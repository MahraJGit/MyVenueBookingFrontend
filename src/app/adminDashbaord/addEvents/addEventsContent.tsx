"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CalendarIcon, ImagePlus, Loader2, Plus, Trash2 } from "lucide-react"

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
import { VenueGalleryUpload } from "@/components/venues/VenueGalleryUpload"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    createEvent,
    getManagedEvent,
    updateEvent,
    uploadEventMedia,
    type CreateEventPayload,
} from "@/features/events/api"
import { listEventCategories } from "@/features/event-categories/api"
import { toastApiError } from "@/lib/toasts"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { AddressHint } from "@/components/maps/location-picker-map"
import { useDashboardPaths } from "@/features/dashboard/paths"
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui"
import { cn } from "@/lib/utils"

const inputClass = "bg-input/50 border-border"
const selectTriggerClass = cn(inputClass, "w-full")

const TIMEZONES = [
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Riyadh",
    "Asia/Qatar",
    "Europe/London",
    "America/New_York",
    "UTC",
]

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
    name: string
    price: string
    currency: string
    quantityTotal: string
    salesStart: string
    salesEnd: string
}

const defaultTicket = (ticketName: string): TicketForm => ({
    name: ticketName,
    price: "0",
    currency: "PKR",
    quantityTotal: "100",
    salesStart: "",
    salesEnd: "",
})

function toDatetimeLocalValue(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultSchedule() {
    const start = new Date()
    start.setMinutes(0, 0, 0)
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000)
    return { start: toDatetimeLocalValue(start), end: toDatetimeLocalValue(end) }
}

function parseLocalDateTime(value: string): Date | null {
    if (!value) return null
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

function pad2(n: number) {
    return String(n).padStart(2, "0")
}

function toTimeValue(date: Date | null) {
    if (!date) return "12:00"
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export default function AddEventsContentPage() {
    const t = useTranslations("adminDashboard")
    const tCommon = useTranslations("common")
    const tForms = useTranslations("forms")
    const tCurrency = useTranslations("currency")
    const tEvents = useTranslations("events")
    const router = useRouter()
    const searchParams = useSearchParams()
    const paths = useDashboardPaths()
    const editId = searchParams.get("id")
    const queryClient = useQueryClient()

    const prettyDateTime = React.useCallback(
        (value: string) => {
            const d = parseLocalDateTime(value)
            if (!d) return t("pickDateTime")
            return d.toLocaleString()
        },
        [t],
    )

    const [eventName, setEventName] = React.useState("")
    const [eventDescription, setEventDescription] = React.useState("")
    const [timezone, setTimezone] = React.useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dubai",
    )
    const [category, setCategory] = React.useState("")
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
    const [venuePhone, setVenuePhone] = React.useState("")
    const [venueWebsite, setVenueWebsite] = React.useState("https://example.com")
    const [countryCode, setCountryCode] = React.useState("AE")
    const [city, setCity] = React.useState("")
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
    const [tickets, setTickets] = React.useState<TicketForm[]>([defaultTicket(t("generalTicket"))])

    const coverInputRef = React.useRef<HTMLInputElement>(null)
    const thumbnailInputRef = React.useRef<HTMLInputElement>(null)

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

    const timezoneOptions = React.useMemo(() => {
        const base = [...TIMEZONES]
        if (timezone && !base.includes(timezone)) {
            base.unshift(timezone)
        }
        return base
    }, [timezone])

    const legacyCategoryName = React.useMemo(() => {
        const cat = category.trim()
        if (!cat) return null
        if (eventCategories.some((c) => c.name === cat)) return null
        return cat
    }, [category, eventCategories])

    React.useEffect(() => {
        if (!existing) return

        setEventName(existing.eventName)
        setEventDescription(existing.eventDescription ?? "")
        setTimezone(existing.timezone)
        setCategory(existing.category ?? "")
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

        const toLocal = (iso: string) => {
            const d = new Date(iso)
            if (Number.isNaN(d.getTime())) return ""
            const pad = (n: number) => String(n).padStart(2, "0")
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        setStartLocal(toLocal(existing.startDateTime))
        setEndLocal(toLocal(existing.endDateTime))

        setTickets(
            existing.ticketTypes.length > 0
                ? existing.ticketTypes.map((ticket) => ({
                    name: ticket.name,
                    price: String(ticket.price),
                    currency: ticket.currency || "PKR",
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
    }, [existing, t])

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = buildPayload()
            if (editId) {
                return updateEvent(editId, payload)
            }
            return createEvent(payload as CreateEventPayload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["managed-events"] })
            toast.success(editId ? t("eventUpdated") : t("eventCreated"))
            router.push(paths.events)
        },
        onError: (e) => toastApiError(e, t("couldNotSaveEvent")),
    })

    function buildPayload(): CreateEventPayload | Partial<CreateEventPayload> {
        const gallery = galleryUrls

        const ticketPayload = tickets.map((ticket) => {
            const row: CreateEventPayload["ticketTypes"][0] = {
                name: ticket.name.trim(),
                price: Number(ticket.price),
                currency: ticket.currency.trim() || "PKR",
                quantityTotal: Number(ticket.quantityTotal),
            }
            if (ticket.salesStart) {
                row.salesStart = new Date(ticket.salesStart).toISOString()
            }
            if (ticket.salesEnd) {
                row.salesEnd = new Date(ticket.salesEnd).toISOString()
            }
            return row
        })

        const base = {
            eventName: eventName.trim(),
            eventDescription: eventDescription.trim(),
            startDateTime: new Date(startLocal).toISOString(),
            endDateTime: new Date(endLocal).toISOString(),
            timezone: timezone.trim(),
            category: category.trim(),
            tags,
            coverImage: coverImage.trim(),
            thumbnail: thumbnail.trim() || undefined,
            gallery,
            venueName: venueName.trim(),
            venuePhone: venuePhone.trim(),
            venueWebsite: venueWebsite.trim(),
            countryCode: countryCode.trim(),
            city: city.trim(),
            state: state.trim(),
            address: address.trim(),
            zipCode: zipCode.trim(),
            latitude: Number(latitude),
            longitude: Number(longitude),
            locationSource,
            ticketTypes: ticketPayload,
        }

        return base as CreateEventPayload
    }

    function applyMapPosition(lat: number, lng: number) {
        setLatitude(String(lat))
        setLongitude(String(lng))
    }

    function applyAddressHint(hint: AddressHint) {
        if (hint.countryCode) setCountryCode(hint.countryCode)
        if (hint.city) setCity(hint.city)
        if (hint.state) setState(hint.state)
        if (hint.zipCode) setZipCode(hint.zipCode)
        if (hint.fullAddress ?? hint.addressLine) {
            setAddress(hint.fullAddress ?? hint.addressLine ?? "")
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!category.trim()) {
            toast.error(t("selectCategoryError"))
            return
        }
        if (!coverImage.trim()) {
            toast.error(t("uploadCoverError"))
            return
        }
        saveMutation.mutate()
    }

    async function onCoverFile(f: File | null) {
        if (!f) return
        try {
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

    async function onGalleryFiles(files: FileList | null) {
        if (!files?.length) return
        const list = Array.from(files)
        try {
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

    const currencyOptions = ["PKR", "USD", "EUR", "GBP", "AED", "SAR"] as const

    if (editId && loadingEvent) {
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
                        <p className="text-sm text-muted-foreground">
                            {t("eventFormDesc")}
                        </p>
                    </div>
                </div>

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle>{t("basics")}</CardTitle>
                        <CardDescription>{t("eventFormDesc")}</CardDescription>
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
                        <div className="space-y-2">
                            <Label>{t("categoryLabel").replace(":", "")}</Label>
                            <Select
                                value={category || undefined}
                                onValueChange={setCategory}
                                disabled={
                                    loadingEventCategories ||
                                    (eventCategories.length === 0 && !legacyCategoryName)
                                }
                            >
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue
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
                                </SelectTrigger>
                                <SelectContent>
                                    {legacyCategoryName ? (
                                        <SelectItem value={legacyCategoryName}>
                                            {legacyCategoryName}{" "}
                                            <span className="text-muted-foreground">{t("currentValue")}</span>
                                        </SelectItem>
                                    ) : null}
                                    {eventCategories.map((c) => (
                                        <SelectItem key={c.id} value={c.name}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                            <Label htmlFor="event-timezone">{tForms("timezone")}</Label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger id="event-timezone" className={selectTriggerClass}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezoneOptions.map((tz) => (
                                        <SelectItem key={tz} value={tz}>
                                            {tz}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>{tForms("startDate")}</Label>
                            <DateTimePicker
                                value={startLocal}
                                onChange={setStartLocal}
                                required
                                prettyLabel={prettyDateTime(startLocal)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{tForms("endDate")}</Label>
                            <DateTimePicker
                                value={endLocal}
                                onChange={setEndLocal}
                                required
                                prettyLabel={prettyDateTime(endLocal)}
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
                            <Input
                                id="venue-phone"
                                required
                                value={venuePhone}
                                onChange={(e) => setVenuePhone(e.target.value)}
                                className={inputClass}
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
                            <Input
                                id="country-code"
                                required
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event-city">{tForms("city")}</Label>
                            <Input
                                id="event-city"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className={inputClass}
                            />
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
                                </div>
                                <div className="space-y-2">
                                    <Label>{tCurrency("displayCurrency")}</Label>
                                    <Select
                                        value={ticket.currency || "PKR"}
                                        onValueChange={(value) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, currency: value } : r,
                                                ),
                                            )
                                        }
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder={tCurrency("displayCurrency")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map((code) => (
                                                <SelectItem key={code} value={code}>
                                                    {code} — {tCurrency(code)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("quantityTotal")}</Label>
                                    <Input
                                        required
                                        type="number"
                                        min={1}
                                        value={ticket.quantityTotal}
                                        onChange={(e) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, quantityTotal: e.target.value } : r,
                                                ),
                                            )
                                        }
                                        className={inputClass}
                                    />
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
                                        prettyLabel={t("salesStart")}
                                    />
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
                                        prettyLabel={t("salesEnd")}
                                    />
                                </div>
                            </div>
                        ))}
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

function DateTimePicker({
    value,
    onChange,
    required,
    prettyLabel,
}: {
    value: string
    onChange: (value: string) => void
    required?: boolean
    prettyLabel: string
}) {
    const tCommon = useTranslations("common")
    const selected = parseLocalDateTime(value)

    const onDateSelect = (date?: Date) => {
        if (!date) return
        const base = selected ?? new Date()
        const next = new Date(date)
        next.setHours(base.getHours(), base.getMinutes(), 0, 0)
        onChange(toDatetimeLocalValue(next))
    }

    const onTimeChange = (time: string) => {
        const [h, m] = time.split(":").map((v) => Number(v))
        if (!Number.isFinite(h) || !Number.isFinite(m)) return
        const base = selected ?? new Date()
        base.setHours(h, m, 0, 0)
        onChange(toDatetimeLocalValue(base))
    }

    return (
        <div className="space-y-2">
            <input
                required={required}
                value={value}
                readOnly
                className="sr-only"
                tabIndex={-1}
                aria-hidden
            />
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start border-border text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {prettyLabel}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-border bg-card p-2" align="start">
                    <Calendar
                        mode="single"
                        selected={selected ?? undefined}
                        onSelect={onDateSelect}
                        className="rounded-md border border-border"
                    />
                    <div className="mt-2 border-t border-border pt-2">
                        <Label className="mb-1 block text-xs text-muted-foreground">{tCommon("time")}</Label>
                        <Input
                            type="time"
                            value={toTimeValue(selected)}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
