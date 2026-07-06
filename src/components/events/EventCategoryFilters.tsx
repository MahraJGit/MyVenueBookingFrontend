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
    <div className="flex flex-wrap gap-2">
      {buttons.map((button) => {
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
