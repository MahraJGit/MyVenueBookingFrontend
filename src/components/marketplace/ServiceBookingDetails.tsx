"use client";

import { useTranslations } from "next-intl";
import { Lock, MapPin, Receipt } from "lucide-react";
import type { ServiceBooking, ServiceLocation } from "@/features/marketplace/types";
import {
  bookingAddOnNames,
  bookingMenuSelectionLabels,
  bookingPriceLines,
  bookingSelectionHours,
  isInstantServiceBooking,
} from "@/features/marketplace/booking-display";
import { decimalToNumber } from "@/features/marketplace/utils";

type Props = {
  booking: ServiceBooking;
  /** Buyer view — show vendor contact when available. */
  showVendor?: boolean;
};

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="min-w-0 text-left text-zinc-200 sm:text-right">{value}</span>
    </div>
  );
}

function asLocation(value: unknown): ServiceLocation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as ServiceLocation;
}

export function ServiceBookingDetails({
  booking,
  showVendor = false,
}: Props) {
  const t = useTranslations("userDashboard");
  const lines = bookingPriceLines(booking);
  const hours = bookingSelectionHours(booking);
  const addOnNames = bookingAddOnNames(booking);
  const menuRows = bookingMenuSelectionLabels(booking);
  const packageName = booking.inquiry?.package?.name?.trim() || null;
  const guestCount = booking.inquiry?.guestCount ?? null;
  const notes = booking.inquiry?.notes?.trim() || null;
  const proposalNotes = booking.proposal?.notes?.trim() || null;
  const instant = isInstantServiceBooking(booking);
  const location = asLocation(booking.locationSnapshot);
  const addressUnlocked = Boolean(booking.addressUnlocked);
  const cityCountry = [location.city?.trim(), location.country?.trim()]
    .filter(Boolean)
    .join(", ");
  const hasLocation =
    Boolean(cityCountry) ||
    Boolean(location.venueName?.trim()) ||
    Boolean(location.address?.trim());
  const startKey = String(booking.startDate).slice(0, 10);
  const endKey = String(booking.endDate).slice(0, 10);
  const eventDate = startKey === endKey ? startKey : `${startKey} → ${endKey}`;
  const vendor = booking.vendor ?? booking.service?.vendor ?? null;
  const packagePrice =
    booking.inquiry?.package?.price != null
      ? decimalToNumber(booking.inquiry.package.price)
      : null;

  return (
    <div className="space-y-4">
      {instant ? (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
          {t("instantBookingBadge")}
        </p>
      ) : null}

      <DetailSection title={t("bookingDetails")}>
        <MetaRow
          label={t("status")}
          value={t(
            `serviceBookingStatus.${booking.status}` as "serviceBookingStatus.CONFIRMED",
          )}
        />
        <MetaRow label={t("eventDate")} value={eventDate} />
        <MetaRow
          label={t("serviceFallback")}
          value={booking.service?.title ?? null}
        />
        {packageName ? (
          <MetaRow
            label={t("inquiryPackage")}
            value={
              packagePrice != null
                ? `${packageName} (${packagePrice.toLocaleString()} ${booking.currency})`
                : packageName
            }
          />
        ) : null}
        {guestCount != null && guestCount > 0 ? (
          <MetaRow label={t("guests")} value={String(guestCount)} />
        ) : null}
        {hours != null ? (
          <MetaRow label={t("hours")} value={String(hours)} />
        ) : null}
        <MetaRow
          label={t("total")}
          value={`${decimalToNumber(booking.totalAmount).toLocaleString()} ${booking.currency}`}
        />
        {booking.expiresAt ? (
          <MetaRow
            label={t("holdExpiresAt")}
            value={new Date(booking.expiresAt).toLocaleString()}
          />
        ) : null}
      </DetailSection>

      {showVendor && vendor ? (
        <DetailSection title={t("inquiryVendor")}>
          <MetaRow label={t("inquiryName")} value={vendor.vendorName} />
          {"email" in vendor && vendor.email ? (
            <MetaRow label={t("inquiryEmail")} value={vendor.email} />
          ) : null}
        </DetailSection>
      ) : null}

      {hasLocation ? (
        <DetailSection title={t("eventLocation")}>
          <div className="flex items-start gap-2 text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              {location.venueName?.trim() ? (
                <p>{location.venueName.trim()}</p>
              ) : null}
              {cityCountry ? <p>{cityCountry}</p> : null}
              {addressUnlocked && location.address?.trim() ? (
                <p className="text-sm text-white">{location.address.trim()}</p>
              ) : (
                <p className="inline-flex items-center gap-1.5 text-xs text-amber-200/90">
                  <Lock className="h-3.5 w-3.5" />
                  {t("addressLockedUntilConfirmed")}
                </p>
              )}
              {!location.venueName?.trim() &&
              !cityCountry &&
              !(addressUnlocked && location.address?.trim()) ? (
                <p className="text-muted-foreground">
                  {t("locationUnavailable")}
                </p>
              ) : null}
            </div>
          </div>
        </DetailSection>
      ) : null}

      {addOnNames.length > 0 || menuRows.length > 0 ? (
        <DetailSection title={t("inquirySelection")}>
          {addOnNames.length > 0 ? (
            <MetaRow
              label={t("selectAddOns")}
              value={addOnNames.join(", ")}
            />
          ) : null}
          {menuRows.map((row) => (
            <MetaRow
              key={row.course}
              label={row.course}
              value={row.items.join(", ")}
            />
          ))}
        </DetailSection>
      ) : null}

      {notes ? (
        <DetailSection title={t("notes")}>
          <p className="whitespace-pre-wrap text-zinc-200">{notes}</p>
        </DetailSection>
      ) : null}

      {proposalNotes ? (
        <DetailSection title={t("proposalNotes")}>
          <p className="whitespace-pre-wrap text-zinc-200">{proposalNotes}</p>
        </DetailSection>
      ) : null}

      {lines.length > 0 ? (
        <DetailSection title={t("lineItems")}>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li
                key={line.id ?? line.label}
                className="flex items-start justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-zinc-200">
                    <Receipt className="mr-1.5 inline h-3.5 w-3.5 text-zinc-500" />
                    {line.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {line.lineType ? `${line.lineType} · ` : ""}
                    {line.quantity} × {line.unitPrice.toLocaleString()}{" "}
                    {booking.currency}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-white">
                  {line.amount.toLocaleString()} {booking.currency}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-zinc-800 pt-3 text-base font-semibold text-white">
            <span>{t("total")}</span>
            <span>
              {decimalToNumber(booking.totalAmount).toLocaleString()}{" "}
              {booking.currency}
            </span>
          </div>
        </DetailSection>
      ) : null}
    </div>
  );
}
