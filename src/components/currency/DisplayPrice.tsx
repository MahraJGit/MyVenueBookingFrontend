"use client";

import { useDisplayPrice } from "@/features/currency/currency-context";
import { cn } from "@/lib/utils";

type DisplayPriceProps = {
  amount: number | string;
  currency: string;
  className?: string;
  as?: "span" | "p";
};

export function DisplayPrice({
  amount,
  currency,
  className,
  as: Tag = "span",
}: DisplayPriceProps) {
  const { formatted } = useDisplayPrice(amount, currency);
  return <Tag className={className}>{formatted}</Tag>;
}

type DisplayPriceWithSuffixProps = DisplayPriceProps & {
  suffix?: string;
  suffixClassName?: string;
};

export function DisplayPriceWithSuffix({
  amount,
  currency,
  className,
  suffix,
  suffixClassName,
  as: Tag = "span",
}: DisplayPriceWithSuffixProps) {
  const { formatted } = useDisplayPrice(amount, currency);
  return (
    <Tag className={className}>
      {formatted}
      {suffix ? (
        <span className={cn("font-normal text-zinc-400", suffixClassName)}> {suffix}</span>
      ) : null}
    </Tag>
  );
}
