"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CalendarDays, Loader2, MapPin, Store } from "lucide-react";
import { DetailGallerySlider } from "@/components/gallery/DetailGallerySlider";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { Button } from "@/components/ui/button";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { ServiceInquiryDialog } from "@/components/marketplace/ServiceInquiryDialog";
import {
  checkServiceAvailability,
  getPreviewMarketplaceService,
  getPublicMarketplaceServiceBySlug,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import {
  decimalToNumber,
  formatDateKey,
  getServiceFromPrice,
  monthRangeKeys,
  serviceCustomizationLabel,
  servicePricingModelLabel,
} from "@/features/marketplace/utils";
import { getFallbackEventImage } from "@/features/events/utils";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import type { MonthAvailabilityDay } from "@/features/venues/types";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useAuth } from "@/features/auth/auth-context";

function DetailSkeleton() {
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

export default function MarketplaceServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isEmbed = searchParams.get("embed") === "1";
  const isPreview = searchParams.get("preview") === "1";
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const { isAuthenticated, isReady } = useAuth();

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"inquire" | "instant">("inquire");

  const serviceQuery = useQuery({
    queryKey: [
      ...marketplaceKeys.publicDetail(slug),
      locale,
      isPreview ? "preview" : "public",
    ],
    queryFn: () =>
      isPreview
        ? getPreviewMarketplaceService(slug)
        : getPublicMarketplaceServiceBySlug(slug),
  });

  const year = calendarMonth.getFullYear();
  const monthNum = calendarMonth.getMonth() + 1;
  const range = monthRangeKeys(year, monthNum);

  const availabilityQuery = useQuery({
    queryKey: marketplaceKeys.availability(
      serviceQuery.data?.id ?? "",
      range.startDate,
      range.endDate,
    ),
    queryFn: () =>
      checkServiceAvailability(
        serviceQuery.data!.id,
        range.startDate,
        range.endDate,
      ),
    enabled: Boolean(serviceQuery.data?.id),
  });

  const busyDates = useMemo(() => {
    const set = new Set<string>();
    const result = availabilityQuery.data;
    if (!result) return set;
    for (const block of result.blocks ?? []) {
      if (block.isBlocked) set.add(String(block.blockDate).slice(0, 10));
    }
    for (const booking of result.busyBookings ?? []) {
      const start = new Date(String(booking.startDate).slice(0, 10) + "T12:00:00");
      const end = new Date(String(booking.endDate).slice(0, 10) + "T12:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(formatDateKey(d));
      }
    }
    return set;
  }, [availabilityQuery.data]);

  const openByWeekday = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const row of serviceQuery.data?.schedules ?? []) {
      map.set(row.dayOfWeek, row.isOpen);
    }
    return map;
  }, [serviceQuery.data?.schedules]);

  const monthAvailability: MonthAvailabilityDay[] = useMemo(() => {
    const days: MonthAvailabilityDay[] = [];
    const endDay = new Date(year, monthNum, 0).getDate();
    const hasSchedule = openByWeekday.size > 0;
    for (let day = 1; day <= endDay; day += 1) {
      const date = new Date(year, monthNum - 1, day);
      const key = formatDateKey(date);
      const weekday = date.getDay();
      const scheduleOpen = hasSchedule ? openByWeekday.get(weekday) === true : true;
      const available = scheduleOpen && !busyDates.has(key);
      days.push({
        date: key,
        available,
        reason: available ? undefined : "BLOCKED",
      });
    }
    return days;
  }, [year, monthNum, busyDates, openByWeekday]);

  const selectedDateStr = selectedDate ? formatDateKey(selectedDate) : "";

  const handleSelectDate = (date: Date | undefined) => {
    // Single selection only — do not clear when the same day is clicked again.
    if (date) setSelectedDate(date);
  };

  const openBookingDialog = (mode: "inquire" | "instant") => {
    if (isPreview || !selectedDate) return;
    if (!isReady) return;
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname || `/marketplace/${slug}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    setDialogMode(mode);
    setInquiryOpen(true);
  };

  if (serviceQuery.isLoading) return <DetailSkeleton />;

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e] text-white">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">{t("notFound")}</h1>
          <p className="text-zinc-400">{t("notFoundDesc")}</p>
          {!isEmbed ? (
            <Button asChild variant="outline">
              <Link href="/marketplace">{t("backToMarketplace")}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const service = serviceQuery.data;
  const price = getServiceFromPrice(service);
  const coverUrl = service.coverImage?.trim()
    ? getMediaProxyUrl(service.coverImage.trim())
    : getFallbackEventImage(service.id);
  const galleryImages = (service.portfolio ?? []).filter(
    (u) => u && u !== service.coverImage,
  );
  const locationLabel =
    service.baseCity ||
    (service.citiesServed?.length ? service.citiesServed.slice(0, 3).join(", ") : null);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {isPreview ? (
        <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-100">
          {t("previewModeBanner")}
        </div>
      ) : null}

      <div className="relative h-[360px] w-full overflow-hidden sm:h-[420px]">
        <Image
          src={coverUrl}
          alt={service.title}
          fill
          priority
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-10">
          <p className="mb-2 text-sm uppercase tracking-wide text-primary">
            {service.category?.name || t("badge")}
          </p>
          <h1 className="mb-3 max-w-3xl text-3xl font-bold sm:text-5xl" dir="auto">
            {service.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-200">
            {service.vendor?.vendorName ? (
              <span className="inline-flex items-center gap-1.5">
                <Store className="h-4 w-4 text-primary" />
                {service.vendor.vendorName}
              </span>
            ) : null}
            {locationLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {locationLabel}
              </span>
            ) : null}
            {price.amount != null ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                {tCommon("from")}{" "}
                <DisplayPrice amount={price.amount} currency={price.currency} />
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <DetailGallerySlider
          className="container mx-auto -mt-4 px-4"
          images={galleryImages}
          lightboxTitle={service.title}
          getAlt={(i) => t("galleryImageAlt", { index: i + 1 })}
          showDots={false}
          itemClassName="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4"
          thumbnailClassName="h-[120px] md:h-[150px]"
        />
      ) : null}

      <section className="container mx-auto px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="order-2 min-w-0 space-y-10 lg:order-1 lg:col-span-2">
            <section>
              <h2 className="mb-6 text-xl font-bold text-primary">{t("about")}</h2>
              <div className="prose prose-invert max-w-none whitespace-pre-line leading-relaxed text-zinc-300">
                {service.description || t("noDescription")}
              </div>
            </section>

            {(service.packages?.length ?? 0) > 0 ? (
              <section>
                <h2 className="mb-6 text-xl font-bold text-primary">
                  {t("packages")}
                </h2>
                <ul className="space-y-4">
                  {(service.packages ?? [])
                    .filter((p) => p.isActive !== false)
                    .map((pkg) => (
                      <li
                        key={pkg.id ?? pkg.name}
                        className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-white">{pkg.name}</h4>
                            {pkg.description ? (
                              <p className="mt-2 text-sm text-zinc-400">
                                {pkg.description}
                              </p>
                            ) : null}
                          </div>
                          <span className="shrink-0 rounded-full border border-primary px-3 py-0.5 text-sm font-bold text-primary">
                            <DisplayPrice
                              amount={decimalToNumber(pkg.price)}
                              currency={service.currency}
                            />
                          </span>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}

            {(service.addOns?.length ?? 0) > 0 ? (
              <section>
                <h2 className="mb-6 text-xl font-bold text-primary">{t("addOns")}</h2>
                <ul className="space-y-3">
                  {(service.addOns ?? [])
                    .filter((a) => a.isActive !== false)
                    .map((addon) => (
                      <li
                        key={addon.id ?? addon.name}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#303030] bg-[#1B1B1B] px-4 py-3 text-sm"
                      >
                        <span>{addon.name}</span>
                        <DisplayPrice
                          amount={decimalToNumber(addon.price)}
                          currency={service.currency}
                          className="font-semibold text-primary"
                        />
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}

            {(service.baseCity || (service.citiesServed?.length ?? 0) > 0) ? (
              <section>
                <h2 className="mb-6 text-xl font-bold text-primary">
                  {t("serviceArea")}
                </h2>
                <p className="text-zinc-300">
                  {[
                    service.baseCity?.trim(),
                    ...(service.citiesServed ?? []).map((c) => c.trim()),
                  ]
                    .filter(Boolean)
                    .filter(
                      (city, i, arr) =>
                        arr.findIndex(
                          (x) => x?.toLowerCase() === city?.toLowerCase(),
                        ) === i,
                    )
                    .join(", ")}
                </p>
              </section>
            ) : null}
          </div>

          <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
            <div className="lg:sticky lg:top-[calc(var(--site-header-offset)+1rem)]">
              <div
                className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 shadow-xl shadow-black/25 sm:p-6"
                aria-labelledby="service-inquiry-title"
              >
                <div className="mb-4 flex items-center gap-2.5 border-b border-[#303030] pb-3 sm:mb-5 sm:pb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <CalendarDays size={18} className="text-primary" />
                  </div>
                  <h2
                    id="service-inquiry-title"
                    className="text-base font-semibold text-white sm:text-lg"
                  >
                    {t("availability")}
                  </h2>
                </div>

                <p className="mb-3 text-xs uppercase tracking-wide text-zinc-500">
                  Pricing Model: {servicePricingModelLabel(service.pricingModel)}
                  {/* {serviceCustomizationLabel(service.customizationMode)} */}
                </p>

                {price.amount != null ? (
                  <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5 text-center sm:mb-5 sm:px-4 sm:py-3">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 sm:text-xs">
                      {t("from")}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-primary sm:text-xl">
                      <DisplayPrice
                        amount={price.amount}
                        currency={price.currency}
                      />
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl border border-[#303030] bg-[#151515] px-3 py-2.5 text-center text-sm text-zinc-400 sm:mb-5">
                    {t("priceOnRequest")}
                  </div>
                )}

                <div className="relative mt-1">
                  {availabilityQuery.isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <AvailabilityCalendar
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      availability={monthAvailability}
                      selected={selectedDate}
                      timezone={service.timezone ?? undefined}
                      onSelect={handleSelectDate}
                      className="border-0 bg-transparent p-0"
                    />
                  )}
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                  {t("availabilityHint")}
                </p>

                <div className="mt-4 border-t border-[#303030] pt-4 sm:mt-5 sm:pt-5">
                  {isPreview ? (
                    <>
                      <Button type="button" className="w-full" disabled>
                        {service.instantBookingEnabled
                          ? t("instantBookCta")
                          : t("inquireCta")}
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("previewInquireDisabled")}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {service.instantBookingEnabled ? (
                        <>
                          <Button
                            type="button"
                            className="w-full bg-primary"
                            onClick={() => openBookingDialog("instant")}
                            disabled={!selectedDate}
                          >
                            {t("instantBookCta")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-[#303030] bg-transparent"
                            onClick={() => openBookingDialog("inquire")}
                            disabled={!selectedDate}
                          >
                            {t("inquireCta")}
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {selectedDate
                              ? t("instantBookHint")
                              : t("selectDateToBook")}
                          </p>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            className="w-full bg-primary"
                            onClick={() => openBookingDialog("inquire")}
                            disabled={!selectedDate}
                          >
                            {t("inquireCta")}
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {selectedDate
                              ? t("inquireHint")
                              : t("selectDateToInquire")}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isPreview ? (
        <ServiceInquiryDialog
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          service={service}
          initialStartDate={selectedDateStr}
          initialEndDate={selectedDateStr}
          lockEventDate
          mode={dialogMode}
        />
      ) : null}
    </div>
  );
}
