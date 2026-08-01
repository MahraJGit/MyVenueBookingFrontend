"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { getServiceInquiry } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";

const paths = getDashboardPaths("vendor");

function NewProposalInner() {
  const t = useTranslations("vendorMarketplace");
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get("inquiryId") ?? "";
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: inquiry, isLoading } = useQuery({
    queryKey: marketplaceKeys.inquiry(user?.id, inquiryId),
    queryFn: () => getServiceInquiry(inquiryId),
    enabled: isAuthenticated && isReady && !!user?.id && !!inquiryId,
  });

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href={
            inquiryId
              ? paths.marketplaceInquiry(inquiryId)
              : paths.marketplaceInquiries
          }
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToInquiries")}
        </Link>
      </Button>

      <DashboardPageHeader
        title={t("createProposalTitle")}
        description={t("createProposalDesc")}
      />

      {!inquiryId ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {t("inquiryIdRequired")}
        </p>
      ) : isLoading || !inquiry ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-6">
          <ServiceProposalForm mode="create" inquiry={inquiry} />
        </div>
      )}
    </DashboardContentPanel>
  );
}

export default function VendorNewProposalPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <NewProposalInner />
      </Suspense>
    </RoleGuard>
  );
}
