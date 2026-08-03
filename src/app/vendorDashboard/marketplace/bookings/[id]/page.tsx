"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import { ServiceBookingDetails } from "@/components/marketplace/ServiceBookingDetails";
import { getServiceBooking } from "@/features/marketplace/api";
import { isInstantServiceBooking } from "@/features/marketplace/booking-display";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";

const paths = getDashboardPaths("vendor");

function VendorBookingDetailContent({ id }: { id: string }) {
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: marketplaceKeys.booking(user?.id, id),
    queryFn: () => getServiceBooking(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const addressUnlocked = Boolean(booking?.addressUnlocked);

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href={paths.marketplaceBookings}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBookings")}
        </Link>
      </Button>

      {isLoading || !booking ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary">
              {tUser(
                `serviceBookingStatus.${booking.status}` as "serviceBookingStatus.CONFIRMED",
              )}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {booking.service?.title ?? t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {String(booking.startDate).slice(0, 10)} →{" "}
              {String(booking.endDate).slice(0, 10)}
            </p>
          </div>

          <ServiceBookingDetails booking={booking} />

          <div className="flex flex-wrap gap-3">
            {addressUnlocked && booking.inquiry?.conversation?.id ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/vendorDashboard/messages?c=${booking.inquiry.conversation.id}`}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("openConversation")}
                </Link>
              </Button>
            ) : null}
            {!isInstantServiceBooking(booking) && booking.inquiryId ? (
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={paths.marketplaceInquiry(booking.inquiryId)}>
                  {t("viewInquiry")}
                </Link>
              </Button>
            ) : null}
            {!isInstantServiceBooking(booking) && booking.proposalId ? (
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={paths.marketplaceProposal(booking.proposalId)}>
                  {t("viewProposal")}
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </DashboardContentPanel>
  );
}

export default function VendorMarketplaceBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VendorBookingDetailContent id={id} />
    </RoleGuard>
  );
}
