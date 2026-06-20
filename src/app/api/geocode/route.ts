import { NextRequest, NextResponse } from "next/server"

import {
  dedupeSuggestions,
  fetchGooglePlaceDetails,
  reverseNominatim,
  searchGooglePlaces,
  searchNominatim,
  searchPhoton,
  type GeocodeSuggestion,
} from "@/lib/geocode"

function parseBias(lat: string | null, lon: string | null) {
  if (!lat || !lon) return undefined
  const latNum = Number.parseFloat(lat)
  const lonNum = Number.parseFloat(lon)
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return undefined
  return { lat: latNum, lon: lonNum }
}

async function runSearch(
  q: string,
  limit: number,
  bias?: { lat: number; lon: number },
): Promise<GeocodeSuggestion[]> {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY?.trim()

  if (googleKey) {
    const googleResults = await searchGooglePlaces(q, googleKey, bias)
    if (googleResults.length > 0) return googleResults.slice(0, limit)
  }

  const photonResults = await searchPhoton(q, limit, bias)
  if (photonResults.length >= Math.min(limit, 3)) {
    return dedupeSuggestions(photonResults).slice(0, limit)
  }

  const nominatimResults = await searchNominatim(q, limit, bias)
  return dedupeSuggestions([...photonResults, ...nominatimResults]).slice(0, limit)
}

/**
 * Location search proxy (Google Places when configured, otherwise Photon + Nominatim).
 *
 * Search:   GET ?q=Dubai Marina&limit=8&lat=25.2&lon=55.27
 * Details:  GET ?placeId=ChIJ...
 * Reverse:  GET ?lat=25.2&lon=55.27
 */
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId")?.trim()
  const googleKey = process.env.GOOGLE_PLACES_API_KEY?.trim()

  if (placeId) {
    if (!googleKey) {
      return NextResponse.json({ error: "Place details require Google Places API key" }, { status: 400 })
    }

    try {
      const place = await fetchGooglePlaceDetails(placeId, googleKey)
      if (!place) {
        return NextResponse.json({ error: "Place not found" }, { status: 404 })
      }
      return NextResponse.json(place)
    } catch {
      return NextResponse.json({ error: "Place details request failed" }, { status: 502 })
    }
  }

  const lat = req.nextUrl.searchParams.get("lat")
  const lon = req.nextUrl.searchParams.get("lon")
  const q = req.nextUrl.searchParams.get("q")?.trim()

  if (!q && lat && lon) {
    const latNum = Number.parseFloat(lat)
    const lonNum = Number.parseFloat(lon)
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    try {
      const place = await reverseNominatim(latNum, lonNum)
      if (!place) {
        return NextResponse.json({ error: "Reverse geocoding unavailable" }, { status: 502 })
      }
      return NextResponse.json(place)
    } catch {
      return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 })
    }
  }

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    )
  }

  const limitRaw = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 8
  const bias = parseBias(req.nextUrl.searchParams.get("biasLat"), req.nextUrl.searchParams.get("biasLon"))
    ?? parseBias(lat, lon)

  try {
    const results = await runSearch(q, limit, bias)
    return NextResponse.json(results)
  } catch {
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 502 })
  }
}
