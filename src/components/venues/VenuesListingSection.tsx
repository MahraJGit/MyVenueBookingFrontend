"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { VenueCard } from "@/components/venues/VenueCard";
import { VenueTypeFilters } from "@/components/venues/VenueTypeFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPublicVenues, listVenueTypes } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  {
    value: "createdAt-desc",
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    label: "Newest first",
  },
  {
    value: "name-asc",
    sortBy: "name" as const,
    sortOrder: "asc" as const,
    label: "Name A–Z",
  },
  {
    value: "name-desc",
    sortBy: "name" as const,
    sortOrder: "desc" as const,
    label: "Name Z–A",
  },
];

function sortValueFromParams(sortBy: string, sortOrder: string): string {
  const match = SORT_OPTIONS.find(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder,
  );
  return match?.value ?? "createdAt-desc";
}

export function VenuesListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const venueTypeIdFromUrl = searchParams.get("venueTypeId")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const sortValue = sortValueFromParams(sortBy, sortOrder);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
  }, [searchFromUrl, cityFromUrl]);

  const pushParams = useCallback(
    (patch: Record<string, string | undefined>, replace = false) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value?.trim()) sp.set(key, value.trim());
        else sp.delete(key);
      }
      const qs = sp.toString();
      const href = qs ? `/venues?${qs}` : "/venues";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, searchParams],
  );

  const handleTypeChange = useCallback(
    (typeId: string) => {
      pushParams({ venueTypeId: typeId || undefined, page: undefined }, true);
    },
    [pushParams],
  );

  const applyFilters = () => {
    pushParams({
      search: search || undefined,
      city: city || undefined,
      page: undefined,
    });
  };

  const handleSortChange = (value: string) => {
    const option = SORT_OPTIONS.find((o) => o.value === value);
    if (!option) return;
    const isDefault =
      option.sortBy === "createdAt" && option.sortOrder === "desc";
    pushParams({
      sortBy: isDefault ? undefined : option.sortBy,
      sortOrder: isDefault ? undefined : option.sortOrder,
      page: undefined,
    });
  };

  const { data: types = [], isLoading: loadingTypes } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
  });

  const activeTypeName =
    types.find((t) => t.id === venueTypeIdFromUrl)?.name ?? null;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: venueKeys.publicList({
      page,
      search: searchFromUrl,
      city: cityFromUrl,
      venueTypeId: venueTypeIdFromUrl,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      listPublicVenues({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
        venueTypeId: venueTypeIdFromUrl || undefined,
        sortBy: sortBy as "createdAt" | "name",
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const venues = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;

  return (
    <section className="eventslist py-10 pt-28">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl">
          <h1 className="page-title mb-3 text-white">
            Venue <span className="text-gradient-accent">Booking</span>
          </h1>
          <p className="text-muted-foreground">
            Discover and book event spaces for your next occasion.
          </p>
        </div>

        <VenueTypeFilters
          types={types}
          activeTypeId={venueTypeIdFromUrl}
          onTypeChange={handleTypeChange}
          isLoading={loadingTypes}
        />

        <div className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
          <Input
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="max-w-xs border-[#303030] bg-black text-white"
          />
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="max-w-[160px] border-[#303030] bg-black text-white"
          />
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] border-[#303030] bg-black text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyFilters} className="bg-primary">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          {(searchFromUrl || cityFromUrl) && (
            <Button
              variant="outline"
              className="border-[#303030] text-muted-foreground"
              onClick={() => {
                setSearch("");
                setCity("");
                pushParams({ search: undefined, city: undefined, page: undefined });
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {isError ? (
          <p className="mb-8 py-8 text-sm text-red-400">
            {error instanceof Error ? error.message : "Could not load venues."}
          </p>
        ) : null}

        {isLoading ? (
          <div className="venue-cards mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
              />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
            No venues found
            {activeTypeName ? ` in ${activeTypeName}` : ""}
            {searchFromUrl ? ` matching "${searchFromUrl}"` : ""}
            {cityFromUrl ? ` in ${cityFromUrl}` : ""}.
          </p>
        ) : (
          <div className="relative mb-8">
            {isFetching && !isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}
            <div className="venue-cards grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        )}

        {showPagination ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              className="border-[#303030]"
              disabled={page <= 1 || isFetching}
              onClick={() => {
                pushParams({ page: page <= 2 ? undefined : String(page - 1) });
              }}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {totalPages}
              {data?.meta.total != null ? ` · ${data.meta.total} venues` : ""}
            </span>
            <Button
              variant="outline"
              className="border-[#303030]"
              disabled={page >= totalPages || isFetching}
              onClick={() => {
                pushParams({ page: String(page + 1) });
              }}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
