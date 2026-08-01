"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Loader2, Lock, MapPin, MessageCircle } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import { getServiceBooking } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServiceLocation } from "@/features/marketplace/types";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";

const paths = getDashboardPaths("vendor");

function asLocation(value: unknown): ServiceLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ServiceLocation;
}

function VendorBookingDetailContent({ id }: { id: string }) {
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();

  const { data: booking, isLoading } = useQuery({
    queryKey: marketplaceKeys.booking(user?.id, id),
    queryFn: () => getServiceBooking(id),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const location = asLocation(booking?.locationSnapshot);
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
            {booking.buyer ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {booking.buyer.firstName} {booking.buyer.lastName}
                {booking.buyer.email ? ` · ${booking.buyer.email}` : ""}
              </p>
            ) : null}
          </div>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-sm font-medium text-zinc-300">{t("total")}</h2>
            <p className="mt-2 text-lg font-semibold text-white">
              {decimalToNumber(booking.totalAmount).toLocaleString()}{" "}
              {booking.currency}
            </p>
            {booking.status === "PAYMENT_PENDING" && booking.expiresAt ? (
              <p className="mt-1 text-xs text-amber-300">
                {t("holdExpires", {
                  time: new Date(booking.expiresAt).toLocaleString(),
                })}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
              <MapPin className="h-4 w-4" />
              {t("eventLocation")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {[location.venueName, location.city, location.country]
                .filter(Boolean)
                .join(" · ") || t("locationUnavailable")}
            </p>
            {addressUnlocked && location.address ? (
              <p className="mt-2 text-sm text-white">{location.address}</p>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                {t("addressLocked")}
              </p>
            )}
          </section>

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
            {booking.inquiryId ? (
              <Button asChild variant="ghost" size="sm" className="px-0">
                <Link href={paths.marketplaceInquiry(booking.inquiryId)}>
                  {t("viewInquiry")}
                </Link>
              </Button>
            ) : null}
            {booking.proposalId ? (
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
