"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TimePicker } from "@/components/ui/date-time-picker"
import { NumberInput } from "@/components/ui/number-input"
import { Label } from "@/components/ui/label"
import { VenueGalleryUpload } from "@/components/venues/VenueGalleryUpload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createAttraction,
  getManagedAttraction,
  updateAttraction,
  uploadAttractionMedia,
  type CreateAttractionPayload,
} from "@/features/attractions/api"
import {
  listAttractionCategories,
  toAttractionCategoryOption,
} from "@/features/attraction-categories/api"
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api"
import {
  findActiveCountry,
  findCatalogCity,
  findCatalogCityFromHint,
  MAP_LOCATION_TOAST_ID,
  uniqueCityTimezones,
  withSavedCityOption,
  type PendingMapCity,
} from "@/features/locations/match"
import { locationKeys } from "@/features/locations/query-keys"
import { toastApiError } from "@/lib/toasts"
import { formatTimezoneLabel } from "@/lib/timezones"
import { validateUploadFile } from "@/features/uploads/validation"
import type { AddressHint } from "@/components/maps/location-picker-map"
import { useDashboardPaths } from "@/features/dashboard/paths"
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui"
import { cn } from "@/lib/utils"
import {
  SeatingLayoutEditor,
  type SeatingEditorSection,
} from "@/components/seating/SeatingLayoutEditor"
import {
  getManagedAttractionSeating,
  putManagedAttractionSeating,
  type SeatMapFocalPoint,
} from "@/features/attraction-seating/api"

const inputClass = "bg-input/50 border-border"
const selectTriggerClass = cn(inputClass, "w-full")
const GALLERY_MIN = 3
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const LOCATION_CURRENCY_LABELS = new Set([
  "AED",
  "PKR",
  "USD",
  "EUR",
  "GBP",
  "SAR",
  "QAR",
])

function defaultBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dubai"
}

const LocationPickerMap = dynamic(
  () =>
    import("@/components/maps/location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[380px] animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50"
        aria-hidden
      />
    ),
  },
)

type TicketForm = {
  id?: string
  name: string
  price: string
  quantityPerOccurrence: string
}

function defaultTicket(ticketName: string): TicketForm {
  return { name: ticketName, price: "", quantityPerOccurrence: "" }
}

export default function AddAttractionsContentPage() {
  const t = useTranslations("adminDashboard")
  const tForms = useTranslations("forms")
  const tCommon = useTranslations("common")
  const tCurrency = useTranslations("currency")
  const tEvents = useTranslations("events")
  const paths = useDashboardPaths()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("id")
  const queryClient = useQueryClient()

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [categoryOverride, setCategoryOverride] = React.useState<string | null>(null)
  const [timezoneOverride, setTimezoneOverride] = React.useState<string | null>(null)
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
  const [coverImage, setCoverImage] = React.useState("")
  const [thumbnail, setThumbnail] = React.useState("")
  const [galleryUrls, setGalleryUrls] = React.useState<string[]>([])
  const [coverUploading, setCoverUploading] = React.useState(false)
  const [thumbnailUploading, setThumbnailUploading] = React.useState(false)
  const [galleryUploading, setGalleryUploading] = React.useState(false)
  const [venueName, setVenueName] = React.useState("")
  const [venuePhone, setVenuePhone] = React.useState("")
  const [venueWebsite, setVenueWebsite] = React.useState("https://example.com")
  const [countryCode, setCountryCode] = React.useState("AE")
  const [city, setCity] = React.useState("")
  const [pendingMapCity, setPendingMapCity] = React.useState<PendingMapCity | null>(null)
  const [state, setState] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [zipCode, setZipCode] = React.useState("")
  const [latitude, setLatitude] = React.useState("25.2048")
  const [longitude, setLongitude] = React.useState("55.2708")
  const [locationSource, setLocationSource] = React.useState<"VENUE" | "CUSTOM">("CUSTOM")

  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>([1, 2, 3, 4, 5])
  const [materializeHorizonDays, setMaterializeHorizonDays] = React.useState(60)
  const [slots, setSlots] = React.useState<
    Array<{ name: string; startTime: string; endTime: string }>
  >([])
  const [slotNameInput, setSlotNameInput] = React.useState("")
  const [slotStartTimeInput, setSlotStartTimeInput] = React.useState("10:00")
  const [slotEndTimeInput, setSlotEndTimeInput] = React.useState("11:00")

  const [tickets, setTickets] = React.useState<TicketForm[]>([
    defaultTicket(""),
  ])
  const [seatingEnabled, setSeatingEnabled] = React.useState(false)
  const [seatingSections, setSeatingSections] = React.useState<SeatingEditorSection[]>([])
  const [seatingFocal, setSeatingFocal] = React.useState<SeatMapFocalPoint | null>(null)
  const [seatingLoaded, setSeatingLoaded] = React.useState(false)

  const coverInputRef = React.useRef<HTMLInputElement>(null)
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null)
  const hydratedIdRef = React.useRef<string | null>(null)

  const { data: existing, isLoading: loadingAttraction } = useQuery({
    queryKey: ["managed-attraction", editId],
    queryFn: () => getManagedAttraction(editId!),
    enabled: Boolean(editId),
  })

  const {
    data: attractionCategories = [],
    isLoading: loadingAttractionCategories,
    isError: attractionCategoriesError,
  } = useQuery({
    queryKey: ["attraction-categories", "add-attraction-dropdown"],
    queryFn: () => listAttractionCategories({ isActive: true }),
  })

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  })

  const {
    data: cities = [],
    isSuccess: citiesReady,
    isFetching: citiesFetching,
  } = useQuery({
    queryKey: locationKeys.cities(countryCode, { activeOnly: true, featuredOnly: true }),
    queryFn: () =>
      listCitiesByCountryCode(countryCode, { activeOnly: true, featuredOnly: true }),
    enabled: !!countryCode,
  })

  const savedCategory = existing?.category?.trim() ?? ""
  const savedTimezone = existing?.timezone?.trim() ?? ""
  const savedCity = existing?.city?.trim() ?? ""
  const category = categoryOverride ?? savedCategory
  const selectedCity = findCatalogCity(cities, city)
  const timezone =
    timezoneOverride ?? savedTimezone ?? selectedCity?.timezone ?? defaultBrowserTimezone()

  const selectedCountry = React.useMemo(
    () => findActiveCountry(countries, countryCode),
    [countries, countryCode],
  )
  const locationCurrency = selectedCountry?.defaultCurrency?.trim() || ""

  const timezoneOptions = React.useMemo(
    () => uniqueCityTimezones(cities, timezone, savedTimezone),
    [cities, timezone, savedTimezone],
  )

  const cityOptions = React.useMemo(
    () =>
      withSavedCityOption(cities, city || savedCity, {
        countryId: cities[0]?.countryId,
        timezone: savedTimezone || selectedCity?.timezone,
      }),
    [cities, city, savedCity, savedTimezone, selectedCity?.timezone],
  )

  const categoryOptions = React.useMemo(() => {
    const options = attractionCategories.map(toAttractionCategoryOption)
    if (savedCategory && !options.some((c) => c.value === savedCategory)) {
      return [{ label: savedCategory, value: savedCategory }, ...options]
    }
    return options
  }, [attractionCategories, savedCategory])

  const legacyCategoryName = React.useMemo(() => {
    const cat = category.trim()
    if (!cat) return null
    if (categoryOptions.some((c) => c.value === cat)) return null
    return cat
  }, [category, categoryOptions])

  React.useEffect(() => {
    if (
      !pendingMapCity ||
      pendingMapCity.countryCode !== countryCode ||
      !citiesReady ||
      citiesFetching
    ) {
      return
    }
    const match = findCatalogCityFromHint(cities, pendingMapCity)
    if (match) {
      setCity(match.name)
      if (match.timezone) setTimezoneOverride(match.timezone)
    } else if (pendingMapCity.city || pendingMapCity.fullAddress) {
      toast.error(
        t("unsupportedCity", {
          city: pendingMapCity.city?.trim() || pendingMapCity.fullAddress || "—",
        }),
        { id: MAP_LOCATION_TOAST_ID },
      )
      setCity((current) => (findCatalogCity(cities, current) ? current : ""))
    }
    setPendingMapCity(null)
  }, [pendingMapCity, cities, citiesReady, citiesFetching, countryCode, t])

  React.useEffect(() => {
    if (!existing?.id) return
    if (hydratedIdRef.current === existing.id) return
    hydratedIdRef.current = existing.id

    setName(existing.name)
    setDescription(existing.description ?? "")
    setCategoryOverride(null)
    setTimezoneOverride(null)
    setTags(existing.tags ?? [])
    setCoverImage(existing.coverImage ?? "")
    setThumbnail(existing.thumbnail ?? "")
    setGalleryUrls(existing.gallery ?? [])
    setVenueName(existing.venueName ?? "")
    setVenuePhone(existing.venuePhone ?? "")
    setVenueWebsite(existing.venueWebsite ?? "https://example.com")
    setCountryCode(existing.countryCode)
    setCity(existing.city)
    setState(existing.state ?? "")
    setAddress(existing.address ?? "")
    setZipCode(existing.zipCode ?? "")
    setLatitude(String(existing.latitude))
    setLongitude(String(existing.longitude))
    setLocationSource(existing.locationSource)
    setDaysOfWeek(existing.daysOfWeek?.length ? existing.daysOfWeek : [1, 2, 3, 4, 5])
    setMaterializeHorizonDays(
      Math.min(365, Math.max(1, existing.materializeHorizonDays ?? 60)),
    )
    setSlots(
      existing.slots?.length
        ? existing.slots.map((s) => ({
            name: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
          }))
        : [],
    )
    setTickets(
      existing.ticketTypes.length > 0
        ? existing.ticketTypes.map((ticket) => ({
            id: ticket.id,
            name: ticket.name,
            price: String(ticket.price),
            quantityPerOccurrence: String(ticket.quantityPerOccurrence),
          }))
        : [defaultTicket(t("generalTicket"))],
    )
    setSeatingEnabled(Boolean(existing.seatingEnabled))
    setSeatingLoaded(false)
  }, [existing, t])

  React.useEffect(() => {
    if (!editId || !existing?.id || seatingLoaded) return
    let cancelled = false
    void getManagedAttractionSeating(existing.id)
      .then((layout) => {
        if (cancelled) return
        setSeatingEnabled(layout.seatingEnabled)
        setSeatingFocal(layout.focalPoint ?? null)
        setSeatingSections(
          layout.sections.map((section) => {
            const seats = section.seats ?? []
            const rowCount = seats.length
              ? Math.max(...seats.map((s) => s.rowIndex)) + 1
              : 1
            const seatsPerRow = seats.length
              ? Math.max(...seats.map((s) => s.colIndex)) + 1
              : 1
            return {
              ticketTypeId: section.ticketTypeId,
              name: section.name,
              color: section.color,
              sortOrder: section.sortOrder,
              rowCount: Math.max(1, rowCount),
              seatsPerRow: Math.max(1, seatsPerRow),
              rowLabelStart: seats[0]?.rowLabel?.[0] ?? "A",
              shape: section.shape ?? "GRID",
              posX: section.posX ?? 0,
              posY: section.posY ?? 0,
              rotation: section.rotation ?? 0,
              curve: section.curve ?? 0,
              arcRadius: section.arcRadius ?? 0,
            }
          }),
        )
        setSeatingLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setSeatingEnabled(false)
          setSeatingSections([])
          setSeatingFocal(null)
          setSeatingLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [editId, existing?.id, seatingLoaded])

  React.useEffect(() => {
    setCategoryOverride(null)
    setTimezoneOverride(null)
    hydratedIdRef.current = null
    setSeatingEnabled(false)
    setSeatingSections([])
    setSeatingFocal(null)
    setSeatingLoaded(false)
  }, [editId])

  const seatingTicketOptions = React.useMemo(
    () =>
      tickets.map((ticket, index) => ({
        id: ticket.id ?? `pending:${index}`,
        name: ticket.name.trim() || `Ticket ${index + 1}`,
      })),
    [tickets],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!locationCurrency) {
        throw new Error(
          "Selected country has no currency configured. Set a default currency in Locations first.",
        )
      }

      const contentOnlyEdit = Boolean(editId && existing?.contentOnlyEdit)
      if (contentOnlyEdit && editId) {
        const saved = await updateAttraction(editId, {
          description: description.trim() || null,
          category: category.trim() || null,
          tags,
          coverImage: coverImage.trim(),
          thumbnail: thumbnail.trim() || undefined,
          gallery: galleryUrls,
          venueName: venueName.trim() || null,
          venuePhone: venuePhone.trim() || null,
          venueWebsite: venueWebsite.trim() || null,
        })
        return { saved, seatingResult: undefined as undefined }
      }

      if (seatingEnabled) {
        if (seatingSections.length === 0) {
          throw new Error("Add at least one seating section.")
        }
        for (const section of seatingSections) {
          if (!section.name.trim()) {
            throw new Error("Each seating section needs a name.")
          }
          if (!section.ticketTypeId) {
            throw new Error("Each seating section needs a ticket type.")
          }
        }
      }

      const payload = buildPayload()
      const saved = editId
        ? await updateAttraction(editId, payload)
        : await createAttraction(payload)

      const resolvedSections = seatingSections.map((section, index) => {
        let ticketTypeId = section.ticketTypeId
        if (ticketTypeId.startsWith("pending:")) {
          const idx = Number(ticketTypeId.slice("pending:".length))
          ticketTypeId = saved.ticketTypes[idx]?.id ?? ""
        } else if (!saved.ticketTypes.some((tt) => tt.id === ticketTypeId)) {
          const ticketName =
            tickets.find((row) => row.id === section.ticketTypeId)?.name ?? ""
          const byName = saved.ticketTypes.find(
            (tt) =>
              tt.name.trim().toLowerCase() === ticketName.trim().toLowerCase(),
          )
          ticketTypeId =
            byName?.id ??
            saved.ticketTypes[index]?.id ??
            saved.ticketTypes[0]?.id ??
            ""
        }
        return {
          ...section,
          ticketTypeId,
          name: section.name.trim(),
          sortOrder: index,
        }
      })

      if (seatingEnabled && resolvedSections.some((s) => !s.ticketTypeId)) {
        throw new Error("Could not link seating sections to ticket types.")
      }

      const seatingResult = await putManagedAttractionSeating(saved.id, {
        seatingEnabled,
        sections: seatingEnabled ? resolvedSections : [],
        focalPoint: seatingEnabled ? seatingFocal : null,
      })

      return { saved, seatingResult }
    },
    onSuccess: ({ seatingResult }) => {
      queryClient.invalidateQueries({ queryKey: ["managed-attractions"] })
      const summary = seatingResult?.applySummary
      if (
        editId &&
        seatingEnabled &&
        summary &&
        (summary.updatedShows > 0 || summary.preservedShows > 0)
      ) {
        toast.success(
          t("seatingApplySummary", {
            updated: summary.updatedShows,
            preserved: summary.preservedShows,
          }),
        )
      } else {
        toast.success(editId ? t("attractionUpdated") : t("attractionCreated"))
      }
      router.push(paths.attractions)
    },
    onError: (e) => toastApiError(e, t("couldNotSaveAttraction")),
  })

  function buildPayload(): CreateAttractionPayload {
    const gallery = galleryUrls

    const seatCountByIndex = new Map<number, number>()
    if (seatingEnabled) {
      for (const section of seatingSections) {
        const seats =
          Math.max(1, section.rowCount) * Math.max(1, section.seatsPerRow)
        if (section.ticketTypeId.startsWith("pending:")) {
          const idx = Number(section.ticketTypeId.slice("pending:".length))
          seatCountByIndex.set(idx, (seatCountByIndex.get(idx) ?? 0) + seats)
        } else {
          const idx = tickets.findIndex((row) => row.id === section.ticketTypeId)
          if (idx >= 0) {
            seatCountByIndex.set(idx, (seatCountByIndex.get(idx) ?? 0) + seats)
          }
        }
      }
    }

    return {
      name: name.trim(),
      description: description.trim() || null,
      timezone: timezone.trim() || "UTC",
      category: category.trim() || null,
      tags,
      coverImage: coverImage.trim(),
      thumbnail: thumbnail.trim() || undefined,
      gallery,
      venueName: venueName.trim() || null,
      venuePhone: venuePhone.trim() || null,
      venueWebsite: venueWebsite.trim() || null,
      countryCode: countryCode.trim(),
      city: city.trim(),
      state: state.trim() || null,
      address: address.trim() || null,
      zipCode: zipCode.trim() || null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      locationSource,
      seatingEnabled,
      daysOfWeek,
      materializeHorizonDays,
      slots: slots.map((s) => ({
        name: s.name.trim(),
        startTime: s.startTime.trim(),
        endTime: s.endTime.trim(),
      })),
      ticketTypes: tickets.map((ticket, index) => {
        const seatedQty = seatCountByIndex.get(index)
        return {
          name: ticket.name.trim(),
          price: Number(ticket.price) || 0,
          currency: locationCurrency,
          quantityPerOccurrence:
            seatingEnabled && seatedQty != null && seatedQty > 0
              ? seatedQty
              : Math.max(1, Number(ticket.quantityPerOccurrence) || 1),
        }
      }),
    }
  }

  function applyMapPosition(lat: number, lng: number) {
    setLatitude(String(lat))
    setLongitude(String(lng))
  }

  function applyAddressHint(hint: AddressHint) {
    let nextCountryCode = countryCode
    let countryAccepted = true

    if (hint.countryCode) {
      const matchedCountry = findActiveCountry(countries, hint.countryCode)
      if (!matchedCountry) {
        countryAccepted = false
        toast.error(t("unsupportedCountry"), { id: MAP_LOCATION_TOAST_ID })
      } else {
        nextCountryCode = matchedCountry.code
        if (matchedCountry.code !== countryCode) {
          setCountryCode(matchedCountry.code)
          setCity("")
          setTimezoneOverride(null)
        }
      }
    }

    if (!countryAccepted) {
      setPendingMapCity(null)
    } else if (nextCountryCode === countryCode && citiesReady && !citiesFetching) {
      const match = findCatalogCityFromHint(cities, hint)
      if (match) {
        setCity(match.name)
        if (match.timezone) setTimezoneOverride(match.timezone)
        setPendingMapCity(null)
      } else if (hint.city || hint.fullAddress) {
        setCity("")
        toast.error(
          t("unsupportedCity", {
            city: hint.city?.trim() || hint.fullAddress || "—",
          }),
          { id: MAP_LOCATION_TOAST_ID },
        )
        setPendingMapCity(null)
      } else {
        setPendingMapCity(null)
      }
    } else {
      setPendingMapCity({
        countryCode: nextCountryCode,
        city: hint.city,
        fullAddress: hint.fullAddress,
        addressLine: hint.addressLine,
      })
    }

    if (hint.state) setState(hint.state)
    if (hint.zipCode) setZipCode(hint.zipCode)
    if (hint.fullAddress ?? hint.addressLine) {
      setAddress(hint.fullAddress ?? hint.addressLine ?? "")
    }
    setLocationSource("CUSTOM")
  }

  function handleCityChange(nextCity: string) {
    setCity(nextCity)
    const match = findCatalogCity(cities, nextCity)
    if (match?.timezone) setTimezoneOverride(match.timezone)
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    )
  }

  function addSlot() {
    const name = slotNameInput.trim()
    const startTime = slotStartTimeInput.trim()
    const endTime = slotEndTimeInput.trim()
    if (!name) {
      toast.error(t("slotNameRequired"))
      return
    }
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      toast.error(t("slotTimeFormatError"))
      return
    }
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em
    if (endMins <= startMins) {
      toast.error(t("slotEndAfterStartError"))
      return
    }
    if (slots.some((s) => s.startTime === startTime)) {
      toast.error(t("slotTimeDuplicateError"))
      return
    }
    const overlap = slots.find((s) => {
      const [osh, osm] = s.startTime.split(":").map(Number)
      const [oeh, oem] = s.endTime.split(":").map(Number)
      const otherStart = osh * 60 + osm
      const otherEnd = oeh * 60 + oem
      return startMins < otherEnd && endMins > otherStart
    })
    if (overlap) {
      toast.error(
        t("slotOverlapError", { nameA: name, nameB: overlap.name }),
      )
      return
    }
    setSlots((prev) =>
      [...prev, { name, startTime, endTime }].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    )
    setSlotNameInput("")
  }

  function addTagFromInput() {
    const value = tagInput.trim()
    if (!value) return
    setTags((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setTagInput("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 3) {
      toast.error(t("attractionNameMinError"))
      return
    }
    if (!category.trim()) {
      toast.error(t("selectCategoryError"))
      return
    }
    if (!findCatalogCity(cityOptions, city)) {
      toast.error(t("selectCityError"))
      return
    }
    if (!coverImage.trim()) {
      toast.error(t("uploadCoverError"))
      return
    }
    if (galleryUrls.length < GALLERY_MIN) {
      toast.error(t("galleryMinError", { min: GALLERY_MIN }))
      return
    }
    if (daysOfWeek.length === 0) {
      toast.error(t("selectDayError"))
      return
    }
    if (slots.length === 0) {
      toast.error(t("addSlotTimeError"))
      return
    }
    if (slots.some((s) => !s.name.trim() || !s.endTime)) {
      toast.error(t("slotNameRequired"))
      return
    }
    if (
      !Number.isFinite(materializeHorizonDays) ||
      materializeHorizonDays < 1 ||
      materializeHorizonDays > 365
    ) {
      toast.error(t("bookingHorizonInvalid"))
      return
    }
    if (tickets.some((ticket) => !ticket.name.trim())) {
      toast.error(t("ticketNameRequired"))
      return
    }
    if (
      editId &&
      seatingEnabled &&
      !existing?.contentOnlyEdit &&
      !confirm(t("seatingUpdateConfirmAttraction"))
    ) {
      return
    }
    saveMutation.mutate()
  }

  async function onCoverFile(f: File | null) {
    if (!f) return
    try {
      validateUploadFile(f)
      setCoverUploading(true)
      const url = await uploadAttractionMedia(f)
      setCoverImage(url)
      toast.success(t("coverUploaded"))
    } catch (err) {
      toastApiError(err, t("uploadFailed"))
    } finally {
      setCoverUploading(false)
    }
  }

  async function onThumbnailFile(f: File | null) {
    if (!f) return
    try {
      validateUploadFile(f)
      setThumbnailUploading(true)
      const url = await uploadAttractionMedia(f)
      setThumbnail(url)
      toast.success(t("thumbnailUploaded"))
    } catch (err) {
      toastApiError(err, t("thumbnailUploadFailed"))
    } finally {
      setThumbnailUploading(false)
    }
  }

  async function onGalleryFiles(files: File[]) {
    if (!files.length) return
    try {
      for (const file of files) validateUploadFile(file)
      setGalleryUploading(true)
      const results = await Promise.all(files.map((file) => uploadAttractionMedia(file)))
      setGalleryUrls((prev) => [...prev, ...results])
      toast.success(
        files.length === 1
          ? t("galleryUploaded")
          : t("galleryUploadedMany", { count: files.length }),
      )
    } catch (err) {
      toastApiError(err, t("galleryUploadFailed"))
    } finally {
      setGalleryUploading(false)
    }
  }

  function removeGalleryAt(index: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index))
  }

  if (editId && (loadingAttraction || loadingAttractionCategories || !existing)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const formActions = (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => router.push(paths.attractions)}
      >
        {tCommon("cancel")}
      </Button>
      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("saving")}
          </>
        ) : editId ? (
          t("updateAttraction")
        ) : (
          t("createAttractionBtn")
        )}
      </Button>
    </div>
  )

  return (
    <DashboardPageShell>
      <div className="w-full min-w-0 space-y-6">
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white">
                {editId ? t("editAttractionTitle") : t("createAttractionTitle")}
              </h1>
              {editId && existing?.contentOnlyEdit ? (
                <p className="max-w-2xl text-sm text-amber-500/90">
                  {t("contentOnlyEditBanner")}
                </p>
              ) : null}
            </div>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("basics")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="attraction-name">{tCommon("name")}</Label>
                <Input
                  id="attraction-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  disabled={Boolean(editId && existing?.contentOnlyEdit)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="attraction-description">{tCommon("description")}</Label>
                <Textarea
                  id="attraction-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(inputClass, "min-h-24")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("categoryLabel").replace(":", "")}</Label>
                <Select
                  key={`category-${editId ?? "new"}-${category}`}
                  value={category || undefined}
                  onValueChange={setCategoryOverride}
                  disabled={
                    loadingAttractionCategories ||
                    (attractionCategories.length === 0 && !category)
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue
                      placeholder={
                        loadingAttractionCategories
                          ? t("loadingCategories")
                          : attractionCategoriesError
                            ? t("couldNotLoadCategories")
                            : attractionCategories.length === 0 && !legacyCategoryName
                              ? t("noActiveCategories")
                              : tForms("selectCategory")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {legacyCategoryName ? (
                      <SelectItem value={legacyCategoryName}>
                        {legacyCategoryName}{" "}
                        <span className="text-muted-foreground">{t("currentValue")}</span>
                      </SelectItem>
                    ) : null}
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {attractionCategoriesError ? (
                  <p className="text-xs text-destructive">
                    {t("refreshConnectionHint")}
                  </p>
                ) : null}
                {!attractionCategoriesError &&
                !loadingAttractionCategories &&
                attractionCategories.length === 0 &&
                !legacyCategoryName ? (
                  <p className="text-xs text-muted-foreground">
                    {t("noCategoriesContactAdmin")}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{tForms("coverImage")}</Label>
                <p className="text-xs text-muted-foreground">{t("coverRequired")}</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {coverImage ? (
                    <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={tForms("coverImage")}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-48 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      className="hidden"
                      onChange={(e) => {
                        void onCoverFile(e.target.files?.[0] ?? null)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={coverUploading}
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {coverUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tCommon("uploading")}
                        </>
                      ) : (
                        <>
                          <ImagePlus className="mr-2 h-4 w-4" />
                          {tForms("uploadCover")}
                        </>
                      )}
                    </Button>
                    {coverImage ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setCoverImage("")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tForms("removeCover")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{tForms("thumbnail")}</Label>
                <p className="text-xs text-muted-foreground">{t("thumbnailOptionalAttraction")}</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {thumbnail ? (
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnail}
                        alt={tForms("thumbnail")}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/*"
                      className="hidden"
                      onChange={(e) => {
                        void onThumbnailFile(e.target.files?.[0] ?? null)
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={thumbnailUploading}
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      {thumbnailUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tCommon("uploading")}
                        </>
                      ) : (
                        <>
                          <ImagePlus className="mr-2 h-4 w-4" />
                          {tForms("uploadThumbnail")}
                        </>
                      )}
                    </Button>
                    {thumbnail ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setThumbnail("")}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {tForms("removeThumbnail")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <VenueGalleryUpload
                urls={galleryUrls}
                uploading={galleryUploading}
                onUpload={onGalleryFiles}
                onRemove={removeGalleryAt}
                inputId="attraction-gallery-upload"
                hint={t("galleryRequiredAttraction", { min: GALLERY_MIN })}
              />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{tForms("tags")}</CardTitle>
              <CardDescription>{t("tagsHint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTagFromInput()
                    }
                  }}
                  placeholder={t("typeTag")}
                  className={cn(inputClass, "sm:flex-1")}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addTagFromInput}
                  disabled={!tagInput.trim()}
                  className="sm:w-auto"
                >
                  {tCommon("add")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-border bg-muted/20 px-2.5 py-0.5 text-xs text-foreground"
                    onClick={() => setTags((p) => p.filter((item) => item !== tag))}
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{tEvents("venue")}</CardTitle>
              <CardDescription>{t("attractionVenueDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="venue-name">{tForms("venueName")}</Label>
                <Input
                  id="venue-name"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-phone">{t("venuePhoneLabel").replace(":", "")}</Label>
                <Input
                  id="venue-phone"
                  value={venuePhone}
                  onChange={(e) => setVenuePhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue-website">{tForms("website")}</Label>
                <Input
                  id="venue-website"
                  type="url"
                  value={venueWebsite}
                  onChange={(e) => setVenueWebsite(e.target.value)}
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{tForms("location")}</CardTitle>
              <CardDescription>{t("attractionVenueDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <LocationPickerMap
                  latitude={latitude}
                  longitude={longitude}
                  onPositionChange={applyMapPosition}
                  onAddressHint={applyAddressHint}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country-code">{t("countryCode")}</Label>
                <Select
                  value={countryCode}
                  onValueChange={(nextCountryCode) => {
                    setCountryCode(nextCountryCode)
                    setCity("")
                    setTimezoneOverride(null)
                    setPendingMapCity(null)
                  }}
                >
                  <SelectTrigger id="country-code" className={selectTriggerClass}>
                    <SelectValue placeholder={tForms("country")} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-currency">{tCurrency("currency")}</Label>
                <Input
                  id="attraction-currency"
                  value={
                    locationCurrency
                      ? `${locationCurrency} — ${
                          LOCATION_CURRENCY_LABELS.has(locationCurrency)
                            ? tCurrency(
                                locationCurrency as
                                  | "AED"
                                  | "PKR"
                                  | "USD"
                                  | "EUR"
                                  | "GBP"
                                  | "SAR"
                                  | "QAR",
                              )
                            : locationCurrency
                        }`
                      : ""
                  }
                  disabled
                  readOnly
                  placeholder={
                    countryCode
                      ? t("countryCurrencyMissing")
                      : t("selectCountryForCurrency")
                  }
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground">
                  {t("countryCurrencyHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-city">{tForms("city")}</Label>
                <Select
                  value={city}
                  onValueChange={handleCityChange}
                  disabled={!countryCode}
                >
                  <SelectTrigger id="attraction-city" className={selectTriggerClass}>
                    <SelectValue placeholder={tForms("city")} />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="attraction-timezone">{tForms("timezone")}</Label>
                <Select
                  key={`timezone-${editId ?? "new"}-${timezone}`}
                  value={timezone}
                  onValueChange={setTimezoneOverride}
                  disabled={timezoneOptions.length === 0}
                >
                  <SelectTrigger id="attraction-timezone" className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {formatTimezoneLabel(tz)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {timezone ? (
                  <p className="text-xs text-muted-foreground">
                    {t("attractionTimezoneHint", { timezone })}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-state">{t("stateRegion")}</Label>
                <Input
                  id="attraction-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-zip">{t("zipPostal")}</Label>
                <Input
                  id="attraction-zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="attraction-address">{tForms("address")}</Label>
                <Input
                  id="attraction-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-latitude">{t("latitude")}</Label>
                <Input
                  id="attraction-latitude"
                  required
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attraction-longitude">{t("longitude")}</Label>
                <Input
                  id="attraction-longitude"
                  required
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("scheduleTitle")}</CardTitle>
              <CardDescription>{t("scheduleDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="booking-horizon-days">{t("bookingHorizonLabel")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("bookingHorizonHint")}
                </p>
                <NumberInput
                  id="booking-horizon-days"
                  integer
                  min={1}
                  max={365}
                  value={materializeHorizonDays}
                  onValueChange={(v) =>
                    setMaterializeHorizonDays(v ?? 60)
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("daysOfWeek")}</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, day) => {
                    const active = daysOfWeek.includes(day)
                    return (
                      <Button
                        key={label}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={cn(
                          "min-w-11",
                          !active && "border-border bg-input/50",
                        )}
                        onClick={() => toggleDay(day)}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("namedSlots")}</Label>
                <div className="space-y-2">
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("namedSlotsEmpty")}
                    </p>
                  ) : (
                    slots.map((slot) => (
                      <div
                        key={`${slot.startTime}-${slot.name}`}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 text-sm font-medium">
                          {slot.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setSlots((prev) =>
                              prev.filter((s) => s.startTime !== slot.startTime),
                            )
                          }
                        >
                          ×
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                  <Input
                    value={slotNameInput}
                    onChange={(e) => setSlotNameInput(e.target.value)}
                    placeholder={t("slotNamePlaceholder")}
                    className={inputClass}
                  />
                  <TimePicker
                    value={slotStartTimeInput}
                    onChange={setSlotStartTimeInput}
                    className="w-full sm:w-32"
                    triggerClassName={inputClass}
                  />
                  <TimePicker
                    value={slotEndTimeInput}
                    onChange={setSlotEndTimeInput}
                    className="w-full sm:w-32"
                    triggerClassName={inputClass}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addSlot}
                    disabled={
                      !slotNameInput.trim() ||
                      !slotStartTimeInput ||
                      !slotEndTimeInput
                    }
                  >
                    {tCommon("add")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle>{t("ticketTypes")}</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setTickets((rows) => [...rows, defaultTicket(t("generalTicket"))])
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("addType")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tickets.map((ticket, i) => (
                <div
                  key={i}
                  className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2"
                >
                  <div className="flex items-center justify-between sm:col-span-2">
                    <span className="text-sm font-medium text-foreground">
                      {t("ticketN", { n: i + 1 })}
                    </span>
                    {tickets.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setTickets((rows) => rows.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label>{tCommon("name")}</Label>
                    <Input
                      required
                      value={ticket.name}
                      onChange={(e) =>
                        setTickets((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, name: e.target.value } : r,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{tCommon("price")}</Label>
                    <Input
                      required
                      type="number"
                      min={0}
                      step="0.01"
                      value={ticket.price}
                      onChange={(e) =>
                        setTickets((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, price: e.target.value } : r,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                    {locationCurrency ? (
                      <p className="text-xs text-muted-foreground">
                        {tCurrency("chargeCurrency", {
                          currency: locationCurrency,
                        })}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("quantityPerOccurrence")}</Label>
                    <Input
                      required={!seatingEnabled}
                      type="number"
                      min={1}
                      disabled={seatingEnabled}
                      value={
                        seatingEnabled
                          ? String(
                              seatingSections
                                .filter((s) => {
                                  const key = tickets[i]?.id ?? `pending:${i}`
                                  return s.ticketTypeId === key
                                })
                                .reduce(
                                  (sum, s) =>
                                    sum +
                                    Math.max(1, s.rowCount) *
                                      Math.max(1, s.seatsPerRow),
                                  0,
                                ) || Number(ticket.quantityPerOccurrence) || 0,
                            )
                          : ticket.quantityPerOccurrence
                      }
                      onChange={(e) =>
                        setTickets((rows) =>
                          rows.map((r, j) =>
                            j === i
                              ? { ...r, quantityPerOccurrence: e.target.value }
                              : r,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                    {seatingEnabled ? (
                      <p className="text-xs text-muted-foreground">
                        {t("quantityFromSeating")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("seatingTitle")}</CardTitle>
              <CardDescription>{t("seatingDescAttraction")}</CardDescription>
              {editId ? (
                <p className="text-xs text-muted-foreground pt-1">
                  {t("seatingUpdatePolicyAttraction")}
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <SeatingLayoutEditor
                enabled={seatingEnabled}
                onEnabledChange={setSeatingEnabled}
                sections={seatingSections}
                onSectionsChange={setSeatingSections}
                focalPoint={seatingFocal}
                onFocalPointChange={setSeatingFocal}
                ticketOptions={seatingTicketOptions}
                disabled={
                  saveMutation.isPending ||
                  Boolean(editId && existing?.contentOnlyEdit)
                }
              />
            </CardContent>
            <CardFooter className="border-t justify-end">
              {formActions}
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardPageShell>
  )
}
