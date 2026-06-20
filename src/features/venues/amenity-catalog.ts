import type { AmenityCatalogItem } from "./types";
import type { PackageItemForm, PackageOptionForm } from "./packages";
import { newPackageItem, newPackageOption } from "./packages";

export type { PackageItemForm, PackageOptionForm };
export { newPackageItem, newPackageOption };

export type BulkTierForm = {
  minQuantity: number;
  unitPrice: number;
};

export type AmenityOfferMode = "included" | "addon";

export type VenueAmenityFormState = {
  catalogId: string;
  offerMode: AmenityOfferMode;
  addonPricingType: "PER_UNIT" | "PER_HOUR" | "FLAT_PER_EVENT" | "PACKAGE_BASED";
  price: number;
  bulkTiers: BulkTierForm[];
  maxPerBooking?: number;
  packages: PackageOptionForm[];
};

export function defaultAmenityForm(): VenueAmenityFormState {
  return {
    catalogId: "",
    offerMode: "addon",
    addonPricingType: "PER_UNIT",
    price: 0,
    bulkTiers: [],
    maxPerBooking: undefined,
    packages: [],
  };
}

/** Select a catalog item — vendor chooses included vs paid and pricing on the venue. */
export function suggestedVenueAmenityFormFromCatalog(
  item: AmenityCatalogItem,
): VenueAmenityFormState {
  return { ...defaultAmenityForm(), catalogId: item.id };
}
