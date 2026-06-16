"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Users } from "lucide-react";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { SlotPicker } from "@/components/venues/SlotPicker";
import { VenueBookingDialog } from "@/components/bookings/VenueBookingDialog";
import { Button } from "@/components/ui/button";
import {
  getDayAvailability,
  getMonthAvailability,
  getPublicVenue,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import { formatDateKey } from "@/features/venues/timezone";
import {
  decimalToNumber,
  formatVenuePrice,
  getFallbackVenueImage,
  getVenueDisplayPrice,
  pricingModelLabel,
} from "@/features/venues/utils";
import type { AvailabilitySlot } from "@/features/venues/types";

export default function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data: venue, isLoading } = useQuery({
    queryKey: venueKeys.publicDetail(id),
    queryFn: () => getPublicVenue(id),
  });

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth() + 1;

  const { data: monthAvailability = [] } = useQuery({
    queryKey: venueKeys.monthAvailability(id, year, month),
    queryFn: () => getMonthAvailability(id, year, month),
    enabled: !!venue,
  });

  const dateStr = selectedDate ? formatDateKey(selectedDate) : "";

  const { data: dayAvailability, isLoading: dayLoading } = useQuery({
    queryKey: venueKeys.dayAvailability(id, dateStr),
    queryFn: () => getDayAvailability(id, dateStr),
    enabled: !!dateStr && !!venue,
  });

  const priceInfo = useMemo(
    () => (venue ? getVenueDisplayPrice(venue) : null),
    [venue],
  );

  if (isLoading || !venue) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const imageSrc = venue.coverImage || getFallbackVenueImage(venue.id);
  const currency = venue.pricing?.currency ?? "AED";

  return (
    <div className="container mx-auto px-4 pb-16 pt-28">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#303030]">
            <Image src={imageSrc} alt={venue.name} fill className="object-cover" priority />
          </div>

          <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6 space-y-4">
            <h1 className="text-2xl font-bold text-white">{venue.name}</h1>
            {venue.venueType?.name && (
              <span className="text-sm text-primary">{venue.venueType.name}</span>
            )}
            {venue.description && (
              <p className="text-sm text-muted-foreground">{venue.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {venue.address}
                {venue.city ? `, ${venue.city}` : ""}
              </span>
              {(venue.capacityMin || venue.capacityMax) && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {venue.capacityMin ?? "?"}–{venue.capacityMax ?? "?"} guests
                </span>
              )}
            </div>
            {venue.pricing && (
              <div className="border-t border-[#303030] pt-4">
                <p className="text-sm text-muted-foreground">
                  {pricingModelLabel(venue.pricing.modelType)}
                </p>
                {priceInfo && (
                  <p className="text-xl font-bold text-primary">
                    {formatVenuePrice(priceInfo.price, priceInfo.currency)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      {priceInfo.label}
                    </span>
                  </p>
                )}
                {venue.pricing.taxRate && (
                  <p className="text-xs text-muted-foreground">
                    +{decimalToNumber(venue.pricing.taxRate)}% tax
                  </p>
                )}
              </div>
            )}
            {(venue.amenities?.length ?? 0) > 0 && (
              <div className="border-t border-[#303030] pt-4">
                <h4 className="mb-2 text-white">Amenities</h4>
                <ul className="flex flex-wrap gap-2">
                  {venue.amenities!.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-full border border-[#303030] px-3 py-1 text-xs text-muted-foreground"
                    >
                      {a.catalog?.name ?? "Amenity"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Check availability</h2>
          <AvailabilityCalendar
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            availability={monthAvailability}
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null);
            }}
          />

          {selectedDate && (
            <div className="space-y-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
              <h3 className="text-white">
                Slots for {formatDateKey(selectedDate)}
              </h3>
              {dayLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : dayAvailability?.modelType === "DAILY_BLOCK" ||
                dayAvailability?.modelType === "FLAT_RATE" ? (
                dayAvailability.available ? (
                  <Button
                    className="bg-primary"
                    onClick={() => {
                      setSelectedSlot({
                        startTime: "09:00",
                        endTime: "17:00",
                        available: true,
                        price: dayAvailability.price,
                      });
                      setBookingOpen(true);
                    }}
                  >
                    Book this day —{" "}
                    {formatVenuePrice(dayAvailability.price, currency)}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Not available</p>
                )
              ) : (
                <>
                  <SlotPicker
                    slots={dayAvailability?.slots ?? []}
                    currency={currency}
                    selected={
                      selectedSlot
                        ? {
                            startTime: selectedSlot.startTime,
                            endTime: selectedSlot.endTime,
                          }
                        : null
                    }
                    onSelect={(slot) => setSelectedSlot(slot)}
                  />
                  {selectedSlot?.available && (
                    <Button
                      className="w-full bg-primary"
                      onClick={() => setBookingOpen(true)}
                    >
                      Continue to book
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          <Button asChild variant="outline" className="border-[#303030]">
            <Link href="/venues">Back to venues</Link>
          </Button>
        </div>
      </div>

      {selectedSlot && selectedDate && (
        <VenueBookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          venue={venue}
          dateStr={formatDateKey(selectedDate)}
          slot={{
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
          }}
        />
      )}
    </div>
  );
}
