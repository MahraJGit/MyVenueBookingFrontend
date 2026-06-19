"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { VenueCard } from "@/components/venues/VenueCard";
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

function VenuesListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [venueTypeId, setVenueTypeId] = useState(searchParams.get("venueTypeId") ?? "");
  const page = Number(searchParams.get("page") ?? "1");

  const { data: types = [] } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
  });

  const { data, isLoading } = useQuery({
    queryKey: venueKeys.publicList({ page, search, city, venueTypeId }),
    queryFn: () =>
      listPublicVenues({
        page,
        limit: 12,
        search: search || undefined,
        city: city || undefined,
        venueTypeId: venueTypeId || undefined,
      }),
  });

  const applyFilters = () => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (city) sp.set("city", city);
    if (venueTypeId) sp.set("venueTypeId", venueTypeId);
    sp.set("page", "1");
    router.push(`/venues?${sp.toString()}`);
  };

  return (
    <section className="eventslist py-10 pt-28">
      <div className="container mx-auto px-4">
        <h1 className="mb-2 text-white text-xl">Venue Booking</h1>
        <p className="mb-8 text-muted-foreground">
          Discover and book event spaces for your next occasion.
        </p>

        <div className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
          <Input
            placeholder="Search venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs border-[#303030] bg-black text-white"
          />
          <Input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="max-w-[160px] border-[#303030] bg-black text-white"
          />
          <Select value={venueTypeId || "ALL"} onValueChange={(v) => setVenueTypeId(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-[180px] border-[#303030] bg-black text-white">
              <SelectValue placeholder="Venue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applyFilters} className="bg-primary">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>

        {isLoading ? (
          <div className="venue-cards mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="venue-cards mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(data?.data ?? []).map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
            {(data?.data ?? []).length === 0 && (
              <p className="py-16 text-center text-muted-foreground">No venues found.</p>
            )}
            {data && data.meta.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  className="border-[#303030]"
                  disabled={page <= 1}
                  onClick={() => {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set("page", String(page - 1));
                    router.push(`/venues?${sp.toString()}`);
                  }}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  className="border-[#303030]"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set("page", String(page + 1));
                    router.push(`/venues?${sp.toString()}`);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function VenuesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VenuesListingContent />
    </Suspense>
  );
}
