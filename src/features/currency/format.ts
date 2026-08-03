import { toFiniteAmount } from "./convert";

export function formatMoney(price: number | string, currency: string): string {
  const amount = toFiniteAmount(price);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.length === 3 ? currency : "AED",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
