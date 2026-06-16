"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { CountdownTimer } from "@/components/venues/CountdownTimer";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
} from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import type { Booking } from "@/features/bookings/types";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { decimalToNumber, formatVenuePrice } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

type BookingDetailPanelProps = {
  bookingId: string;
  onClose?: () => void;
  allowCancel?: boolean;
  allowReschedule?: boolean;
};

export function BookingDetailPanel({
  bookingId,
  onClose,
  allowCancel = true,
  allowReschedule = true,
}: BookingDetailPanelProps) {
  const queryClient = useQueryClient();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => getBooking(bookingId),
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelBooking(bookingId),
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      refetch();
    },
    onError: (e) => toastApiError(e),
  });

  const rescheduleMut = useMutation({
    mutationFn: () =>
      rescheduleBooking(bookingId, {
        startTime: new Date(startLocal).toISOString(),
        endTime: new Date(endLocal).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Booking rescheduled");
      setRescheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      refetch();
    },
    onError: (e) => toastApiError(e),
  });

  if (isLoading || !booking) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const tz = booking.venue.timezone;
  const currency =
    (booking.pricingSnapshot as { currency?: string } | null)?.currency ??
    booking.venue.pricing?.currency ??
    "AED";

  return (
    <div className="space-y-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{booking.venue.name}</h3>
          <p className="text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {booking.status === "HOLD" && booking.expiresAt && (
        <CountdownTimer expiresAt={booking.expiresAt} onExpire={() => refetch()} />
      )}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Start</dt>
          <dd className="text-white">{formatInVenueTimezone(booking.startTime, tz)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">End</dt>
          <dd className="text-white">{formatInVenueTimezone(booking.endTime, tz)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-primary font-semibold">
            {formatVenuePrice(decimalToNumber(booking.totalAmount), currency)}
          </dd>
        </div>
        {booking.numGuests && (
          <div>
            <dt className="text-muted-foreground">Guests</dt>
            <dd className="text-white">{booking.numGuests}</dd>
          </div>
        )}
        {booking.buyer && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Buyer</dt>
            <dd className="text-white">
              {booking.buyer.firstName} {booking.buyer.lastName} ({booking.buyer.email})
            </dd>
          </div>
        )}
        {booking.specialRequests && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Special requests</dt>
            <dd className="text-white">{booking.specialRequests}</dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        {allowReschedule &&
          (booking.status === "HOLD" || booking.status === "CONFIRMED") && (
            <Button variant="outline" className="border-[#303030]" onClick={() => setRescheduleOpen(true)}>
              Reschedule
            </Button>
          )}
        {allowCancel &&
          booking.status !== "CANCELLED" &&
          booking.status !== "COMPLETED" && (
            <Button
              variant="destructive"
              onClick={() => cancelMut.mutate()}
              disabled={cancelMut.isPending}
            >
              Cancel booking
            </Button>
          )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="border-[#303030] bg-[#1B1B1B] text-white">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>New start (UTC ISO or datetime-local)</Label>
              <Input type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>New end</Label>
              <Input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} className="border-[#303030] bg-black" />
            </div>
            <p className="text-xs text-muted-foreground">
              Duration must match the original booking exactly. Use UTC times that correspond to venue local hours.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button onClick={() => rescheduleMut.mutate()} disabled={rescheduleMut.isPending || !startLocal || !endLocal}>
              Confirm reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BookingListRow({
  booking,
  onSelect,
}: {
  booking: Booking;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(booking.id)}
      className="w-full rounded-xl border border-[#303030] bg-[#1B1B1B] p-4 text-left transition hover:border-primary/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-white">{booking.venue.name}</span>
        <StatusBadge status={booking.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")} —{" "}
        {format(new Date(booking.endTime), "h:mm a")}
      </p>
    </button>
  );
}
