"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type PlatformDisclaimerProps = {
  className?: string;
};

export function PlatformDisclaimer({ className }: PlatformDisclaimerProps) {
  const t = useTranslations("common");

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-3",
        className,
      )}
      role="note"
    >
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("platformDisclaimer")}
      </p>
    </div>
  );
}
