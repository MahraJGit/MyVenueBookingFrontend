"use client";

import type { VenueAmenity } from "@/features/venues/types";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { getVenueAmenityPriceInfo } from "@/features/venues/utils";
import { getPackagesFromConfig } from "@/features/venues/packages";

export type AmenitySelection = {
  venueAmenityId: string;
  quantity: number;
  selected: boolean;
  selectedConfig?: { packageId?: string };
};

type AmenityPickerProps = {
  amenities: VenueAmenity[];
  selections: AmenitySelection[];
  onChange: (selections: AmenitySelection[]) => void;
  currency: string;
};

export function AmenityPicker({
  amenities,
  selections,
  onChange,
  currency,
}: AmenityPickerProps) {
  if (amenities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No add-on amenities available.</p>
    );
  }

  const toggle = (amenity: VenueAmenity, checked: boolean) => {
    const existing = selections.find((s) => s.venueAmenityId === amenity.id);
    const next = selections.filter((s) => s.venueAmenityId !== amenity.id);
    if (checked) {
      const packages =
        amenity.pricingType === "PACKAGE_BASED"
          ? getPackagesFromConfig(amenity.pricingConfig ?? {})
          : [];
      next.push({
        venueAmenityId: amenity.id,
        quantity: existing?.quantity ?? 1,
        selected: true,
        selectedConfig:
          packages.length > 0
            ? { packageId: existing?.selectedConfig?.packageId ?? packages[0].id }
            : undefined,
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

  const setPackage = (amenityId: string, packageId: string) => {
    onChange(
      selections.map((s) =>
        s.venueAmenityId === amenityId
          ? { ...s, selectedConfig: { packageId } }
          : s,
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
        const priceInfo = getVenueAmenityPriceInfo(amenity);
        const packages =
          amenity.pricingType === "PACKAGE_BASED"
            ? getPackagesFromConfig(amenity.pricingConfig ?? {})
            : [];
        const selectedPackage =
          packages.find((p) => p.id === sel?.selectedConfig?.packageId) ?? packages[0];

        return (
          <div
            key={amenity.id}
            className="space-y-3 rounded-xl border border-[#303030] bg-[#1B1B1B] p-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Checkbox
                id={`amenity-${amenity.id}`}
                checked={!!sel?.selected || isIncluded}
                disabled={isIncluded}
                onCheckedChange={(v) => toggle(amenity, !!v)}
              />
              <Label htmlFor={`amenity-${amenity.id}`} className="flex-1 cursor-pointer">
                <span className="font-medium text-white">{name}</span>
                {isIncluded ? (
                  <span className="ml-2 text-xs text-primary">Included</span>
                ) : priceInfo ? (
                  <span className="ml-2 text-xs text-zinc-400">
                    <DisplayPrice amount={priceInfo.amount} currency={currency} />
                    <span> {priceInfo.suffix}</span>
                  </span>
                ) : null}
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
              {sel?.selected && !isIncluded && amenity.pricingType === "PACKAGE_BASED" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Guests</Label>
                  <NumberInput
                    integer
                    min={selectedPackage?.minHeads ?? 1}
                    max={amenity.maxPerBooking ?? undefined}
                    value={sel.quantity}
                    defaultOnBlur={selectedPackage?.minHeads ?? 1}
                    onValueChange={(quantity) =>
                      setQuantity(amenity.id, quantity ?? 1)
                    }
                    className="h-8 w-20 border-[#303030] bg-black"
                  />
                </div>
              )}
            </div>

            {sel?.selected && !isIncluded && packages.length > 0 && (
              <div className="space-y-2 border-t border-[#303030] pt-3 pl-7">
                {packages.length > 1 && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Choose package</Label>
                    <Select
                      value={sel.selectedConfig?.packageId ?? packages[0].id}
                      onValueChange={(packageId) => setPackage(amenity.id, packageId)}
                    >
                      <SelectTrigger className="border-[#303030] bg-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} — {pkg.pricePerHead}/guest
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedPackage && (
                  <div className="space-y-1">
                    {selectedPackage.description && (
                      <p className="text-xs text-zinc-400">{selectedPackage.description}</p>
                    )}
                    {selectedPackage.items.length > 0 && (
                      <ul className="list-inside list-disc text-xs text-zinc-300">
                        {selectedPackage.items.map((item) => (
                          <li key={item.id}>
                            {item.name}
                            {item.description ? ` — ${item.description}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {selectedPackage.minHeads && (
                      <p className="text-xs text-muted-foreground">
                        Minimum {selectedPackage.minHeads} guests
                      </p>
                    )}
                  </div>
                )}
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
    .map((s) => ({
      venueAmenityId: s.venueAmenityId,
      quantity: s.quantity,
      ...(s.selectedConfig ? { selectedConfig: s.selectedConfig } : {}),
    }));
}
