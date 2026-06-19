"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { TableShell } from "@/components/ui/table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
  bookingStatusBadgeClass,
  bookingStatusLabel,
  formatBookingTotal,
} from "@/components/bookings/user-booking-utils";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
} from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import type { Booking } from "@/features/bookings/types";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { toastApiError } from "@/lib/toasts";

type BookingDetailPanelProps = {
  bookingId: string;
  onClose?: () => void;
  allowCancel?: boolean;
  allowReschedule?: boolean;
  variant?: "default" | "user";
};

function DetailSkeleton({ variant }: { variant: "default" | "user" }) {
  if (variant === "user") {
    return (
      <Card className="border-zinc-800 bg-zinc-950/40">
        <Skeleton className="h-40 w-full rounded-none rounded-t-xl" />
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function BookingDetailPanel({
  bookingId,
  onClose,
  allowCancel = true,
  allowReschedule = true,
  variant = "default",
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
    return <DetailSkeleton variant={variant} />;
  }

  if (variant === "user") {
    return (
      <UserBookingDetail
        booking={booking}
        onClose={onClose}
        allowCancel={allowCancel}
        allowReschedule={allowReschedule}
        cancelMut={cancelMut}
        rescheduleMut={rescheduleMut}
        rescheduleOpen={rescheduleOpen}
        setRescheduleOpen={setRescheduleOpen}
        startLocal={startLocal}
        setStartLocal={setStartLocal}
        endLocal={endLocal}
        setEndLocal={setEndLocal}
        onExpire={() => refetch()}
      />
    );
  }

  return (
    <DefaultBookingDetail
      booking={booking}
      onClose={onClose}
      allowCancel={allowCancel}
      allowReschedule={allowReschedule}
      cancelMut={cancelMut}
      rescheduleMut={rescheduleMut}
      rescheduleOpen={rescheduleOpen}
      setRescheduleOpen={setRescheduleOpen}
      startLocal={startLocal}
      setStartLocal={setStartLocal}
      endLocal={endLocal}
      setEndLocal={setEndLocal}
      onExpire={() => refetch()}
    />
  );
}

type DetailBodyProps = {
  booking: Booking;
  onClose?: () => void;
  allowCancel: boolean;
  allowReschedule: boolean;
  cancelMut: { mutate: () => void; isPending: boolean };
  rescheduleMut: { mutate: () => void; isPending: boolean };
  rescheduleOpen: boolean;
  setRescheduleOpen: (open: boolean) => void;
  startLocal: string;
  setStartLocal: (v: string) => void;
  endLocal: string;
  setEndLocal: (v: string) => void;
  onExpire: () => void;
};

function UserBookingDetail({
  booking,
  onClose,
  allowCancel,
  allowReschedule,
  cancelMut,
  rescheduleMut,
  rescheduleOpen,
  setRescheduleOpen,
  startLocal,
  setStartLocal,
  endLocal,
  setEndLocal,
  onExpire,
}: DetailBodyProps) {
  const tz = booking.venue.timezone;
  const isHold = booking.status === "HOLD";
  const canModify =
    booking.status === "HOLD" || booking.status === "CONFIRMED";
  const canCancel =
    allowCancel &&
    booking.status !== "CANCELLED" &&
    booking.status !== "COMPLETED";

  return (
    <Card className="sticky top-6 overflow-hidden border-zinc-800 bg-zinc-950/40">
      <div className="relative h-40 bg-zinc-800">
        {booking.venue.coverImage ? (
          <Image
            src={booking.venue.coverImage}
            alt={booking.venue.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-zinc-800 to-zinc-900">
            <MapPin className="h-10 w-10 text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">{booking.venue.name}</h2>
            <p className="text-xs text-zinc-300">
              Ref #{booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", bookingStatusBadgeClass(booking.status))}
          >
            {bookingStatusLabel(booking.status)}
          </Badge>
        </div>
        {onClose ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={onClose}
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <CardContent className="space-y-5 p-6">
        {isHold && booking.expiresAt ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-2 text-sm font-medium text-amber-200">
              Payment required to confirm
            </p>
            <CountdownTimer
              expiresAt={booking.expiresAt}
              onExpire={onExpire}
              className="border-amber-500/30 bg-amber-500/5"
            />
          </div>
        ) : null}

        {booking.status === "CONFIRMED" ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            Your booking is confirmed. We&apos;ve sent the details to your email.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat
            icon={CalendarDays}
            label="Starts"
            value={formatInVenueTimezone(booking.startTime, tz)}
          />
          <DetailStat
            icon={CalendarDays}
            label="Ends"
            value={formatInVenueTimezone(booking.endTime, tz)}
          />
          <DetailStat
            icon={CreditCard}
            label="Total"
            value={formatBookingTotal(booking)}
            highlight
          />
          {booking.numGuests ? (
            <DetailStat
              icon={Users}
              label="Guests"
              value={String(booking.numGuests)}
            />
          ) : null}
        </div>

        {booking.venue.address ? (
          <div className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <p className="text-foreground">{booking.venue.address}</p>
            </div>
          </div>
        ) : null}

        {booking.specialRequests ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Special requests
            </p>
            <p className="mt-1 text-foreground">{booking.specialRequests}</p>
          </div>
        ) : null}

        <Separator className="bg-zinc-800" />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isHold ? (
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
              <Link href={`/venues/booking/${booking.id}/checkout`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Complete payment
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1 border-zinc-700">
            <Link href={`/venues/${booking.venueId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View venue
            </Link>
          </Button>
          {allowReschedule && canModify ? (
            <Button
              variant="outline"
              className="flex-1 border-zinc-700"
              onClick={() => setRescheduleOpen(true)}
            >
              Reschedule
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => cancelMut.mutate()}
              disabled={cancelMut.isPending}
            >
              {cancelMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Cancel booking
            </Button>
          ) : null}
        </div>
      </CardContent>

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        startLocal={startLocal}
        setStartLocal={setStartLocal}
        endLocal={endLocal}
        setEndLocal={setEndLocal}
        onConfirm={() => rescheduleMut.mutate()}
        isPending={rescheduleMut.isPending}
      />
    </Card>
  );
}

function DefaultBookingDetail({
  booking,
  onClose,
  allowCancel,
  allowReschedule,
  cancelMut,
  rescheduleMut,
  rescheduleOpen,
  setRescheduleOpen,
  startLocal,
  setStartLocal,
  endLocal,
  setEndLocal,
  onExpire,
}: DetailBodyProps) {
  const tz = booking.venue.timezone;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">{booking.venue.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Booking #{booking.id.slice(0, 8)}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        {booking.status === "HOLD" && booking.expiresAt && (
          <CountdownTimer expiresAt={booking.expiresAt} onExpire={onExpire} />
        )}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Start</dt>
            <dd className="text-foreground">
              {formatInVenueTimezone(booking.startTime, tz)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">End</dt>
            <dd className="text-foreground">
              {formatInVenueTimezone(booking.endTime, tz)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-semibold text-primary">
              {formatBookingTotal(booking)}
            </dd>
          </div>
          {booking.numGuests ? (
            <div>
              <dt className="text-muted-foreground">Guests</dt>
              <dd className="text-foreground">{booking.numGuests}</dd>
            </div>
          ) : null}
          {booking.buyer ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Buyer</dt>
              <dd className="text-foreground">
                {booking.buyer.firstName} {booking.buyer.lastName} ({booking.buyer.email})
              </dd>
            </div>
          ) : null}
          {booking.specialRequests ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Special requests</dt>
              <dd className="text-foreground">{booking.specialRequests}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-wrap gap-2">
          {allowReschedule &&
            (booking.status === "HOLD" || booking.status === "CONFIRMED") && (
              <Button
                variant="outline"
                className="border-border"
                onClick={() => setRescheduleOpen(true)}
              >
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
          {onClose ? (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          ) : null}
        </div>

        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          startLocal={startLocal}
          setStartLocal={setStartLocal}
          endLocal={endLocal}
          setEndLocal={setEndLocal}
          onConfirm={() => rescheduleMut.mutate()}
          isPending={rescheduleMut.isPending}
        />
      </CardContent>
    </Card>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn("text-sm", highlight ? "font-semibold text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

function RescheduleDialog({
  open,
  onOpenChange,
  startLocal,
  setStartLocal,
  endLocal,
  setEndLocal,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startLocal: string;
  setStartLocal: (v: string) => void;
  endLocal: string;
  setEndLocal: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-foreground">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reschedule-start">New start date & time</Label>
            <Input
              id="reschedule-start"
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reschedule-end">New end date & time</Label>
            <Input
              id="reschedule-end"
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Duration must match the original booking. Times should reflect the
            venue&apos;s local schedule.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || !startLocal || !endLocal}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type BookingsTableProps = {
  bookings: Booking[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  showBuyer?: boolean;
};

export function BookingsTable({
  bookings,
  selectedId,
  onSelect,
  isLoading,
  emptyMessage = "No bookings found.",
  showBuyer = false,
}: BookingsTableProps) {
  const colCount = showBuyer ? 5 : 4;

  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Venue</TableHead>
            {showBuyer ? (
              <TableHead className="text-muted-foreground">Buyer</TableHead>
            ) : null}
            <TableHead className="text-muted-foreground">Start</TableHead>
            <TableHead className="text-muted-foreground">End</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={colCount} />
          ) : bookings.length === 0 ? (
            <TableEmptyRow colSpan={colCount}>{emptyMessage}</TableEmptyRow>
          ) : (
            bookings.map((booking) => (
              <TableRow
                key={booking.id}
                className={cn(
                  "border-border cursor-pointer",
                  selectedId === booking.id && "bg-muted/50",
                )}
                onClick={() => onSelect(booking.id)}
              >
                <TableCell className="font-medium text-foreground">
                  {booking.venue.name}
                </TableCell>
                {showBuyer ? (
                  <TableCell className="text-muted-foreground">
                    {booking.buyer
                      ? `${booking.buyer.firstName} ${booking.buyer.lastName}`
                      : "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-muted-foreground">
                  {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(booking.endTime), "h:mm a")}
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
}
