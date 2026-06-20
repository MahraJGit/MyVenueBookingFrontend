"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_OPTIONS } from "@/features/currency/constants";
import { useCurrency } from "@/features/currency/currency-context";
import type { Currency } from "@/features/venues/types";
import { cn } from "@/lib/utils";

type CurrencySelectProps = {
  className?: string;
  triggerClassName?: string;
  fullWidth?: boolean;
};

export function CurrencySelect({
  className,
  triggerClassName,
  fullWidth = false,
}: CurrencySelectProps) {
  const { displayCurrency, setDisplayCurrency } = useCurrency();

  return (
    <Select
      value={displayCurrency}
      onValueChange={(value) => setDisplayCurrency(value as Currency)}
    >
      <SelectTrigger
        className={cn(
          fullWidth ? "w-full" : "w-[120px]",
          "text-sm border-muted",
          triggerClassName,
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_OPTIONS.map((option) => (
          <SelectItem key={option.code} value={option.code}>
            <div className="flex items-center gap-2">
              <span aria-hidden>{option.flag}</span>
              <span>{option.code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
