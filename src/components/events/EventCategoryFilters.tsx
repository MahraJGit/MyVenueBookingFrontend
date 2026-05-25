"use client";

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
  const buttons = [ALL_EVENTS_CATEGORY, ...categories];

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {buttons.map((button) => (
        <button
          key={button}
          type="button"
          disabled={isLoading}
          onClick={() => onCategoryChange(button)}
          className={`text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px] transition-colors disabled:opacity-60
        ${
          activeCategory === button
            ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
            : "text-[#B3B3B3] border-[#B3B3B3]"
        }`}
        >
          {button}
        </button>
      ))}
    </div>
  );
}
