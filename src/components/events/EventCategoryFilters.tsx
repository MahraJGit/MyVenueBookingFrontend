"use client";

import { useTranslations } from "next-intl";
import { ALL_EVENTS_CATEGORY } from "@/features/events/utils";

type EventCategoryFiltersProps = {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading?: boolean;
};

export function EventCategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  isLoading,
}: EventCategoryFiltersProps) {
  const tEvents = useTranslations("events");
  const buttons = [ALL_EVENTS_CATEGORY, ...categories];

  const getLabel = (button: string) =>
    button === ALL_EVENTS_CATEGORY ? tEvents("allCategory") : button;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 mb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
      {buttons.map((button) => (
        <button
          key={button}
          type="button"
          disabled={isLoading}
          onClick={() => onCategoryChange(button)}
          className={`shrink-0 cursor-pointer whitespace-nowrap text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed
        ${
          activeCategory === button
            ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
            : "text-[#B3B3B3] border-[#B3B3B3]"
        }`}
        >
          {getLabel(button)}
        </button>
      ))}
    </div>
  );
}
