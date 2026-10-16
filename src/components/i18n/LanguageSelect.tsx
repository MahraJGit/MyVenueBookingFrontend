"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { CountryFlag } from "@/components/i18n/CountryFlag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-64 border-[#303030] bg-[#1B1B1B] p-1.5 text-foreground shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
          {tCommon("selectLanguage")}
        </DropdownMenuLabel>

        {LOCALE_OPTIONS.map((option) => {
          const isSelected = locale === option.code;
          return (
            <DropdownMenuItem
              key={option.code}
              onSelect={() => handleSelect(option.code)}
              className={cn(
                "cursor-pointer gap-3 rounded-lg px-3 py-2.5 focus:bg-white/5",
                isSelected && "bg-primary/15 text-primary focus:bg-primary/15 focus:text-primary",
              )}
            >
              <CountryFlag code={option.countryCode} className="h-5 w-7 shrink-0" />
              <span className="min-w-0 flex-1 text-start">
                <span className="block text-sm font-medium" dir="auto">
                  {option.nativeLabel}
                </span>
                <span className="block text-xs text-muted-foreground" dir="auto">
                  {option.label}
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
