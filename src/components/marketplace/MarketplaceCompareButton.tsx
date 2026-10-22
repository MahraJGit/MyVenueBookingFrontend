"use client";

import { GitCompareArrows } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useMarketplaceCompare } from "@/features/marketplace/use-marketplace-compare";
import type { MarketplaceCompareItem } from "@/features/marketplace/compare";
import { cn } from "@/lib/utils";

type Props = {
  item: MarketplaceCompareItem;
  className?: string;
  /** Compact icon button for cards; outline for detail sidebar. */
  variant?: "icon" | "outline";
};

export function MarketplaceCompareButton({
  item,
  className,
  variant = "icon",
}: Props) {
  const t = useTranslations("marketplace");
  const { isSelected, toggle, hydrated } = useMarketplaceCompare();
  const selected = hydrated && isSelected(item.id);

  if (variant === "outline") {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full border-[#303030] bg-transparent",
          selected && "border-primary text-primary",
          className,
        )}
        onClick={() => toggle(item)}
        aria-pressed={selected}
      >
        <GitCompareArrows className="me-2 h-4 w-4" />
        {selected ? t("compareRemove") : t("compareAdd")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={cn(
        "h-9 w-9 rounded-full border border-[#303030] bg-[#1B1B1B]/90 text-white shadow-md backdrop-blur-sm hover:border-primary hover:text-primary",
        selected && "border-primary bg-primary/20 text-primary",
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(item);
      }}
      aria-pressed={selected}
      aria-label={selected ? t("compareRemove") : t("compareAdd")}
      title={selected ? t("compareRemove") : t("compareAdd")}
    >
      <GitCompareArrows className="h-4 w-4" />
    </Button>
  );
}
