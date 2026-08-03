import type { Currency } from "@/features/venues/types";
import { RATE_BASE_CURRENCY } from "./constants";

export type ExchangeRates = Record<string, number>;

export function toBaseAmount(
  amount: number,
  from: string,
  rates: ExchangeRates,
  base: string = RATE_BASE_CURRENCY,
): number {
  if (from === base) return amount;
  const rate = rates[from];
  if (!rate || rate <= 0) return amount;
  return amount / rate;
}

export function fromBaseAmount(
  amount: number,
  to: string,
  rates: ExchangeRates,
  base: string = RATE_BASE_CURRENCY,
): number {
  if (to === base) return amount;
  const rate = rates[to];
  if (!rate || rate <= 0) return amount;
  return amount * rate;
}

/** Coerce API Decimal strings (e.g. "50.00") to a finite number. */
export function toFiniteAmount(amount: number | string): number {
  const n = typeof amount === "number" ? amount : Number(amount);
  return Number.isFinite(n) ? n : 0;
}

export function convertAmount(
  amount: number | string,
  from: string,
  to: string,
  rates: ExchangeRates,
  base: string = RATE_BASE_CURRENCY,
): number | null {
  const value = toFiniteAmount(amount);
  if (from === to) return value;
  if (!rates || Object.keys(rates).length === 0) return null;
  if (from !== base && (!rates[from] || rates[from] <= 0)) return null;
  if (to !== base && (!rates[to] || rates[to] <= 0)) return null;
  const inBase = toBaseAmount(value, from, rates, base);
  return fromBaseAmount(inBase, to, rates, base);
}

export function normalizeCurrencyCode(code: string): Currency {
  const upper = code.trim().toUpperCase();
  if (upper.length === 3) return upper as Currency;
  return RATE_BASE_CURRENCY;
}
