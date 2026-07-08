"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { CalendarDays, ChevronRight, Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/features/bookings/types";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import { bookingStatusBadgeClass } from "@/components/bookings/user-booking-utils";
import { BookingTotalPrice } from "@/components/currency/BookingTotalPrice";
import { useLocaleContext } from "@/features/i18n/locale-context";

type VendorBookingsListProps = {
  bookings: Booking[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
};

function BookingCardSkeleton() {
  return (
    <div className="rounded-xl bg-[#151515] p-4">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-xl bg-[#1a1a1a]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3 bg-[#1a1a1a]" />
          <Skeleton className="h-4 w-1/2 bg-[#1a1a1a]" />
          <Skeleton className="h-4 w-1/3 bg-[#1a1a1a]" />
        </div>
      </div>
    </div>
  );
}

function useBookingStatusLabel() {
  const t = useTranslations("booking");
  return (status: BookingStatus) => {
    const keys: Record<BookingStatus, string> = {
      DRAFT: "draft",
      HOLD: "hold",
      PENDING: "pending",
      CONFIRMED: "confirmed",
      CANCELLED: "cancelled",
      COMPLETED: "completed",
    };
    return t(keys[status] as Parameters<typeof t>[0]);
  };
}

function VendorBookingCard({
  booking,
  selected,
  onSelect,
}: {
  booking: Booking;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("booking");
  const { locale } = useLocaleContext();
  const bookingStatusLabel = useBookingStatusLabel();
  const tz = booking.venue.timezone;
  const buyerName = booking.buyer
    ? `${booking.buyer.firstName} ${booking.buyer.lastName}`.trim()
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group cursor-pointer rounded-xl bg-[#151515] p-4 transition-colors hover:bg-[#1a1a1a]",
        selected && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a]">
          {booking.venue.coverImage ? (
            <Image
              src={booking.venue.coverImage}
              alt={booking.venue.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <MapPin className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground">
                {booking.venue.name}
              </h3>
              {buyerName ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <User className="h-3 w-3 shrink-0" />
                  {buyerName}
                </p>
              ) : null}
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 capitalize", bookingStatusBadgeClass(booking.status))}
            >
              {bookingStatusLabel(booking.status)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {formatInVenueTimezone(booking.startTime, tz, locale)}
            </span>
            <BookingTotalPrice booking={booking} className="font-medium text-foreground" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatInVenueTimezone(booking.endTime, tz, locale)}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("viewDetails")}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VendorBookingsList({
  bookings,
  selectedId,
  onSelect,
  isLoading,
}: VendorBookingsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <BookingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <VendorBookingCard
          key={booking.id}
          booking={booking}
          selected={selectedId === booking.id}
          onSelect={() => onSelect(booking.id)}
        />
      ))}
    </div>
  );
}

export function VendorBookingsEmptyState({
  tab,
  message,
}: {
  tab: string;
  message?: string;
}) {
  const t = useTranslations("booking");

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <CalendarDays className="h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-semibold">
        {message ??
          (tab === "all"
            ? t("noBookingsFound")
            : t("noTabBookings", { tab: tab.toLowerCase() }))}
      </h3>
      {tab !== "all" ? (
        <p className="max-w-sm text-sm text-muted-foreground">{t("tryAnotherTab")}</p>
      ) : null}
    </div>
  );
}
