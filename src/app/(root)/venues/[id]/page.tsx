"use client";

import { use, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { DetailGallerySlider } from "@/components/gallery/DetailGallerySlider";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { VenueReviewsSection } from "@/components/reviews/VenueReviewsSection";
import { SlotPicker } from "@/components/venues/SlotPicker";
import { VenueBookingDialog } from "@/components/bookings/VenueBookingDialog";
import { DisplayPrice, DisplayPriceWithSuffix } from "@/components/currency/DisplayPrice";
import { CurrencyBrowseNotice } from "@/components/currency/CheckoutPrice";
import { Button } from "@/components/ui/button";
import {
  getDayAvailability,
  getMonthAvailability,
  getPreviewVenue,
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
} from "@/features/venues/utils";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import type { AvailabilitySlot, PricingModel, UnavailabilityReason } from "@/features/venues/types";
import {
  combinedSlotRange,
  selectedSlotsTotalPrice,
  toggleSlotSelection,
} from "@/features/venues/slot-selection";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useVenuePriceLabels } from "@/features/i18n/use-venue-price-labels";

function usePricingModelLabel() {
  const t = useTranslations("venues");
  return (model: PricingModel) => {
    switch (model) {
      case "HOURLY":
        return t("modelHourly");
      case "NAMED_SLOTS":
        return t("modelNamedSlots");
      case "DAILY_BLOCK":
        return t("modelDailyBlock");
      case "FLAT_RATE":
        return t("modelFlatRate");
      default:
        return model;
    }
  };
}

function useUnavailabilityMessage() {
  const t = useTranslations("venues");
  return (reason?: UnavailabilityReason) => {
    switch (reason) {
      case "BLOCKED":
        return t("unavailBlocked");
      case "CLOSED":
        return t("unavailClosed");
      case "FULLY_BOOKED":
        return t("unavailFullyBooked");
      case "OUT_OF_WINDOW":
        return t("unavailOutOfWindow");
      default:
        return t("unavailDefault");
    }
  };
}

function VenueDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="h-[45vh] min-h-[260px] max-h-[480px] animate-pulse bg-zinc-900 sm:min-h-[320px]" />
      <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
            <div className="h-40 animate-pulse rounded-2xl bg-zinc-800" />
            <div className="h-32 animate-pulse rounded-2xl bg-zinc-800" />
          </div>
          <div className="order-1 h-[420px] animate-pulse rounded-2xl bg-zinc-800 lg:order-2" />
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
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";
  const isPreview = searchParams.get("preview") === "1";
  const t = useTranslations("venues");
  const { locale } = useLocaleContext();
  const priceLabels = useVenuePriceLabels();
  const pricingModelLabel = usePricingModelLabel();
  const unavailabilityMessage = useUnavailabilityMessage();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);

  const handleShare = useCallback(async (venueName: string) => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: venueName, url });
      } catch {
        /* user dismissed share sheet */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("shareFailed"));
    }
  }, [t]);

  const { data: venue, isLoading, isError } = useQuery({
    queryKey: [...venueKeys.publicDetail(id), locale, isPreview ? "preview" : "public"],
    queryFn: () => (isPreview ? getPreviewVenue(id) : getPublicVenue(id)),
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
    () => (venue ? getVenueDisplayPrice(venue, priceLabels) : null),
    [venue, priceLabels],
  );

  const isDailyPricing = dayAvailability?.modelType === "DAILY_BLOCK";
  const bookableDaySlots =
    dayAvailability?.slots?.filter((slot) => slot.available) ?? [];
  const combinedRange = combinedSlotRange(selectedSlots);
  const canContinueBooking =
    selectedSlots.length > 0 && selectedSlots.every((s) => s.available);

  if (isLoading) return <VenueDetailSkeleton />;

  if (isError || !venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] px-4 text-white">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">{t("notFound")}</h1>
          <p className="text-zinc-400">{t("notFoundDesc")}</p>
          <Button asChild variant="outline" className="border-[#303030]">
            <Link href="/venues">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToVenues")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const coverUrl = getMediaProxyUrl(venue.coverImage?.trim() || getFallbackVenueImage(venue.id));
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
    <div className="min-h-screen overflow-x-hidden bg-[#0e0e0e] text-white">
      {isEmbed || isPreview ? (
        <div className="border-b border-primary/30 bg-primary/10 px-4 py-2 text-center text-xs text-primary sm:text-sm">
          {t("previewModeBanner")}
        </div>
      ) : null}
      {/* Hero */}
      <section className="relative h-[42vh] min-h-[260px] max-h-[500px] overflow-hidden sm:min-h-[320px] md:h-[480px]">
        <Image
          src={coverUrl}
          alt={venue.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/60 to-[#0e0e0e]/20" />

        {!isEmbed && !isPreview ? (
        <Link
          href="/venues"
          className="absolute left-3 top-[calc(var(--site-header-offset)+0.5rem)] z-10 flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs backdrop-blur-md transition-colors hover:border-primary hover:text-primary sm:left-4 sm:px-4 sm:py-2 sm:text-sm md:left-6"
        >
          <ArrowLeft size={16} />
          {t("allVenuesLink")}
        </Link>
        ) : null}

        {!isEmbed && !isPreview ? (
        <button
          type="button"
          className="absolute right-3 top-[calc(var(--site-header-offset)+0.5rem)] z-10 rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur-md transition-colors hover:border-primary hover:bg-black/50 sm:right-4 sm:p-2.5 md:right-6"
          onClick={() => void handleShare(venue.name)}
          aria-label={t("shareVenue")}
        >
          <Share2 size={18} />
        </button>
        ) : null}

        <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-8 text-center sm:pb-10 md:pb-14">
          {venue.venueType?.name && (
            <span className="mb-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary sm:mb-3 sm:px-4 sm:text-xs">
              {venue.venueType.name}
            </span>
          )}
          <h1 className="mb-3 line-clamp-2 max-w-4xl px-1 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            {venue.name}
          </h1>
          <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-2 text-xs text-zinc-300 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:text-sm">
            {fullAddress && (
              <span className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0 text-primary" />
                <span className="line-clamp-1">{fullAddress}</span>
              </span>
            )}
            {(venue.capacityMin || venue.capacityMax) && (
              <span className="flex items-center gap-2">
                <Users size={15} className="text-primary" />
                {t("guestsRange", {
                  min: venue.capacityMin ?? "?",
                  max: venue.capacityMax ?? "?",
                })}
              </span>
            )}
            {priceInfo && (
              <span className="hidden items-center gap-2 font-semibold text-primary lg:flex">
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
        <DetailGallerySlider
          className="container mx-auto -mt-4 px-4 sm:px-6"
          images={galleryImages}
          lightboxTitle={venue.name}
          getAlt={(i) => t("galleryImageAlt", { index: i + 1 })}
          swipeHint={t("swipeForMorePhotos")}
          header={
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                {t("gallery")}
              </h2>
              <span className="shrink-0 text-xs text-zinc-500">
                {galleryImages.length === 1
                  ? t("photoCount", { count: galleryImages.length })
                  : t("photosCount", { count: galleryImages.length })}
              </span>
            </div>
          }
        />
      )}

      {/* Main Content */}
      <section className="container mx-auto max-w-full px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <div className="grid min-w-0 gap-8 lg:grid-cols-3 lg:gap-10 xl:gap-12">
          {/* Left column — details */}
          <div className="order-2 min-w-0 space-y-8 sm:space-y-10 lg:order-1 lg:col-span-2">
            {/* About */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-xl">{t("aboutVenue")}</h2>
              <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:p-6">
                <p className="whitespace-pre-line leading-relaxed text-zinc-300">
                  {venue.description || t("noDescription")}
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
                    <p className="text-xs text-zinc-500">{t("pricing")}</p>
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
                        {t("taxPercent", {
                          rate: decimalToNumber(venue.pricing.taxRate),
                        })}
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
                    <p className="text-xs text-zinc-500">{t("capacity")}</p>
                    <p className="font-semibold text-white">
                      {t("guestsRange", {
                        min: venue.capacityMin ?? "?",
                        max: venue.capacityMax ?? "?",
                      })}
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
                    <p className="text-xs text-zinc-500">{t("location")}</p>
                    <p className="font-semibold text-white">{fullAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Property details */}
            {hasPropertyDetails && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-xl">{t("propertyDetails")}</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {propertyAttrs.floorArea != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <Maximize2 size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">{t("floorArea")}</p>
                        <p className="font-semibold">{propertyAttrs.floorArea} m²</p>
                      </div>
                    </div>
                  )}
                  {propertyAttrs.bedrooms != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <BedDouble size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">{t("bedrooms")}</p>
                        <p className="font-semibold">{propertyAttrs.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {propertyAttrs.bathrooms != null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
                      <Bath size={18} className="text-primary" />
                      <div>
                        <p className="text-xs text-zinc-500">{t("bathrooms")}</p>
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
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary sm:mb-4 sm:text-xl">
                  <Sparkles size={20} />
                  {t("amenities")}
                </h2>
                <ul className="flex flex-wrap gap-3">
                  {venue.amenities!.map((a) => {
                    const priceInfo = getVenueAmenityPriceInfo(a, priceLabels);
                    return (
                      <li
                        key={a.id}
                        className="rounded-full border border-[#303030] bg-[#1B1B1B] px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-primary/50 hover:text-white"
                      >
                        {a.catalog?.name ?? t("amenity")}
                        {priceInfo ? (
                          <span className="ml-2 text-primary">
                            <DisplayPrice amount={priceInfo.amount} currency={currency} />
                            <span className="text-zinc-500"> {priceInfo.suffix}</span>
                          </span>
                        ) : (
                          <span className="ml-2 text-xs text-primary">{t("included")}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-xl">{t("location")}</h2>
              <div className="overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B]">
                <div className="relative min-h-[220px] sm:min-h-[280px]">
                  {mapEmbedUrl ? (
                    <iframe
                      src={mapEmbedUrl}
                      className="h-full min-h-[220px] w-full border-0 sm:min-h-[280px]"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${venue.name} location`}
                    />
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-zinc-500 sm:min-h-[280px] sm:flex-row">
                      <MapPin size={32} className="mr-2" />
                      <span>{t("mapNotAvailable")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column — booking */}
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(var(--site-header-offset)+1rem)]">
              <div
                className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 shadow-xl shadow-black/25 sm:p-6"
                aria-labelledby="booking-panel-title"
              >
                <div className="mb-4 flex items-center gap-2.5 border-b border-[#303030] pb-3 sm:mb-5 sm:pb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <CalendarDays size={18} className="text-primary" />
                  </div>
                  <h2 id="booking-panel-title" className="text-base font-semibold text-white sm:text-lg">
                    {t("checkAvailability")}
                  </h2>
                </div>

                {priceInfo && (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-center sm:mb-5 sm:px-4 sm:py-3">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 sm:text-xs">
                      {t("fromLabel")}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-primary sm:text-xl">
                      <DisplayPrice amount={priceInfo.price} currency={priceInfo.currency} />
                      <span className="ml-1 text-sm font-normal text-zinc-400">
                        {priceInfo.label}
                      </span>
                    </p>
                    <CurrencyBrowseNotice className="mt-2 text-center" />
                  </div>
                )}

                {!isPreview && !isEmbed ? (
                <div className="relative mt-1">
                  <AvailabilityCalendar
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    availability={monthAvailability}
                    selected={selectedDate}
                    timezone={venue.timezone}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      setSelectedSlots([]);
                    }}
                    className="border-0 bg-transparent p-0"
                  />
                </div>
                ) : (
                  <p className="mt-4 rounded-lg bg-zinc-900/50 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-500">
                    {t("previewBookingDisabled")}
                  </p>
                )}

                {!isPreview && !isEmbed && selectedDate && (
                  <div
                    className="mt-4 min-w-0 space-y-3 border-t border-[#303030] pt-4 sm:mt-5 sm:pt-5"
                    aria-live="polite"
                    aria-busy={dayLoading}
                  >
                    <h3 className="text-xs font-medium text-zinc-300 sm:text-sm">
                      {t("availableSlots", { date: formatDateKey(selectedDate) })}
                    </h3>
                    {venue.timezone ? (
                      <p className="text-[11px] text-zinc-500">
                        {t("timezoneHint", { timezone: venue.timezone })}
                      </p>
                    ) : null}
                    {dayLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
                        <span className="sr-only">{t("loadingSlots")}</span>
                        <p className="text-xs text-zinc-500">{t("loadingSlots")}</p>
                      </div>
                    ) : !dayAvailability?.available ? (
                      <p className="text-center text-sm text-zinc-500">
                        {unavailabilityMessage(dayAvailability?.reason)}
                      </p>
                    ) : isDailyPricing && bookableDaySlots.length > 0 ? (
                      (() => {
                        const daySlot = bookableDaySlots[0];
                        return (
                          <div className="space-y-2">
                            <p className="text-center text-xs text-zinc-400">
                              {t("bookingHours", {
                                start: daySlot.startTime,
                                end: daySlot.endTime,
                              })}
                              {venue.timezone ? ` · ${venue.timezone}` : ""}
                            </p>
                            <Button
                              className="h-auto min-h-11 w-full whitespace-normal rounded-full bg-primary px-4 py-2.5 text-sm shadow-lg shadow-primary/20 hover:bg-primary/90"
                              onClick={() => {
                                setSelectedSlots([daySlot]);
                                setBookingOpen(true);
                              }}
                            >
                              {t("bookFullDay")} —{" "}
                              <DisplayPrice amount={daySlot.price} currency={currency} />
                            </Button>
                          </div>
                        );
                      })()
                    ) : (
                      <>
                        <SlotPicker
                          slots={dayAvailability?.slots ?? []}
                          currency={currency}
                          selectedSlots={selectedSlots}
                          onToggleSlot={(slot) =>
                            setSelectedSlots((prev) =>
                              toggleSlotSelection(
                                dayAvailability?.slots ?? [],
                                prev,
                                slot,
                              ),
                            )
                          }
                        />
                        {canContinueBooking && combinedRange ? (
                          <div className="space-y-2">
                            <p className="text-center text-xs text-zinc-400">
                              {combinedRange.startTime} – {combinedRange.endTime}
                              {venue.timezone ? ` · ${venue.timezone}` : ""}
                              {selectedSlots.length > 1
                                ? ` · ${t("slotsSelected", { count: selectedSlots.length })}`
                                : ""}
                            </p>
                            <Button
                              className="h-11 w-full rounded-full bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90"
                              onClick={() => setBookingOpen(true)}
                            >
                              {t("continueToBook")} —{" "}
                              <DisplayPrice
                                amount={selectedSlotsTotalPrice(selectedSlots)}
                                currency={currency}
                              />
                            </Button>
                          </div>
                        ) : null}
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

                {!isPreview && !isEmbed && !selectedDate && (
                  <p className="mt-4 rounded-lg bg-zinc-900/50 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-500">
                    {t("selectDateForSlots")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto border-t border-[#303030] px-4 py-12 sm:px-6">
        <VenueReviewsSection venueId={venue.id} />
      </section>

      {!isPreview && !isEmbed && combinedRange && selectedDate && (
        <VenueBookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          venue={venue}
          dateStr={formatDateKey(selectedDate)}
          slot={{
            startTime: combinedRange.startTime,
            endTime: combinedRange.endTime,
          }}
        />
      )}
    </div>
  );
}
