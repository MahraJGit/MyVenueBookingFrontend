"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/features/bookings/types";
import { formatInVenueTimezone } from "@/features/venues/timezone";
import {
  bookingStatusBadgeClass,
} from "@/components/bookings/user-booking-utils";
import { BookingTotalPrice } from "@/components/currency/BookingTotalPrice";

type UserBookingsListProps = {
  bookings: Booking[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
};

function BookingCardSkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/40">
      <CardContent className="flex gap-4 p-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
    </Card>
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

function UserBookingCard({
  booking,
  selected,
  onSelect,
}: {
  booking: Booking;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("booking");
  const bookingStatusLabel = useBookingStatusLabel();
  const tz = booking.venue.timezone;
  const isHold = booking.status === "HOLD";

  return (
    <Card
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
        "group cursor-pointer border-zinc-800 bg-zinc-950/40 transition-all hover:border-zinc-700 hover:bg-zinc-900/60",
        selected && "border-primary/50 ring-1 ring-primary/30",
      )}
    >
      <CardContent className="flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
          {booking.venue.coverImage ? (
            <Image
              src={booking.venue.coverImage}
              alt={booking.venue.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-500">
              <MapPin className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">{booking.venue.name}</h3>
              {booking.venue.address ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {booking.venue.address}
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
              {formatInVenueTimezone(booking.startTime, tz)}
            </span>
            <BookingTotalPrice booking={booking} className="font-medium text-foreground" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {isHold ? (
              <Button
                asChild
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/venues/booking/${booking.id}/checkout`}>
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  {t("completePayment")}
                </Link>
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatInVenueTimezone(booking.endTime, tz)}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              {t("viewDetails")}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserBookingsList({
  bookings,
  selectedId,
  onSelect,
  isLoading,
}: UserBookingsListProps) {
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
        <UserBookingCard
          key={booking.id}
          booking={booking}
          selected={selectedId === booking.id}
          onSelect={() => onSelect(booking.id)}
        />
      ))}
    </div>
  );
}

export function UserBookingsEmptyState({ tab }: { tab: string }) {
  const t = useTranslations("booking");

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80">
        <CalendarDays className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">
          {tab === "all"
            ? t("noVenueBookings")
            : t("noTabBookings", { tab: tab.toLowerCase() })}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {tab === "all" ? t("discoverVenues") : t("tryAnotherTab")}
        </p>
      </div>
      <Button asChild>
        <Link href="/venues" className="inline-flex items-center gap-2">
          {t("browseVenues")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
