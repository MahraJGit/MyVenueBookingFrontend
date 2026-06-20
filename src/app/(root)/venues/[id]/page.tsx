"use client";

import { use, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Maximize2,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { SlotPicker } from "@/components/venues/SlotPicker";
import { VenueBookingDialog } from "@/components/bookings/VenueBookingDialog";
import { DisplayPrice, DisplayPriceWithSuffix } from "@/components/currency/DisplayPrice";
import { CurrencyBrowseNotice } from "@/components/currency/CheckoutPrice";
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
  getFallbackVenueImage,
  getVenueAmenityPriceInfo,
  getVenueDisplayPrice,
  isPropertyStyleVenueType,
  parseVenuePropertyAttributes,
  pricingModelLabel,
  unavailabilityMessage,
} from "@/features/venues/utils";
import type { AvailabilitySlot } from "@/features/venues/types";

function VenueDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="h-[400px] animate-pulse bg-zinc-900" />
      <div className="container mx-auto space-y-8 px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="h-40 animate-pulse rounded-2xl bg-zinc-800" />
            <div className="h-32 animate-pulse rounded-2xl bg-zinc-800" />
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

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

  const { data: venue, isLoading, isError } = useQuery({
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

  const isDailyPricing =
    dayAvailability?.modelType === "DAILY_BLOCK" ||
    dayAvailability?.modelType === "FLAT_RATE";
  const bookableDaySlots =
    dayAvailability?.slots?.filter((slot) => slot.available) ?? [];

  if (isLoading) return <VenueDetailSkeleton />;

  if (isError || !venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] px-4 text-white">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Venue not found</h1>
          <p className="text-zinc-400">
            The venue you are looking for does not exist or is no longer available.
          </p>
          <Button asChild variant="outline" className="border-[#303030]">
            <Link href="/venues">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to venues
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const coverUrl = venue.coverImage?.trim() || getFallbackVenueImage(venue.id);
  const galleryImages = venue.gallery?.length ? venue.gallery : [];
  const hasGallery = galleryImages.length > 0;
  const currency = venue.pricing?.currency ?? "AED";
  const fullAddress = [venue.address, venue.city].filter(Boolean).join(", ");
  const lat = Number(venue.latitude);
  const lng = Number(venue.longitude);
  const hasCoords =
    !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
  const mapEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;
  const isProperty = isPropertyStyleVenueType(
    venue.venueType?.name,
    venue.venueType?.slug,
  );
  const propertyAttrs = parseVenuePropertyAttributes(venue.customAttributes);
  const hasPropertyDetails =
    isProperty &&
    (propertyAttrs.floorArea || propertyAttrs.bedrooms || propertyAttrs.bathrooms);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {/* Hero */}
      <section className="relative h-[380px] overflow-hidden md:h-[480px]">
        <Image
          src={coverUrl}
          alt={venue.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-[#0e0e0e]/20" />

        <Link
          href="/venues"
          className="absolute left-4 top-24 z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm backdrop-blur-sm transition-colors hover:border-primary hover:text-primary md:left-6 md:top-28"
        >
          <ArrowLeft size={16} />
          All venues
        </Link>

        <button
          type="button"
          className="absolute right-4 top-24 z-10 rounded-full border border-white/20 bg-black/30 p-2.5 backdrop-blur-sm transition-colors hover:border-primary md:right-6 md:top-28"
          onClick={() => {
            if (navigator.share) {
              void navigator.share({ title: venue.name, url: window.location.href });
            } else {
              void navigator.clipboard.writeText(window.location.href);
            }
          }}
          aria-label="Share venue"
        >
          <Share2 size={18} />
        </button>

        <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-10 text-center md:pb-14">
          {venue.venueType?.name && (
            <span className="mb-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              {venue.venueType.name}
            </span>
          )}
          <h1 className="mb-4 max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {venue.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-300">
            {fullAddress && (
              <span className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0 text-primary" />
                <span className="line-clamp-1">{fullAddress}</span>
              </span>
            )}
            {(venue.capacityMin || venue.capacityMax) && (
              <span className="flex items-center gap-2">
                <Users size={15} className="text-primary" />
                {venue.capacityMin ?? "?"}–{venue.capacityMax ?? "?"} guests
              </span>
            )}
            {priceInfo && (
              <span className="flex items-center gap-2 font-semibold text-primary">
                <DisplayPriceWithSuffix
                  amount={priceInfo.price}
                  currency={priceInfo.currency}
                  suffix={priceInfo.label}
                  suffixClassName="font-normal text-zinc-400"
                />
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Slider */}
      {hasGallery && (
        <section className="container relative z-10 mx-auto -mt-4 px-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Gallery
            </h2>
            <span className="text-xs text-zinc-500">
              {galleryImages.length} photo{galleryImages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <Carousel opts={{ loop: true, align: "start" }} className="w-full">
            <CarouselContent className="-ml-3">
              {galleryImages.map((img, i) => (
                <CarouselItem
                  key={`${img}-${i}`}
                  className="basis-1/2 pl-3 sm:basis-1/3 md:basis-1/4"
                >
                  <div className="group relative h-[120px] overflow-hidden rounded-xl border border-[#303030] md:h-[150px]">
                    <Image
                      src={img}
                      alt={`${venue.name} gallery ${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 h-9 w-9 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
            <CarouselNext className="right-2 h-9 w-9 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white" />
          </Carousel>
        </section>
      )}

      {/* Main Content */}
      <section className="container mx-auto px-4 py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Left column — details */}
          <div className="space-y-10 lg:col-span-2">
            {/* About */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-primary">About this venue</h2>
              <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6">
                <p className="whitespace-pre-line leading-relaxed text-zinc-300">
                  {venue.description || "No description provided."}
                </p>
              </div>
            </div>

            {/* Quick info cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {venue.pricing && priceInfo && (
                <div className="flex gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Pricing</p>
                    <p className="font-semibold text-white">
                      {pricingModelLabel(venue.pricing.modelType)}
                    </p>
                    <p className="text-sm text-primary">
                      <DisplayPriceWithSuffix
                        amount={priceInfo.price}
                        currency={priceInfo.currency}
                        suffix={priceInfo.label}
                        suffixClassName="text-zinc-400"
                      />
                    </p>
                    {venue.pricing.taxRate && (
                      <p className="text-xs text-zinc-500">
                        +{decimalToNumber(venue.pricing.taxRate)}% tax
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(venue.capacityMin || venue.capacityMax) && (
                <div className="flex gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Capacity</p>
                    <p className="font-semibold text-white">
                      {venue.capacityMin ?? "?"} – {venue.capacityMax ?? "?"} guests
                    </p>
                  </div>
                </div>
              )}

              {fullAddress && (
                <div className="flex gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-5 sm:col-span-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Location</p>
                    <p className="font-semibold text-white">{fullAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Property details */}
            {hasPropertyDetails && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-primary">Property details</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {propertyAttrs.floorArea != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <Maximize2 size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">Floor area</p>
                        <p className="font-semibold">{propertyAttrs.floorArea} m²</p>
                      </div>
                    </div>
                  )}
                  {propertyAttrs.bedrooms != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <BedDouble size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">Bedrooms</p>
                        <p className="font-semibold">{propertyAttrs.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {propertyAttrs.bathrooms != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <Bath size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">Bathrooms</p>
                        <p className="font-semibold">{propertyAttrs.bathrooms}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amenities */}
            {(venue.amenities?.length ?? 0) > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-primary">
                  <Sparkles size={20} />
                  Amenities
                </h2>
                <ul className="flex flex-wrap gap-3">
                  {venue.amenities!.map((a) => {
                    const priceInfo = getVenueAmenityPriceInfo(a);
                    return (
                      <li
                        key={a.id}
                        className="rounded-full border border-[#303030] bg-[#1B1B1B] px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-primary/50 hover:text-white"
                      >
                        {a.catalog?.name ?? "Amenity"}
                        {priceInfo ? (
                          <span className="ml-2 text-primary">
                            <DisplayPrice amount={priceInfo.amount} currency={currency} />
                            <span className="text-zinc-500"> {priceInfo.suffix}</span>
                          </span>
                        ) : (
                          <span className="ml-2 text-xs text-primary">Included</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-primary">Location</h2>
              <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B]">
                <div className="relative min-h-[280px]">
                  {mapEmbedUrl ? (
                    <iframe
                      src={mapEmbedUrl}
                      className="h-full min-h-[280px] w-full border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${venue.name} location`}
                    />
                  ) : (
                    <div className="flex min-h-[280px] items-center justify-center text-zinc-500">
                      <MapPin size={32} className="mr-2" />
                      <span>Map not available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column — booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-5">
              <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6 shadow-xl shadow-black/20">
                <div className="mb-5 flex items-center gap-2 border-b border-[#303030] pb-4">
                  <CalendarDays size={20} className="text-primary" />
                  <h2 className="text-lg font-semibold text-white">Check availability</h2>
                </div>

                {priceInfo && (
                  <div className="mb-5 rounded-xl bg-primary/10 px-4 py-3 text-center">
                    <p className="text-xs uppercase tracking-wider text-zinc-400">From</p>
                    <p className="text-xl font-bold text-primary">
                      <DisplayPrice amount={priceInfo.price} currency={priceInfo.currency} />
                      <span className="ml-1 text-sm font-normal text-zinc-400">
                        {priceInfo.label}
                      </span>
                    </p>
                    <CurrencyBrowseNotice className="mt-2 text-center" />
                  </div>
                )}

                <AvailabilityCalendar
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  availability={monthAvailability}
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedSlot(null);
                  }}
                  className="border-0 bg-transparent p-0"
                />

                {selectedDate && (
                  <div className="mt-5 space-y-3 border-t border-[#303030] pt-5">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Available slots — {formatDateKey(selectedDate)}
                    </h3>
                    {dayLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : !dayAvailability?.available ? (
                      <p className="text-center text-sm text-zinc-500">
                        {unavailabilityMessage(dayAvailability?.reason)}
                      </p>
                    ) : isDailyPricing && bookableDaySlots.length > 0 ? (
                      (() => {
                        const daySlot = bookableDaySlots[0];
                        const slotLabel = daySlot.name
                          ? daySlot.name
                          : `${daySlot.startTime} – ${daySlot.endTime}`;
                        return (
                          <Button
                            className="w-full rounded-full bg-primary hover:bg-primary/90"
                            onClick={() => {
                              setSelectedSlot(daySlot);
                              setBookingOpen(true);
                            }}
                          >
                            Book {slotLabel} —{" "}
                            <DisplayPrice amount={daySlot.price} currency={currency} />
                          </Button>
                        );
                      })()
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
                            className="w-full rounded-full bg-primary hover:bg-primary/90"
                            onClick={() => setBookingOpen(true)}
                          >
                            Continue to book
                          </Button>
                        )}
                        {(dayAvailability?.slots?.length ?? 0) > 0 &&
                          !dayAvailability.slots.some((slot) => slot.available) && (
                            <p className="text-center text-sm text-zinc-500">
                              {unavailabilityMessage("FULLY_BOOKED")}
                            </p>
                          )}
                      </>
                    )}
                  </div>
                )}

                {!selectedDate && (
                  <p className="mt-4 text-center text-xs text-zinc-500">
                    Select a date to view available time slots
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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
