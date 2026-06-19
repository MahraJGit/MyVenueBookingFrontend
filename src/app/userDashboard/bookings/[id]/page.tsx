"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import { Button } from "@/components/ui/button";
import { getBooking } from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";

export default function UserBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: booking, isLoading } = useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button
        asChild
        variant="ghost"
        className="text-muted-foreground hover:text-white"
      >
        <Link href="/userDashboard/bookings" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to bookings
        </Link>
      </Button>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : booking?.status === "CONFIRMED" ? (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div>
              <p className="font-semibold text-green-300">Booking confirmed!</p>
              <p className="mt-1 text-sm text-green-200/80">
                Your payment was successful. Your reservation at{" "}
                <span className="font-medium text-green-200">{booking.venue.name}</span>{" "}
                is confirmed.
              </p>
            </div>
          </div>
        </div>
      ) : booking?.status === "HOLD" ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-200">Payment pending</p>
              <p className="mt-1 text-sm text-amber-200/80">
                Complete payment to secure your booking before the hold expires.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <BookingDetailPanel bookingId={id} allowCancel allowReschedule variant="user" />
    </div>
  );
}
