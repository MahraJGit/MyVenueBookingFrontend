"use client";

import type { VenueAmenity, AmenityCatalogItem } from "@/features/venues/types";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type AmenitySelection = {
  venueAmenityId: string;
  quantity: number;
  selected: boolean;
};

type AmenityPickerProps = {
  amenities: VenueAmenity[];
  selections: AmenitySelection[];
  onChange: (selections: AmenitySelection[]) => void;
};

export function AmenityPicker({ amenities, selections, onChange }: AmenityPickerProps) {
  if (amenities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No add-on amenities available.</p>
    );
  }

  const toggle = (amenity: VenueAmenity, checked: boolean) => {
    const existing = selections.find((s) => s.venueAmenityId === amenity.id);
    const next = selections.filter((s) => s.venueAmenityId !== amenity.id);
    if (checked) {
      next.push({
        venueAmenityId: amenity.id,
        quantity: existing?.quantity ?? 1,
        selected: true,
      });
    }
    onChange(next);
  };

  const setQuantity = (amenityId: string, quantity: number) => {
    onChange(
      selections.map((s) =>
        s.venueAmenityId === amenityId ? { ...s, quantity: Math.max(1, quantity) } : s,
      ),
    );
  };

  return (
    <div className="space-y-3">
      {amenities.map((amenity) => {
        const sel = selections.find((s) => s.venueAmenityId === amenity.id);
        const name = amenity.catalog?.name ?? "Amenity";
        const isIncluded =
          amenity.pricingType === "INCLUDED" || amenity.isIncluded;

        return (
          <div
            key={amenity.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[#303030] bg-[#1B1B1B] p-3"
          >
            <Checkbox
              id={`amenity-${amenity.id}`}
              checked={!!sel?.selected || isIncluded}
              disabled={isIncluded}
              onCheckedChange={(v) => toggle(amenity, !!v)}
            />
            <Label htmlFor={`amenity-${amenity.id}`} className="flex-1 cursor-pointer">
              <span className="font-medium text-white">{name}</span>
              {isIncluded && (
                <span className="ml-2 text-xs text-primary">Included</span>
              )}
            </Label>
            {sel?.selected && !isIncluded && amenity.pricingType === "PER_UNIT" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Qty</Label>
                <NumberInput
                  integer
                  min={1}
                  max={amenity.maxPerBooking ?? undefined}
                  value={sel.quantity}
                  defaultOnBlur={1}
                  onValueChange={(quantity) =>
                    setQuantity(amenity.id, quantity ?? 1)
                  }
                  className="h-8 w-16 border-[#303030] bg-black"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function selectionsToPayload(selections: AmenitySelection[]) {
  return selections
    .filter((s) => s.selected)
    .map((s) => ({ venueAmenityId: s.venueAmenityId, quantity: s.quantity }));
}
