"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dashboardInputClass } from "@/components/dashboard/dashboard-ui";
import {
  createServiceProposal,
  reviseServiceProposal,
} from "@/features/marketplace/api";
import type {
  CreateServiceProposalLinePayload,
  Currency,
  ServiceInquiry,
  ServiceProposal,
  ServiceProposalLineType,
} from "@/features/marketplace/types";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const LINE_TYPES: ServiceProposalLineType[] = [
  "PACKAGE",
  "ADDON",
  "MENU",
  "CUSTOM",
  "DISCOUNT",
  "FEE",
  "TRAVEL",
];

type DraftLine = {
  key: string;
  lineType: ServiceProposalLineType;
  label: string;
  quantity: string;
  unitPrice: string;
};

function newKey() {
  return `line-${Math.random().toString(36).slice(2, 10)}`;
}

function linesFromEstimate(inquiry: ServiceInquiry): DraftLine[] {
  const snap = inquiry.estimateSnapshot;
  const rawLines =
    snap && typeof snap === "object" && Array.isArray((snap as { lines?: unknown }).lines)
      ? ((snap as { lines: Array<Record<string, unknown>> }).lines)
      : null;

  if (rawLines && rawLines.length > 0) {
    return rawLines.map((line) => ({
      key: newKey(),
      lineType: (String(line.lineType || "CUSTOM") as ServiceProposalLineType),
      label: String(line.label || "Line item"),
      quantity: String(line.quantity ?? 1),
      // Discounts are stored negative; edit them as positive values.
      unitPrice: String(Math.abs(Number(line.unitPrice ?? 0))),
    }));
  }

  if (inquiry.package) {
    return [
      {
        key: newKey(),
        lineType: "PACKAGE",
        label: inquiry.package.name,
        quantity: "1",
        unitPrice: String(decimalToNumber(inquiry.package.price)),
      },
    ];
  }

  return [
    {
      key: newKey(),
      lineType: "CUSTOM",
      label: inquiry.service?.title ?? "Service",
      quantity: "1",
      unitPrice: "0",
    },
  ];
}

function linesFromProposal(proposal: ServiceProposal): DraftLine[] {
  const lines = proposal.lines ?? [];
  if (lines.length === 0) {
    return [
      {
        key: newKey(),
        lineType: "CUSTOM",
        label: proposal.service?.title ?? "Service",
        quantity: "1",
        unitPrice: String(decimalToNumber(proposal.totalAmount)),
      },
    ];
  }
  return lines.map((line) => ({
    key: newKey(),
    lineType: (String(line.lineType) as ServiceProposalLineType),
    label: line.label,
    quantity: String(line.quantity ?? 1),
    // Discounts are stored negative; edit them as positive values.
    unitPrice: String(Math.abs(decimalToNumber(line.unitPrice))),
  }));
}

function toPayloadLines(lines: DraftLine[]): CreateServiceProposalLinePayload[] {
  return lines.map((line, index) => {
    const quantity = Math.max(0.01, Number(line.quantity) || 1);
    const unitPrice = Number(line.unitPrice) || 0;
    return {
      lineType: line.lineType,
      label: line.label.trim() || `Line ${index + 1}`,
      quantity,
      unitPrice,
      sortOrder: index,
    };
  });
}

export function ServiceProposalForm({
  mode,
  inquiry,
  proposal,
}: {
  mode: "create" | "revise";
  inquiry?: ServiceInquiry | null;
  proposal?: ServiceProposal | null;
}) {
  const t = useTranslations("vendorMarketplace");
  const router = useRouter();
  const paths = getDashboardPaths("vendor");

  const sourceInquiry = inquiry ?? proposal?.inquiry ?? null;
  const currency = (proposal?.currency ??
    sourceInquiry?.service?.currency ??
    "AED") as Currency;

  // Proposals are always for the inquiry's event date (locked server-side too).
  const eventStart = String(
    sourceInquiry?.startDate ?? proposal?.startDate ?? "",
  ).slice(0, 10);
  const eventEnd = String(
    sourceInquiry?.endDate ?? proposal?.endDate ?? "",
  ).slice(0, 10);
  const eventDateLabel =
    eventStart === eventEnd ? eventStart : `${eventStart} → ${eventEnd}`;
  const [notes, setNotes] = useState(proposal?.notes ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => {
    if (mode === "revise" && proposal) return linesFromProposal(proposal);
    if (sourceInquiry) return linesFromEstimate(sourceInquiry);
    return [
      {
        key: newKey(),
        lineType: "CUSTOM",
        label: "Service",
        quantity: "1",
        unitPrice: "0",
      },
    ];
  });

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const qty = Number(line.quantity) || 0;
      const price = Math.abs(Number(line.unitPrice) || 0);
      const sign = line.lineType === "DISCOUNT" ? -1 : 1;
      return sum + sign * qty * price;
    }, 0);
  }, [lines]);

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        lineType: "CUSTOM",
        label: "",
        quantity: "1",
        unitPrice: "0",
      },
    ]);
  };

  const createMut = useMutation({
    mutationFn: (send: boolean) => {
      if (!sourceInquiry?.id) throw new Error("Missing inquiry");
      return createServiceProposal({
        inquiryId: sourceInquiry.id,
        notes: notes.trim() || null,
        currency,
        lines: toPayloadLines(lines),
        send,
      });
    },
    onSuccess: (result, send) => {
      toast.success(send ? t("proposalSent") : t("proposalDraftSaved"));
      router.push(paths.marketplaceProposal(result.id));
    },
    onError: (e) => toastApiError(e, t("proposalSaveFailed")),
  });

  const reviseMut = useMutation({
    mutationFn: (send: boolean) => {
      if (!proposal?.id) throw new Error("Missing proposal");
      return reviseServiceProposal(proposal.id, {
        notes: notes.trim() || null,
        currency,
        lines: toPayloadLines(lines),
        send,
      });
    },
    onSuccess: (result, send) => {
      toast.success(send ? t("proposalSent") : t("proposalDraftSaved"));
      router.push(paths.marketplaceProposal(result.id));
    },
    onError: (e) => toastApiError(e, t("proposalSaveFailed")),
  });

  const busy = createMut.isPending || reviseMut.isPending;
  const submit = (send: boolean) => {
    if (lines.some((l) => !l.label.trim())) {
      toast.error(t("lineLabelRequired"));
      return;
    }
    if (mode === "create") createMut.mutate(send);
    else reviseMut.mutate(send);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {sourceInquiry ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-white">
            {sourceInquiry.service?.title ?? t("serviceFallback")}
          </p>
          <p className="mt-1">
            {sourceInquiry.buyer
              ? `${sourceInquiry.buyer.firstName} ${sourceInquiry.buyer.lastName}`
              : t("buyerFallback")}
            {sourceInquiry.guestCount
              ? ` · ${sourceInquiry.guestCount} ${t("guests")}`
              : ""}
          </p>
          {sourceInquiry.notes ? (
            <p className="mt-2 whitespace-pre-wrap">{sourceInquiry.notes}</p>
          ) : null}
        </section>
      ) : null}

      <div className="space-y-2">
        <Label>{t("proposalEventDate")}</Label>
        <Input
          className={dashboardInputClass}
          value={eventDateLabel}
          disabled
          readOnly
        />
        <p className="text-xs text-muted-foreground">
          {t("proposalEventDateHint")}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-300">{t("lineItems")}</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-4 w-4" />
            {t("addLine")}
          </Button>
        </div>

        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.key}
              className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:grid-cols-[140px_1fr_88px_100px_auto]"
            >
              <Select
                value={line.lineType}
                onValueChange={(v) =>
                  updateLine(line.key, {
                    lineType: v as ServiceProposalLineType,
                  })
                }
              >
                <SelectTrigger className={cn(dashboardInputClass, "w-full")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`lineType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className={dashboardInputClass}
                placeholder={t("lineLabel")}
                value={line.label}
                onChange={(e) => updateLine(line.key, { label: e.target.value })}
              />
              <Input
                className={dashboardInputClass}
                type="number"
                min={0}
                step={1}
                placeholder={t("quantity")}
                value={line.quantity}
                onChange={(e) =>
                  updateLine(line.key, { quantity: e.target.value })
                }
              />
              <Input
                className={dashboardInputClass}
                type="number"
                min={0}
                step={1}
                placeholder={t("unitPrice")}
                value={line.unitPrice}
                onChange={(e) =>
                  updateLine(line.key, { unitPrice: e.target.value })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
                onClick={() => removeLine(line.key)}
                disabled={lines.length <= 1}
                aria-label={t("removeLine")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-zinc-800 pt-3 text-base font-semibold text-white">
          <span>{t("total")}</span>
          <span>
            {total.toLocaleString()} {currency}
          </span>
        </div>
      </section>

      <div className="space-y-2">
        <Label>{t("notes")}</Label>
        <Textarea
          className={dashboardInputClass}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("proposalNotesPlaceholder")}
        />
        <p className="text-xs text-muted-foreground">{t("noContactHint")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => submit(true)} disabled={busy} className="bg-primary">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("sendProposal")}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit(false)}
          disabled={busy}
        >
          {t("saveProposalDraft")}
        </Button>
      </div>
    </div>
  );
}
