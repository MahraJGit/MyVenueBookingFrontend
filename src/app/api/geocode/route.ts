import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side proxy to Nominatim (OpenStreetMap) to avoid browser CORS limits.
 * Respect usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 },
    )
  }

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", q)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("addressdetails", "1")

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MyVenueBooking/1.0 (event admin; contact: support@local)",
      },
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
