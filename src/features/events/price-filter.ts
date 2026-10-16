import { SUPPORTED_CURRENCIES } from "@/features/currency/constants";
import {
  convertAmount,
  normalizeCurrencyCode,
  type ExchangeRates,
} from "@/features/currency/convert";
export type PriceBound = {
  currency: string;
  min?: number;
  max?: number;
};

/** @deprecated Prefer PriceBound — kept for event API typing. */
export type EventPriceBound = PriceBound;

/**
 * Expand a display-currency min/max into per-currency bounds so the
 * backend can match listings priced in any supported currency.
 */
export function buildPriceBounds(
  minPrice: number | undefined,
  maxPrice: number | undefined,
  displayCurrency: string,
  rates: ExchangeRates,
): PriceBound[] {
  if (minPrice == null && maxPrice == null) return [];

  let min = minPrice;
  let max = maxPrice;
  if (min != null && max != null && min > max) {
    [min, max] = [max, min];
  }

  const from = normalizeCurrencyCode(displayCurrency);
  const bounds: PriceBound[] = [];

  for (const currency of SUPPORTED_CURRENCIES) {
    const convertedMin =
      min == null ? null : convertAmount(min, from, currency, rates);
    const convertedMax =
      max == null ? null : convertAmount(max, from, currency, rates);

    // Same currency always works even without rates.
    if (currency === from) {
      bounds.push({
        currency,
        ...(min != null ? { min } : {}),
        ...(max != null ? { max } : {}),
      });
      continue;
    }

    // Skip currencies we cannot convert reliably.
    if ((min != null && convertedMin == null) || (max != null && convertedMax == null)) {
      continue;
    }

    bounds.push({
      currency,
      ...(convertedMin != null ? { min: roundMoney(convertedMin) } : {}),
      ...(convertedMax != null ? { max: roundMoney(convertedMax) } : {}),
    });
  }

  return bounds;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Alias for event listing call sites. */
export const buildEventPriceBounds = buildPriceBounds;
