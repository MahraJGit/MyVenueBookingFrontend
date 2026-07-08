"use client";

import { useTranslations } from "next-intl";
import { useCurrency, useDisplayPrice } from "@/features/currency/currency-context";
import { cn } from "@/lib/utils";

type CheckoutPriceProps = {
  amount: number;
  currency: string;
  className?: string;
  amountClassName?: string;
  showDisclaimer?: boolean;
  chargeLabel?: "venue" | "event";
};

export function CheckoutPrice({
  amount,
  currency,
  className,
  amountClassName,
  showDisclaimer = true,
  chargeLabel = "venue",
}: CheckoutPriceProps) {
  const t = useTranslations("currency");
  const { formatted, chargeFormatted, isConverted } = useDisplayPrice(amount, currency);
  const sourceKey = chargeLabel === "event" ? "chargeSourceOrganizer" : "chargeSourceVenue";

  return (
    <div className={className}>
      <p className={cn("text-xl font-bold text-primary", amountClassName)}>{formatted}</p>
      {showDisclaimer && isConverted ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("chargeDisclaimerConverted", { amount: chargeFormatted })}
        </p>
      ) : showDisclaimer ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("chargeDisclaimerNative", {
            source: t(sourceKey),
            currency,
          })}
        </p>
      ) : null}
    </div>
  );
}

export function CurrencyBrowseNotice({
  className,
  chargeLabel = "vendor",
}: {
  className?: string;
  chargeLabel?: "vendor" | "event";
}) {
  const t = useTranslations("currency");
  const { displayCurrency, ratesDate } = useCurrency();
  const sourceKey =
    chargeLabel === "event" ? "chargeSourceOrganizer" : "chargeSourceVendor";
  const ratesDateSuffix = ratesDate
    ? t("browseNoticeRatesDate", { date: ratesDate })
    : "";

  return (
    <p className={cn("text-xs text-muted-foreground", className)} dir="auto">
      {t("browseNotice", {
        currency: displayCurrency,
        ratesDate: ratesDateSuffix,
        source: t(sourceKey),
      })}
    </p>
  );
}
