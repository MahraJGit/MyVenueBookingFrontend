"use client";

import { Bath, BedDouble, Clock, DollarSign, MapPin, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import type { PublicVenue, VenuePricing } from "@/features/venues/types";
import {
  DAY_NAMES,
  decimalToNumber,
  formatVenuePrice,
  getVenueAmenityPriceInfo,
  isPropertyStyleVenueType,
  parseVenuePropertyAttributes,
  pricingModelLabel,
} from "@/features/venues/utils";
import { useVenuePriceLabels } from "@/features/i18n/use-venue-price-labels";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

type NamedSlotConfig = {
  name?: string;
  startTime?: string;
  endTime?: string;
  price?: number | string;
};

function PricingDetails({
  pricing,
  t,
}: {
  pricing: VenuePricing;
  t: ReturnType<typeof useTranslations<"adminVenueReviews">>;
}) {
  const config = (pricing.config ?? {}) as Record<string, unknown>;
  const currency = pricing.currency;
  const namedSlots =
    pricing.modelType === "NAMED_SLOTS" && Array.isArray(config.slots)
      ? (config.slots as NamedSlotConfig[])
      : [];

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t("pricing")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1 font-normal">
          <DollarSign className="h-3 w-3" />
          {pricingModelLabel(pricing.modelType)}
        </Badge>
        {pricing.modelType !== "NAMED_SLOTS" ? (
          <span className="text-foreground">
            {formatVenuePrice(decimalToNumber(pricing.basePrice), currency)}
          </span>
        ) : null}
        <span className="text-muted-foreground">
          {t("taxRate", { rate: decimalToNumber(pricing.taxRate) })}
        </span>
      </div>

      {namedSlots.length > 0 ? (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t("namedSlots")}</p>
          <ul className="space-y-1.5">
            {namedSlots.map((slot, idx) => (
              <li
                key={`${slot.name ?? "slot"}-${slot.startTime ?? idx}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="inline-flex items-center gap-2 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {slot.name?.trim() || `Slot ${idx + 1}`}
                  </span>
                  <span className="text-muted-foreground">
                    {slot.startTime ?? "—"} – {slot.endTime ?? "—"}
                  </span>
                </span>
                <span className="text-foreground">
                  {formatVenuePrice(decimalToNumber(slot.price ?? 0), currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pricing.modelType === "HOURLY" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <DetailRow
            label={t("hourlyRate")}
            value={formatVenuePrice(decimalToNumber(pricing.basePrice), currency)}
          />
          <DetailRow
            label={t("slotDuration")}
            value={t("minutes", { count: Number(config.slotDurationMinutes) || 60 })}
          />
          <DetailRow
            label={t("bufferMinutes")}
            value={t("minutes", { count: Number(config.bufferMinutes) || 0 })}
          />
        </div>
      ) : null}

      {pricing.modelType === "DAILY_BLOCK" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DetailRow
            label={t("pricePerDay")}
            value={formatVenuePrice(
              config.pricePerDay !== undefined
                ? decimalToNumber(config.pricePerDay as number | string)
                : decimalToNumber(pricing.basePrice),
              currency,
            )}
          />
          <DetailRow
            label={t("minBookingDays")}
            value={String(Number(config.minBookingDays) || 1)}
          />
        </div>
      ) : null}
    </div>
  );
}

type VenueReviewDetailsProps = {
  venue: PublicVenue;
};

export function VenueReviewDetails({ venue }: VenueReviewDetailsProps) {
  const t = useTranslations("adminVenueReviews");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tVenues = useTranslations("venues");
  const tSetup = useTranslations("venueSetup");
  const priceLabels = useVenuePriceLabels();

  const currency = venue.pricing?.currency ?? "AED";
  const gallery = venue.gallery ?? [];
  const schedules = [...(venue.schedules ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const isProperty = isPropertyStyleVenueType(
    venue.venueType?.name,
    venue.venueType?.slug,
  );
  const propertyAttrs = parseVenuePropertyAttributes(venue.customAttributes);
  const hasPropertyDetails =
    isProperty &&
    (propertyAttrs.floorArea != null ||
      propertyAttrs.bedrooms != null ||
      propertyAttrs.bathrooms != null);

  const rules = (venue.rules ?? {}) as Record<string, unknown>;
  const bookingPolicy = (rules.bookingPolicy as Record<string, unknown>) ?? {};
  const cancellationPolicy = (rules.cancellationPolicy as Record<string, unknown>) ?? {};
  const maxAdvanceDays = Number(bookingPolicy.maxAdvanceDays);
  const freeCancelHours = Number(cancellationPolicy.freeCancelHoursBeforeStart);
  const lateRefundPercent = Number(cancellationPolicy.lateRefundPercent);
  const hasPolicies =
    Number.isFinite(maxAdvanceDays) ||
    Number.isFinite(freeCancelHours) ||
    Number.isFinite(lateRefundPercent);

  const lat = Number(venue.latitude);
  const lng = Number(venue.longitude);
  const hasCoords =
    !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);

  const rejectionReason =
    "rejectionReason" in venue
      ? (venue as PublicVenue & { rejectionReason?: string | null }).rejectionReason
      : null;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {venue.venueType?.name ? (
          <Badge variant="outline">{venue.venueType.name}</Badge>
        ) : null}
      </div>

      {venue.coverImage ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <SecureStoredImage
            src={venue.coverImage}
            alt={venue.name}
            className="h-48 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{tVenues("gallery")}</p>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="overflow-hidden rounded-md border border-border"
              >
                <SecureStoredImage
                  src={url}
                  alt={t("galleryImageAlt", { index: index + 1 })}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noGallery")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailRow label={tCommon("vendor")} value={venue.vendor?.vendorName ?? "—"} />
        <DetailRow label={t("vendorEmail")} value={venue.vendor?.email ?? "—"} />
        <DetailRow label={tForms("city")} value={venue.city ?? "—"} />
        <DetailRow label={tForms("address")} value={venue.address} />
        <DetailRow label={tForms("timezone")} value={venue.timezone} />
        <DetailRow
          label={t("coordinates")}
          value={hasCoords ? `${lat}, ${lng}` : "—"}
        />
        <DetailRow
          label={t("capacity")}
          value={
            venue.capacityMin || venue.capacityMax
              ? `${venue.capacityMin ?? "—"} – ${venue.capacityMax ?? "—"}`
              : "—"
          }
        />
        {venue.createdAt ? (
          <DetailRow
            label={t("submittedOn")}
            value={new Date(venue.createdAt).toLocaleString()}
          />
        ) : null}
      </div>

      {hasPropertyDetails ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {tVenues("propertyDetails")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {propertyAttrs.floorArea != null ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{tVenues("floorArea")}</p>
                  <p className="font-medium">{propertyAttrs.floorArea} m²</p>
                </div>
              </div>
            ) : null}
            {propertyAttrs.bedrooms != null ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{tVenues("bedrooms")}</p>
                  <p className="font-medium">{propertyAttrs.bedrooms}</p>
                </div>
              </div>
            ) : null}
            {propertyAttrs.bathrooms != null ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{tVenues("bathrooms")}</p>
                  <p className="font-medium">{propertyAttrs.bathrooms}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium text-muted-foreground">{tCommon("description")}</p>
        <p className="mt-1 whitespace-pre-wrap text-foreground">
          {venue.description?.trim() || "—"}
        </p>
      </div>

      {rejectionReason ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-medium text-destructive">{t("rejectionReason")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{rejectionReason}</p>
        </div>
      ) : null}

      {hasPolicies ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("bookingPolicies")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Number.isFinite(maxAdvanceDays) ? (
              <DetailRow
                label={tSetup("maxAdvanceDays")}
                value={String(maxAdvanceDays)}
              />
            ) : null}
            {Number.isFinite(freeCancelHours) ? (
              <DetailRow
                label={tSetup("freeCancelHours")}
                value={String(freeCancelHours)}
              />
            ) : null}
            {Number.isFinite(lateRefundPercent) ? (
              <DetailRow
                label={tSetup("lateRefundPercent")}
                value={`${lateRefundPercent}%`}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <Separator />

      {venue.pricing ? <PricingDetails pricing={venue.pricing} t={t} /> : null}

      {schedules.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("weeklySchedule")}</p>
          <ul className="space-y-1 text-foreground">
            {schedules.map((s) => (
              <li key={s.dayOfWeek} className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="min-w-[88px] font-medium">{DAY_NAMES[s.dayOfWeek]}</span>
                <span className="text-muted-foreground">
                  {s.isOpen ? `${s.openTime} – ${s.closeTime}` : t("closed")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {venue.amenities && venue.amenities.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{tForms("amenities")}</p>
          <ul className="space-y-2">
            {venue.amenities.map((amenity) => {
              const priceInfo = getVenueAmenityPriceInfo(amenity, priceLabels);
              return (
                <li
                  key={amenity.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      {amenity.catalog?.name ?? amenity.catalogId}
                    </p>
                    {amenity.catalog?.category ? (
                      <p className="text-xs text-muted-foreground">{amenity.catalog.category}</p>
                    ) : null}
                    {(amenity.capacity != null || amenity.maxPerBooking != null) && (
                      <p className="text-xs text-muted-foreground">
                        {amenity.capacity != null
                          ? t("amenityCapacity", { count: amenity.capacity })
                          : null}
                        {amenity.capacity != null && amenity.maxPerBooking != null
                          ? " · "
                          : null}
                        {amenity.maxPerBooking != null
                          ? t("amenityMaxPerBooking", { count: amenity.maxPerBooking })
                          : null}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-foreground">
                    {priceInfo ? (
                      <>
                        {formatVenuePrice(priceInfo.amount, currency)}
                        <span className="text-muted-foreground"> {priceInfo.suffix}</span>
                      </>
                    ) : (
                      <span className="text-primary">{tVenues("included")}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {hasCoords ? (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {tVenues("location")}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              title={t("mapPreview")}
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
              className="h-48 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
