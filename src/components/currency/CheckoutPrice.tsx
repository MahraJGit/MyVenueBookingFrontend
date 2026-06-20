"use client";

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
  const { formatted, chargeFormatted, isConverted } = useDisplayPrice(amount, currency);
  const vendorLabel = chargeLabel === "event" ? "organizer" : "venue";

  return (
    <div className={className}>
      <p className={cn("text-xl font-bold text-primary", amountClassName)}>{formatted}</p>
      {showDisclaimer && isConverted ? (
        <p className="mt-1 text-xs text-muted-foreground">
          You will be charged {chargeFormatted}. Exchange rates are approximate and may vary.
        </p>
      ) : showDisclaimer ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Payment is processed in the {vendorLabel}&apos;s selected currency ({currency}).
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
  const { displayCurrency, ratesDate } = useCurrency();
  const sourceLabel = chargeLabel === "event" ? "organizer" : "vendor";

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Prices shown in {displayCurrency} use approximate exchange rates
      {ratesDate ? ` (${ratesDate})` : ""}. You will be charged in the {sourceLabel}&apos;s
      currency.
    </p>
  );
}
