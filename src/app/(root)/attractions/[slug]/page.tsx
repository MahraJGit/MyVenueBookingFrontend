"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  CalendarDays,
  Globe,
  Loader2,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailGallerySlider } from "@/components/gallery/DetailGallerySlider";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import {
  getAttractionAvailability,
  getAttractionMonthAvailability,
  getPublicAttractionBySlug,
} from "@/features/attractions/api";
import type { MonthAvailabilityDay } from "@/features/venues/types";
import { formatDateKey } from "@/features/venues/timezone";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { CurrencyBrowseNotice } from "@/components/currency/CheckoutPrice";
import { AttractionTicketPurchaseDialog } from "@/components/attractions/AttractionTicketPurchaseDialog";
import { EventOrganizerSection } from "@/components/events/EventOrganizerSection";
import { VendorReviewsSection } from "@/components/reviews/VendorReviewsSection";
import { useAuth } from "@/features/auth/auth-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getIntlLocale } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import type { PublicVendorProfile as EventVendorProfile } from "@/features/events/api";

function AttractionDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="h-[400px] animate-pulse bg-zinc-900" />
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
          <div className="h-40 animate-pulse rounded-2xl bg-zinc-800" />
          <div className="h-32 animate-pulse rounded-2xl bg-zinc-800" />
        </div>
        <div className="order-1 h-[420px] animate-pulse rounded-2xl bg-zinc-800 lg:order-2" />
      </div>
    </div>
  );
}

function formatTime(
  iso: string,
  timezone: string,
  intlLocale: string,
): string {
  return new Date(iso).toLocaleTimeString(intlLocale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export default function AttractionDetailPage() {
  const t = useTranslations("attractions");
  const tCommon = useTranslations("common");
  const tTickets = useTranslations("tickets");
  const { locale } = useLocaleContext();
  const intlLocale = getIntlLocale(locale);
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(
    null,
  );
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const {
    data: attraction,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-attraction", slug, locale],
    queryFn: () => getPublicAttractionBySlug(slug),
    enabled: Boolean(slug),
  });

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const monthQuery = useQuery({
    queryKey: ["attraction-month-availability", slug, monthKey],
    queryFn: () => getAttractionMonthAvailability(slug, monthKey),
    enabled: Boolean(slug && attraction),
  });

  const monthAvailability: MonthAvailabilityDay[] = useMemo(
    () => monthQuery.data?.days ?? [],
    [monthQuery.data],
  );

  const dateStr = selectedDate ? formatDateKey(selectedDate) : "";

  const availabilityQuery = useQuery({
    queryKey: ["attraction-availability", slug, dateStr],
    queryFn: () => getAttractionAvailability(slug, dateStr),
    enabled: Boolean(slug && dateStr),
  });

  useEffect(() => {
    setSelectedOccurrenceId(null);
  }, [dateStr]);

  const selectedSlot = useMemo(
    () =>
      availabilityQuery.data?.slots.find(
        (s) => s.occurrenceId === selectedOccurrenceId,
      ) ?? null,
    [availabilityQuery.data, selectedOccurrenceId],
  );

  const bookableSlots = useMemo(
    () =>
      (availabilityQuery.data?.slots ?? []).filter(
        (s) => s.status === "SCHEDULED",
      ),
    [availabilityQuery.data],
  );

  if (isLoading) return <AttractionDetailSkeleton />;

  if (isError || !attraction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">{t("notFound")}</h1>
          <p className="text-zinc-400">
            {error instanceof Error ? error.message : t("notFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const coverUrl = attraction.coverImage?.trim() || "/images/card-img-2.jpg";
  const galleryImages = attraction.gallery?.length ? attraction.gallery : [];
  const venueLabel =
    attraction.venueName ||
    [attraction.city, attraction.state].filter(Boolean).join(", ");
  const fromCurrency =
    attraction.ticketTypes.find((tt) => tt.isActive !== false)?.currency || "USD";
  const fullAddress = [
    attraction.address,
    attraction.city,
    attraction.state,
    attraction.zipCode,
  ]
    .filter(Boolean)
    .join(", ");
  const lat = Number(attraction.latitude);
  const lng = Number(attraction.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapEmbedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  const openPurchase = (occurrenceId: string) => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname || `/attractions/${slug}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    setSelectedOccurrenceId(occurrenceId);
    setPurchaseOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="relative h-[360px] w-full overflow-hidden sm:h-[420px]">
        <Image
          src={coverUrl}
          alt={attraction.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-10">
          <p className="mb-2 text-sm uppercase tracking-wide text-primary">
            {t("badge")}
          </p>
          <h1 className="mb-3 max-w-3xl text-3xl font-bold sm:text-5xl" dir="auto">
            {attraction.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-200">
            {venueLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {venueLabel}
              </span>
            ) : null}
            {attraction.fromPrice != null ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                {tCommon("from")}{" "}
                <DisplayPrice amount={attraction.fromPrice} currency={fromCurrency} />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <DetailGallerySlider
          className="container mx-auto -mt-4 px-4"
          images={galleryImages}
          lightboxTitle={attraction.name}
          getAlt={(i) => t("galleryImageAlt", { index: i + 1 })}
          showDots={false}
          itemClassName="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4"
          thumbnailClassName="h-[120px] md:h-[150px]"
        />
      ) : null}

      <section className="container mx-auto px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left — event-style details */}
          <div className="order-2 min-w-0 space-y-10 lg:order-1 lg:col-span-2">
            <section>
              <h2 className="mb-6 text-xl font-bold text-primary">
                {t("aboutTitle")}
              </h2>
              <div className="prose prose-invert max-w-none whitespace-pre-line leading-relaxed text-zinc-300">
                {attraction.description || t("noDescription")}
              </div>
            </section>

            {attraction.ticketTypes.length > 0 ? (
              <section>
                <h2 className="mb-2 text-xl font-bold text-primary">
                  {tTickets("title")}
                </h2>
                <p className="mb-6 text-xs text-zinc-500">
                  {t("ticketTypesHint")}
                </p>
                <CurrencyBrowseNotice className="mb-6" chargeLabel="event" />
                <div className="mb-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {attraction.ticketTypes
                    .filter((tt) => tt.isActive !== false)
                    .map((ticketType) => (
                      <div
                        key={ticketType.id ?? ticketType.name}
                        className="flex flex-col gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            <Ticket size={18} className="shrink-0 text-primary" />
                            <h4 className="min-h-[2.5rem] flex-1 break-words text-sm font-semibold leading-6 text-white">
                              {ticketType.name}
                            </h4>
                          </div>
                          <span className="shrink-0 rounded-full border border-primary px-3 py-0.5 text-sm font-bold text-primary">
                            <DisplayPrice
                              amount={ticketType.price}
                              currency={ticketType.currency || fromCurrency}
                            />
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {t("perShowCapacity", {
                            count: ticketType.quantityPerOccurrence,
                          })}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            ) : null}

            {attraction.tags?.length ? (
              <section>
                <h2 className="mb-4 text-xl font-bold text-primary">{t("tags")}</h2>
                <div className="flex flex-wrap gap-2">
                  {attraction.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#303030] bg-[#1B1B1B] px-3 py-1 text-xs text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* Right — venue-style booking panel */}
          <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(var(--site-header-offset)+1rem)]">
              <div
                className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 shadow-xl shadow-black/25 sm:p-6"
                aria-labelledby="attraction-booking-title"
              >
                <div className="mb-4 flex items-center gap-2.5 border-b border-[#303030] pb-3 sm:mb-5 sm:pb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <CalendarDays size={18} className="text-primary" />
                  </div>
                  <h2
                    id="attraction-booking-title"
                    className="text-base font-semibold text-white sm:text-lg"
                  >
                    {t("checkAvailability")}
                  </h2>
                </div>

                {attraction.fromPrice != null ? (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-center sm:mb-5 sm:px-4 sm:py-3">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 sm:text-xs">
                      {t("fromLabel")}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-primary sm:text-xl">
                      <DisplayPrice
                        amount={attraction.fromPrice}
                        currency={fromCurrency}
                      />
                      <span className="ml-1 text-sm font-normal text-zinc-400">
                        {t("perTicket")}
                      </span>
                    </p>
                    <CurrencyBrowseNotice className="mt-2 text-center" />
                  </div>
                ) : null}

                <div className="relative mt-1">
                  <AvailabilityCalendar
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    availability={monthAvailability}
                    selected={selectedDate}
                    timezone={attraction.timezone}
                    onSelect={(d) => {
                      setSelectedDate(d);
                      setSelectedOccurrenceId(null);
                    }}
                    className="border-0 bg-transparent p-0"
                  />
                </div>
                {monthQuery.data?.bookingHorizonDays != null ? (
                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                    {t("bookingHorizonHint", {
                      days: monthQuery.data.bookingHorizonDays,
                    })}
                  </p>
                ) : null}

                {selectedDate ? (
                  <div
                    className="mt-4 min-w-0 space-y-3 border-t border-[#303030] pt-4 sm:mt-5 sm:pt-5"
                    aria-live="polite"
                    aria-busy={availabilityQuery.isLoading}
                  >
                    <h3 className="text-xs font-medium text-zinc-300 sm:text-sm">
                      {t("availableShows", { date: dateStr })}
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      {t("timezoneHint", { timezone: attraction.timezone })}
                    </p>

                    {availabilityQuery.isLoading ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <Loader2
                          className="h-6 w-6 animate-spin text-primary"
                          aria-hidden
                        />
                        <p className="text-xs text-zinc-500">{t("loadingShows")}</p>
                      </div>
                    ) : availabilityQuery.isError ? (
                      <p className="text-center text-sm text-red-400">
                        {availabilityQuery.error instanceof Error
                          ? availabilityQuery.error.message
                          : t("loadShowsError")}
                      </p>
                    ) : bookableSlots.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#303030] px-4 py-6 text-center text-sm text-zinc-500">
                        {t("noShowsForDay")}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-zinc-500">{t("selectShowHint")}</p>
                        <div
                          className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                          role="listbox"
                          aria-label={t("selectShow")}
                        >
                          {bookableSlots.map((slot) => {
                            const remaining = slot.inventories.reduce(
                              (sum, inv) => sum + inv.remaining,
                              0,
                            );
                            const available = remaining > 0;
                            const selected =
                              selectedOccurrenceId === slot.occurrenceId;
                            const start = formatTime(
                              slot.startDateTime,
                              attraction.timezone,
                              intlLocale,
                            );
                            const end = formatTime(
                              slot.endDateTime,
                              attraction.timezone,
                              intlLocale,
                            );
                            const label = slot.slotName
                              ? `${slot.slotName} (${start}–${end})`
                              : `${start} – ${end}`;
                            const fromInv = slot.inventories
                              .filter((inv) => inv.isActive !== false && inv.remaining > 0)
                              .sort((a, b) => Number(a.price) - Number(b.price))[0];

                            return (
                              <Button
                                key={slot.occurrenceId}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                variant={selected ? "default" : "outline"}
                                disabled={!available}
                                onClick={() =>
                                  setSelectedOccurrenceId(slot.occurrenceId)
                                }
                                className={cn(
                                  "h-auto min-h-11 w-full min-w-0 max-w-full flex-col items-start gap-1 whitespace-normal break-words rounded-xl border-[#303030] px-3 py-3 text-left transition-colors",
                                  !available && "opacity-40",
                                  !selected &&
                                    available &&
                                    "hover:border-primary/40 hover:bg-primary/5",
                                  selected &&
                                    "border-primary bg-primary text-white shadow-md shadow-primary/20",
                                )}
                              >
                                <span className="w-full text-xs font-medium leading-snug">
                                  {label}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs",
                                    selected ? "text-white/90" : "text-primary",
                                  )}
                                >
                                  {available
                                    ? fromInv ? (
                                        <>
                                          {tCommon("from")}{" "}
                                          <DisplayPrice
                                            amount={Number(fromInv.price)}
                                            currency={fromInv.currency}
                                            className={cn(
                                              "text-xs",
                                              selected
                                                ? "text-white/90"
                                                : "text-primary",
                                            )}
                                          />
                                        </>
                                      ) : (
                                        t("spotsLeft", { count: remaining })
                                      )
                                    : t("soldOut")}
                                </span>
                              </Button>
                            );
                          })}
                        </div>

                        {selectedSlot ? (
                          <div className="space-y-2">
                            <p className="text-center text-xs text-zinc-400">
                              {selectedSlot.slotName
                                ? `${selectedSlot.slotName} · `
                                : ""}
                              {formatTime(
                                selectedSlot.startDateTime,
                                attraction.timezone,
                                intlLocale,
                              )}{" "}
                              –{" "}
                              {formatTime(
                                selectedSlot.endDateTime,
                                attraction.timezone,
                                intlLocale,
                              )}
                              {` · ${attraction.timezone}`}
                            </p>
                            <Button
                              className="h-11 w-full rounded-full bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90"
                              onClick={() =>
                                openPurchase(selectedSlot.occurrenceId)
                              }
                            >
                              {t("buyTickets")}
                            </Button>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg bg-zinc-900/50 px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-500">
                    {t("selectDateForShows")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {attraction.vendorProfile ? (
        <EventOrganizerSection
          vendor={attraction.vendorProfile as EventVendorProfile}
        />
      ) : null}

      <section className="container mx-auto px-4 py-12 sm:px-6">
        <h2 className="mb-8 text-xl font-bold text-primary">
          {t("venueInformation")}
        </h2>
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:p-6">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-semibold text-white">
                {attraction.venueName || attraction.name}
              </h3>
              <p className="mt-1 flex items-start gap-1 text-sm text-zinc-400">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span className="break-words">
                  {attraction.city}
                  {attraction.state ? `, ${attraction.state}` : ""}
                </span>
              </p>
            </div>

            <div className="space-y-4 border-t border-[#303030] pt-4">
              <h4 className="text-sm font-semibold text-white">
                {t("contactDetails")}
              </h4>

              {attraction.venuePhone ? (
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Phone size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">{t("phone")}</p>
                    <p className="break-all text-sm text-white">
                      {attraction.venuePhone}
                    </p>
                  </div>
                </div>
              ) : null}

              {attraction.venueWebsite ? (
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Globe size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">{t("website")}</p>
                    <a
                      href={attraction.venueWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary hover:underline"
                    >
                      {attraction.venueWebsite}
                    </a>
                  </div>
                </div>
              ) : null}

              {fullAddress ? (
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <MapPin size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">{t("address")}</p>
                    <p className="break-words text-sm text-white">{fullAddress}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B]">
            <div className="px-6 pb-2 pt-4">
              <h4 className="text-sm font-semibold text-white">
                {t("locationMap")}
              </h4>
            </div>
            <div className="relative min-h-[280px] flex-1">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
                  className="h-full min-h-[280px] w-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title={t("locationMap")}
                />
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center text-zinc-500">
                  <MapPin size={32} className="mr-2" />
                  <span>{t("mapNotAvailable")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {attraction.vendorProfile?.id ? (
        <section className="container mx-auto border-t border-[#303030] px-4 py-12 sm:px-6">
          <VendorReviewsSection vendorId={attraction.vendorProfile.id} />
        </section>
      ) : null}

      {selectedOccurrenceId ? (
        <AttractionTicketPurchaseDialog
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          occurrenceId={selectedOccurrenceId}
          attractionName={attraction.name}
          coverImage={attraction.coverImage}
          seatingEnabled={Boolean(
            selectedSlot?.status === "SCHEDULED" &&
              (attraction.seatingEnabled ||
                availabilityQuery.data?.seatingEnabled),
          )}
          onSuccess={() => {
            void availabilityQuery.refetch();
            void monthQuery.refetch();
          }}
        />
      ) : null}
    </div>
  );
}
