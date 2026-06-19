"use client"

import * as React from "react"
import L from "leaflet"
import { Loader2, MapPin, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  parseNominatimHit,
  type AddressHint,
  type NominatimHit,
} from "@/lib/nominatim"

import "leaflet/dist/leaflet.css"

export type { AddressHint }

const LEAFLET_ICON_VERSION = "1.9.4"
const AUTOCOMPLETE_DEBOUNCE_MS = 350

if (typeof window !== "undefined") {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
  delete proto._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon-2x.png`,
    iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-shadow.png`,
  })
}

async function fetchGeocodeSearch(q: string, limit = 6, signal?: AbortSignal) {
  const res = await fetch(
    `/api/geocode?q=${encodeURIComponent(q)}&limit=${limit}`,
    { headers: { Accept: "application/json" }, signal },
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
    throw new Error(msg)
  }
  return Array.isArray(data) ? (data as NominatimHit[]) : []
}

async function fetchReverseGeocode(lat: number, lon: number, signal?: AbortSignal) {
  const res = await fetch(
    `/api/geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
    { headers: { Accept: "application/json" }, signal },
  )
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Reverse geocoding failed"
    throw new Error(msg)
  }
  return data as NominatimHit
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
  const [reverseGeocoding, setReverseGeocoding] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<
    Array<AddressHint & { label: string; lat: number; lon: number; hit: NominatimHit }>
  >([])
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false)
  const [activeSuggestion, setActiveSuggestion] = React.useState(-1)
  const [loadingSuggestions, setLoadingSuggestions] = React.useState(false)

  const mapRootRef = React.useRef<HTMLDivElement | null>(null)
  const searchWrapRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<L.Map | null>(null)
  const markerRef = React.useRef<L.Marker | null>(null)
  const onPositionChangeRef = React.useRef(onPositionChange)
  const onAddressHintRef = React.useRef(onAddressHint)

  React.useEffect(() => {
    onPositionChangeRef.current = onPositionChange
  }, [onPositionChange])

  React.useEffect(() => {
    onAddressHintRef.current = onAddressHint
  }, [onAddressHint])

  const lat = Number.parseFloat(latitude)
  const lng = Number.parseFloat(longitude)
  const centerLat = Number.isFinite(lat) ? lat : 25.2048
  const centerLng = Number.isFinite(lng) ? lng : 55.2708

  const applyHit = React.useCallback((hit: NominatimHit, updateQuery = true) => {
    const nLat = Number.parseFloat(hit.lat)
    const nLng = Number.parseFloat(hit.lon)
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return false

    onPositionChangeRef.current(nLat, nLng)

    const parsed = parseNominatimHit(hit)
    if (onAddressHintRef.current) {
      onAddressHintRef.current({
        addressLine: parsed.addressLine,
        fullAddress: parsed.fullAddress,
        city: parsed.city,
        state: parsed.state,
        zipCode: parsed.zipCode,
        countryCode: parsed.countryCode,
      })
    }
    if (updateQuery) {
      setQuery(parsed.label)
    }
    return true
  }, [])

  const reverseGeocodeAt = React.useCallback(
    async (nLat: number, nLng: number) => {
      setReverseGeocoding(true)
      try {
        const hit = await fetchReverseGeocode(nLat, nLng)
        applyHit(hit, true)
      } catch {
        toast.error("Could not resolve address for this location")
      } finally {
        setReverseGeocoding(false)
      }
    },
    [applyHit],
  )

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
      onPositionChangeRef.current(p.lat, p.lng)
      void reverseGeocodeAt(p.lat, p.lng)
    })

    map.on("click", (e) => {
      marker.setLatLng(e.latlng)
      onPositionChangeRef.current(e.latlng.lat, e.latlng.lng)
      void reverseGeocodeAt(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      marker.off()
      map.off()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once
  }, [])

  React.useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    marker.setLatLng([centerLat, centerLng])
    const zoom = map.getZoom()
    map.setView([centerLat, centerLng], zoom >= 3 ? zoom : 14)
  }, [centerLat, centerLng])

  React.useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    const controller = new AbortController()
    setLoadingSuggestions(true)

    const timer = window.setTimeout(async () => {
      try {
        const hits = await fetchGeocodeSearch(q, 6, controller.signal)
        const mapped = hits
          .map((hit) => {
            const nLat = Number.parseFloat(hit.lat)
            const nLng = Number.parseFloat(hit.lon)
            if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null
            const parsed = parseNominatimHit(hit)
            return { ...parsed, lat: nLat, lon: nLng, hit }
          })
          .filter(Boolean) as Array<
          AddressHint & { label: string; lat: number; lon: number; hit: NominatimHit }
        >
        setSuggestions(mapped)
        setSuggestionsOpen(mapped.length > 0)
        setActiveSuggestion(-1)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSuggestions([])
        }
      } finally {
        setLoadingSuggestions(false)
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  React.useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  function selectSuggestion(item: (typeof suggestions)[number]) {
    applyHit(item.hit, true)
    setSuggestionsOpen(false)
    setSuggestions([])
    toast.success("Location updated")
  }

  async function runSearch() {
    const q = query.trim()
    if (q.length < 2) {
      toast.error("Enter at least 2 characters to search.")
      return
    }
    setSearching(true)
    setSuggestionsOpen(false)
    try {
      const hits = await fetchGeocodeSearch(q, 1)
      if (hits.length === 0) {
        toast.message("No results found")
        return
      }
      if (!applyHit(hits[0], true)) {
        toast.error("Invalid search result")
        return
      }
      toast.success("Location updated from search")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        void runSearch()
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveSuggestion((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const pick = suggestions[activeSuggestion >= 0 ? activeSuggestion : 0]
      if (pick) selectSuggestion(pick)
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Map</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Search for a place, pick a suggestion, click the map, or drag the pin.
          Address fields fill automatically in English.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div ref={searchWrapRef} className="relative sm:flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSuggestionsOpen(true)
            }}
            onFocus={() => {
              if (suggestions.length > 0) setSuggestionsOpen(true)
            }}
            onKeyDown={onSearchKeyDown}
            placeholder="Search address or city…"
            className="border-border bg-input/50 pr-9"
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-autocomplete="list"
          />
          {(loadingSuggestions || reverseGeocoding) && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {suggestionsOpen && suggestions.length > 0 && (
            <ul
              className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
              role="listbox"
            >
              {suggestions.map((item, index) => (
                <li key={`${item.lat}-${item.lon}-${index}`} role="option">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                      index === activeSuggestion && "bg-accent",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(item)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="line-clamp-2 text-foreground">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => void runSearch()}
          disabled={searching || reverseGeocoding}
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

      <div className="overflow-hidden rounded-lg border border-border">
        <div
          ref={mapRootRef}
          className="z-0 h-[300px] w-full [&_.leaflet-control-attribution]:text-[10px]"
        />
      </div>
    </div>
  )
}
