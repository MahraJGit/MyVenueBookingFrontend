import { NextRequest, NextResponse } from "next/server"

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "MyVenueBooking/1.0 (venue location picker; contact: support@local)",
}

/**
 * Server-side proxy to Nominatim (OpenStreetMap) to avoid browser CORS limits.
 * Respect usage policy: https://operations.osmfoundation.org/policies/nominatim/
 *
 * Search:  GET ?q=Dubai&limit=5
 * Reverse: GET ?lat=25.2&lon=55.27
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat")
  const lon = req.nextUrl.searchParams.get("lon")

  if (lat && lon) {
    const latNum = Number.parseFloat(lat)
    const lonNum = Number.parseFloat(lon)
    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("lat", String(latNum))
    url.searchParams.set("lon", String(lonNum))
    url.searchParams.set("format", "json")
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("accept-language", "en")

    try {
      const res = await fetch(url.toString(), {
        headers: NOMINATIM_HEADERS,
        cache: "no-store",
      })
      if (!res.ok) {
        return NextResponse.json(
          { error: "Reverse geocoding unavailable" },
          { status: 502 },
        )
      }
      const data: unknown = await res.json()
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: "Reverse geocoding failed" }, { status: 502 })
    }
  }

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    )
  }

  const limitRaw = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 10) : 5

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", q)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("accept-language", "en")

  try {
    const res = await fetch(url.toString(), {
      headers: NOMINATIM_HEADERS,
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 },
      )
    }

    const data: unknown = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 502 })
  }
}
