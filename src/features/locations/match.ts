import type { City, Country } from "./types";

export function findActiveCountry(
  countries: Country[],
  countryCode: string | undefined | null,
): Country | undefined {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized) return undefined;
  // List is often already activeOnly-filtered; don't require isActive === true.
  return countries.find((country) => country.code.toUpperCase() === normalized);
}

function normalizePlaceName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Match a geocoded city name to a catalog city (exact, then fuzzy contains).
 */
export function findCatalogCity(
  cities: City[],
  cityName: string | undefined | null,
): City | undefined {
  const normalized = cityName ? normalizePlaceName(cityName) : "";
  if (!normalized) return undefined;

  const exact = cities.find((city) => normalizePlaceName(city.name) === normalized);
  if (exact) return exact;

  // Prefer longer names ("New York" over "York").
  const ranked = [...cities].sort(
    (a, b) => normalizePlaceName(b.name).length - normalizePlaceName(a.name).length,
  );
  return ranked.find((city) => {
    const name = normalizePlaceName(city.name);
    return name.length >= 3 && (normalized.includes(name) || name.includes(normalized));
  });
}

type AddressMatchInput = {
  city?: string | null;
  fullAddress?: string | null;
  addressLine?: string | null;
};

/**
 * Resolve catalog city from geocode city and/or freeform address text.
 */
export function findCatalogCityFromHint(
  cities: City[],
  hint: AddressMatchInput,
): City | undefined {
  const fromCityField = findCatalogCity(cities, hint.city);
  if (fromCityField) return fromCityField;

  const haystack = normalizePlaceName(
    [hint.fullAddress, hint.addressLine, hint.city].filter(Boolean).join(" "),
  );
  if (!haystack) return undefined;

  const ranked = [...cities].sort(
    (a, b) => normalizePlaceName(b.name).length - normalizePlaceName(a.name).length,
  );
  return ranked.find((city) => {
    const name = normalizePlaceName(city.name);
    return name.length >= 3 && haystack.includes(name);
  });
}

export function uniqueCityTimezones(cities: City[], ...extras: Array<string | null | undefined>): string[] {
  const values = [
    ...cities.map((city) => city.timezone?.trim()).filter(Boolean),
    ...extras.map((value) => value?.trim()).filter(Boolean),
  ] as string[];
  return [...new Set(values)];
}

/** Shared sonner id so map location errors replace each other instead of stacking. */
export const MAP_LOCATION_TOAST_ID = "map-location-feedback";

export type PendingMapCity = {
  countryCode: string;
  city?: string | null;
  fullAddress?: string | null;
  addressLine?: string | null;
};
