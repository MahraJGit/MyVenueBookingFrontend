export type GeocodeSuggestion = {
  id: string
  lat: number | null
  lon: number | null
  primary: string
  secondary?: string
  addressLine?: string
  fullAddress?: string
  city?: string
  state?: string
  zipCode?: string
  countryCode?: string
  /** Google Places id — fetch details when lat/lon are null. */
  placeId?: string
}

export type AddressHint = {
  addressLine?: string
  fullAddress?: string
  city?: string
  state?: string
  zipCode?: string
  countryCode?: string
}

export function suggestionToAddressHint(
  item: GeocodeSuggestion,
): AddressHint & { label: string } {
  return {
    label: item.fullAddress ?? [item.primary, item.secondary].filter(Boolean).join(", "),
    addressLine: item.addressLine,
    fullAddress: item.fullAddress,
    city: item.city,
    state: item.state,
    zipCode: item.zipCode,
    countryCode: item.countryCode,
  }
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: Record<string, string | undefined>
}

type PhotonResponse = {
  features?: PhotonFeature[]
}

type NominatimHit = {
  place_id?: number | string
  lat: string
  lon: string
  display_name?: string
  address?: Record<string, string>
}

type GoogleAutocompleteSuggestion = {
  placePrediction?: {
    placeId?: string
    text?: { text?: string }
    structuredFormat?: {
      mainText?: { text?: string }
      secondaryText?: { text?: string }
    }
  }
}

type GooglePlaceDetails = {
  id?: string
  formattedAddress?: string
  displayName?: { text?: string }
  location?: { latitude?: number; longitude?: number }
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
}

function firstString(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

function buildStreetLine(parts: Array<string | undefined>): string | undefined {
  const line = parts.filter(Boolean).join(" ").trim()
  return line || undefined
}

function buildSecondary(parts: Array<string | undefined>): string | undefined {
  const line = parts.filter(Boolean).join(", ")
  return line || undefined
}

export function parsePhotonFeature(feature: PhotonFeature): GeocodeSuggestion | null {
  const coords = feature.geometry?.coordinates
  if (!coords || coords.length < 2) return null

  const [lon, lat] = coords
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const p = feature.properties ?? {}
  const name = firstString(p.name)
  const street = buildStreetLine([p.housenumber, p.street])
  const city = firstString(p.city, p.district, p.locality, p.county)
  const state = firstString(p.state, p.region)
  const country = firstString(p.country)
  const countryCode = p.countrycode?.toUpperCase()
  const zipCode = firstString(p.postcode)

  const primary =
    name && street && !street.includes(name)
      ? `${name}, ${street}`
      : firstString(street, name, city) ?? "Unknown location"

  const secondary = buildSecondary([
    city && city !== primary ? city : undefined,
    state,
    country,
  ])

  const fullAddress = buildSecondary([street ?? name, city, state, country, zipCode])
  const addressLine = firstString(street, name)

  const id = [
    p.osm_type,
    p.osm_id,
    lat.toFixed(5),
    lon.toFixed(5),
  ]
    .filter(Boolean)
    .join(":")

  return {
    id: id || `${lat},${lon}`,
    lat,
    lon,
    primary,
    secondary,
    addressLine,
    fullAddress,
    city,
    state,
    zipCode,
    countryCode,
  }
}

export function parseNominatimHit(hit: NominatimHit): GeocodeSuggestion {
  const lat = Number.parseFloat(hit.lat)
  const lon = Number.parseFloat(hit.lon)
  const a = hit.address ?? {}

  const road = buildStreetLine([a.house_number, a.road])
  const city = firstString(a.city, a.town, a.village, a.municipality, a.suburb, a.neighbourhood, a.county)
  const state = firstString(a.state, a.region)
  const zipCode = firstString(a.postcode)
  const countryCode = a.country_code?.toUpperCase()
  const country = firstString(a.country)

  const displayParts =
    hit.display_name?.split(",").map((part) => part.trim()).filter(Boolean) ?? []

  const primary = firstString(road, displayParts[0], city) ?? hit.display_name ?? "Unknown location"
  const secondary = buildSecondary([
    city && city !== primary ? city : undefined,
    state,
    country,
  ])

  const fullAddress =
    displayParts.length > 0
      ? displayParts.slice(0, Math.min(displayParts.length, 4)).join(", ")
      : buildSecondary([road, city, state, country])

  return {
    id: String(hit.place_id ?? `${lat},${lon}`),
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    primary,
    secondary,
    addressLine: firstString(road, displayParts[0]),
    fullAddress,
    city,
    state,
    zipCode,
    countryCode,
  }
}

function googleComponent(
  components: GooglePlaceDetails["addressComponents"],
  type: string,
  useShort = false,
): string | undefined {
  const match = components?.find((component) => component.types?.includes(type))
  return firstString(useShort ? match?.shortText : match?.longText, match?.longText)
}

export function parseGooglePlaceDetails(place: GooglePlaceDetails): GeocodeSuggestion | null {
  const lat = place.location?.latitude
  const lon = place.location?.longitude
  if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null
  }

  const components = place.addressComponents ?? []
  const streetNumber = googleComponent(components, "street_number")
  const route = googleComponent(components, "route")
  const street = buildStreetLine([streetNumber, route])
  const city = firstString(
    googleComponent(components, "locality"),
    googleComponent(components, "postal_town"),
    googleComponent(components, "administrative_area_level_2"),
    googleComponent(components, "sublocality"),
  )
  const state = googleComponent(components, "administrative_area_level_1")
  const zipCode = googleComponent(components, "postal_code")
  const country = googleComponent(components, "country")
  const countryCode = googleComponent(components, "country", true)?.toUpperCase()
  const name = place.displayName?.text

  const primary = firstString(name, street, city) ?? place.formattedAddress ?? "Unknown location"
  const secondary =
    place.formattedAddress && place.formattedAddress !== primary
      ? place.formattedAddress.replace(primary, "").replace(/^,\s*/, "") || undefined
      : buildSecondary([city && city !== primary ? city : undefined, state, country])

  return {
    id: place.id ?? `${lat},${lon}`,
    placeId: place.id,
    lat,
    lon,
    primary,
    secondary,
    addressLine: firstString(street, name),
    fullAddress: place.formattedAddress,
    city,
    state,
    zipCode,
    countryCode,
  }
}

export function parseGoogleAutocompleteSuggestion(
  suggestion: GoogleAutocompleteSuggestion,
): GeocodeSuggestion | null {
  const prediction = suggestion.placePrediction
  if (!prediction?.placeId) return null

  const primary =
    prediction.structuredFormat?.mainText?.text ??
    prediction.text?.text ??
    "Unknown location"
  const secondary = prediction.structuredFormat?.secondaryText?.text

  return {
    id: prediction.placeId,
    placeId: prediction.placeId,
    lat: null,
    lon: null,
    primary,
    secondary,
    fullAddress: [primary, secondary].filter(Boolean).join(", "),
  }
}

export async function searchPhoton(
  q: string,
  limit: number,
  bias?: { lat: number; lon: number },
): Promise<GeocodeSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/")
  url.searchParams.set("q", q)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("lang", "en")
  if (bias) {
    url.searchParams.set("lat", String(bias.lat))
    url.searchParams.set("lon", String(bias.lon))
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) return []

  const data = (await res.json()) as PhotonResponse
  return (data.features ?? [])
    .map(parsePhotonFeature)
    .filter((item): item is GeocodeSuggestion => item !== null)
}

export async function searchNominatim(
  q: string,
  limit: number,
  bias?: { lat: number; lon: number },
): Promise<GeocodeSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", q)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "en")
  url.searchParams.set("dedupe", "1")
  if (bias) {
    const delta = 0.35
    url.searchParams.set("viewbox", [
      bias.lon - delta,
      bias.lat + delta,
      bias.lon + delta,
      bias.lat - delta,
    ].join(","))
    url.searchParams.set("bounded", "0")
  }

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "MyVenueBooking/1.0 (venue location picker; contact: support@local)",
    },
    cache: "no-store",
  })
  if (!res.ok) return []

  const data = (await res.json()) as NominatimHit[]
  return Array.isArray(data) ? data.map(parseNominatimHit) : []
}

export async function searchGooglePlaces(
  q: string,
  apiKey: string,
  bias?: { lat: number; lon: number },
): Promise<GeocodeSuggestion[]> {
  const body: Record<string, unknown> = {
    input: q,
    includedPrimaryTypes: ["street_address", "route", "premise", "subpremise", "establishment", "point_of_interest", "locality", "sublocality"],
    languageCode: "en",
  }

  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lon },
        radius: 50000,
      },
    }
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  if (!res.ok) return []

  const data = (await res.json()) as { suggestions?: GoogleAutocompleteSuggestion[] }
  return (data.suggestions ?? [])
    .map(parseGoogleAutocompleteSuggestion)
    .filter((item): item is GeocodeSuggestion => item !== null)
}

export async function fetchGooglePlaceDetails(
  placeId: string,
  apiKey: string,
): Promise<GeocodeSuggestion | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
    },
    cache: "no-store",
  })

  if (!res.ok) return null
  const data = (await res.json()) as GooglePlaceDetails
  return parseGooglePlaceDetails(data)
}

export async function reverseNominatim(
  lat: number,
  lon: number,
): Promise<GeocodeSuggestion | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse")
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lon))
  url.searchParams.set("format", "json")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "en")

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "MyVenueBooking/1.0 (venue location picker; contact: support@local)",
    },
    cache: "no-store",
  })

  if (!res.ok) return null
  const data = (await res.json()) as NominatimHit
  return parseNominatimHit(data)
}

export function dedupeSuggestions(items: GeocodeSuggestion[]): GeocodeSuggestion[] {
  const seen = new Set<string>()
  const result: GeocodeSuggestion[] = []

  for (const item of items) {
    const key = item.placeId ?? `${item.primary}|${item.secondary ?? ""}|${item.lat ?? ""}|${item.lon ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}
