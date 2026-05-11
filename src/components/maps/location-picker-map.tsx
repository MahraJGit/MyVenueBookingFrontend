"use client"

import * as React from "react"
import L from "leaflet"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import "leaflet/dist/leaflet.css"

const LEAFLET_ICON_VERSION = "1.9.4"

if (typeof window !== "undefined") {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
  delete proto._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon-2x.png`,
    iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-shadow.png`,
  })
}

type NominatimHit = {
  lat: string
  lon: string
  display_name?: string
  address?: Record<string, string>
}

export type AddressHint = {
  addressLine?: string
  city?: string
  state?: string
  zipCode?: string
  countryCode?: string
}

export function LocationPickerMap({
  latitude,
  longitude,
  onPositionChange,
  onAddressHint,
}: {
  latitude: string
  longitude: string
  onPositionChange: (lat: number, lng: number) => void
  onAddressHint?: (hint: AddressHint) => void
}) {
  const [query, setQuery] = React.useState("")
  const [searching, setSearching] = React.useState(false)
  const mapRootRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const markerRef = React.useRef<L.Marker | null>(null)

  const lat = Number.parseFloat(latitude)
  const lng = Number.parseFloat(longitude)
  const centerLat = Number.isFinite(lat) ? lat : 25.2048
  const centerLng = Number.isFinite(lng) ? lng : 55.2708

  React.useEffect(() => {
    const root = mapRootRef.current
    if (!root || mapRef.current) return

    const map = L.map(root, {
      zoomControl: true,
      attributionControl: true,
    }).setView([centerLat, centerLng], 14)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const marker = L.marker([centerLat, centerLng], { draggable: true }).addTo(map)
    marker.on("dragend", () => {
      const p = marker.getLatLng()
      onPositionChange(p.lat, p.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.off()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [centerLat, centerLng, onPositionChange])

  React.useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    marker.setLatLng([centerLat, centerLng])
    const zoom = map.getZoom()
    map.setView([centerLat, centerLng], zoom >= 3 ? zoom : 14)
  }, [centerLat, centerLng])

  async function runSearch() {
    const q = query.trim()
    if (q.length < 2) {
      toast.error("Enter at least 2 characters to search.")
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      )
      const data: unknown = await res.json()
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Search failed"
        toast.error(msg)
        return
      }
      if (!Array.isArray(data) || data.length === 0) {
        toast.message("No results found")
        return
      }
      const first = data[0] as NominatimHit
      const nLat = Number.parseFloat(first.lat)
      const nLng = Number.parseFloat(first.lon)
      if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
        toast.error("Invalid search result")
        return
      }
      onPositionChange(nLat, nLng)

      if (onAddressHint && first.address) {
        const a = first.address
        const road = [a.house_number, a.road].filter(Boolean).join(" ").trim()
        const city =
          a.city ||
          a.town ||
          a.village ||
          a.municipality ||
          a.suburb ||
          a.county
        const state = a.state || a.region
        const zipCode = a.postcode
        const countryCode = a.country_code?.toUpperCase()
        const addressLine =
          road ||
          first.display_name?.split(",").slice(0, 2).join(", ").trim()
        onAddressHint({
          addressLine: addressLine || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
          countryCode: countryCode || undefined,
        })
      }
      toast.success("Location updated from search")
    } catch {
      toast.error("Search failed")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-zinc-200">Map</Label>
        <p className="mt-1 text-xs text-zinc-500">
          Search for a place, or drag the pin. Coordinates sync with the fields
          below and are saved with the event.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void runSearch()
            }
          }}
          placeholder="Search address or place…"
          className="border-zinc-700 bg-[#111111] sm:flex-1"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => void runSearch()}
          disabled={searching}
        >
          {searching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div
          ref={mapRootRef}
          className="z-0 h-[300px] w-full [&_.leaflet-control-attribution]:text-[10px]"
        />
      </div>
    </div>
  )
}
