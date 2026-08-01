"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import { ServiceInquiryDetails } from "@/components/marketplace/ServiceInquiryDetails";
import { getServiceInquiry } from "@/features/marketplace/api";
import { formatInquiryEventDate } from "@/features/marketplace/inquiry-display";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";

const paths = getDashboardPaths("vendor");

function VendorInquiryDetailContent({ id }: { id: string }) {
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: inquiry, isLoading } = useQuery({
    queryKey: marketplaceKeys.inquiry(user?.id, id),
    queryFn: () => getServiceInquiry(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const canPropose =
    inquiry &&
    !inquiry.booking &&
    inquiry.status !== "ACCEPTED" &&
    inquiry.status !== "DECLINED" &&
    inquiry.status !== "CANCELLED" &&
    inquiry.status !== "EXPIRED";

  const latestProposal = (inquiry?.proposals ?? [])
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href={paths.marketplaceInquiries}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToInquiries")}
        </Link>
      </Button>

      {isLoading || !inquiry ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">
              {tUser(
                `serviceInquiryStatus.${inquiry.status}` as "serviceInquiryStatus.PENDING",
              )}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {inquiry.service?.title ?? t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatInquiryEventDate(inquiry.startDate, inquiry.endDate)}
              {inquiry.buyer
                ? ` · ${inquiry.buyer.firstName} ${inquiry.buyer.lastName}`.trim()
                : ""}
            </p>
          </div>

          <ServiceInquiryDetails inquiry={inquiry} showBuyer />

          <div className="flex flex-wrap gap-3">
            {canPropose ? (
              <Button asChild size="sm" className="bg-primary">
                <Link href={paths.newMarketplaceProposal(inquiry.id)}>
                  {t("createProposal")}
                </Link>
              </Button>
            ) : null}
            {latestProposal ? (
              <Button asChild variant="outline" size="sm">
                <Link href={paths.marketplaceProposal(latestProposal.id)}>
                  {t("viewProposal")}
                </Link>
              </Button>
            ) : null}
            {inquiry.booking?.id ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={paths.marketplaceBooking(inquiry.booking.id)}>
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

export default function VendorMarketplaceInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VendorInquiryDetailContent id={id} />
    </RoleGuard>
  );
}
