"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import {
  getServiceProposal,
  sendServiceProposal,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

const paths = getDashboardPaths("vendor");

function VendorProposalDetailContent({ id }: { id: string }) {
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: proposal, isLoading } = useQuery({
    queryKey: marketplaceKeys.proposal(user?.id, id),
    queryFn: () => getServiceProposal(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const sendMut = useMutation({
    mutationFn: () => sendServiceProposal(id),
    onSuccess: async () => {
      toast.success(t("proposalSent"));
      await queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (e) => toastApiError(e, t("proposalSendFailed")),
  });

  const canSend = proposal?.status === "DRAFT";
  const canRevise =
    proposal?.status === "DRAFT" || proposal?.status === "SENT";

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href={paths.marketplaceProposals}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToProposals")}
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
              {tUser(
                `serviceProposalStatus.${proposal.status}` as "serviceProposalStatus.SENT",
              )}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {proposal.service?.title ??
                proposal.inquiry?.service?.title ??
                t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {String(proposal.startDate).slice(0, 10)} →{" "}
              {String(proposal.endDate).slice(0, 10)}
              {proposal.version != null ? ` · v${proposal.version}` : ""}
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
                    {decimalToNumber(
                      line.amount ??
                        Number(line.unitPrice) * Number(line.quantity),
                    ).toLocaleString()}{" "}
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

          {proposal.changeRequestMessage && proposal.status === "SENT" ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h2 className="text-sm font-medium text-amber-300">
                {t("buyerChangeRequestTitle")}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-100/80">
                {proposal.changeRequestMessage}
              </p>
              <p className="mt-2 text-xs text-amber-200/60">
                {t("buyerChangeRequestHint")}
              </p>
            </section>
          ) : null}

          {proposal.notes ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="text-sm font-medium text-zinc-300">{t("notes")}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {proposal.notes}
              </p>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {canSend ? (
              <Button
                onClick={() => sendMut.mutate()}
                disabled={sendMut.isPending}
                className="bg-primary"
              >
                {sendMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("sendProposal")}
              </Button>
            ) : null}
            {canRevise ? (
              <Button asChild variant="outline">
                <Link href={paths.reviseMarketplaceProposal(proposal.id)}>
                  {t("reviseProposal")}
                </Link>
              </Button>
            ) : null}
            {proposal.inquiryId ? (
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={paths.marketplaceInquiry(proposal.inquiryId)}>
                  {t("viewInquiry")}
                </Link>
              </Button>
            ) : null}
            {proposal.booking?.id ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={paths.marketplaceBooking(proposal.booking.id)}>
                  {t("viewBooking")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </DashboardContentPanel>
  );
}

export default function VendorMarketplaceProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VendorProposalDetailContent id={id} />
    </RoleGuard>
  );
}
