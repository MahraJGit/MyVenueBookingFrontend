"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarDays,
  CreditCard,
  ExternalLink,
  Loader2,
  MapPin,
  Star,
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
  dashboardListItemClass,
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
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
  formatBookingTotal,
} from "@/components/bookings/user-booking-utils";
import { BookingTotalPrice } from "@/components/currency/BookingTotalPrice";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
} from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import type { Booking } from "@/features/bookings/types";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { toastApiError } from "@/lib/toasts";
import { VenueReviewDialog } from "@/components/reviews/VenueReviewDialog";

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
      <div className={`overflow-hidden ${dashboardListItemClass}`}>
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-6 w-2/3 bg-[#1a1a1a]" />
          <Skeleton className="h-4 w-1/2 bg-[#1a1a1a]" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-16 w-full bg-[#1a1a1a]" />
            <Skeleton className="h-16 w-full bg-[#1a1a1a]" />
          </div>
          <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
        </div>
      </div>
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
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
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
      toast.success(t("bookingCancelled"));
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
      toast.success(t("bookingRescheduled"));
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
        t={t}
        tCommon={tCommon}
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
      t={t}
      tCommon={tCommon}
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
  t: ReturnType<typeof useTranslations<"booking">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
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
  t,
  tCommon,
}: DetailBodyProps) {
  const tDashboard = useTranslations("userDashboard");
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const tz = booking.venue.timezone;
  const statusKey = {
    DRAFT: "draft",
    HOLD: "hold",
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
  } as const;
  const isHold = booking.status === "HOLD";
  const canModify =
    booking.status === "HOLD" || booking.status === "CONFIRMED";
  const canCancel =
    allowCancel &&
    booking.status !== "CANCELLED" &&
    booking.status !== "COMPLETED";

  return (
    <div className={`sticky top-6 overflow-hidden ${dashboardListItemClass}`}>
      <div className="relative h-40 bg-[#1a1a1a]">
        {booking.venue.coverImage ? (
          <Image
            src={booking.venue.coverImage}
            alt={booking.venue.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#151515]">
            <MapPin className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#151515] via-[#151515]/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{booking.venue.name}</h2>
            <p className="text-xs text-muted-foreground">
              {t("bookingRef", { ref: booking.id.slice(0, 8).toUpperCase() })}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", bookingStatusBadgeClass(booking.status))}
          >
            {t(statusKey[booking.status])}
          </Badge>
        </div>
        {onClose ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
            onClick={onClose}
            aria-label={t("closeDetails")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-5 p-6">
        {isHold && booking.expiresAt ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-2 text-sm font-medium text-amber-200">
              {t("paymentRequired")}
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
            {t("bookingConfirmedEmail")}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat
            icon={CalendarDays}
            label={t("starts")}
            value={formatInVenueTimezone(booking.startTime, tz)}
          />
          <DetailStat
            icon={CalendarDays}
            label={t("ends")}
            value={formatInVenueTimezone(booking.endTime, tz)}
          />
          <DetailStat
            icon={CreditCard}
            label={t("total")}
            value={<BookingTotalPrice booking={booking} />}
            highlight
          />
          {booking.numGuests ? (
            <DetailStat
              icon={Users}
              label={t("guests")}
              value={String(booking.numGuests)}
            />
          ) : null}
        </div>

        {booking.venue.address ? (
          <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}>
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("location")}
              </p>
              <p className="text-foreground">{booking.venue.address}</p>
            </div>
          </div>
        ) : null}

        {booking.specialRequests ? (
          <div className={`rounded-xl border p-3 text-sm ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("specialRequests")}
            </p>
            <p className="mt-1 text-foreground">{booking.specialRequests}</p>
          </div>
        ) : null}

        <Separator className="bg-[#242424]" />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {booking.canReviewVenue ? (
            <Button
              type="button"
              className="flex-1"
              onClick={() => setReviewOpen(true)}
            >
              <Star className="mr-2 h-4 w-4" />
              {tDashboard("reviewVenue")}
            </Button>
          ) : booking.hasReviewedVenue ? (
            <p className="w-full text-sm text-muted-foreground">{tDashboard("reviewedVenue")}</p>
          ) : null}
          {isHold ? (
            <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
              <Link href={`/venues/booking/${booking.id}/checkout`}>
                <CreditCard className="mr-2 h-4 w-4" />
                {t("completePayment")}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/venues/${booking.venueId}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("viewVenue")}
            </Link>
          </Button>
          {allowReschedule && canModify ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRescheduleOpen(true)}
            >
              {t("reschedule")}
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
              {t("cancelBooking")}
            </Button>
          ) : null}
        </div>
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
        t={t}
        tCommon={tCommon}
      />

      <VenueReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        venueId={booking.venueId}
        venueName={booking.venue.name}
        bookingId={booking.id}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
          void queryClient.invalidateQueries({ queryKey: ["venue-review-summary", booking.venueId] });
          void queryClient.invalidateQueries({ queryKey: ["venue-reviews", booking.venueId] });
        }}
      />
    </div>
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
  t,
  tCommon,
}: DetailBodyProps) {
  const tz = booking.venue.timezone;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">{booking.venue.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("bookingNumber", { id: booking.id.slice(0, 8) })}
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
            <dt className="text-muted-foreground">{t("start")}</dt>
            <dd className="text-foreground">
              {formatInVenueTimezone(booking.startTime, tz)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("end")}</dt>
            <dd className="text-foreground">
              {formatInVenueTimezone(booking.endTime, tz)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("total")}</dt>
            <dd className="font-semibold text-primary">
              {formatBookingTotal(booking)}
            </dd>
          </div>
          {booking.numGuests ? (
            <div>
              <dt className="text-muted-foreground">{t("guests")}</dt>
              <dd className="text-foreground">{booking.numGuests}</dd>
            </div>
          ) : null}
          {booking.buyer ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t("buyer")}</dt>
              <dd className="text-foreground">
                {booking.buyer.firstName} {booking.buyer.lastName} ({booking.buyer.email})
              </dd>
            </div>
          ) : null}
          {booking.specialRequests ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">{t("specialRequests")}</dt>
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
                {t("reschedule")}
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
                {t("cancelBooking")}
              </Button>
            )}
          {onClose ? (
            <Button variant="ghost" onClick={onClose}>
              {tCommon("close")}
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
          t={t}
          tCommon={tCommon}
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
  value: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}>
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
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startLocal: string;
  setStartLocal: (v: string) => void;
  endLocal: string;
  setEndLocal: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<"booking">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-foreground">
        <DialogHeader>
          <DialogTitle>{t("rescheduleBooking")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="reschedule-start">{t("newStartDateTime")}</Label>
            <Input
              id="reschedule-start"
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reschedule-end">{t("newEndDateTime")}</Label>
            <Input
              id="reschedule-end"
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className="border-zinc-700 bg-zinc-950"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("rescheduleDurationHint")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending || !startLocal || !endLocal}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("confirmReschedule")}
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
  emptyMessage,
  showBuyer = false,
}: BookingsTableProps) {
  const t = useTranslations("booking");
  const resolvedEmptyMessage = emptyMessage ?? t("noBookingsFound");
  const colCount = showBuyer ? 5 : 4;

  return (
    <TableShell>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">{t("venue")}</TableHead>
            {showBuyer ? (
              <TableHead className="text-muted-foreground">{t("buyer")}</TableHead>
            ) : null}
            <TableHead className="text-muted-foreground">{t("start")}</TableHead>
            <TableHead className="text-muted-foreground">{t("end")}</TableHead>
            <TableHead className="text-muted-foreground">{t("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={colCount} />
          ) : bookings.length === 0 ? (
            <TableEmptyRow colSpan={colCount}>{resolvedEmptyMessage}</TableEmptyRow>
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
