"use client";

import { use } from "react";
import Link from "next/link";
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import { Button } from "@/components/ui/button";

export default function UserBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button asChild variant="ghost" className="text-muted-foreground">
        <Link href="/userDashboard/bookings">← Back to bookings</Link>
      </Button>
      <BookingDetailPanel bookingId={id} allowCancel allowReschedule />
    </div>
  );
}
