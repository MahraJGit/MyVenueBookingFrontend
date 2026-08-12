"use client";

import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import type { ServiceInquiry } from "@/features/marketplace/types";
import {
  asInquiryLocation,
  formatInquiryEventDate,
  inquiryAddOnNames,
  inquiryEstimateAmount,
  inquiryEstimateLines,
  inquiryHours,
  inquiryMenuSelectionLabels,
} from "@/features/marketplace/inquiry-display";
import {
  decimalToNumber,
  formatSlotLabel,
  servicePricingModelLabel,
} from "@/features/marketplace/utils";

type ServiceInquiryDetailsProps = {
  inquiry: ServiceInquiry;
  /** Show buyer block (vendor view). */
  showBuyer?: boolean;
  /** Show vendor name (buyer view). */
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

export function ServiceInquiryDetails({
  inquiry,
  showBuyer = false,
  showVendor = false,
}: ServiceInquiryDetailsProps) {
  const t = useTranslations("userDashboard");
  const location = asInquiryLocation(inquiry.location);
  const estimate = inquiryEstimateAmount(inquiry);
  const lines = inquiryEstimateLines(inquiry);
  const addOnNames = inquiryAddOnNames(inquiry);
  const menuRows = inquiryMenuSelectionLabels(inquiry);
  const hours = inquiryHours(inquiry);
  const currency = inquiry.service?.currency ?? "AED";
  const packageName = inquiry.package?.name ?? null;
  const eventDate = formatInquiryEventDate(inquiry.startDate, inquiry.endDate);
  const slotTime =
    inquiry.slot?.startAt && inquiry.slot?.endAt
      ? formatSlotLabel(
          inquiry.slot.startAt,
          inquiry.slot.endAt,
          inquiry.slot.label,
        )
      : null;
  const cityCountry = [location?.city?.trim(), location?.country?.trim()]
    .filter(Boolean)
    .join(", ");
  const addressUnlocked = location?.addressUnlocked === true;
  const showStreetAddress =
    addressUnlocked && Boolean(location?.address?.trim());
  const hasLocation =
    Boolean(cityCountry) ||
    Boolean(location?.venueName?.trim()) ||
    showStreetAddress;

  return (
    <div className="space-y-4">
      <DetailSection title={t("inquiryEventDetails")}>
        <MetaRow label={t("eventDate")} value={eventDate} />
        {slotTime ? (
          <MetaRow label={t("inquiryTimeSlot")} value={slotTime} />
        ) : null}
        {packageName ? (
          <MetaRow label={t("inquiryPackage")} value={packageName} />
        ) : null}
        {inquiry.guestCount != null && inquiry.guestCount > 0 ? (
          <MetaRow
            label={t("guests")}
            value={String(inquiry.guestCount)}
          />
        ) : null}
        {hours != null ? (
          <MetaRow label={t("hours")} value={String(hours)} />
        ) : null}
        {inquiry.service?.pricingModel ? (
          <MetaRow
            label={t("inquiryPricingModel")}
            value={servicePricingModelLabel(
              inquiry.service.pricingModel as "FLAT_PER_EVENT",
            )}
          />
        ) : null}
        <MetaRow
          label={t("inquirySubmittedAt")}
          value={new Date(inquiry.createdAt).toLocaleString()}
        />
      </DetailSection>

      {showBuyer && inquiry.buyer ? (
        <DetailSection title={t("inquiryBuyer")}>
          <MetaRow
            label={t("inquiryName")}
            value={`${inquiry.buyer.firstName} ${inquiry.buyer.lastName}`.trim()}
          />
          {inquiry.buyer.email ? (
            <MetaRow label={t("inquiryEmail")} value={inquiry.buyer.email} />
          ) : null}
        </DetailSection>
      ) : null}

      {showVendor && inquiry.service?.vendor ? (
        <DetailSection title={t("inquiryVendor")}>
          <MetaRow
            label={t("inquiryName")}
            value={inquiry.service.vendor.vendorName}
          />
          {inquiry.service.vendor.email ? (
            <MetaRow
              label={t("inquiryEmail")}
              value={inquiry.service.vendor.email}
            />
          ) : null}
        </DetailSection>
      ) : null}

      {hasLocation ? (
        <DetailSection title={t("eventLocation")}>
          <div className="flex items-start gap-2 text-zinc-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 space-y-1">
              {location?.venueName?.trim() ? (
                <p>{location.venueName.trim()}</p>
              ) : null}
              {cityCountry ? <p>{cityCountry}</p> : null}
              {showStreetAddress ? (
                <p className="text-sm text-white">{location?.address}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("addressLockedUntilConfirmed")}
                </p>
              )}
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

      {inquiry.notes ? (
        <DetailSection title={t("notes")}>
          <p className="whitespace-pre-wrap text-zinc-200">{inquiry.notes}</p>
        </DetailSection>
      ) : null}

      {estimate != null ? (
        <DetailSection title={t("estimateLabel")}>
          <p className="text-lg font-semibold text-white">
            <DisplayPrice amount={estimate} currency={currency} />
          </p>
          {lines.length > 0 ? (
            <ul className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
              {lines.map((line, index) => (
                <li
                  key={`${line.label}-${index}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 text-zinc-300">
                    {line.label}
                    {line.quantity > 1 ? (
                      <span className="text-zinc-500"> × {line.quantity}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-zinc-200">
                    <DisplayPrice
                      amount={line.amount}
                      currency={currency}
                    />
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {t("estimateNotBinding")}
          </p>
        </DetailSection>
      ) : null}

      {(inquiry.proposals?.length ?? 0) > 0 ? (
        <DetailSection title={t("inquiryProposals")}>
          <ul className="space-y-2">
            {(inquiry.proposals ?? []).map((proposal) => (
              <li
                key={proposal.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-zinc-300">
                  {t("inquiryProposalVersion", {
                    version: proposal.version ?? 1,
                  })}
                  {" · "}
                  {t(
                    `serviceProposalStatus.${proposal.status}` as "serviceProposalStatus.SENT",
                  )}
                </span>
                <span className="text-zinc-200">
                  <DisplayPrice
                    amount={decimalToNumber(proposal.totalAmount)}
                    currency={proposal.currency ?? currency}
                  />
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}
    </div>
  );
}
