"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CalendarCheck, Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardScrollableTabs,
  dashboardEyebrowClass,
  dashboardTabCountClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { listServiceBookings } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServiceBooking } from "@/features/marketplace/types";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

const TABS = [
  "all",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;
const paths = getDashboardPaths("vendor");

function VendorBookingsContent() {
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const tUser = useTranslations("userDashboard");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: marketplaceKeys.bookings(user?.id, { scope: "vendor" }),
    queryFn: () => listServiceBookings({ limit: 50, scope: "vendor" }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = data?.items ?? [];

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: bookings.length };
    for (const row of bookings) {
      base[row.status] = (base[row.status] ?? 0) + 1;
    }
    return base;
  }, [bookings]);

  const filtered = useMemo(() => {
    if (activeTab === "all") return bookings;
    return bookings.filter((row) => row.status === activeTab);
  }, [bookings, activeTab]);

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadBookings"));
  }, [isError, error, t]);

  return (
    <DashboardPageShell>
      <div className={dashboardEyebrowClass}>
        <CalendarCheck className="h-3.5 w-3.5" />
        {t("marketplaceEyebrow")}
      </div>
      <DashboardPageHeader
        title={t("bookingsTitle")}
        description={t("bookingsDesc")}
      />

      <DashboardPanel className="mt-4 space-y-0">
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={TABS.map((value) => ({
            value,
            label: (
              <>
                {value === "all"
                  ? tCommon("all")
                  : tUser(`serviceBookingStatus.${value}`)}
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
              {t("noBookings")}
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {filtered.map((booking) => (
              <BookingRow key={booking.id} booking={booking} />
            ))}
          </ul>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function BookingRow({ booking }: { booking: ServiceBooking }) {
  const t = useTranslations("vendorMarketplace");
  const tUser = useTranslations("userDashboard");
  const total = decimalToNumber(booking.totalAmount);
  const buyerName = booking.buyer
    ? `${booking.buyer.firstName} ${booking.buyer.lastName}`.trim()
    : t("buyerFallback");

  return (
    <li>
      <Link
        href={paths.marketplaceBooking(booking.id)}
        className="flex flex-col gap-1 px-1 py-4 transition hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-white">
            {booking.service?.title ?? t("serviceFallback")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {String(booking.startDate).slice(0, 10)} →{" "}
            {String(booking.endDate).slice(0, 10)} · {total.toLocaleString()}{" "}
            {booking.currency} · {buyerName}
          </p>
        </div>
        <span className="mt-2 inline-flex rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 sm:mt-0">
          {tUser(
            `serviceBookingStatus.${booking.status}` as "serviceBookingStatus.CONFIRMED",
          )}
        </span>
      </Link>
    </li>
  );
}

export default function VendorMarketplaceBookingsPage() {
  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <VendorBookingsContent />
    </RoleGuard>
  );
}
