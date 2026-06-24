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
import { LOCALE_OPTIONS, type AppLocale } from "@/i18n/locales";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { cn } from "@/lib/utils";

type LanguageSelectProps = {
  className?: string;
  triggerClassName?: string;
  fullWidth?: boolean;
};

export function LanguageSelect({
  className,
  triggerClassName,
  fullWidth = false,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useLocaleContext();
  const tCommon = useTranslations("common");

  const current =
    LOCALE_OPTIONS.find((option) => option.code === locale) ?? LOCALE_OPTIONS[0];

  const handleSelect = (code: AppLocale) => {
    setLocale(code);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-[#303030]/80 bg-black/30 backdrop-blur-sm transition-colors hover:bg-white/10",
          fullWidth ? "h-11 w-full" : "size-9",
          triggerClassName,
          className,
        )}
        aria-label={`${tCommon("selectLanguage")}: ${current.nativeLabel}`}
      >
        <CountryFlag code={current.countryCode} className="h-3.5 w-5" />
      </button>

      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-6 py-4 text-start">
          <DialogTitle>{tCommon("selectLanguage")}</DialogTitle>
        </DialogHeader>

        <ul className="max-h-[min(60vh,24rem)] overflow-y-auto p-2">
          {LOCALE_OPTIONS.map((option) => {
            const isSelected = locale === option.code;
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
                    <span className="block text-sm font-medium">{option.nativeLabel}</span>
                    <span className="block text-xs text-muted-foreground">{option.label}</span>
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
