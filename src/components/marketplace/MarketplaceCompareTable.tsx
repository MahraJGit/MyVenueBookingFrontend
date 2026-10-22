"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  MapPin,
  Minus,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { MarketplaceCoverImage } from "@/components/marketplace/MarketplaceCoverImage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { PublicMarketplaceService } from "@/features/marketplace/types";
import {
  decimalToNumber,
  getServiceFromPrice,
  serviceCustomizationLabel,
  servicePricingModelLabel,
} from "@/features/marketplace/utils";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import { cn } from "@/lib/utils";

type Props = {
  services: PublicMarketplaceService[];
  className?: string;
};

type CompareFact = {
  key: string;
  label: string;
  left: string;
  right: string;
  leftNode?: ReactNode;
  rightNode?: ReactNode;
  differs: boolean;
  /** Emphasize this row in the summary strip */
  important?: boolean;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function textsDiffer(a: string, b: string) {
  return normalizeText(a) !== normalizeText(b);
}

function guestsLabel(
  min?: number | null,
  max?: number | null,
  noneLabel = "—",
) {
  if (min != null && max != null) return `${min}–${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `Up to ${max}`;
  return noneLabel;
}

function locationParts(service: PublicMarketplaceService) {
  const parts = [
    service.baseCity?.trim(),
    ...(service.citiesServed ?? []).map((c) => c.trim()),
  ].filter(Boolean) as string[];
  return parts.filter(
    (city, i, arr) =>
      arr.findIndex((x) => x.toLowerCase() === city.toLowerCase()) === i,
  );
}

function locationLabel(service: PublicMarketplaceService, noneLabel: string) {
  const parts = locationParts(service);
  return parts.length ? parts.join(", ") : noneLabel;
}

function activePackages(service: PublicMarketplaceService) {
  return (service.packages ?? [])
    .filter((p) => p.isActive !== false)
    .slice()
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        decimalToNumber(a.price) - decimalToNumber(b.price),
    );
}

function activeAddOns(service: PublicMarketplaceService) {
  return (service.addOns ?? [])
    .filter((a) => a.isActive !== false)
    .slice()
    .sort(
      (a, b) =>
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
        decimalToNumber(a.price) - decimalToNumber(b.price),
    );
}

function YesNo({
  value,
  yesLabel,
  noLabel,
}: {
  value: boolean;
  yesLabel: string;
  noLabel: string;
}) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
      <Check className="h-3.5 w-3.5" aria-hidden />
      {yesLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-500">
      <Minus className="h-3.5 w-3.5" aria-hidden />
      {noLabel}
    </span>
  );
}

function DiffBadge({ label }: { label: string }) {
  return (
    <span className="ms-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
      {label}
    </span>
  );
}

function SameBadge({ label }: { label: string }) {
  return (
    <span className="ms-2 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
      {label}
    </span>
  );
}

export function MarketplaceCompareTable({ services, className }: Props) {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const [differencesOnly, setDifferencesOnly] = useState(true);

  const columns = services.slice(0, 2);
  const left = columns[0];
  const right = columns[1];

  const comparison = useMemo(() => {
    if (!left || !right) return null;

    const leftPrice = getServiceFromPrice(left);
    const rightPrice = getServiceFromPrice(right);
    const leftPkgs = activePackages(left);
    const rightPkgs = activePackages(right);
    const leftAddOns = activeAddOns(left);
    const rightAddOns = activeAddOns(right);
    const none = t("compareNone");

    const leftPriceText =
      leftPrice.amount != null
        ? `${leftPrice.amount} ${leftPrice.currency}`
        : none;
    const rightPriceText =
      rightPrice.amount != null
        ? `${rightPrice.amount} ${rightPrice.currency}`
        : none;

    const facts: CompareFact[] = [
      {
        key: "category",
        label: t("category"),
        left: left.category?.name || none,
        right: right.category?.name || none,
        differs: textsDiffer(
          left.category?.name || "",
          right.category?.name || "",
        ),
        important: true,
      },
      {
        key: "vendor",
        label: t("compareRowVendor"),
        left: left.vendor?.vendorName || t("vendorFallback"),
        right: right.vendor?.vendorName || t("vendorFallback"),
        differs: textsDiffer(
          left.vendor?.vendorName || "",
          right.vendor?.vendorName || "",
        ),
      },
      {
        key: "pricingModel",
        label: t("compareRowPricingModel"),
        left: servicePricingModelLabel(left.pricingModel),
        right: servicePricingModelLabel(right.pricingModel),
        differs: left.pricingModel !== right.pricingModel,
        important: true,
      },
      {
        key: "price",
        label: t("compareRowFromPrice"),
        left: leftPriceText,
        right: rightPriceText,
        leftNode:
          leftPrice.amount != null ? (
            <span className="text-base font-bold text-primary">
              {tCommon("from")}{" "}
              <DisplayPrice
                amount={leftPrice.amount}
                currency={leftPrice.currency}
              />
            </span>
          ) : (
            <span className="text-zinc-400">{t("priceOnRequest")}</span>
          ),
        rightNode:
          rightPrice.amount != null ? (
            <span className="text-base font-bold text-primary">
              {tCommon("from")}{" "}
              <DisplayPrice
                amount={rightPrice.amount}
                currency={rightPrice.currency}
              />
            </span>
          ) : (
            <span className="text-zinc-400">{t("priceOnRequest")}</span>
          ),
        differs:
          leftPrice.amount !== rightPrice.amount ||
          leftPrice.currency !== rightPrice.currency,
        important: true,
      },
      {
        key: "area",
        label: t("serviceArea"),
        left: locationLabel(left, none),
        right: locationLabel(right, none),
        differs: textsDiffer(
          locationLabel(left, ""),
          locationLabel(right, ""),
        ),
      },
      {
        key: "guests",
        label: t("compareRowGuests"),
        left: guestsLabel(left.guestMin, left.guestMax, none),
        right: guestsLabel(right.guestMin, right.guestMax, none),
        differs:
          (left.guestMin ?? null) !== (right.guestMin ?? null) ||
          (left.guestMax ?? null) !== (right.guestMax ?? null),
      },
      {
        key: "instant",
        label: t("compareRowInstantBook"),
        left: left.instantBookingEnabled ? t("compareYes") : t("compareNo"),
        right: right.instantBookingEnabled ? t("compareYes") : t("compareNo"),
        leftNode: (
          <YesNo
            value={Boolean(left.instantBookingEnabled)}
            yesLabel={t("compareYes")}
            noLabel={t("compareNo")}
          />
        ),
        rightNode: (
          <YesNo
            value={Boolean(right.instantBookingEnabled)}
            yesLabel={t("compareYes")}
            noLabel={t("compareNo")}
          />
        ),
        differs:
          Boolean(left.instantBookingEnabled) !==
          Boolean(right.instantBookingEnabled),
        important: true,
      },
      {
        key: "bookingMode",
        label: t("compareRowBookingMode"),
        left:
          left.bookingMode === "SLOT"
            ? t("compareBookingModeSlot")
            : t("compareBookingModeDate"),
        right:
          right.bookingMode === "SLOT"
            ? t("compareBookingModeSlot")
            : t("compareBookingModeDate"),
        differs: (left.bookingMode ?? "DATE") !== (right.bookingMode ?? "DATE"),
      },
      {
        key: "customization",
        label: t("compareRowCustomization"),
        left: serviceCustomizationLabel(left.customizationMode),
        right: serviceCustomizationLabel(right.customizationMode),
        differs: left.customizationMode !== right.customizationMode,
      },
      {
        key: "portfolioPdf",
        label: t("portfolioPdf"),
        left: left.portfolioPdf?.trim() ? t("compareYes") : t("compareNo"),
        right: right.portfolioPdf?.trim() ? t("compareYes") : t("compareNo"),
        leftNode: left.portfolioPdf?.trim() ? (
          <a
            href={getMediaProxyUrl(left.portfolioPdf.trim())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {t("downloadPortfolioPdf")}
          </a>
        ) : (
          <YesNo value={false} yesLabel={t("compareYes")} noLabel={t("compareNo")} />
        ),
        rightNode: right.portfolioPdf?.trim() ? (
          <a
            href={getMediaProxyUrl(right.portfolioPdf.trim())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {t("downloadPortfolioPdf")}
          </a>
        ) : (
          <YesNo value={false} yesLabel={t("compareYes")} noLabel={t("compareNo")} />
        ),
        differs: Boolean(left.portfolioPdf?.trim()) !== Boolean(right.portfolioPdf?.trim()),
      },
    ];

    let cheaper: "left" | "right" | "tie" | "unknown" = "unknown";
    if (leftPrice.amount != null && rightPrice.amount != null) {
      if (leftPrice.amount < rightPrice.amount) cheaper = "left";
      else if (rightPrice.amount < leftPrice.amount) cheaper = "right";
      else cheaper = "tie";
    }

    const insights: Array<{ icon: typeof Sparkles; text: string }> = [];
    if (cheaper === "left") {
      insights.push({
        icon: Sparkles,
        text: t("compareInsightCheaper", { name: left.title }),
      });
    } else if (cheaper === "right") {
      insights.push({
        icon: Sparkles,
        text: t("compareInsightCheaper", { name: right.title }),
      });
    } else if (cheaper === "tie") {
      insights.push({
        icon: Sparkles,
        text: t("compareInsightSamePrice"),
      });
    }

    if (left.instantBookingEnabled && !right.instantBookingEnabled) {
      insights.push({
        icon: Zap,
        text: t("compareInsightInstant", { name: left.title }),
      });
    } else if (right.instantBookingEnabled && !left.instantBookingEnabled) {
      insights.push({
        icon: Zap,
        text: t("compareInsightInstant", { name: right.title }),
      });
    } else if (left.instantBookingEnabled && right.instantBookingEnabled) {
      insights.push({
        icon: Zap,
        text: t("compareInsightBothInstant"),
      });
    }

    const leftCities = locationParts(left);
    const rightCities = locationParts(right);
    if (leftCities.length || rightCities.length) {
      insights.push({
        icon: MapPin,
        text: t("compareInsightAreas", {
          left: leftCities.length ? leftCities.slice(0, 2).join(", ") : none,
          right: rightCities.length ? rightCities.slice(0, 2).join(", ") : none,
        }),
      });
    }

    const leftGuests = guestsLabel(left.guestMin, left.guestMax, "");
    const rightGuests = guestsLabel(right.guestMin, right.guestMax, "");
    if (leftGuests || rightGuests) {
      insights.push({
        icon: Users,
        text: t("compareInsightGuests", {
          left: leftGuests || none,
          right: rightGuests || none,
        }),
      });
    }

    return {
      leftPrice,
      rightPrice,
      leftPkgs,
      rightPkgs,
      leftAddOns,
      rightAddOns,
      facts,
      insights,
      cheaper,
      categoriesDiffer:
        Boolean(left.categoryId) &&
        Boolean(right.categoryId) &&
        left.categoryId !== right.categoryId,
      diffCount: facts.filter((f) => f.differs).length,
    };
  }, [left, right, t, tCommon]);

  if (!left || !right || !comparison) return null;

  const visibleFacts = differencesOnly
    ? comparison.facts.filter((f) => f.differs)
    : comparison.facts;

  return (
    <div className={cn("space-y-8", className)}>
      {comparison.categoriesDiffer ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {t("compareCategoryMismatch")}
        </p>
      ) : null}

      {/* At-a-glance insights */}
      <section className="rounded-2xl border border-[#303030] bg-[#151515] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {t("compareAtAGlance")}
          </h2>
          <p className="text-xs text-zinc-500">
            {t("compareDiffCount", { count: comparison.diffCount })}
          </p>
        </div>
        {comparison.insights.length > 0 ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {comparison.insights.map((insight) => (
              <li
                key={insight.text}
                className="flex items-start gap-2.5 rounded-xl border border-[#303030] bg-[#1B1B1B] px-3 py-2.5 text-sm text-zinc-200"
              >
                <insight.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400">{t("compareNoInsights")}</p>
        )}
      </section>

      {/* Side-by-side service cards */}
      <section className="grid gap-4 md:grid-cols-2">
        {[left, right].map((service, index) => {
          const price =
            index === 0 ? comparison.leftPrice : comparison.rightPrice;
          const isCheaper =
            (index === 0 && comparison.cheaper === "left") ||
            (index === 1 && comparison.cheaper === "right");
          return (
            <article
              key={service.id}
              className={cn(
                "overflow-hidden rounded-2xl border bg-[#1B1B1B]",
                isCheaper ? "border-primary/50" : "border-[#303030]",
              )}
            >
              <div className="relative h-40 w-full">
                <MarketplaceCoverImage
                  coverImage={service.coverImage}
                  serviceTitle={service.title}
                  seed={service.id}
                  className="h-40 w-full object-cover"
                />
                {isCheaper ? (
                  <span className="absolute start-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-black">
                    {t("compareLowerPrice")}
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-primary">
                    {service.category?.name || t("badge")}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {service.vendor?.vendorName || t("vendorFallback")}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5">
                  {price.amount != null ? (
                    <p className="text-xl font-bold text-primary">
                      {tCommon("from")}{" "}
                      <DisplayPrice
                        amount={price.amount}
                        currency={price.currency}
                      />
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400">{t("priceOnRequest")}</p>
                  )}
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {servicePricingModelLabel(service.pricingModel)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <YesNo
                    value={Boolean(service.instantBookingEnabled)}
                    yesLabel={t("instantBookCta")}
                    noLabel={t("inquireCta")}
                  />
                  <span className="inline-flex items-center rounded-full border border-[#303030] bg-[#242424] px-2.5 py-1 text-xs text-zinc-300">
                    {service.bookingMode === "SLOT"
                      ? t("compareBookingModeSlot")
                      : t("compareBookingModeDate")}
                  </span>
                </div>
                <Button asChild className="w-full bg-primary">
                  <Link href={`/marketplace/${encodeURIComponent(service.slug)}`}>
                    {t("compareViewService")}
                    <ArrowRight className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      {/* Attribute comparison */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("compareDetailsTitle")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t("compareDetailsHint")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="compare-diff-only"
              checked={differencesOnly}
              onCheckedChange={setDifferencesOnly}
            />
            <Label
              htmlFor="compare-diff-only"
              className="cursor-pointer text-sm text-zinc-300"
            >
              {t("compareDifferencesOnly")}
            </Label>
          </div>
        </div>

        {visibleFacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#303030] bg-[#1B1B1B]/60 px-4 py-8 text-center text-sm text-zinc-400">
            {t("compareNoDifferences")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#303030]">
            <div className="grid grid-cols-[minmax(7rem,10rem)_1fr_1fr] border-b border-[#303030] bg-[#151515] text-xs font-medium uppercase tracking-wide text-zinc-500">
              <div className="px-3 py-3 sm:px-4">{t("compareAttributeCol")}</div>
              <div className="border-s border-[#303030] px-3 py-3 sm:px-4">
                {left.title}
              </div>
              <div className="border-s border-[#303030] px-3 py-3 sm:px-4">
                {right.title}
              </div>
            </div>
            {visibleFacts.map((fact, index) => (
              <div
                key={fact.key}
                className={cn(
                  "grid grid-cols-[minmax(7rem,10rem)_1fr_1fr] border-b border-[#303030] last:border-0",
                  fact.differs ? "bg-primary/[0.04]" : "bg-[#1B1B1B]",
                  index % 2 === 1 && !fact.differs && "bg-[#181818]",
                )}
              >
                <div className="px-3 py-3 text-xs font-medium text-zinc-400 sm:px-4 sm:py-3.5">
                  <span className="inline-flex flex-wrap items-center gap-y-1">
                    {fact.label}
                    {fact.differs ? (
                      <DiffBadge label={t("compareDiffBadge")} />
                    ) : (
                      <SameBadge label={t("compareSameBadge")} />
                    )}
                  </span>
                </div>
                <div
                  className={cn(
                    "border-s border-[#303030] px-3 py-3 text-sm sm:px-4 sm:py-3.5",
                    fact.differs ? "font-medium text-white" : "text-zinc-300",
                  )}
                >
                  {fact.leftNode ?? fact.left}
                </div>
                <div
                  className={cn(
                    "border-s border-[#303030] px-3 py-3 text-sm sm:px-4 sm:py-3.5",
                    fact.differs ? "font-medium text-white" : "text-zinc-300",
                  )}
                >
                  {fact.rightNode ?? fact.right}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Packages side-by-side */}
      {(comparison.leftPkgs.length > 0 || comparison.rightPkgs.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{t("packages")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { service: left, pkgs: comparison.leftPkgs },
              { service: right, pkgs: comparison.rightPkgs },
            ].map(({ service, pkgs }) => (
              <div
                key={`pkg-${service.id}`}
                className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4"
              >
                <p className="mb-3 text-sm font-medium text-zinc-300">
                  {service.title}
                </p>
                {pkgs.length === 0 ? (
                  <p className="text-sm text-zinc-500">{t("compareNoPackages")}</p>
                ) : (
                  <ul className="space-y-2">
                    {pkgs.map((pkg) => (
                      <li
                        key={pkg.id ?? pkg.name}
                        className="overflow-hidden rounded-xl border border-[#303030] bg-[#151515]"
                      >
                        {pkg.image?.trim() ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getMediaProxyUrl(pkg.image.trim())}
                            alt=""
                            className="h-24 w-full object-cover"
                          />
                        ) : null}
                        <div className="flex items-start justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">
                              {pkg.name}
                            </p>
                            {pkg.description ? (
                              <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                                {pkg.description}
                              </p>
                            ) : null}
                            {(pkg.highlights?.length ?? 0) > 0 ? (
                              <ul className="mt-1.5 flex flex-wrap gap-1">
                                {pkg.highlights!.slice(0, 4).map((item) => (
                                  <li
                                    key={item}
                                    className="rounded-full bg-[#242424] px-2 py-0.5 text-[10px] text-zinc-400"
                                  >
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-primary">
                            <DisplayPrice
                              amount={decimalToNumber(pkg.price)}
                              currency={service.currency}
                            />
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add-ons side-by-side */}
      {(comparison.leftAddOns.length > 0 ||
        comparison.rightAddOns.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">{t("addOns")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { service: left, items: comparison.leftAddOns },
              { service: right, items: comparison.rightAddOns },
            ].map(({ service, items }) => (
              <div
                key={`addon-${service.id}`}
                className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4"
              >
                <p className="mb-3 text-sm font-medium text-zinc-300">
                  {service.title}
                </p>
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500">{t("compareNoAddOns")}</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id ?? item.name}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#303030] bg-[#151515] px-3 py-2 text-sm"
                      >
                        <span className="text-zinc-200">{item.name}</span>
                        <span className="shrink-0 font-semibold text-primary">
                          <DisplayPrice
                            amount={decimalToNumber(item.price)}
                            currency={service.currency}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
