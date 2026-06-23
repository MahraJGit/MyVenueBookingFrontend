"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCALE_OPTIONS } from "@/i18n/locales";
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
  const { locale, setLocale } = useLocaleContext();

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger
        className={cn(
          fullWidth ? "w-full" : "w-[130px]",
          "text-sm border-muted",
          triggerClassName,
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALE_OPTIONS.map((option) => (
          <SelectItem key={option.code} value={option.code}>
            <div className="flex items-center gap-2">
              <span aria-hidden>{option.flag}</span>
              <span>{option.nativeLabel}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
