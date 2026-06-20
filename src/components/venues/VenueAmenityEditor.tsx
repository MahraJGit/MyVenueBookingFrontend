"use client";

import * as React from "react";
import type { AmenityCatalogItem, VenueAmenity, VenueAmenityPayload } from "@/features/venues/types";
import {
  defaultAmenityForm,
  newPackageItem,
  newPackageOption,
  suggestedVenueAmenityFormFromCatalog,
  type AmenityOfferMode,
  type PackageOptionForm,
  type VenueAmenityFormState,
} from "@/features/venues/amenity-catalog";
import { getPackagesFromConfig, sanitizePackagesForSave } from "@/features/venues/packages";import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClassName, isBlank, requiredMessage } from "@/lib/form-validation";

export type { AmenityOfferMode, VenueAmenityFormState } from "@/features/venues/amenity-catalog";
export { defaultAmenityForm } from "@/features/venues/amenity-catalog";

const inputClass = "bg-input/50 border-border w-full";
const selectTriggerClass = cn(inputClass, "w-full");

export function amenityFormToPayload(form: VenueAmenityFormState): VenueAmenityPayload {
  if (form.offerMode === "included") {
    return {
      catalogId: form.catalogId,
      pricingType: "INCLUDED",
      isIncluded: true,
      pricingConfig: {},
    };
  }

  if (form.addonPricingType === "PACKAGE_BASED") {
    return {
      catalogId: form.catalogId,
      pricingType: "PACKAGE_BASED",
      isIncluded: false,
      pricingConfig: {
        packages: sanitizePackagesForSave(form.packages),
      },
    };
  }

  const pricingConfig: Record<string, unknown> =
    form.addonPricingType === "PER_UNIT"
      ? {
          unitPrice: form.price,
          ...(form.bulkTiers.length > 0 ? { bulkTiers: form.bulkTiers } : {}),
        }
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
    const bulk = (config.bulkTiers as Array<{ minQuantity: number; unitPrice: number }>) ?? [];
    const base = `${config.unitPrice} per unit`;
    return bulk.length > 0 ? `${base} (bulk tiers apply)` : base;
  }
  if (amenity.pricingType === "PER_HOUR" && config.hourlyPrice != null) {
    return `${config.hourlyPrice} per hour`;
  }
  if (amenity.pricingType === "FLAT_PER_EVENT" && config.flatPrice != null) {
    return `${config.flatPrice} per booking`;
  }
  if (amenity.pricingType === "PACKAGE_BASED") {
    const packages = getPackagesFromConfig(config);
    if (packages.length === 0) return "Package-based pricing";
    if (packages.length === 1) {
      const itemCount = packages[0].items.length;
      return `${packages[0].name}: ${packages[0].pricePerHead} / head${itemCount > 0 ? ` · ${itemCount} items` : ""}`;
    }
    return `${packages.length} packages`;
  }
  return null;
}

function isPackageValid(packages: PackageOptionForm[]): boolean {
  if (packages.length === 0) return false;
  return packages.every(
    (pkg) =>
      pkg.name.trim() &&
      pkg.pricePerHead > 0 &&
      pkg.items.some((item) => item.name.trim()),
  );
}

type VenueAmenityEditorProps = {
  catalog: AmenityCatalogItem[];
  existingAmenities?: VenueAmenity[];
  isSaving?: boolean;
  disabled?: boolean;
  onAdd: (payload: VenueAmenityPayload) => void;
  onRemove: (amenityId: string) => void;
};

export function VenueAmenityEditor({
  catalog,
  existingAmenities = [],
  isSaving = false,
  disabled = false,
  onAdd,
  onRemove,
}: VenueAmenityEditorProps) {
  const [form, setForm] = React.useState<VenueAmenityFormState>(defaultAmenityForm());
  const [attempted, setAttempted] = React.useState(false);

  const usedCatalogIds = new Set(existingAmenities.map((a) => a.catalogId));
  const availableCatalog = catalog.filter((c) => !usedCatalogIds.has(c.id));

  const selectedCatalog = catalog.find((c) => c.id === form.catalogId);
  const isAddon = form.offerMode === "addon";
  const isPackage = isAddon && form.addonPricingType === "PACKAGE_BASED";

  const catalogError =
    attempted && isBlank(form.catalogId) ? requiredMessage("Amenity") : null;
  const priceError =
    attempted &&
    isAddon &&
    !isPackage &&
    (form.price <= 0 || Number.isNaN(form.price))
      ? "Price must be greater than 0"
      : null;
  const packageError =
    attempted && isPackage && !isPackageValid(form.packages)
      ? "Each package needs a name, price per head, and at least one item"
      : null;

  function handleAdd() {
    setAttempted(true);
    if (isBlank(form.catalogId)) return;
    if (isAddon && !isPackage && (form.price <= 0 || Number.isNaN(form.price))) return;
    if (isPackage && !isPackageValid(form.packages)) return;
    onAdd(amenityFormToPayload(form));
    setForm(defaultAmenityForm());
    setAttempted(false);
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "space-y-4 rounded-lg border border-border bg-muted/20 p-4",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <p className="text-sm text-muted-foreground">
          Pick an item from the admin catalog, then configure how it works at{" "}
          <strong className="text-foreground">this venue</strong> — included for free or a paid
          add-on with your pricing (per unit, hourly, flat rate, or itemized packages).
        </p>

        <FormField label="Amenity" htmlFor="amenity-catalog" required error={catalogError}>
          <Select
            value={form.catalogId || undefined}
            onValueChange={(v) => {
              const item = catalog.find((c) => c.id === v);
              setForm(item ? suggestedVenueAmenityFormFromCatalog(item) : { ...defaultAmenityForm(), catalogId: v });
              setAttempted(false);
            }}
          >
            <SelectTrigger
              id="amenity-catalog"
              aria-invalid={!!catalogError}
              className={fieldClassName(selectTriggerClass, !!catalogError)}
            >
              <SelectValue placeholder="Select from admin catalog…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {catalog.length === 0 ? (
                <SelectItem value="__none" disabled>
                  No amenities in catalog — ask admin to add some
                </SelectItem>
              ) : (
                catalog.map((c) => {
                  const alreadyAdded = usedCatalogIds.has(c.id);
                  return (
                    <SelectItem key={c.id} value={c.id} disabled={alreadyAdded}>
                      {c.name}
                      {alreadyAdded ? " (already added)" : ""}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
          {catalog.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {availableCatalog.length} of {catalog.length} catalog amenities available to add.
              {existingAmenities.length > 0 &&
                " Items already on this venue are shown but disabled."}
            </p>
          )}
          {selectedCatalog?.description && (
            <p className="text-xs text-muted-foreground">{selectedCatalog.description}</p>
          )}
        </FormField>

        <div className="space-y-3">
          <Label>How is this offered at your venue?</Label>
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
                <p className="text-xs text-muted-foreground">Free for guests.</p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <RadioGroupItem value="addon" id="offer-addon" className="mt-0.5" />
              <div>
                <span className="text-sm font-medium text-foreground">Paid add-on</span>
                <p className="text-xs text-muted-foreground">Extra cost for this venue.</p>
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
                    packages:
                      v === "PACKAGE_BASED" && form.packages.length === 0
                        ? [newPackageOption("Package 1")]
                        : form.packages,
                  })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_UNIT">Per unit (e.g. per chair)</SelectItem>
                  <SelectItem value="PER_HOUR">Per hour (e.g. staff / equipment)</SelectItem>
                  <SelectItem value="FLAT_PER_EVENT">Flat per booking</SelectItem>
                  <SelectItem value="PACKAGE_BASED">Package-based (e.g. catering tiers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isPackage && (
              <>
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
                {form.addonPricingType === "PER_UNIT" && (
                  <div className="space-y-2">
                    <Label>Max per booking</Label>
                    <NumberInput
                      min={1}
                      integer
                      value={form.maxPerBooking}
                      onValueChange={(maxPerBooking) =>
                        setForm({ ...form, maxPerBooking: maxPerBooking ?? undefined })
                      }
                      className={inputClass}
                      placeholder="Optional"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {isAddon && form.addonPricingType === "PER_UNIT" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Bulk pricing tiers (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    bulkTiers: [
                      ...form.bulkTiers,
                      { minQuantity: 10, unitPrice: form.price },
                    ],
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add tier
              </Button>
            </div>
            {form.bulkTiers.map((tier, index) => (
              <div
                key={index}
                className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-background p-3"
              >
                <FormField label="Min qty" className="min-w-[100px] flex-1">
                  <NumberInput
                    integer
                    min={1}
                    value={tier.minQuantity}
                    onValueChange={(minQuantity) => {
                      const bulkTiers = [...form.bulkTiers];
                      bulkTiers[index] = { ...tier, minQuantity: minQuantity ?? 1 };
                      setForm({ ...form, bulkTiers });
                    }}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Unit price" className="min-w-[100px] flex-1">
                  <NumberInput
                    min={0}
                    value={tier.unitPrice}
                    onValueChange={(unitPrice) => {
                      const bulkTiers = [...form.bulkTiers];
                      bulkTiers[index] = { ...tier, unitPrice: unitPrice ?? 0 };
                      setForm({ ...form, bulkTiers });
                    }}
                    className={inputClass}
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() =>
                    setForm({
                      ...form,
                      bulkTiers: form.bulkTiers.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {isPackage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Packages</Label>
                <p className="text-xs text-muted-foreground">
                  Create a package with a price per guest, then list what is included.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    packages: [
                      ...form.packages,
                      newPackageOption(`Package ${form.packages.length + 1}`),
                    ],
                  })
                }
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add package
              </Button>
            </div>
            {packageError ? <p className="text-sm text-destructive">{packageError}</p> : null}
            {form.packages.map((pkg, pkgIndex) => (
              <div
                key={pkg.id}
                className="space-y-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Package {pkgIndex + 1}</p>
                  {form.packages.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setForm({
                          ...form,
                          packages: form.packages.filter((p) => p.id !== pkg.id),
                        })
                      }
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Remove package
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Package name">
                    <Input
                      className={inputClass}
                      placeholder="e.g. Premium Buffet"
                      value={pkg.name}
                      onChange={(e) => {
                        const packages = [...form.packages];
                        packages[pkgIndex] = { ...pkg, name: e.target.value };
                        setForm({ ...form, packages });
                      }}
                    />
                  </FormField>
                  <FormField label="Price / guest">
                    <NumberInput
                      min={0}
                      value={pkg.pricePerHead}
                      onValueChange={(pricePerHead) => {
                        const packages = [...form.packages];
                        packages[pkgIndex] = { ...pkg, pricePerHead: pricePerHead ?? 0 };
                        setForm({ ...form, packages });
                      }}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Min guests" className="sm:col-span-1">
                    <NumberInput
                      integer
                      min={1}
                      value={pkg.minHeads}
                      onValueChange={(minHeads) => {
                        const packages = [...form.packages];
                        packages[pkgIndex] = { ...pkg, minHeads: minHeads ?? undefined };
                        setForm({ ...form, packages });
                      }}
                      className={inputClass}
                      placeholder="Optional"
                    />
                  </FormField>
                </div>
                <FormField label="Package description (optional)">
                  <Textarea
                    className={inputClass}
                    placeholder="Short summary for guests…"
                    value={pkg.description}
                    onChange={(e) => {
                      const packages = [...form.packages];
                      packages[pkgIndex] = { ...pkg, description: e.target.value };
                      setForm({ ...form, packages });
                    }}
                    rows={2}
                  />
                </FormField>

                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Items in this package</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const packages = [...form.packages];
                        packages[pkgIndex] = {
                          ...pkg,
                          items: [...pkg.items, newPackageItem()],
                        };
                        setForm({ ...form, packages });
                      }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add item
                    </Button>
                  </div>
                  {pkg.items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <FormField label="Item name">
                        <Input
                          className={inputClass}
                          placeholder="e.g. Grilled chicken"
                          value={item.name}
                          onChange={(e) => {
                            const packages = [...form.packages];
                            const items = [...pkg.items];
                            items[itemIndex] = { ...item, name: e.target.value };
                            packages[pkgIndex] = { ...pkg, items };
                            setForm({ ...form, packages });
                          }}
                        />
                      </FormField>
                      <FormField label="Item detail (optional)">
                        <Input
                          className={inputClass}
                          placeholder="e.g. With herb butter sauce"
                          value={item.description ?? ""}
                          onChange={(e) => {
                            const packages = [...form.packages];
                            const items = [...pkg.items];
                            items[itemIndex] = { ...item, description: e.target.value };
                            packages[pkgIndex] = { ...pkg, items };
                            setForm({ ...form, packages });
                          }}
                        />
                      </FormField>
                      {pkg.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end text-destructive"
                          onClick={() => {
                            const packages = [...form.packages];
                            packages[pkgIndex] = {
                              ...pkg,
                              items: pkg.items.filter((i) => i.id !== item.id),
                            };
                            setForm({ ...form, packages });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="button" onClick={handleAdd} disabled={isSaving || disabled}>
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
                  {a.pricingType === "PACKAGE_BASED" && (
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {getPackagesFromConfig(a.pricingConfig ?? {}).map((pkg) => (
                        <li key={pkg.id}>
                          <span className="font-medium text-foreground">{pkg.name}</span>
                          {pkg.items.length > 0 && (
                            <span>
                              {" "}
                              — {pkg.items.map((item) => item.name).join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
