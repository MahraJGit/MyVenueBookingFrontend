"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ListingFieldLabel,
  ListingHeroShell,
  listingControlClass,
  listingFieldShellClass,
  listingSelectTriggerClass,
} from "@/components/listing/ListingHeroShell";
import type { AttractionCategoryOption } from "@/features/attraction-categories/api";
import { ALL_ATTRACTIONS_CATEGORY } from "@/features/attractions/utils";
import { cn } from "@/lib/utils";

type SortOption = { value: string; label: string };

type AttractionsListingHeroProps = {
  categoryOptions: AttractionCategoryOption[];
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
  labels: {
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
    allCategories: string;
    category: string;
    minPrice: string;
    maxPrice: string;
  };
};

export function AttractionsListingHero({
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
}: AttractionsListingHeroProps) {
  const t = useTranslations("attractions");

  return (
    <ListingHeroShell
      variant="attractions"
      title={t("discoverTitle")}
      titleHighlight={t("title")}
      subtitle={t("listingSubtitle")}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn(listingFieldShellClass, "sm:col-span-2")}>
          <ListingFieldLabel>{labels.searchLabel}</ListingFieldLabel>
          <Input
            placeholder={t("searchAttractions")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onApplyFilters();
            }}
            className={listingControlClass}
          />
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>{labels.category}</ListingFieldLabel>
          <Select
            value={category || ALL_ATTRACTIONS_CATEGORY}
            onValueChange={onCategoryChange}
            disabled={loadingCategories}
          >
            <SelectTrigger className={listingSelectTriggerClass}>
              <SelectValue placeholder={labels.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ATTRACTIONS_CATEGORY}>
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

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>{labels.country}</ListingFieldLabel>
          <SearchableSelect
            value={countryCode || "__all__"}
            onValueChange={onCountryChange}
            placeholder={labels.country}
            searchPlaceholder={labels.searchCountry}
            triggerClassName={listingControlClass}
            options={[
              { value: "__all__", label: labels.allCountries },
              ...countries.map((c) => ({ value: c.code, label: c.name })),
            ]}
          />
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>{labels.city}</ListingFieldLabel>
          <SearchableSelect
            value={city || "__all__"}
            onValueChange={(v) => onCityChange(v === "__all__" ? "" : v)}
            disabled={!countryCode}
            placeholder={countryCode ? labels.city : labels.selectCountryFirst}
            searchPlaceholder={labels.searchCity}
            triggerClassName={cn(listingControlClass, "disabled:opacity-50")}
            options={[
              { value: "__all__", label: labels.city },
              ...cities.map((c) => ({ value: c.name, label: c.name })),
            ]}
          />
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>
            {labels.minPrice} ({displayCurrency})
          </ListingFieldLabel>
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
              listingControlClass,
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            )}
          />
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>{labels.maxPrice}</ListingFieldLabel>
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
              listingControlClass,
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            )}
          />
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel>{labels.sortBy}</ListingFieldLabel>
          <Select value={sortValue} onValueChange={onSortChange}>
            <SelectTrigger className={listingSelectTriggerClass}>
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

        <div className={listingFieldShellClass}>
          <ListingFieldLabel className="invisible select-none" aria-hidden>
            {labels.search}
          </ListingFieldLabel>
          <Button
            type="button"
            onClick={onApplyFilters}
            className="h-12 w-full bg-primary"
          >
            <Search className="me-2 h-4 w-4" />
            {labels.search}
          </Button>
        </div>

        <div className={listingFieldShellClass}>
          <ListingFieldLabel className="invisible select-none" aria-hidden>
            {labels.clearFilters}
          </ListingFieldLabel>
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
    </ListingHeroShell>
  );
}
