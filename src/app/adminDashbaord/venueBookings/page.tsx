"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  BookingDetailPanel,
  BookingsTable,
} from "@/components/bookings/BookingDetailPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBookings } from "@/features/bookings/api";
import type { BookingStatus } from "@/features/bookings/types";
import { bookingKeys } from "@/features/venues/query-keys";

export default function AdminVenueBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: bookingKeys.list({ status: status === "ALL" ? undefined : status, admin: true }),
    queryFn: () =>
      listBookings({
        limit: 50,
        status: status === "ALL" ? undefined : status,
      }),
  });

  const bookings = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All venue bookings</h1>
            <p className="text-sm text-muted-foreground">
              Platform-wide booking oversight.
            </p>
          </div>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as BookingStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="HOLD">Hold</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <BookingsTable
            bookings={bookings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            isLoading={isLoading}
            showBuyer
            emptyMessage="No bookings."
          />

          {selectedId && (
            <BookingDetailPanel
              bookingId={selectedId}
              onClose={() => setSelectedId(null)}
              allowCancel
              allowReschedule
            />
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
