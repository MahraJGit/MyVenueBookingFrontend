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
  countryCode: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "AED", label: "UAE Dirham", countryCode: "AE" },
  { code: "PKR", label: "Pakistani Rupee", countryCode: "PK" },
  { code: "USD", label: "US Dollar", countryCode: "US" },
  { code: "EUR", label: "Euro", countryCode: "EU" },
  { code: "GBP", label: "British Pound", countryCode: "GB" },
  { code: "SAR", label: "Saudi Riyal", countryCode: "SA" },
  { code: "QAR", label: "Qatari Riyal", countryCode: "QA" },
];

export const DISPLAY_CURRENCY_STORAGE_KEY = "displayCurrency";

export const EXCHANGE_RATES_STALE_MS = 6 * 60 * 60 * 1000;

export const EXCHANGE_RATES_CACHE_KEY = "exchangeRatesCache_v2";
