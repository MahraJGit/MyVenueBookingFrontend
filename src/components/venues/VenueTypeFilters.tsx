"use client";

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
  const pills: VenueTypeOption[] = [
    { id: ALL_VENUE_TYPES, name: "All" },
    ...types,
  ];

  return (
    <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
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
            className={`shrink-0 cursor-pointer whitespace-nowrap rounded-[18px] border border-[#303030] bg-[#242424] px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60
        ${
          isActive
            ? `border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)] text-[#D580F2]`
            : "border-[#B3B3B3] text-[#B3B3B3]"
        }`}
          >
            {type.name}
          </button>
        );
      })}
    </div>
  );
}
