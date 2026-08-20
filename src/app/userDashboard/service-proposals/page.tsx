"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardScrollableTabs,
  dashboardEyebrowClass,
  dashboardTabCountClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { listServiceProposals } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServiceProposal } from "@/features/marketplace/types";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

const TABS = ["all", "ACCEPTED", "DECLINED"] as const;

function customerProposalStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations>,
) {
  if (status === "SENT") return t("proposalReceived");
  return t(`serviceProposalStatus.${status}` as "serviceProposalStatus.SENT");
}

export default function UserServiceProposalsPage() {
  const t = useTranslations("userDashboard");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: marketplaceKeys.proposals(user?.id, { scope: "buyer" }),
    queryFn: () => listServiceProposals({ limit: 50, scope: "buyer" }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const proposals = data?.items ?? [];

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: proposals.length };
    for (const row of proposals) {
      base[row.status] = (base[row.status] ?? 0) + 1;
    }
    return base;
  }, [proposals]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return proposals;
    return proposals.filter((row) => row.status === activeTab);
  }, [proposals, activeTab]);

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadServiceProposalsToast"));
  }, [isError, error, t]);

  return (
    <DashboardPageShell>
      <div className={dashboardEyebrowClass}>
        <FileText className="h-3.5 w-3.5" />
        {t("quoteMarketplaceSection")}
      </div>
      <DashboardPageHeader
        title={t("myServiceProposals")}
        description={t("serviceProposalsSubtitle")}
      />

      <DashboardPanel className="mt-4 space-y-0">
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={TABS.map((value) => ({
            value,
            label: (
              <>
                {value === "all" ? tCommon("all") : t(`serviceProposalStatus.${value}`)}
                <span className={dashboardTabCountClass}>{counts[value] ?? 0}</span>
              </>
            ),
          }))}
        />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-zinc-800 bg-transparent">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("noServiceProposals")}
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/userDashboard/service-inquiries">
                    {t("myServiceInquiries")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filtered.map((proposal) => (
              <ProposalRow key={proposal.id} proposal={proposal} />
            ))}
          </ul>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function ProposalRow({ proposal }: { proposal: ServiceProposal }) {
  const t = useTranslations("userDashboard");
  const total = decimalToNumber(proposal.totalAmount);
  return (
    <li>
      <Link
        href={`/userDashboard/service-proposals/${proposal.id}`}
        className="flex flex-col gap-1 px-1 py-4 transition hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {proposal.service?.title ??
              proposal.inquiry?.service?.title ??
              t("serviceFallback")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {String(proposal.startDate).slice(0, 10)} →{" "}
            {String(proposal.endDate).slice(0, 10)} · {total.toLocaleString()}{" "}
            {proposal.currency}
          </p>
        </div>
        <span className="mt-2 inline-flex w-fit rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 sm:mt-0">
          {customerProposalStatusLabel(proposal.status, t)}
        </span>
      </Link>
    </li>
  );
}
