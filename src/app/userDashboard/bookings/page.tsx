"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  BookingDetailPanel,
  BookingListRow,
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

export default function UserBookingsPage() {
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: bookingKeys.list({ status: status === "ALL" ? undefined : status, scope: "buyer" }),
    queryFn: () =>
      listBookings({
        limit: 50,
        status: status === "ALL" ? undefined : status,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My venue bookings</h1>
          <p className="text-sm text-muted-foreground">
            View, cancel, or reschedule your venue reservations.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as BookingStatus | "ALL")}
        >
          <SelectTrigger className="w-[180px] border-[#303030] bg-[#1B1B1B] text-white">
            <SelectValue placeholder="Filter status" />
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
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-8 text-center">
              <p className="text-muted-foreground">No venue bookings yet.</p>
              <Link href="/venues" className="mt-4 inline-block text-primary hover:underline">
                Browse venues
              </Link>
            </div>
          ) : (
            (data?.data ?? []).map((b) => (
              <BookingListRow key={b.id} booking={b} onSelect={setSelectedId} />
            ))
          )}
        </div>

        {selectedId ? (
          <BookingDetailPanel
            bookingId={selectedId}
            onClose={() => setSelectedId(null)}
            allowReschedule
            allowCancel
          />
        ) : null}
      </div>
    </div>
  );
}
