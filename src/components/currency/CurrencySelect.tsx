"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/i18n/CountryFlag";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-[#303030]/80 bg-black/30 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/10",
          fullWidth ? "h-11 w-full gap-2 rounded-xl px-3" : "h-9 min-w-[3.25rem] px-2.5",
          triggerClassName,
          className,
        )}
        aria-label={`${tCommon("selectCurrency")}: ${t(current.code)}`}
      >
        <CountryFlag code={current.countryCode} className="h-3.5 w-5" />
        <span>{current.code}</span>
      </button>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-6 py-4 text-start">
          <DialogTitle>{tCommon("selectCurrency")}</DialogTitle>
        </DialogHeader>

        <ul className="max-h-[min(60vh,24rem)] overflow-y-auto p-2">
          {CURRENCY_OPTIONS.map((option) => {
            const isSelected = displayCurrency === option.code;
            return (
              <li key={option.code}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.code)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start transition-colors",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "text-foreground hover:bg-white/5",
                  )}
                >
                  <CountryFlag code={option.countryCode} className="h-5 w-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{t(option.code)}</span>
                    <span className="block text-xs text-muted-foreground">{option.code}</span>
                  </span>
                  {isSelected ? (
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
