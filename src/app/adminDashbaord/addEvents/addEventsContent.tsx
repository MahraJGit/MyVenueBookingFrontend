"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { NumberInput } from "@/components/ui/number-input"
import { VenueGalleryUpload } from "@/components/venues/VenueGalleryUpload"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
    createEvent,
    getManagedEvent,
    updateEvent,
    uploadEventMedia,
    type CreateEventPayload,
} from "@/features/events/api"
import {
    listEventCategories,
    toEventCategoryOption,
} from "@/features/event-categories/api"
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api"
import {
    findActiveCountry,
    findCatalogCity,
    findCatalogCityFromHint,
    MAP_LOCATION_TOAST_ID,
    resolveCitySelectValue,
    uniqueCityTimezones,
    withSavedCityOption,
    withSavedCountryOption,
    type PendingMapCity,
} from "@/features/locations/match"
import { locationKeys } from "@/features/locations/query-keys"
import {
    datetimeLocalValueToUtcIso,
    utcIsoToDatetimeLocalValue,
} from "@/features/venues/timezone"
import { toastApiError } from "@/lib/toasts"
import { formatTimezoneLabel } from "@/lib/timezones"
import { validateUploadFile } from "@/features/uploads/validation"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { AddressHint } from "@/components/maps/location-picker-map"
import { useDashboardPaths } from "@/features/dashboard/paths"
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui"
import { cn } from "@/lib/utils"
import { SeatingLayoutEditor, type SeatingEditorSection } from "@/components/seating/SeatingLayoutEditor"
import {
    getManagedSeating,
    putManagedSeating,
    type SeatMapFocalPoint,
} from "@/features/seating/api"
import { SignupPhoneField } from "@/components/signup-phone-field"
import { isE164Valid, toPhoneInputValue } from "@/lib/phone"
import type { Value as PhoneValue } from "react-phone-number-input"
import type { CountryCode } from "libphonenumber-js"

const inputClass = "bg-input/50 border-border"
const selectTriggerClass = cn(inputClass, "w-full")
const EVENT_GALLERY_MIN_IMAGES = 3
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
        import("@/components/maps/location-picker-map").then(
            (m) => m.LocationPickerMap,
        ),
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
    quantityTotal: string
    salesStart: string
    salesEnd: string
}

type TicketTimeError = {
    salesStart?: string
    salesEnd?: string
}

type TimingValidationResult = {
    eventStartError: string | null
    eventEndError: string | null
    ticketTimeErrors: TicketTimeError[]
    isValid: boolean
}

const defaultTicket = (ticketName: string): TicketForm => ({
    name: "",
    price: "",
    quantityTotal: "",
    salesStart: "",
    salesEnd: "",
})

function toDatetimeLocalValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultSchedule() {
    const start = new Date()
    start.setDate(start.getDate() + 1)
    start.setHours(18, 0, 0, 0)
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
    return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) }
}

function getCalendarDateKeyInTimezone(date: Date, timeZone: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

function addCalendarDaysToDateKey(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split("-").map(Number)
    const utc = new Date(Date.UTC(year, month - 1, day))
    utc.setUTCDate(utc.getUTCDate() + days)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`
}

/** Interpret a datetime-local wall clock in the given IANA timezone as a UTC Date. */
function parseDatetimeLocalInTimezone(value: string, timeZone: string): Date | null {
    if (!value.trim()) return null
    try {
        const iso = datetimeLocalValueToUtcIso(value, timeZone)
        const d = new Date(iso)
        return Number.isNaN(d.getTime()) ? null : d
    } catch {
        return null
    }
}

function validateEventAndTicketTiming(
    startLocal: string,
    endLocal: string,
    tickets: TicketForm[],
    timeZone: string,
    isEditMode = false,
): TimingValidationResult {
    const tz = timeZone.trim() || "UTC"
    const start = parseDatetimeLocalInTimezone(startLocal, tz)
    const end = parseDatetimeLocalInTimezone(endLocal, tz)
    const todayKey = getCalendarDateKeyInTimezone(new Date(), tz)
    let eventStartError: string | null = null
    let eventEndError: string | null = null

    if (!start || !end) {
        if (!start) eventStartError = "Please select a valid start date/time."
        if (!end) eventEndError = "Please select a valid end date/time."
    } else {
        const startKey = getCalendarDateKeyInTimezone(start, tz)
        const minStartKey = addCalendarDaysToDateKey(todayKey, 3)
        if (!isEditMode && startKey < minStartKey) {
            eventStartError = "Event must start at least 3 days after today."
        } else if (end <= start) {
            eventEndError = "End date must be after start date."
        }
    }

    const ticketTimeErrors: TicketTimeError[] = tickets.map(() => ({}))
    if (start) {
        tickets.forEach((ticket, index) => {
            const salesStart = parseDatetimeLocalInTimezone(ticket.salesStart, tz)
            const salesEnd = parseDatetimeLocalInTimezone(ticket.salesEnd, tz)

            if (salesStart) {
                if (!isEditMode && salesStart < new Date()) {
                    ticketTimeErrors[index].salesStart =
                        "Sales start cannot be before now."
                } else if (salesStart >= start) {
                    ticketTimeErrors[index].salesStart =
                        "Sales start must be before the event start."
                }
            }
            if (salesEnd) {
                const salesEndKey = getCalendarDateKeyInTimezone(salesEnd, tz)
                if (!isEditMode && salesEndKey < todayKey) {
                    ticketTimeErrors[index].salesEnd =
                        "Sales end cannot be before today."
                } else if (salesEnd >= start) {
                    ticketTimeErrors[index].salesEnd =
                        "Sales end must be before the event start."
                }
            }
            if (
                salesStart &&
                salesEnd &&
                !ticketTimeErrors[index].salesStart &&
                !ticketTimeErrors[index].salesEnd &&
                salesEnd <= salesStart
            ) {
                ticketTimeErrors[index].salesEnd =
                    "Sales end must be after sales start."
            }
        })
    }

    return {
        eventStartError,
        eventEndError,
        ticketTimeErrors,
        isValid:
            !eventStartError &&
            !eventEndError &&
            ticketTimeErrors.every((err) => !err.salesStart && !err.salesEnd),
    }
}

export default function AddEventsContentPage() {
    const t = useTranslations("adminDashboard")
    const tCommon = useTranslations("common")
    const tForms = useTranslations("forms")
    const tCurrency = useTranslations("currency")
    const tEvents = useTranslations("events")
    const tValidation = useTranslations("validation")
    const router = useRouter()
    const searchParams = useSearchParams()
    const paths = useDashboardPaths()
    const editId = searchParams.get("id")
    const queryClient = useQueryClient()

    const formatPickerLabel = React.useCallback(
        (date: Date) => date.toLocaleString(),
        [],
    )

    const [eventName, setEventName] = React.useState("")
    const [eventDescription, setEventDescription] = React.useState("")
    const [categoryOverride, setCategoryOverride] = React.useState<string | null>(null)
    const [timezoneOverride, setTimezoneOverride] = React.useState<string | null>(null)
    const [tags, setTags] = React.useState<string[]>([])
    const [tagInput, setTagInput] = React.useState("")
    const [coverImage, setCoverImage] = React.useState("")
    const [thumbnail, setThumbnail] = React.useState("")
    /** Populated only via S3 uploads (stored URLs sent to API). */
    const [galleryUrls, setGalleryUrls] = React.useState<string[]>([])
    const [coverUploading, setCoverUploading] = React.useState(false)
    const [thumbnailUploading, setThumbnailUploading] = React.useState(false)
    const [galleryUploading, setGalleryUploading] = React.useState(false)
    const [venueName, setVenueName] = React.useState("")
    const [venuePhone, setVenuePhone] = React.useState<PhoneValue | undefined>(undefined)
    const [venueWebsite, setVenueWebsite] = React.useState("https://example.com")
    const [countryCode, setCountryCode] = React.useState("AE")
    const [city, setCity] = React.useState("")
    const [pendingMapCity, setPendingMapCity] = React.useState<PendingMapCity | null>(null)
    const [state, setState] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [zipCode, setZipCode] = React.useState("")
    const [latitude, setLatitude] = React.useState("25.2048")
    const [longitude, setLongitude] = React.useState("55.2708")
    const [locationSource, setLocationSource] = React.useState<"VENUE" | "CUSTOM">(
        "CUSTOM",
    )
    const [startLocal, setStartLocal] = React.useState(() => defaultSchedule().start)
    const [endLocal, setEndLocal] = React.useState(() => defaultSchedule().end)
    const [entryOpenMinutesBefore, setEntryOpenMinutesBefore] = React.useState(60)
    const [tickets, setTickets] = React.useState<TicketForm[]>([defaultTicket(t("generalTicket"))])
    const [seatingEnabled, setSeatingEnabled] = React.useState(false)
    const [seatingSections, setSeatingSections] = React.useState<SeatingEditorSection[]>([])
    const [seatingFocal, setSeatingFocal] = React.useState<SeatMapFocalPoint | null>(null)
    const [seatingLoaded, setSeatingLoaded] = React.useState(false)

    const coverInputRef = React.useRef<HTMLInputElement>(null)
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null)
    const hydratedEventIdRef = React.useRef<string | null>(null)
    const [hasHydratedEdit, setHasHydratedEdit] = React.useState(!editId)

    const { data: existing, isLoading: loadingEvent } = useQuery({
        queryKey: ["managed-event", editId],
        queryFn: () => getManagedEvent(editId!),
        enabled: Boolean(editId),
    })

    const {
        data: eventCategories = [],
        isLoading: loadingEventCategories,
        isError: eventCategoriesError,
    } = useQuery({
        queryKey: ["event-categories", "add-event-dropdown"],
        queryFn: () => listEventCategories({ isActive: true }),
    })

    const { data: countries = [], isLoading: loadingCountries, isSuccess: countriesReady } = useQuery({
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
        timezoneOverride ??
        savedTimezone ??
        selectedCity?.timezone ??
        defaultBrowserTimezone()

    const selectedCountry = React.useMemo(
        () => findActiveCountry(countries, countryCode),
        [countries, countryCode],
    )
    const locationCurrency = selectedCountry?.defaultCurrency?.trim() || ""

    const timezoneOptions = React.useMemo(
        () => uniqueCityTimezones(cities, timezone, savedTimezone),
        [cities, timezone, savedTimezone],
    )

    const countryOptions = React.useMemo(
        () => withSavedCountryOption(countries, countryCode || existing?.countryCode),
        [countries, countryCode, existing?.countryCode],
    )

    const cityOptions = React.useMemo(
        () =>
            withSavedCityOption(cities, city || savedCity, {
                countryId: cities[0]?.countryId,
                timezone: savedTimezone || selectedCity?.timezone,
            }),
        [cities, city, savedCity, savedTimezone, selectedCity?.timezone],
    )

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

    const categoryOptions = React.useMemo(() => {
        const options = eventCategories.map(toEventCategoryOption)
        if (savedCategory && !options.some((c) => c.value === savedCategory)) {
            return [{ label: savedCategory, value: savedCategory }, ...options]
        }
        return options
    }, [eventCategories, savedCategory])

    const legacyCategoryName = React.useMemo(() => {
        const cat = category.trim()
        if (!cat) return null
        if (categoryOptions.some((c) => c.value === cat)) return null
        return cat
    }, [category, categoryOptions])

    const categorySelectOptions = React.useMemo(() => {
        if (!legacyCategoryName) return categoryOptions
        return [
            {
                value: legacyCategoryName,
                label: `${legacyCategoryName} ${t("currentValue")}`,
            },
            ...categoryOptions,
        ]
    }, [categoryOptions, legacyCategoryName, t])

    const timingValidation = React.useMemo(
        () =>
            validateEventAndTicketTiming(
                startLocal,
                endLocal,
                tickets,
                timezone,
                Boolean(editId),
            ),
        [startLocal, endLocal, tickets, timezone, editId],
    )

    React.useEffect(() => {
        if (!existing?.id) return
        if (hydratedEventIdRef.current === existing.id) return
        hydratedEventIdRef.current = existing.id

        setEventName(existing.eventName)
        setEventDescription(existing.eventDescription ?? "")
        setCategoryOverride(null)
        setTimezoneOverride(null)
        setTags(existing.tags ?? [])
        setCoverImage(existing.coverImage ?? "")
        setThumbnail(existing.thumbnail ?? "")
        setGalleryUrls(existing.gallery ?? [])
        setVenueName(existing.venueName ?? "")
        setVenuePhone(toPhoneInputValue(existing.venuePhone))
        setVenueWebsite(existing.venueWebsite ?? "https://example.com")
        setCountryCode(existing.countryCode?.trim().toUpperCase() || "AE")
        setCity(existing.city?.trim() ?? "")
        setState(existing.state ?? "")
        setAddress(existing.address ?? "")
        setZipCode(existing.zipCode ?? "")
        setLatitude(String(existing.latitude))
        setLongitude(String(existing.longitude))
        setLocationSource(existing.locationSource)
        setPendingMapCity(null)

        const eventTz = existing.timezone?.trim() || "UTC"
        const toLocal = (iso: string) => utcIsoToDatetimeLocalValue(iso, eventTz)
        setStartLocal(toLocal(existing.startDateTime))
        setEndLocal(toLocal(existing.endDateTime))
        setEntryOpenMinutesBefore(
            Math.min(1440, Math.max(0, existing.entryOpenMinutesBefore ?? 60)),
        )

        setTickets(
            existing.ticketTypes.length > 0
                ? existing.ticketTypes.map((ticket) => ({
                    id: ticket.id,
                    name: ticket.name,
                    price: String(ticket.price),
                    quantityTotal: String(ticket.quantityTotal),
                    salesStart: ticket.salesStart
                        ? toLocal(typeof ticket.salesStart === "string" ? ticket.salesStart : String(ticket.salesStart))
                        : "",
                    salesEnd: ticket.salesEnd
                        ? toLocal(typeof ticket.salesEnd === "string" ? ticket.salesEnd : String(ticket.salesEnd))
                        : "",
                }))
                : [defaultTicket(t("generalTicket"))],
        )
        setSeatingLoaded(false)
        setHasHydratedEdit(true)
    }, [existing, t])

    React.useEffect(() => {
        if (!editId || !city.trim() || !citiesReady || citiesFetching) return
        const resolved = resolveCitySelectValue(cityOptions, city)
        if (resolved && resolved !== city) {
            setCity(resolved)
        }
    }, [editId, city, cityOptions, citiesReady, citiesFetching])

    React.useEffect(() => {
        if (!editId || !existing?.id || seatingLoaded) return
        let cancelled = false
        void getManagedSeating(existing.id)
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
        hydratedEventIdRef.current = null
        setHasHydratedEdit(!editId)
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
                return updateEvent(editId, {
                    eventDescription: eventDescription.trim(),
                    category: category.trim(),
                    tags,
                    coverImage: coverImage.trim(),
                    thumbnail: thumbnail.trim() || undefined,
                    gallery: galleryUrls,
                    venueName: venueName.trim(),
                    venuePhone: venuePhone?.trim() ?? "",
                    venueWebsite: venueWebsite.trim(),
                    entryOpenMinutesBefore,
                })
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
                ? await updateEvent(editId, payload)
                : await createEvent(payload as CreateEventPayload)

            const resolvedSections = seatingSections.map((section, index) => {
                let ticketTypeId = section.ticketTypeId
                if (ticketTypeId.startsWith("pending:")) {
                    const idx = Number(ticketTypeId.slice("pending:".length))
                    ticketTypeId = saved.ticketTypes[idx]?.id ?? ""
                } else if (!saved.ticketTypes.some((tt) => tt.id === ticketTypeId)) {
                    const ticketName =
                        tickets.find((t) => t.id === section.ticketTypeId)?.name ?? ""
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

            await putManagedSeating(saved.id, {
                seatingEnabled,
                sections: seatingEnabled ? resolvedSections : [],
                focalPoint: seatingEnabled ? seatingFocal : null,
            })

            return saved
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["managed-events"] })
            toast.success(editId ? t("eventUpdated") : t("eventCreated"))
            router.replace(paths.events)
        },
        onError: (e) => toastApiError(e, t("couldNotSaveEvent")),
    })

    function buildPayload(): CreateEventPayload | Partial<CreateEventPayload> {
        const gallery = galleryUrls
        const eventTz = timezone.trim() || "UTC"

        const seatCountByIndex = new Map<number, number>()
        if (seatingEnabled) {
            for (const section of seatingSections) {
                const seats =
                    Math.max(1, section.rowCount) * Math.max(1, section.seatsPerRow)
                if (section.ticketTypeId.startsWith("pending:")) {
                    const idx = Number(section.ticketTypeId.slice("pending:".length))
                    seatCountByIndex.set(idx, (seatCountByIndex.get(idx) ?? 0) + seats)
                } else {
                    const idx = tickets.findIndex((t) => t.id === section.ticketTypeId)
                    if (idx >= 0) {
                        seatCountByIndex.set(idx, (seatCountByIndex.get(idx) ?? 0) + seats)
                    }
                }
            }
        }

        const ticketPayload = tickets.map((ticket, index) => {
            const seatedQty = seatCountByIndex.get(index)
            const row: CreateEventPayload["ticketTypes"][0] = {
                name: ticket.name.trim(),
                price: Number(ticket.price),
                currency: locationCurrency,
                quantityTotal:
                    seatingEnabled && seatedQty != null && seatedQty > 0
                        ? seatedQty
                        : Math.max(1, Number(ticket.quantityTotal) || 1),
            }
            if (ticket.salesStart) {
                row.salesStart = datetimeLocalValueToUtcIso(ticket.salesStart, eventTz)
            }
            if (ticket.salesEnd) {
                row.salesEnd = datetimeLocalValueToUtcIso(ticket.salesEnd, eventTz)
            }
            return row
        })

        const base = {
            eventName: eventName.trim(),
            eventDescription: eventDescription.trim(),
            startDateTime: datetimeLocalValueToUtcIso(startLocal, eventTz),
            endDateTime: datetimeLocalValueToUtcIso(endLocal, eventTz),
            timezone: eventTz,
            category: category.trim(),
            tags,
            coverImage: coverImage.trim(),
            thumbnail: thumbnail.trim() || undefined,
            gallery,
            venueName: venueName.trim(),
            venuePhone: venuePhone?.trim() ?? "",
            venueWebsite: venueWebsite.trim(),
            countryCode: countryCode.trim(),
            city: city.trim(),
            state: state.trim(),
            address: address.trim(),
            zipCode: zipCode.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            locationSource,
            entryOpenMinutesBefore,
            ticketTypes: ticketPayload,
        }

        return base as CreateEventPayload
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
        } else if (
            nextCountryCode === countryCode &&
            citiesReady &&
            !citiesFetching
        ) {
            // Same country and cities already loaded — apply immediately.
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
            // Country changed or cities still loading — resolve when ready.
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
    }

    function handleCityChange(nextCity: string) {
        setCity(nextCity)
        const match = findCatalogCity(cities, nextCity)
        if (match?.timezone) setTimezoneOverride(match.timezone)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!timingValidation.isValid) {
            toast.error("Please fix event date/time errors before saving.")
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
        if (!isE164Valid(venuePhone)) {
            toast.error(tValidation("invalidPhone"))
            return
        }
        if (galleryUrls.length < EVENT_GALLERY_MIN_IMAGES) {
            toast.error(t("galleryMinError", { min: EVENT_GALLERY_MIN_IMAGES }))
            return
        }
        if (
            !Number.isFinite(entryOpenMinutesBefore) ||
            entryOpenMinutesBefore < 0 ||
            entryOpenMinutesBefore > 1440
        ) {
            toast.error(t("entryOpenMinutesInvalid"))
            return
        }
        saveMutation.mutate()
    }

    async function onCoverFile(f: File | null) {
        if (!f) return
        try {
            validateUploadFile(f)
            setCoverUploading(true)
            const url = await uploadEventMedia(f)
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
            const url = await uploadEventMedia(f)
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
        const list = files
        try {
            for (const file of list) {
                validateUploadFile(file)
            }
            setGalleryUploading(true)
            const results = await Promise.all(
                list.map((file) => uploadEventMedia(file)),
            )
            setGalleryUrls((prev) => [...prev, ...results])
            toast.success(
                list.length === 1
                    ? t("galleryUploaded")
                    : t("galleryUploadedMany", { count: list.length }),
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

    function addTagFromInput() {
        const value = tagInput.trim()
        if (!value) return
        setTags((prev) => (prev.includes(value) ? prev : [...prev, value]))
        setTagInput("")
    }

    if (
        editId &&
        (loadingEvent ||
            loadingEventCategories ||
            loadingCountries ||
            !countriesReady ||
            !existing ||
            !hasHydratedEdit)
    ) {
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
                onClick={() => router.push(paths.events)}
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
                    t("updateEvent")
                ) : (
                    t("createEventBtn")
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
                            {editId ? t("editEventTitle") : t("createEventTitle")}
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
                            <Label htmlFor="event-name">{tForms("eventName")}</Label>
                            <Input
                                id="event-name"
                                required
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="event-description">{tCommon("description")}</Label>
                            <Textarea
                                id="event-description"
                                required
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className={cn(inputClass, "min-h-24")}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>{t("categoryLabel").replace(":", "")}</Label>
                            <SearchableSelect
                                key={`category-${editId ?? "new"}-${category}`}
                                value={category}
                                onValueChange={setCategoryOverride}
                                options={categorySelectOptions}
                                disabled={
                                    loadingEventCategories ||
                                    (eventCategories.length === 0 && !category)
                                }
                                triggerClassName={selectTriggerClass}
                                placeholder={
                                    loadingEventCategories
                                        ? t("loadingCategories")
                                        : eventCategoriesError
                                            ? t("couldNotLoadCategories")
                                            : eventCategories.length === 0 && !legacyCategoryName
                                                ? t("noActiveCategories")
                                                : tForms("selectCategory")
                                }
                            />
                            {eventCategoriesError ? (
                                <p className="text-xs text-destructive">
                                    {t("refreshConnectionHint")}
                                </p>
                            ) : null}
                            {!eventCategoriesError &&
                                !loadingEventCategories &&
                                eventCategories.length === 0 &&
                                !legacyCategoryName ? (
                                <p className="text-xs text-muted-foreground">
                                    {paths.scope === "vendor"
                                        ? t("noCategoriesContactAdmin")
                                        : (
                                            <>
                                                {t("addCategoryHint")}{" "}
                                                <Link
                                                    href={paths.eventCategories}
                                                    className="text-primary underline underline-offset-2"
                                                >
                                                    {t("eventCategoriesLink")}
                                                </Link>{" "}
                                                {t("firstSuffix")}
                                            </>
                                        )}
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label>{tForms("startDate")}</Label>
                            <DateTimePicker
                                value={startLocal}
                                onChange={setStartLocal}
                                required
                                placeholder={t("pickDateTime")}
                                formatLabel={formatPickerLabel}
                                triggerClassName={inputClass}
                            />
                            {timingValidation.eventStartError ? (
                                <p className="text-xs text-destructive">{timingValidation.eventStartError}</p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label>{tForms("endDate")}</Label>
                            <DateTimePicker
                                value={endLocal}
                                onChange={setEndLocal}
                                required
                                placeholder={t("pickDateTime")}
                                formatLabel={formatPickerLabel}
                                triggerClassName={inputClass}
                            />
                            {timingValidation.eventEndError ? (
                                <p className="text-xs text-destructive">{timingValidation.eventEndError}</p>
                            ) : null}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="entry-open-minutes">{t("entryOpenMinutesLabel")}</Label>
                            <p className="text-xs text-muted-foreground">
                                {t("entryOpenMinutesHint")}
                            </p>
                            <NumberInput
                                id="entry-open-minutes"
                                integer
                                min={0}
                                max={1440}
                                value={entryOpenMinutesBefore}
                                onValueChange={(v) =>
                                    setEntryOpenMinutesBefore(v ?? 60)
                                }
                                className={inputClass}
                            />
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
                            <p className="text-xs text-muted-foreground">{t("thumbnailOptional")}</p>
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
                            inputId="event-gallery-upload"
                            hint={t("galleryRequired", { min: EVENT_GALLERY_MIN_IMAGES })}
                        />
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>{tEvents("venue")}</CardTitle>
                        <CardDescription>{t("venueLocationDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="venue-name">{tForms("venueName")}</Label>
                            <Input
                                id="venue-name"
                                required
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="venue-phone">{t("venuePhoneLabel").replace(":", "")}</Label>
                            <SignupPhoneField
                                id="venue-phone"
                                variant="ui"
                                defaultCountry={(countryCode || "AE") as CountryCode}
                                value={venuePhone}
                                onChange={setVenuePhone}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="venue-website">{tForms("website")}</Label>
                            <Input
                                id="venue-website"
                                required
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
                        <CardDescription>{t("venueLocationDesc")}</CardDescription>
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
                                key={`event-country-${countryOptions.length}-${countryCode}`}
                                value={countryCode || undefined}
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
                                    {countryOptions.map((country) => (
                                        <SelectItem key={country.id} value={country.code}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-currency">{tCurrency("currency")}</Label>
                            <Input
                                id="event-currency"
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
                            <Label htmlFor="event-city">{tForms("city")}</Label>
                            <Select
                                key={`event-city-${cityOptions.length}-${city}`}
                                value={city || undefined}
                                onValueChange={handleCityChange}
                                disabled={!countryCode}
                            >
                                <SelectTrigger id="event-city" className={selectTriggerClass}>
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
                            <Label htmlFor="event-timezone">{tForms("timezone")}</Label>
                            <Select
                                key={`timezone-${editId ?? "new"}-${timezone}`}
                                value={timezone}
                                onValueChange={setTimezoneOverride}
                                disabled={timezoneOptions.length === 0}
                            >
                                <SelectTrigger id="event-timezone" className={selectTriggerClass}>
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
                                    {t("eventTimezoneHint", { timezone })}
                                </p>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-state">{t("stateRegion")}</Label>
                            <Input
                                id="event-state"
                                required
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-zip">{t("zipPostal")}</Label>
                            <Input
                                id="event-zip"
                                required
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="event-address">{tForms("address")}</Label>
                            <Input
                                id="event-address"
                                required
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-latitude">{t("latitude")}</Label>
                            <Input
                                id="event-latitude"
                                required
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-longitude">{t("longitude")}</Label>
                            <Input
                                id="event-longitude"
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
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <div className="space-y-1">
                            <CardTitle>{t("ticketTypes")}</CardTitle>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTickets((rows) => [...rows, defaultTicket(t("generalTicket"))])}
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
                                        step={1}
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
                                <div className="space-y-2">
                                    <Label>{t("quantityTotal")}</Label>
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
                                                          ) || Number(ticket.quantityTotal) || 0,
                                                  )
                                                : ticket.quantityTotal
                                        }
                                        onChange={(e) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, quantityTotal: e.target.value } : r,
                                                ),
                                            )
                                        }
                                        className={inputClass}
                                    />
                                    {seatingEnabled ? (
                                        <p className="text-xs text-muted-foreground">
                                            Quantity is calculated from the seating layout.
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>{t("salesStart")}</Label>
                                    <DateTimePicker
                                        value={ticket.salesStart}
                                        onChange={(value) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, salesStart: value } : r,
                                                ),
                                            )
                                        }
                                        placeholder={t("pickDateTime")}
                                        formatLabel={formatPickerLabel}
                                        triggerClassName={inputClass}
                                    />
                                    {timingValidation.ticketTimeErrors[i]?.salesStart ? (
                                        <p className="text-xs text-destructive">
                                            {timingValidation.ticketTimeErrors[i]?.salesStart}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>{t("salesEnd")}</Label>
                                    <DateTimePicker
                                        value={ticket.salesEnd}
                                        onChange={(value) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, salesEnd: value } : r,
                                                ),
                                            )
                                        }
                                        placeholder={t("pickDateTime")}
                                        formatLabel={formatPickerLabel}
                                        triggerClassName={inputClass}
                                    />
                                    {timingValidation.ticketTimeErrors[i]?.salesEnd ? (
                                        <p className="text-xs text-destructive">
                                            {timingValidation.ticketTimeErrors[i]?.salesEnd}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>Seating</CardTitle>
                        <CardDescription>
                            Optional reserved seating map for this event. Buyers pick seats
                            instead of a free quantity.
                        </CardDescription>
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
