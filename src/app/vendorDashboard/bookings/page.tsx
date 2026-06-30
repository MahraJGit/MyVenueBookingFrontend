"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  BookingDetailPanel,
  BookingsTable,
} from "@/components/bookings/BookingDetailPanel";
import { listBookings } from "@/features/bookings/api";
import type { BookingStatus } from "@/features/bookings/types";
import { bookingKeys } from "@/features/venues/query-keys";
import {
  DashboardPageShell,
  DashboardScrollableTabs,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";

export default function VendorBookingsPage() {
  const t = useTranslations("vendorDashboard");
  const tBooking = useTranslations("booking");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: bookingKeys.list({ status: status === "ALL" ? undefined : status }),
    queryFn: () =>
      listBookings({
        limit: 50,
        status: status === "ALL" ? undefined : status,
      }),
  });

  const bookings = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <DashboardPageShell>
        <DashboardPageHeader
          title={t("venueBookingsTitle")}
          description={t("venueBookingsDesc")}
        />

        <DashboardScrollableTabs
          value={status}
          onValueChange={(v) => setStatus(v as BookingStatus | "ALL")}
          items={[
            { value: "ALL", label: t("allStatuses") },
            { value: "HOLD", label: t("hold") },
            { value: "CONFIRMED", label: tBooking("confirmed") },
            { value: "CANCELLED", label: tBooking("cancelled") },
            { value: "COMPLETED", label: tBooking("completed") },
          ]}
        />

        <div className="grid gap-6 ">
          <BookingsTable
            bookings={bookings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={isLoading}
            showBuyer
          />

          {selectedId && (
            <BookingDetailPanel
              bookingId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </DashboardPageShell>
    </RoleGuard>
  );
}
