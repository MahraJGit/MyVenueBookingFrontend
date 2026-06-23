"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CalendarIcon, Loader2, Plus, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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

    const coverPreviewUrl = coverImage?.trim() || null;
    const loadingCoverPreview = false;

    const thumbnailPreviewUrl = thumbnail?.trim() || null;
    const loadingThumbnailPreview = false;

    const galleryPreviewQueries = galleryUrls.map((url) => ({
        data: url,
        isLoading: false,
    }));

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
            <div className="flex min-h-[40vh] items-center justify-center text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen rounded-md bg-[#121212] p-4 text-white md:p-8">
            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-primary">
                            {editId ? t("editEventTitle") : t("createEventTitle")}
                        </h2>
                        <p className="text-sm text-zinc-400">
                            {t("eventFormDesc")}
                        </p>
                    </div>
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
                </div>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">{t("basics")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>{tForms("eventName")}</Label>
                            <Input
                                required
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>{tCommon("description")}</Label>
                            <Textarea
                                required
                                rows={4}
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className="border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2 w-full">
                            <Label>{t("categoryLabel").replace(":", "")}</Label>
                            <Select
                                value={category || undefined}
                                onValueChange={setCategory}
                                disabled={
                                    loadingEventCategories ||
                                    (eventCategories.length === 0 && !legacyCategoryName)
                                }
                            >
                                <SelectTrigger className="border-zinc-700 w-full">
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
                                            <span className="text-zinc-500">{t("currentValue")}</span>
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
                                <p className="text-xs text-red-400">
                                    {t("refreshConnectionHint")}
                                </p>
                            ) : null}
                            {!eventCategoriesError &&
                                !loadingEventCategories &&
                                eventCategories.length === 0 &&
                                !legacyCategoryName ? (
                                <p className="text-xs text-zinc-400">
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
                            <Label>{tForms("timezone")}</Label>
                            <Input
                                required
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                placeholder="Asia/Dubai"
                                className="border-zinc-700"
                            />
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
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">{tForms("media")}</CardTitle>
                        <p className="text-sm text-zinc-400">
                            {t("mediaUploadDesc")}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>{tForms("coverImage")}</Label>
                            <p className="text-xs text-zinc-500">
                                {t("coverRequired")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-600"
                                    disabled={coverUploading}
                                    onClick={() =>
                                        document.getElementById("cover-upload")?.click()
                                    }
                                >
                                    {coverUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {tCommon("uploading")}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {tForms("uploadCover")}
                                        </>
                                    )}
                                </Button>
                                <input
                                    id="cover-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        void onCoverFile(e.target.files?.[0] ?? null)
                                        e.target.value = ""
                                    }}
                                />
                            </div>
                            {coverImage ? (
                                <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/40 p-3">
                                    {coverPreviewUrl ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={coverPreviewUrl}
                                                alt={tForms("coverImage")}
                                                className="max-h-48 w-full max-w-md rounded-md object-cover"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex h-24 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm text-zinc-400">
                                            {loadingCoverPreview ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    {t("loadingPreview")}
                                                </>
                                            ) : (
                                                t("previewUnavailable")
                                            )}
                                        </div>
                                    )}
                                    <p className="break-all font-mono text-xs text-zinc-500">
                                        {coverImage}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-400 hover:text-white"
                                        onClick={() => setCoverImage("")}
                                    >
                                        {tForms("removeCover")}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-amber-200/90">
                                    {tForms("noCoverYet")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 border-t border-zinc-800 pt-6">
                            <Label>{tForms("thumbnail")}</Label>
                            <p className="text-xs text-zinc-500">
                                {t("thumbnailOptional")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-600"
                                    disabled={thumbnailUploading}
                                    onClick={() =>
                                        document.getElementById("thumbnail-upload")?.click()
                                    }
                                >
                                    {thumbnailUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {tCommon("uploading")}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {tForms("uploadThumbnail")}
                                        </>
                                    )}
                                </Button>
                                <input
                                    id="thumbnail-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(e) => {
                                        void onThumbnailFile(e.target.files?.[0] ?? null)
                                        e.target.value = ""
                                    }}
                                />
                            </div>
                            {thumbnail ? (
                                <div className="space-y-2 rounded-lg border border-zinc-800 bg-black/40 p-3">
                                    {thumbnailPreviewUrl ? (
                                        <>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={thumbnailPreviewUrl}
                                                alt={tForms("thumbnail")}
                                                className="max-h-32 w-full max-w-xs rounded-md object-cover"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex h-20 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm text-zinc-400">
                                            {loadingThumbnailPreview ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    {t("loadingPreview")}
                                                </>
                                            ) : (
                                                t("previewUnavailable")
                                            )}
                                        </div>
                                    )}
                                    <p className="break-all font-mono text-xs text-zinc-500">
                                        {thumbnail}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-400 hover:text-white"
                                        onClick={() => setThumbnail("")}
                                    >
                                        {tForms("removeThumbnail")}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">
                                    {tForms("noThumbnailYet")}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 border-t border-zinc-800 pt-6">
                            <Label>{tEvents("gallery")}</Label>
                            <p className="text-xs text-zinc-500">
                                {t("galleryOptional")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="border-zinc-600"
                                    disabled={galleryUploading}
                                    onClick={() =>
                                        document.getElementById("gallery-upload")?.click()
                                    }
                                >
                                    {galleryUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {tCommon("uploading")}
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {t("addGalleryImages")}
                                        </>
                                    )}
                                </Button>
                                <input
                                    id="gallery-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        void onGalleryFiles(e.target.files)
                                        e.target.value = ""
                                    }}
                                />
                            </div>
                            {galleryUrls.length > 0 ? (
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {galleryUrls.map((url, index) => (
                                        <li
                                            key={`${url}-${index}`}
                                            className="relative overflow-hidden rounded-lg border border-zinc-800 bg-black/30"
                                        >
                                            {galleryPreviewQueries[index]?.data ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={galleryPreviewQueries[index].data}
                                                        alt=""
                                                        className="aspect-video w-full object-cover"
                                                    />
                                                </>
                                            ) : (
                                                <div className="flex aspect-video items-center justify-center bg-zinc-900 text-xs text-zinc-400">
                                                    {galleryPreviewQueries[index]?.isLoading
                                                        ? t("loadingPreview")
                                                        : t("previewUnavailable")}
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between gap-2 border-t border-zinc-800 p-2">
                                                <span className="truncate font-mono text-[10px] text-zinc-500">
                                                    {url.slice(-40)}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 text-red-400"
                                                    aria-label={t("removeImage")}
                                                    onClick={() => removeGalleryAt(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">{t("noGalleryYet")}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">
                            {t("venueAndLocation")}
                        </CardTitle>
                        <p className="text-sm text-zinc-400">
                            {t("venueLocationDesc")}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 md:p-5">
                            <h3 className="mb-4 text-sm font-semibold tracking-wide text-primary">
                                {tEvents("venue")}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>{tForms("venueName")}</Label>
                                    <Input
                                        required
                                        value={venueName}
                                        onChange={(e) => setVenueName(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("venuePhoneLabel").replace(":", "")}</Label>
                                    <Input
                                        required
                                        value={venuePhone}
                                        onChange={(e) => setVenuePhone(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{tForms("website")}</Label>
                                    <Input
                                        required
                                        type="url"
                                        value={venueWebsite}
                                        onChange={(e) => setVenueWebsite(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 md:p-5">
                            <h3 className="mb-4 text-sm font-semibold tracking-wide text-primary">
                                {tForms("location")}
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <LocationPickerMap
                                        latitude={latitude}
                                        longitude={longitude}
                                        onPositionChange={applyMapPosition}
                                        onAddressHint={applyAddressHint}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{t("countryCode")}</Label>
                                    <Input
                                        required
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{tForms("city")}</Label>
                                    <Input
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("stateRegion")}</Label>
                                    <Input
                                        required
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>{tForms("address")}</Label>
                                    <Input
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("zipPostal")}</Label>
                                    <Input
                                        required
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("latitude")}</Label>
                                    <Input
                                        required
                                        type="number"
                                        step="any"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("longitude")}</Label>
                                    <Input
                                        required
                                        type="number"
                                        step="any"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">{tForms("tags")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
                                className="border-zinc-700 sm:flex-1"
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
                        <p className="text-xs text-zinc-500">
                            {t("tagsHint")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs"
                                    onClick={() => setTags((p) => p.filter((item) => item !== tag))}
                                >
                                    #{tag} ×
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base text-primary">{t("ticketTypes")}</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-zinc-600"
                            onClick={() => setTickets((rows) => [...rows, defaultTicket(t("generalTicket"))])}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            {t("addType")}
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {tickets.map((ticket, i) => (
                            <div
                                key={i}
                                className="grid gap-3 rounded-lg border border-zinc-800 p-4 md:grid-cols-2"
                            >
                                <div className="space-y-2 md:col-span-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">
                                        {t("ticketN", { n: i + 1 })}
                                    </span>
                                    {tickets.length > 1 ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400"
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
                                        className="border-zinc-700"
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
                                        className="border-zinc-700"
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
                                        <SelectTrigger className="border-zinc-700">
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
                                        className="border-zinc-700"
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </form>
        </div>
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
                        className="w-full justify-start border-zinc-700 text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {prettyLabel}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-zinc-700 bg-[#0e0e0e] p-2" align="start">
                    <Calendar
                        mode="single"
                        selected={selected ?? undefined}
                        onSelect={onDateSelect}
                        className="rounded-md border border-zinc-800"
                    />
                    <div className="mt-2 border-t border-zinc-800 pt-2">
                        <Label className="mb-1 block text-xs text-zinc-400">{tCommon("time")}</Label>
                        <Input
                            type="time"
                            value={toTimeValue(selected)}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="border-zinc-700"
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
