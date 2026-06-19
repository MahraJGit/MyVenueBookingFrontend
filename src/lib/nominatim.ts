export type NominatimHit = {
  lat: string
  lon: string
  display_name?: string
  address?: Record<string, string>
}

export type AddressHint = {
  /** Short street line (road + number). */
  addressLine?: string
  /** Full readable address in English for form fields. */
  fullAddress?: string
  city?: string
  state?: string
  zipCode?: string
  countryCode?: string
}

/** Build a readable English-style address line from a Nominatim result. */
export function parseNominatimHit(hit: NominatimHit): AddressHint & { label: string } {
  const a = hit.address ?? {}
  const road = [a.house_number, a.road].filter(Boolean).join(" ").trim()
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.suburb ||
    a.neighbourhood ||
    a.county
  const state = a.state || a.region
  const zipCode = a.postcode
  const countryCode = a.country_code?.toUpperCase()

  const displayParts =
    hit.display_name?.split(",").map((s) => s.trim()).filter(Boolean) ?? []

  const fullAddress =
    displayParts.length > 0
      ? displayParts.slice(0, Math.min(displayParts.length, 4)).join(", ")
      : [road, city, state, a.country].filter(Boolean).join(", ") || undefined

  const addressLine =
    road ||
    displayParts.slice(0, 2).join(", ") ||
    displayParts[0]

  const label = hit.display_name ?? fullAddress ?? addressLine ?? ""

  return {
    label,
    addressLine: addressLine || undefined,
    fullAddress: fullAddress || undefined,
    city: city || undefined,
    state: state || undefined,
    zipCode: zipCode || undefined,
    countryCode: countryCode || undefined,
  }
}
