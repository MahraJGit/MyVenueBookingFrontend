"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [open, setOpen] = useState(false);
  const { displayCurrency, setDisplayCurrency } = useCurrency();
  const t = useTranslations("currency");
  const tCommon = useTranslations("common");

  const current =
    CURRENCY_OPTIONS.find((option) => option.code === displayCurrency) ??
    CURRENCY_OPTIONS[0];

  const handleSelect = (code: Currency) => {
    setDisplayCurrency(code);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full border border-[#303030]/80 bg-black/30 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/10",
            fullWidth ? "h-11 w-full gap-2 rounded-xl px-3" : "h-9 min-w-[3.25rem] px-2.5",
            triggerClassName,
            className,
          )}
          aria-label={`${tCommon("selectCurrency")}: ${t(current.code)}`}
        >
          <span>{current.code}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-64 border-[#303030] bg-[#1B1B1B] p-1.5 text-foreground shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
          {tCommon("selectCurrency")}
        </DropdownMenuLabel>

        {CURRENCY_OPTIONS.map((option) => {
          const isSelected = displayCurrency === option.code;
          return (
            <DropdownMenuItem
              key={option.code}
              onSelect={() => handleSelect(option.code)}
              className={cn(
                "cursor-pointer gap-3 rounded-lg px-3 py-2.5 focus:bg-white/5",
                isSelected && "bg-primary/15 text-primary focus:bg-primary/15 focus:text-primary",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t(option.code)}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.code}
                </span>
              </span>
              {isSelected ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
