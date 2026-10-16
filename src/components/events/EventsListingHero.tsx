"use client";

import type { ReactNode } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventCategoryOption } from "@/features/event-categories/api";
import { ALL_EVENTS_CATEGORY } from "@/features/events/utils";
import { cn } from "@/lib/utils";

type SortOption = {
  value: string;
  label: string;
};

type ListingLabels = {
  searchEvents: string;
  searchLabel: string;
  country: string;
  searchCountry: string;
  allCountries: string;
  city: string;
  selectCountryFirst: string;
  searchCity: string;
  sortBy: string;
  search: string;
  clearFilters: string;
  selectDate: string;
  eventDate: string;
  minPrice: string;
  maxPrice: string;
  allCategories: string;
  category: string;
  priceRangeInCurrency: (currency: string) => string;
};

type EventsListingHeroProps = {
  categoryOptions: EventCategoryOption[];
  category: string;
  onCategoryChange: (category: string) => void;
  loadingCategories: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  countryCode: string;
  onCountryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  countries: { code: string; name: string }[];
  cities: { name: string }[];
  date: string;
  onDateChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  displayCurrency: string;
  sortValue: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  showClearFilters: boolean;
  labels: ListingLabels;
};

function parseDateKey(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function FieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-2 block text-xs font-medium tracking-wide text-[#B3B3B3]",
        className,
      )}
    >
      {children}
    </label>
  );
}

/** Shared control sizing — overrides SelectTrigger's default w-fit / h-9. */
const controlClass =
  "h-12 w-full min-w-0 border-[#303030] bg-[#0C0C0C] text-white hover:bg-[#0C0C0C] data-[size=default]:h-12";

const selectTriggerClass = cn(
  controlClass,
  "justify-between dark:hover:bg-[#0C0C0C] data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px]",
);

const fieldShellClass = "flex min-w-0 flex-col";

export function EventsListingHero({
  categoryOptions,
  category,
  onCategoryChange,
  loadingCategories,
  search,
  onSearchChange,
  countryCode,
  onCountryChange,
  city,
  onCityChange,
  countries,
  cities,
  date,
  onDateChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  displayCurrency,
  sortValue,
  sortOptions,
  onSortChange,
  onApplyFilters,
  onClearFilters,
  showClearFilters,
  labels,
}: EventsListingHeroProps) {
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const selectedDate = parseDateKey(date);

  return (
    <div className="events-listing-hero-wrap relative mb-10 sm:mb-12">
      <div className="events-listing-hero overflow-hidden rounded-2xl border border-[#303030]">
        <div className="events-listing-hero__inner relative px-4 pb-28 pt-14 sm:px-6 sm:pb-32 sm:pt-16 lg:px-8 lg:pb-36 lg:pt-20">
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            <h1 className="page-title mb-3 text-white">
              {tEvents("discoverTitle")}{" "}
              <span className="text-gradient-accent">{tEvents("title")}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {tEvents("listingSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="events-listing-filter-bar relative z-10 mx-auto -mt-16 w-[min(100%,68rem)] px-3 sm:-mt-[4.5rem] sm:px-4 lg:-mt-20">
        <div className="rounded-2xl border border-[#303030] bg-[#161616]/95 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={cn(fieldShellClass, "sm:col-span-2")}>
              <FieldLabel>{labels.searchLabel}</FieldLabel>
              <Input
                placeholder={labels.searchEvents}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
                className={controlClass}
              />
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.category}</FieldLabel>
              <Select
                value={category || ALL_EVENTS_CATEGORY}
                onValueChange={onCategoryChange}
                disabled={loadingCategories}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={labels.category} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_EVENTS_CATEGORY}>
                    {labels.allCategories}
                  </SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span dir="auto">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.eventDate}</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      controlClass,
                      "justify-between px-3 font-normal hover:text-white",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <span className="truncate">
                      {selectedDate
                        ? format(selectedDate, "MMM d, yyyy")
                        : labels.selectDate}
                    </span>
                    <CalendarIcon className="ms-2 h-4 w-4 shrink-0 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(next) => {
                      onDateChange(next ? toDateKey(next) : "");
                    }}
                    initialFocus
                  />
                  {selectedDate ? (
                    <div className="border-t border-border p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => onDateChange("")}
                      >
                        <X className="me-1.5 h-3.5 w-3.5" />
                        {tCommon("clear")}
                      </Button>
                    </div>
                  ) : null}
                </PopoverContent>
              </Popover>
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.country}</FieldLabel>
              <SearchableSelect
                value={countryCode || "__all__"}
                onValueChange={onCountryChange}
                placeholder={labels.country}
                searchPlaceholder={labels.searchCountry}
                triggerClassName={controlClass}
                options={[
                  { value: "__all__", label: labels.allCountries },
                  ...countries.map((c) => ({ value: c.code, label: c.name })),
                ]}
              />
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.city}</FieldLabel>
              <SearchableSelect
                value={city || "__all__"}
                onValueChange={(v) => onCityChange(v === "__all__" ? "" : v)}
                disabled={!countryCode}
                placeholder={
                  countryCode ? labels.city : labels.selectCountryFirst
                }
                searchPlaceholder={labels.searchCity}
                triggerClassName={cn(controlClass, "disabled:opacity-50")}
                options={[
                  { value: "__all__", label: labels.city },
                  ...cities.map((c) => ({ value: c.name, label: c.name })),
                ]}
              />
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>
                {labels.minPrice} ({displayCurrency})
              </FieldLabel>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder={labels.minPrice}
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
                className={cn(
                  controlClass,
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                )}
              />
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.maxPrice}</FieldLabel>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder={labels.maxPrice}
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApplyFilters();
                }}
                className={cn(
                  controlClass,
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                )}
              />
            </div>

            <div className={fieldShellClass}>
              <FieldLabel>{labels.sortBy}</FieldLabel>
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={labels.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={fieldShellClass}>
              <FieldLabel className="invisible select-none" aria-hidden>
                {labels.search}
              </FieldLabel>
              <Button
                type="button"
                onClick={onApplyFilters}
                className="h-12 w-full bg-primary"
              >
                <Search className="me-2 h-4 w-4" />
                {labels.search}
              </Button>
            </div>

            <div className={fieldShellClass}>
              <FieldLabel className="invisible select-none" aria-hidden>
                {labels.clearFilters}
              </FieldLabel>
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full border-[#303030] text-muted-foreground"
                onClick={onClearFilters}
                disabled={!showClearFilters}
              >
                {labels.clearFilters}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
