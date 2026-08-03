"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type { Currency } from "@/features/venues/types";
import {
  DISPLAY_CURRENCY_STORAGE_KEY,
  EXCHANGE_RATES_STALE_MS,
  RATE_BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
} from "./constants";
import { fetchExchangeRates, readCachedRates } from "./api";
import {
  convertAmount,
  normalizeCurrencyCode,
  toFiniteAmount,
  type ExchangeRates,
} from "./convert";
import { formatMoney } from "./format";
import { currencyKeys } from "./query-keys";

export type DisplayPriceResult = {
  formatted: string;
  chargeFormatted: string;
  convertedAmount: number;
  sourceAmount: number;
  sourceCurrency: string;
  displayCurrency: Currency;
  isConverted: boolean;
};

type CurrencyContextValue = {
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  rates: ExchangeRates;
  ratesDate: string | null;
  ratesLoading: boolean;
  ratesError: boolean;
  convert: (amount: number | string, from: string, to?: string) => number;
  formatDisplayPrice: (amount: number | string, sourceCurrency: string) => string;
  formatChargePrice: (amount: number | string, sourceCurrency: string) => string;
  getDisplayPrice: (
    amount: number | string,
    sourceCurrency: string,
  ) => DisplayPriceResult;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStoredDisplayCurrency(): Currency {
  if (typeof window === "undefined") return RATE_BASE_CURRENCY;
  try {
    const stored = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored as Currency)) {
      return stored as Currency;
    }
  } catch {
    // ignore
  }
  return RATE_BASE_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<Currency>(RATE_BASE_CURRENCY);

  useEffect(() => {
    setDisplayCurrencyState(readStoredDisplayCurrency());
  }, []);

  const setDisplayCurrency = useCallback((currency: Currency) => {
    setDisplayCurrencyState(currency);
    try {
      localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, currency);
    } catch {
      // ignore
    }
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: currencyKeys.rates(),
    queryFn: () => fetchExchangeRates(RATE_BASE_CURRENCY),
    staleTime: EXCHANGE_RATES_STALE_MS,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 2,
    placeholderData: () => readCachedRates() ?? undefined,
  });

  const rates = data?.rates ?? readCachedRates()?.rates ?? {};
  const ratesDate = data?.date ?? readCachedRates()?.date ?? null;

  const convert = useCallback(
    (amount: number | string, from: string, to?: string) => {
      const source = normalizeCurrencyCode(from);
      const target = to ? normalizeCurrencyCode(to) : displayCurrency;
      const converted = convertAmount(amount, source, target, rates, RATE_BASE_CURRENCY);
      return converted ?? toFiniteAmount(amount);
    },
    [displayCurrency, rates],
  );

  const getDisplayPrice = useCallback(
    (amount: number | string, sourceCurrency: string): DisplayPriceResult => {
      const sourceAmount = toFiniteAmount(amount);
      const source = normalizeCurrencyCode(sourceCurrency);
      const chargeFormatted = formatMoney(sourceAmount, source);
      const isConverted = source !== displayCurrency;
      const convertedAmount = isConverted
        ? convertAmount(sourceAmount, source, displayCurrency, rates, RATE_BASE_CURRENCY)
        : sourceAmount;
      const canConvert = convertedAmount !== null;
      const finalAmount = canConvert ? convertedAmount : sourceAmount;
      const formatted =
        isConverted && canConvert
          ? formatMoney(finalAmount, displayCurrency)
          : chargeFormatted;

      return {
        formatted,
        chargeFormatted,
        convertedAmount: finalAmount,
        sourceAmount,
        sourceCurrency: source,
        displayCurrency,
        isConverted: isConverted && canConvert,
      };
    },
    [displayCurrency, rates],
  );

  const formatDisplayPrice = useCallback(
    (amount: number | string, sourceCurrency: string) =>
      getDisplayPrice(amount, sourceCurrency).formatted,
    [getDisplayPrice],
  );

  const formatChargePrice = useCallback(
    (amount: number | string, sourceCurrency: string) =>
      getDisplayPrice(amount, sourceCurrency).chargeFormatted,
    [getDisplayPrice],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rates,
      ratesDate,
      ratesLoading: isLoading,
      ratesError: isError,
      convert,
      formatDisplayPrice,
      formatChargePrice,
      getDisplayPrice,
    }),
    [
      displayCurrency,
      setDisplayCurrency,
      rates,
      ratesDate,
      isLoading,
      isError,
      convert,
      formatDisplayPrice,
      formatChargePrice,
      getDisplayPrice,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}

export function useDisplayPrice(
  amount: number | string,
  sourceCurrency: string,
): DisplayPriceResult {
  const { getDisplayPrice, displayCurrency } = useCurrency();
  return useMemo(
    () => getDisplayPrice(amount, sourceCurrency),
    [getDisplayPrice, amount, sourceCurrency, displayCurrency],
  );
}
