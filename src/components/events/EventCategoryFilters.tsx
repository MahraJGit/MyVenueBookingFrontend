"use client";

import { useTranslations } from "next-intl";
import type { EventCategoryOption } from "@/features/event-categories/api";
import { ALL_EVENTS_CATEGORY } from "@/features/events/utils";

type EventCategoryFiltersProps = {
  categories: EventCategoryOption[];
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

  const buttons: EventCategoryOption[] = [
    { label: tEvents("allCategory"), value: ALL_EVENTS_CATEGORY },
    ...categories,
  ];

  return (
    <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
      {buttons.map((button) => {
        const isActive = activeCategory === button.value;
        return (
          <button
            key={button.value}
            type="button"
            disabled={isLoading}
            onClick={() => onCategoryChange(button.value)}
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-[18px] border bg-[#242424] px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60
        ${
          isActive
            ? `border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)] text-[#D580F2]`
            : "border-[#B3B3B3] text-[#B3B3B3]"
        }`}
          >
            <span dir="auto">{button.label}</span>
          </button>
        );
      })}
    </div>
  );
}
