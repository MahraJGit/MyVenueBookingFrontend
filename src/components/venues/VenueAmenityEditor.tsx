"use client";

import * as React from "react";
import type { AmenityCatalogItem, VenueAmenity, VenueAmenityPayload } from "@/features/venues/types";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/ui/form-field";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClassName, isBlank, requiredMessage } from "@/lib/form-validation";

export type AmenityOfferMode = "included" | "addon";

export type VenueAmenityFormState = {
  catalogId: string;
  offerMode: AmenityOfferMode;
  addonPricingType: "PER_UNIT" | "PER_HOUR" | "FLAT_PER_EVENT";
  price: number;
  maxPerBooking?: number;
};

const inputClass = "bg-input/50 border-border w-full";
const selectTriggerClass = cn(inputClass, "w-full");

export function defaultAmenityForm(): VenueAmenityFormState {
  return {
    catalogId: "",
    offerMode: "addon",
    addonPricingType: "PER_UNIT",
    price: 0,
    maxPerBooking: undefined,
  };
}

export function amenityFormToPayload(form: VenueAmenityFormState): VenueAmenityPayload {
  if (form.offerMode === "included") {
    return {
      catalogId: form.catalogId,
      pricingType: "INCLUDED",
      isIncluded: true,
      pricingConfig: {},
    };
  }

  const pricingConfig: Record<string, number> =
    form.addonPricingType === "PER_UNIT"
      ? { unitPrice: form.price }
      : form.addonPricingType === "PER_HOUR"
        ? { hourlyPrice: form.price }
        : { flatPrice: form.price };

  return {
    catalogId: form.catalogId,
    pricingType: form.addonPricingType,
    isIncluded: false,
    pricingConfig,
    maxPerBooking: form.maxPerBooking,
  };
}

export function formatVenueAmenityPrice(amenity: VenueAmenity): string | null {
  if (amenity.pricingType === "INCLUDED" || amenity.isIncluded) {
    return null;
  }
  const config = amenity.pricingConfig as Record<string, unknown>;
  if (amenity.pricingType === "PER_UNIT" && config.unitPrice != null) {
    return `${config.unitPrice} per unit`;
  }
  if (amenity.pricingType === "PER_HOUR" && config.hourlyPrice != null) {
    return `${config.hourlyPrice} per hour`;
  }
  if (amenity.pricingType === "FLAT_PER_EVENT" && config.flatPrice != null) {
    return `${config.flatPrice} per booking`;
  }
  return null;
}

type VenueAmenityEditorProps = {
  catalog: AmenityCatalogItem[];
  existingAmenities?: VenueAmenity[];
  isSaving?: boolean;
  onAdd: (payload: VenueAmenityPayload) => void;
  onRemove: (amenityId: string) => void;
};

export function VenueAmenityEditor({
  catalog,
  existingAmenities = [],
  isSaving = false,
  onAdd,
  onRemove,
}: VenueAmenityEditorProps) {
  const [form, setForm] = React.useState<VenueAmenityFormState>(defaultAmenityForm());
  const [attempted, setAttempted] = React.useState(false);

  const usedCatalogIds = new Set(existingAmenities.map((a) => a.catalogId));
  const availableCatalog = catalog.filter((c) => !usedCatalogIds.has(c.id));

  const selectedCatalog = catalog.find((c) => c.id === form.catalogId);
  const isAddon = form.offerMode === "addon";

  const catalogError =
    attempted && isBlank(form.catalogId) ? requiredMessage("Amenity") : null;
  const priceError =
    attempted && isAddon && (form.price <= 0 || Number.isNaN(form.price))
      ? "Price must be greater than 0"
      : null;

  function handleAdd() {
    setAttempted(true);
    if (isBlank(form.catalogId)) return;
    if (isAddon && (form.price <= 0 || Number.isNaN(form.price))) return;
    onAdd(amenityFormToPayload(form));
    setForm(defaultAmenityForm());
    setAttempted(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">
          Select from amenities defined in the admin catalog. Mark each as{" "}
          <strong className="text-foreground">included</strong> (free with the booking) or a{" "}
          <strong className="text-foreground">paid add-on</strong> with your own price.
        </p>

        <FormField label="Amenity" htmlFor="amenity-catalog" required error={catalogError}>
          <Select
            value={form.catalogId || undefined}
            onValueChange={(v) => setForm({ ...form, catalogId: v })}
          >
            <SelectTrigger
              id="amenity-catalog"
              aria-invalid={!!catalogError}
              className={fieldClassName(selectTriggerClass, !!catalogError)}
            >
              <SelectValue placeholder="Select from admin catalog…" />
            </SelectTrigger>
            <SelectContent>
              {availableCatalog.length === 0 ? (
                <SelectItem value="__none" disabled>
                  {catalog.length === 0
                    ? "No amenities in catalog — ask admin to add some"
                    : "All catalog amenities already added"}
                </SelectItem>
              ) : (
                availableCatalog.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedCatalog?.description && (
            <p className="text-xs text-muted-foreground">{selectedCatalog.description}</p>
          )}
        </FormField>

        <div className="space-y-3">
          <Label>How is this offered?</Label>
          <RadioGroup
            value={form.offerMode}
            onValueChange={(v) =>
              setForm({ ...form, offerMode: v as AmenityOfferMode })
            }
            className="flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <RadioGroupItem value="included" id="offer-included" className="mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">Included in booking</span>
                <p className="text-xs text-muted-foreground">
                  Free for guests — e.g. Wi‑Fi, parking, basic AV.
                </p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <RadioGroupItem value="addon" id="offer-addon" className="mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">Paid add-on</span>
                <p className="text-xs text-muted-foreground">
                  Extra cost — e.g. chairs, catering, decoration.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {isAddon && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="w-full space-y-2 lg:col-span-2">
              <Label>Charge type</Label>
              <Select
                value={form.addonPricingType}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    addonPricingType: v as VenueAmenityFormState["addonPricingType"],
                  })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_UNIT">Per unit (e.g. per chair)</SelectItem>
                  <SelectItem value="PER_HOUR">Per hour (e.g. staff / equipment)</SelectItem>
                  <SelectItem value="FLAT_PER_EVENT">Flat per booking (e.g. catering package)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField label="Price" required={isAddon} error={priceError}>
              <NumberInput
                min={0}
                value={form.price}
                onValueChange={(price) => setForm({ ...form, price: price ?? 0 })}
                aria-invalid={!!priceError}
                className={fieldClassName(inputClass, !!priceError)}
                placeholder="0.00"
              />
            </FormField>
            <div className="space-y-2">
              <Label>Max per booking</Label>
              <NumberInput
                min={1}
                integer
                value={form.maxPerBooking}
                onValueChange={(maxPerBooking) =>
                  setForm({
                    ...form,
                    maxPerBooking,
                  })
                }
                className={inputClass}
                placeholder="Optional"
              />
              <p className="text-xs text-muted-foreground">
                Limit quantity guests can add (for per-unit items).
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleAdd} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add amenity
          </Button>
        </div>
      </div>

      {existingAmenities.length > 0 ? (
        <ul className="space-y-2">
          {existingAmenities.map((a) => {
            const isIncluded = a.pricingType === "INCLUDED" || a.isIncluded;
            const priceLabel = formatVenueAmenityPrice(a);

            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {a.catalog?.name ?? a.id}
                    </span>
                    <Badge variant={isIncluded ? "default" : "secondary"}>
                      {isIncluded ? "Included" : "Add-on"}
                    </Badge>
                    {!isIncluded && a.pricingType && (
                      <Badge variant="outline" className="text-xs">
                        {a.pricingType.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  {priceLabel && (
                    <p className="text-xs text-muted-foreground">{priceLabel}</p>
                  )}
                  {a.maxPerBooking && !isIncluded && (
                    <p className="text-xs text-muted-foreground">
                      Max {a.maxPerBooking} per booking
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive"
                  onClick={() => onRemove(a.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No amenities yet. Add included items (Wi‑Fi) or paid add-ons (chairs, catering).
        </p>
      )}
    </div>
  );
}
