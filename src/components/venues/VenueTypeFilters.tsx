"use client";

import { useTranslations } from "next-intl";

export const ALL_VENUE_TYPES = "all";

type VenueTypeOption = {
  id: string;
  name: string;
};

type VenueTypeFiltersProps = {
  types: VenueTypeOption[];
  activeTypeId: string;
  onTypeChange: (typeId: string) => void;
  isLoading?: boolean;
};

export function VenueTypeFilters({
  types,
  activeTypeId,
  onTypeChange,
  isLoading,
}: VenueTypeFiltersProps) {
  const tCommon = useTranslations("common");

  const pills: VenueTypeOption[] = [
    { id: ALL_VENUE_TYPES, name: tCommon("all") },
    ...types,
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((type) => {
        const isActive =
          type.id === ALL_VENUE_TYPES
            ? !activeTypeId
            : activeTypeId === type.id;

        return (
          <button
            key={type.id}
            type="button"
            disabled={isLoading}
            onClick={() =>
              onTypeChange(type.id === ALL_VENUE_TYPES ? "" : type.id)
            }
            className={`inline-flex shrink-0 cursor-pointer items-center rounded-[18px] border border-[#303030] bg-[#242424] px-4 py-2 text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60
        ${
          isActive
            ? `border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)] text-[#D580F2]`
            : "border-[#B3B3B3] text-[#B3B3B3] hover:border-[#D7498E] hover:text-[#D580F2]"
        }`}
          >
            <span dir="auto">{type.name}</span>
          </button>
        );
      })}
    </div>
  );
}
