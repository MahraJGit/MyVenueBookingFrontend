"use client"

import * as React from "react"
import L from "leaflet"
import { Loader2, MapPin, Search } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  suggestionToAddressHint,
  type AddressHint,
  type GeocodeSuggestion,
} from "@/lib/geocode"

import "leaflet/dist/leaflet.css"

export type { AddressHint }

const LEAFLET_ICON_VERSION = "1.9.4"
const AUTOCOMPLETE_DEBOUNCE_MS = 280
const SUGGESTION_LIMIT = 8

if (typeof window !== "undefined") {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
  delete proto._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon-2x.png`,
    iconUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-icon.png`,
    shadowUrl: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_ICON_VERSION}/images/marker-shadow.png`,
  })
}

async function fetchGeocodeSearch(
  q: string,
  bias: { lat: number; lon: number } | undefined,
  limit = SUGGESTION_LIMIT,
  signal?: AbortSignal,
  searchFailedLabel = "Search failed",
) {
  const params = new URLSearchParams({ q, limit: String(limit) })
  if (bias) {
    params.set("biasLat", String(bias.lat))
    params.set("biasLon", String(bias.lon))
  }

  const res = await fetch(`/api/geocode?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : searchFailedLabel
    throw new Error(msg)
  }
  return Array.isArray(data) ? (data as GeocodeSuggestion[]) : []
}

async function fetchPlaceDetails(
  placeId: string,
  signal?: AbortSignal,
  couldNotLoadLabel = "Could not load place details",
) {
  const res = await fetch(`/api/geocode?placeId=${encodeURIComponent(placeId)}`, {
    headers: { Accept: "application/json" },
    signal,
  })
  const data: unknown = await res.json()
  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : couldNotLoadLabel
    throw new Error(msg)
  }
  return data as GeocodeSuggestion
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
  const t = useTranslations("locationPicker")
  const tCommon = useTranslations("common")
  const [query, setQuery] = React.useState("")
  const [searching, setSearching] = React.useState(false)
  const [resolvingPlace, setResolvingPlace] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<GeocodeSuggestion[]>([])
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
  const searchBias = React.useMemo(
    () => ({ lat: centerLat, lon: centerLng }),
    [centerLat, centerLng],
  )

  const applySuggestion = React.useCallback(
    (item: GeocodeSuggestion, updateQuery = true, fillAddressFields = false) => {
      if (item.lat == null || item.lon == null) return false

      onPositionChangeRef.current(item.lat, item.lon)

      const parsed = suggestionToAddressHint(item)
      if (fillAddressFields && onAddressHintRef.current) {
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
    },
    [],
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
    })

    map.on("click", (e) => {
      marker.setLatLng(e.latlng)
      onPositionChangeRef.current(e.latlng.lat, e.latlng.lng)
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
        const hits = await fetchGeocodeSearch(
          q,
          searchBias,
          SUGGESTION_LIMIT,
          controller.signal,
          t("searchFailed"),
        )
        setSuggestions(hits)
        setSuggestionsOpen(hits.length > 0)
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
  }, [query, searchBias, t])

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

  async function resolveAndApply(item: GeocodeSuggestion) {
    let resolved = item

    if ((item.lat == null || item.lon == null) && item.placeId) {
      setResolvingPlace(true)
      try {
        resolved = await fetchPlaceDetails(item.placeId, undefined, t("couldNotLoadPlaceDetails"))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("couldNotLoadPlace"))
        return
      } finally {
        setResolvingPlace(false)
      }
    }

    if (!applySuggestion(resolved, true, !!onAddressHintRef.current)) {
      toast.error(t("invalidResult"))
      return
    }

    setSuggestionsOpen(false)
    setSuggestions([])
    toast.success(t("locationUpdated"))
  }

  async function selectSuggestion(item: GeocodeSuggestion) {
    await resolveAndApply(item)
  }

  async function runSearch() {
    const q = query.trim()
    if (q.length < 2) {
      toast.error(t("minChars"))
      return
    }
    setSearching(true)
    setSuggestionsOpen(false)
    try {
      const hits = await fetchGeocodeSearch(q, searchBias, 1, undefined, t("searchFailed"))
      if (hits.length === 0) {
        toast.message(tCommon("noResults"))
        return
      }
      await resolveAndApply(hits[0])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("searchFailed"))
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
      if (pick) void selectSuggestion(pick)
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false)
    }
  }

  const searchBusy = searching || resolvingPlace

  return (
    <div className="space-y-3">
      <div>
        <Label>{t("map")}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
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
            placeholder={t("searchPlaceholder")}
            className="border-border bg-input/50 pr-9"
            autoComplete="off"
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-autocomplete="list"
          />
          {(loadingSuggestions || resolvingPlace) && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}

          {suggestionsOpen && suggestions.length > 0 && (
            <ul
              className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
              role="listbox"
            >
              {suggestions.map((item, index) => (
                <li key={item.id} role="option" aria-selected={index === activeSuggestion}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-accent",
                      index === activeSuggestion && "bg-accent",
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void selectSuggestion(item)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.primary}
                      </span>
                      {item.secondary ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.secondary}
                        </span>
                      ) : null}
                    </span>
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
          disabled={searchBusy}
        >
          {searchBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {tCommon("search")}
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
