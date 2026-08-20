"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dashboardInputClass } from "@/components/dashboard/dashboard-ui";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import {
  contactInfoBlockedMessage,
  textContainsContactInfo,
} from "@/features/marketplace/contact-guard";
import {
  acceptServiceProposal,
  declineServiceProposal,
  getServiceProposal,
  requestServiceProposalChanges,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

function customerProposalStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations>,
) {
  if (status === "SENT") return t("proposalReceived");
  return t(`serviceProposalStatus.${status}` as "serviceProposalStatus.SENT");
}

export default function UserServiceProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("userDashboard");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: proposal, isLoading } = useQuery({
    queryKey: marketplaceKeys.proposal(user?.id, id),
    queryFn: () => getServiceProposal(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
  };

  const acceptMut = useMutation({
    mutationFn: () => acceptServiceProposal(id),
    onSuccess: async (result) => {
      toast.success(t("proposalAccepted"));
      await invalidate();
      router.push(
        `/marketplace/booking/${result.booking.id}/checkout`,
      );
    },
    onError: (e) => toastApiError(e, t("proposalAcceptFailed")),
  });

  const declineMut = useMutation({
    mutationFn: () => declineServiceProposal(id),
    onSuccess: async () => {
      toast.success(t("proposalDeclined"));
      await invalidate();
    },
    onError: (e) => toastApiError(e, t("proposalDeclineFailed")),
  });

  const [changesOpen, setChangesOpen] = useState(false);
  const [changeMessage, setChangeMessage] = useState("");
  const changeMessageHasContact = textContainsContactInfo(changeMessage);
  const canSendChangeRequest =
    changeMessage.trim().length >= 5 && !changeMessageHasContact;

  const changesMut = useMutation({
    mutationFn: () =>
      requestServiceProposalChanges(id, {
        message: changeMessage.trim(),
      }),
    onSuccess: async () => {
      toast.success(t("changesRequested"));
      setChangesOpen(false);
      setChangeMessage("");
      await invalidate();
    },
    onError: (e) => toastApiError(e),
  });

  const busy =
    acceptMut.isPending || declineMut.isPending || changesMut.isPending;
  const canAct = proposal?.status === "SENT";

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href="/userDashboard/service-proposals"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToServiceProposals")}
        </Link>
      </Button>

      {isLoading || !proposal ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">
              {customerProposalStatusLabel(proposal.status, t)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {proposal.service?.title ??
                proposal.inquiry?.service?.title ??
                t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {String(proposal.startDate).slice(0, 10)} →{" "}
              {String(proposal.endDate).slice(0, 10)}
            </p>
          </div>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">
              {t("lineItems")}
            </h2>
            <ul className="space-y-2">
              {(proposal.lines ?? []).map((line, idx) => (
                <li
                  key={line.id ?? `${line.label}-${idx}`}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="text-zinc-300">
                    {line.label}
                    {Number(line.quantity) !== 1
                      ? ` × ${line.quantity}`
                      : ""}
                  </span>
                  <span className="shrink-0 font-medium text-white">
                    {decimalToNumber(line.amount ?? Number(line.unitPrice) * Number(line.quantity)).toLocaleString()}{" "}
                    {proposal.currency}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-zinc-800 pt-3 text-base font-semibold text-white">
              <span>{t("total")}</span>
              <span>
                {decimalToNumber(proposal.totalAmount).toLocaleString()}{" "}
                {proposal.currency}
              </span>
            </div>
          </section>

          {proposal.notes ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-sm font-medium text-zinc-300">{t("notes")}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {proposal.notes}
              </p>
            </section>
          ) : null}

          {proposal.changeRequestMessage && proposal.status === "SENT" ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h2 className="text-sm font-medium text-amber-300">
                {t("changeRequestSentTitle")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-100/80">
                {proposal.changeRequestMessage}
              </p>
            </section>
          ) : null}

          {canAct ? (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => acceptMut.mutate()}
                disabled={busy}
                className="bg-primary"
              >
                {acceptMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("acceptProposal")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setChangesOpen(true)}
                disabled={busy}
              >
                {t("requestChanges")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => declineMut.mutate()}
                disabled={busy}
              >
                {t("declineProposal")}
              </Button>
            </div>
          ) : null}

          {proposal.booking?.id ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/userDashboard/service-bookings/${proposal.booking.id}`}>
                {t("viewServiceBooking")}
              </Link>
            </Button>
          ) : null}

          {proposal.inquiryId ? (
            <Button asChild variant="ghost" size="sm" className="px-0">
              <Link href={`/userDashboard/service-inquiries/${proposal.inquiryId}`}>
                {t("viewInquiry")}
              </Link>
            </Button>
          ) : null}
        </div>
      )}

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("requestChangesTitle")}</DialogTitle>
            <DialogDescription>
              {t("requestChangesDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="change-request-message">
              {t("requestChangesMessageLabel")}
            </Label>
            <Textarea
              id="change-request-message"
              rows={4}
              className={dashboardInputClass}
              value={changeMessage}
              onChange={(e) => setChangeMessage(e.target.value)}
            />
            {changeMessageHasContact ? (
              <p className="text-xs text-red-400">
                {contactInfoBlockedMessage(t("requestChangesMessageLabel"))}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("noContactDetailsHint")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangesOpen(false)}
              disabled={changesMut.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => changesMut.mutate()}
              disabled={!canSendChangeRequest || changesMut.isPending}
            >
              {changesMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("sendChangeRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardContentPanel>
  );
}
