"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import { ServiceInquiryDetails } from "@/components/marketplace/ServiceInquiryDetails";
import { getServiceInquiry } from "@/features/marketplace/api";
import { formatInquiryEventDate } from "@/features/marketplace/inquiry-display";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { useAuth } from "@/features/auth/auth-context";

function customerInquiryStatusLabel(
  status: string,
  t: ReturnType<typeof useTranslations>,
) {
  if (status === "PROPOSAL_SENT") return t("proposalReceived");
  return t(`serviceInquiryStatus.${status}` as "serviceInquiryStatus.PENDING");
}

export default function UserServiceInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: inquiry, isLoading } = useQuery({
    queryKey: marketplaceKeys.inquiry(user?.id, id),
    queryFn: () => getServiceInquiry(id),
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
          href="/userDashboard/service-inquiries"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToServiceInquiries")}
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
              {customerInquiryStatusLabel(inquiry.status, t)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {inquiry.service?.title ?? t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatInquiryEventDate(inquiry.startDate, inquiry.endDate)}
              {inquiry.service?.vendor?.vendorName
                ? ` · ${inquiry.service.vendor.vendorName}`
                : ""}
            </p>
          </div>

          <ServiceInquiryDetails inquiry={inquiry} showVendor />

          <div className="flex flex-wrap gap-3">
            {(inquiry.proposals ?? [])
              .filter((p) => p.status === "SENT" || p.status === "ACCEPTED")
              .map((p) => (
                <Button key={p.id} asChild size="sm">
                  <Link href={`/userDashboard/service-proposals/${p.id}`}>
                    {t("viewProposal")}
                  </Link>
                </Button>
              ))}
            {inquiry.booking?.id ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/userDashboard/service-bookings/${inquiry.booking.id}`}>
                  {t("viewServiceBooking")}
                </Link>
              </Button>
            ) : null}
            {inquiry.service?.slug ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/marketplace/${inquiry.service.slug}`}>
                  {t("viewMarketplaceService")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </DashboardContentPanel>
  );
}
