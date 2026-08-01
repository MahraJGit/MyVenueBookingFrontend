"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  DashboardContentPanel,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared";
import { ServiceProposalForm } from "@/components/marketplace/ServiceProposalForm";
import { getServiceProposal } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";

const paths = getDashboardPaths("vendor");

function ReviseProposalContent({ id }: { id: string }) {
  const t = useTranslations("vendorMarketplace");
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: proposal, isLoading } = useQuery({
    queryKey: marketplaceKeys.proposal(user?.id, id),
    queryFn: () => getServiceProposal(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href={paths.marketplaceProposal(id)}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToProposal")}
        </Link>
      </Button>

      <DashboardPageHeader
        title={t("reviseProposalTitle")}
        description={t("reviseProposalDesc")}
      />

      {isLoading || !proposal ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6">
          <ServiceProposalForm
            mode="revise"
            proposal={proposal}
            inquiry={proposal.inquiry}
          />
        </div>
      )}
    </DashboardContentPanel>
  );
}

export default function VendorReviseProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <ReviseProposalContent id={id} />
    </RoleGuard>
  );
}
