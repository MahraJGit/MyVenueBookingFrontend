"use client";

import { useTranslations } from "next-intl";
import { Clock, MapPin } from "lucide-react";
import type { ManagedMarketplaceService } from "@/features/marketplace/types";
import {
  decimalToNumber,
  serviceCustomizationLabel,
  servicePricingModelLabel,
} from "@/features/marketplace/utils";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { useDayNames } from "@/features/i18n/use-day-names";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function ServiceReviewDetails({
  service,
}: {
  service: ManagedMarketplaceService;
}) {
  const t = useTranslations("adminMarketplaceReviews");
  const dayNames = useDayNames();
  const portfolio = service.portfolio ?? [];
  const schedules = [...(service.schedules ?? [])].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  return (
    <div className="space-y-5">
      {service.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getMediaProxyUrl(service.coverImage)}
          alt=""
          className="h-44 w-full rounded-lg object-cover"
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("category")} value={service.category?.name ?? "—"} />
        <DetailRow
          label={t("vendor")}
          value={service.vendor?.vendorName ?? "—"}
        />
        <DetailRow
          label={t("pricing")}
          value={servicePricingModelLabel(service.pricingModel)}
        />
        <DetailRow
          label={t("customization")}
          value={serviceCustomizationLabel(service.customizationMode)}
        />
        <DetailRow
          label={t("basePrice")}
          value={
            service.basePrice != null
              ? `${decimalToNumber(service.basePrice)} ${service.currency}`
              : "—"
          }
        />
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("location")}</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {service.baseCity ||
              (service.citiesServed ?? []).slice(0, 3).join(", ") ||
              "—"}
          </p>
        </div>
      </div>

      {service.description ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("descriptionLabel")}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
            {service.description}
          </p>
        </div>
      ) : null}

      {portfolio.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("portfolio")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {portfolio.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${i}`}
                src={getMediaProxyUrl(url)}
                alt={t("portfolioImageAlt", { index: i + 1 })}
                className="aspect-video w-full rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}

      {(service.packages?.length ?? 0) > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("packages")}</p>
          <ul className="space-y-2">
            {(service.packages ?? []).map((pkg) => (
              <li
                key={pkg.id ?? pkg.name}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>{pkg.name}</span>
                <DisplayPrice
                  amount={decimalToNumber(pkg.price)}
                  currency={service.currency}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {schedules.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("weeklySchedule")}
          </p>
          <ul className="space-y-1">
            {schedules.map((s) => (
              <li key={s.dayOfWeek} className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="min-w-[88px] font-medium">
                  {dayNames[s.dayOfWeek]}
                </span>
                <span className="text-muted-foreground">
                  {s.isOpen ? `${s.openTime} – ${s.closeTime}` : t("closed")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {service.rejectionReason ? (
        <div>
          <p className="text-xs font-medium text-destructive">
            {t("rejectionReason")}
          </p>
          <p className="mt-1 text-sm text-destructive">{service.rejectionReason}</p>
        </div>
      ) : null}
    </div>
  );
}
