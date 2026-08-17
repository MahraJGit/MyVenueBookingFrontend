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
import { getDateFnsLocale } from "@/lib/date-locale";
import { useLocaleContext } from "@/features/i18n/locale-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { BookingLineItems } from "@/components/bookings/BookingLineItems";
import {
  cancelBooking,
  getBooking,
  rescheduleBooking,
} from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import type { Booking } from "@/features/bookings/types";
import {
  datetimeLocalValueToUtcIso,
  formatInVenueTimezone,
  utcIsoToDatetimeLocalValue,
} from "@/features/venues/timezone";
import { toastApiError } from "@/lib/toasts";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { VenueReviewDialog } from "@/components/reviews/VenueReviewDialog";

type BookingDetailPanelProps = {
  bookingId: string;
  accessScope?: "buyer" | "workspace" | "platform";
  onClose?: () => void;
  allowCancel?: boolean;
  allowReschedule?: boolean;
  variant?: "default" | "user" | "vendor";
  /** Hide chat CTA (e.g. admin venue bookings). */
  showChat?: boolean;
};

function isValidDatetimeLocalInTimezone(value: string, timezone: string): boolean {
  if (!value) return false;
  try {
    const iso = datetimeLocalValueToUtcIso(value, timezone);
    // Guard against non-existent local times (DST gaps) or malformed values.
    return utcIsoToDatetimeLocalValue(iso, timezone) === value;
  } catch {
    return false;
  }
}

function DetailSkeleton({ variant }: { variant: "default" | "user" | "vendor" }) {
  if (variant === "user" || variant === "vendor") {
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
  accessScope,
  onClose,
  allowCancel = true,
  allowReschedule = true,
  variant = "default",
  showChat = true,
}: BookingDetailPanelProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: [...bookingKeys.detail(user?.id, bookingId), accessScope],
    queryFn: () => getBooking(bookingId, accessScope),
    enabled: isAuthenticated && isReady && !!user?.id,
    refetchOnMount: "always",
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
    mutationFn: () => {
      if (!booking) throw new Error("Booking not loaded");
      const tz = booking.venue.timezone;
      if (!isValidDatetimeLocalInTimezone(startLocal, tz)) {
        throw new Error(t("invalidStartDateTime"));
      }
      if (!isValidDatetimeLocalInTimezone(endLocal, tz)) {
        throw new Error(t("invalidEndDateTime"));
      }
      return rescheduleBooking(bookingId, {
        startTime: datetimeLocalValueToUtcIso(startLocal, tz),
        endTime: datetimeLocalValueToUtcIso(endLocal, tz),
      });
    },
    onSuccess: () => {
      toast.success(t("bookingRescheduled"));
      setRescheduleOpen(false);
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      refetch();
    },
    onError: (e) => toastApiError(e),
  });

  const openReschedule = () => {
    if (!booking) return;
    const tz = booking.venue.timezone;
    setStartLocal(utcIsoToDatetimeLocalValue(booking.startTime, tz));
    setEndLocal(utcIsoToDatetimeLocalValue(booking.endTime, tz));
    setRescheduleOpen(true);
  };

  const handleStartLocalChange = (value: string) => {
    setStartLocal(value);
    if (!booking || !value) return;
    const durationMs =
      new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
    try {
      const nextStart = datetimeLocalValueToUtcIso(value, booking.venue.timezone);
      const nextEnd = new Date(new Date(nextStart).getTime() + durationMs);
      setEndLocal(
        utcIsoToDatetimeLocalValue(nextEnd.toISOString(), booking.venue.timezone),
      );
    } catch {
      /* keep end as-is until value is complete */
    }
  };

  if (isLoading || !booking) {
    return <DetailSkeleton variant={variant} />;
  }

  if (variant === "vendor") {
    return (
      <VendorBookingDetail
        booking={booking}
        onClose={onClose}
        allowCancel={allowCancel}
        allowReschedule={allowReschedule}
        showChat={showChat}
        cancelMut={cancelMut}
        rescheduleMut={rescheduleMut}
        rescheduleOpen={rescheduleOpen}
        setRescheduleOpen={setRescheduleOpen}
        startLocal={startLocal}
        onStartLocalChange={handleStartLocalChange}
        endLocal={endLocal}
        setEndLocal={setEndLocal}
        onOpenReschedule={openReschedule}
        onExpire={() => refetch()}
        t={t}
        tCommon={tCommon}
      />
    );
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
        onStartLocalChange={handleStartLocalChange}
        endLocal={endLocal}
        setEndLocal={setEndLocal}
        onOpenReschedule={openReschedule}
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
      onStartLocalChange={handleStartLocalChange}
      endLocal={endLocal}
      setEndLocal={setEndLocal}
      onOpenReschedule={openReschedule}
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
  showChat?: boolean;
  cancelMut: { mutate: () => void; isPending: boolean };
  rescheduleMut: { mutate: () => void; isPending: boolean };
  rescheduleOpen: boolean;
  setRescheduleOpen: (open: boolean) => void;
  startLocal: string;
  onStartLocalChange: (v: string) => void;
  endLocal: string;
  setEndLocal: (v: string) => void;
  onOpenReschedule: () => void;
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
  onStartLocalChange,
  endLocal,
  setEndLocal,
  onOpenReschedule,
  onExpire,
  t,
  tCommon,
}: DetailBodyProps) {
  const tDashboard = useTranslations("userDashboard");
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const tz = booking.venue.timezone;
  const { locale } = useLocaleContext();
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
            value={formatInVenueTimezone(booking.startTime, tz, locale)}
          />
          <DetailStat
            icon={CalendarDays}
            label={t("ends")}
            value={formatInVenueTimezone(booking.endTime, tz, locale)}
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

        <BookingLineItems
          booking={booking}
          className={`rounded-xl border p-4 ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}
        />

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
          {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") ? (
            <OpenChatButton
              kind="booking"
              referenceId={booking.id}
              messagesPath="/userDashboard/messages"
              variant="outline"
            />
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
              onClick={onOpenReschedule}
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
        timezone={tz}
        startLocal={startLocal}
        onStartLocalChange={onStartLocalChange}
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
  onStartLocalChange,
  endLocal,
  setEndLocal,
  onOpenReschedule,
  onExpire,
  t,
  tCommon,
}: DetailBodyProps) {
  const tz = booking.venue.timezone;
  const { locale } = useLocaleContext();

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
              {formatInVenueTimezone(booking.startTime, tz, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("end")}</dt>
            <dd className="text-foreground">
              {formatInVenueTimezone(booking.endTime, tz, locale)}
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
          {booking.source === "OFFLINE" ? (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Local guest</dt>
              <dd className="text-foreground">
                {booking.guestName?.trim() || "—"}
                {booking.guestPhone?.trim()
                  ? ` · ${booking.guestPhone.trim()}`
                  : ""}
                <span className="ml-2 text-xs text-amber-200">(Offline)</span>
              </dd>
            </div>
          ) : booking.buyer ? (
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

        <BookingLineItems booking={booking} className="rounded-lg border border-border bg-muted/20 p-4" />

        <div className="flex flex-wrap gap-2">
          {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") &&
          booking.source !== "OFFLINE" ? (
            <OpenChatButton
              kind="booking"
              referenceId={booking.id}
              messagesPath="/vendorDashboard/messages"
              labelKey="messageBuyer"
            />
          ) : null}
          {allowReschedule &&
            (booking.status === "HOLD" || booking.status === "CONFIRMED") && (
              <Button
                variant="outline"
                className="border-border"
                onClick={onOpenReschedule}
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
          timezone={tz}
          startLocal={startLocal}
          onStartLocalChange={onStartLocalChange}
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

function VendorBookingDetail({
  booking,
  onClose,
  allowCancel,
  allowReschedule,
  showChat = true,
  cancelMut,
  rescheduleMut,
  rescheduleOpen,
  setRescheduleOpen,
  startLocal,
  onStartLocalChange,
  endLocal,
  setEndLocal,
  onOpenReschedule,
  onExpire,
  t,
  tCommon,
}: DetailBodyProps) {
  const tz = booking.venue.timezone;
  const { locale } = useLocaleContext();
  const statusKey = {
    DRAFT: "draft",
    HOLD: "hold",
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
  } as const;
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
        {booking.status === "HOLD" && booking.expiresAt ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-2 text-sm font-medium text-amber-200">
              {t("vendorHoldPending")}
            </p>
            <CountdownTimer
              expiresAt={booking.expiresAt}
              onExpire={onExpire}
              className="border-amber-500/30 bg-amber-500/5"
            />
          </div>
        ) : null}

        {booking.buyer ? (
          <div className={`rounded-xl border p-3 text-sm ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("buyer")}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {booking.buyer.firstName} {booking.buyer.lastName}
            </p>
            <p className="text-muted-foreground">{booking.buyer.email}</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailStat
            icon={CalendarDays}
            label={t("starts")}
            value={formatInVenueTimezone(booking.startTime, tz, locale)}
          />
          <DetailStat
            icon={CalendarDays}
            label={t("ends")}
            value={formatInVenueTimezone(booking.endTime, tz, locale)}
          />
          {booking.numGuests ? (
            <DetailStat
              icon={Users}
              label={t("guests")}
              value={String(booking.numGuests)}
            />
          ) : null}
        </div>

        {booking.specialRequests ? (
          <div className={`rounded-xl border p-3 text-sm ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("specialRequests")}
            </p>
            <p className="mt-1 text-foreground">{booking.specialRequests}</p>
          </div>
        ) : null}

        <BookingLineItems
          booking={booking}
          className={`rounded-xl border p-4 ${dashboardSurfaceBorderClass} bg-[#1a1a1a]`}
        />

        <Separator className="bg-[#242424]" />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {showChat &&
          (booking.status === "CONFIRMED" || booking.status === "COMPLETED") ? (
            <OpenChatButton
              kind="booking"
              referenceId={booking.id}
              messagesPath="/vendorDashboard/messages"
              labelKey="messageBuyer"
              variant="outline"
            />
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
              onClick={onOpenReschedule}
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
        timezone={tz}
        startLocal={startLocal}
        onStartLocalChange={onStartLocalChange}
        endLocal={endLocal}
        setEndLocal={setEndLocal}
        onConfirm={() => rescheduleMut.mutate()}
        isPending={rescheduleMut.isPending}
        t={t}
        tCommon={tCommon}
      />
    </div>
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
  timezone,
  startLocal,
  onStartLocalChange,
  endLocal,
  setEndLocal,
  onConfirm,
  isPending,
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timezone: string;
  startLocal: string;
  onStartLocalChange: (v: string) => void;
  endLocal: string;
  setEndLocal: (v: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  t: ReturnType<typeof useTranslations<"booking">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-foreground">
        <DialogHeader>
          <DialogTitle>{t("rescheduleBooking")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("rescheduleTimezoneHint", { timezone })}
          </p>
          <div className="space-y-2">
            <Label htmlFor="reschedule-start">{t("newStartDateTime")}</Label>
            <DateTimePicker
              value={startLocal}
              onChange={onStartLocalChange}
              placeholder={t("newStartDateTime")}
              formatLabel={(date) => format(date, "PPP p", { locale: dateFnsLocale })}
              triggerClassName="w-full justify-start border-zinc-700 bg-zinc-950 text-left font-normal"
              popoverClassName="z-[90] border-zinc-700 bg-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reschedule-end">{t("newEndDateTime")}</Label>
            <DateTimePicker
              value={endLocal}
              onChange={setEndLocal}
              placeholder={t("newEndDateTime")}
              formatLabel={(date) => format(date, "PPP p", { locale: dateFnsLocale })}
              triggerClassName="w-full justify-start border-zinc-700 bg-zinc-950 text-left font-normal"
              popoverClassName="z-[90] border-zinc-700 bg-zinc-900"
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
  const { locale } = useLocaleContext();
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
                  {formatInVenueTimezone(booking.startTime, booking.venue.timezone, locale)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatInVenueTimezone(booking.endTime, booking.venue.timezone, locale, {
                    timeStyle: "short",
                  })}
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
