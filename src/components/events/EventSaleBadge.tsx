"use client";

import { useTranslations } from "next-intl";
import type { SalePhase } from "@/features/events/api";
import { cn } from "@/lib/utils";

type EventSaleBadgeProps = {
  phase: SalePhase;
  className?: string;
};

export function EventSaleBadge({ phase, className }: EventSaleBadgeProps) {
  const t = useTranslations("events");

  const label =
    phase === "open"
      ? t("saleOpen")
      : phase === "not_started"
        ? t("saleNotStarted")
        : phase === "sold_out"
          ? t("soldOut")
          : t("saleEnded");

  const styles =
    phase === "open"
      ? "border-primary/40 bg-primary/15 text-primary"
      : phase === "not_started"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : "border-zinc-600 bg-zinc-800 text-zinc-400";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
