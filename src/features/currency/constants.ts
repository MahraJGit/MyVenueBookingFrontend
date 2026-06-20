import type { Currency } from "@/features/venues/types";

export const RATE_BASE_CURRENCY: Currency = "AED";

export const SUPPORTED_CURRENCIES: Currency[] = [
  "AED",
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "SAR",
  "QAR",
];

export type CurrencyOption = {
  code: Currency;
  label: string;
  flag: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "AED", label: "UAE Dirham", flag: "🇦🇪" },
  { code: "PKR", label: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "USD", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "British Pound", flag: "🇬🇧" },
  { code: "SAR", label: "Saudi Riyal", flag: "🇸🇦" },
  { code: "QAR", label: "Qatari Riyal", flag: "🇶🇦" },
];

export const DISPLAY_CURRENCY_STORAGE_KEY = "displayCurrency";

export const EXCHANGE_RATES_STALE_MS = 6 * 60 * 60 * 1000;

export const EXCHANGE_RATES_CACHE_KEY = "exchangeRatesCache_v2";
