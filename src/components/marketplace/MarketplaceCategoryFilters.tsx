"use client";

import { useTranslations } from "next-intl";
import { CollapsibleChipRow } from "@/components/filters/CollapsibleChipRow";

export const ALL_MARKETPLACE_CATEGORIES = "ALL";

export type MarketplaceCategoryOption = {
  label: string;
  value: string;
};

type MarketplaceCategoryFiltersProps = {
  categories: MarketplaceCategoryOption[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isLoading?: boolean;
};

export function MarketplaceCategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  isLoading,
}: MarketplaceCategoryFiltersProps) {
  const t = useTranslations("marketplace");

  const buttons: MarketplaceCategoryOption[] = [
    { label: t("allCategory"), value: ALL_MARKETPLACE_CATEGORIES },
    ...categories,
  ];

  return (
    <CollapsibleChipRow
      items={buttons.map((button) => {
        const isActive = activeCategory === button.value;
        return (
          <button
            key={button.value}
            type="button"
            disabled={isLoading}
            onClick={() => onCategoryChange(button.value)}
            className={`inline-flex shrink-0 cursor-pointer items-center rounded-[18px] border bg-[#242424] px-4 py-2 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60
        ${
          isActive
            ? `border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)] text-[#D580F2]`
            : "border-[#B3B3B3] text-[#B3B3B3] hover:border-[#D7498E] hover:text-[#D580F2]"
        }`}
          >
            <span dir="auto">{button.label}</span>
          </button>
        );
      })}
    />
  );
}
