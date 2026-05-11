"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { getPresignedViewUrl } from "@/features/uploads/api"
import { toastApiError } from "@/lib/toasts"
import Link from "next/link"
import dynamic from "next/dynamic"
import type { AddressHint } from "@/components/maps/location-picker-map"

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

const defaultTicket = (): TicketForm => ({
    name: "General",
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

function prettyDateTime(value: string) {
    const d = parseLocalDateTime(value)
    if (!d) return "Pick date & time"
    return d.toLocaleString()
}

export default function AddEventsContentPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get("id")
    const queryClient = useQueryClient()

    const [eventName, setEventName] = React.useState("")
    const [eventDescription, setEventDescription] = React.useState("")
    const [timezone, setTimezone] = React.useState(
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dubai",
    )
    const [category, setCategory] = React.useState("")
    const [tags, setTags] = React.useState<string[]>([])
    const [tagInput, setTagInput] = React.useState("")
    const [coverImage, setCoverImage] = React.useState("")
    /** Populated only via S3 uploads (stored URLs sent to API). */
    const [galleryUrls, setGalleryUrls] = React.useState<string[]>([])
    const [coverUploading, setCoverUploading] = React.useState(false)
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
    const [tickets, setTickets] = React.useState<TicketForm[]>([defaultTicket()])

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

    const { data: coverPreviewUrl, isLoading: loadingCoverPreview } = useQuery({
        queryKey: ["event-media-preview", coverImage],
        queryFn: () => getPresignedViewUrl(coverImage),
        enabled: Boolean(coverImage),
        staleTime: 5 * 60 * 1000,
    })

    const galleryPreviewQueries = useQueries({
        queries: galleryUrls.map((fileUrl) => ({
            queryKey: ["event-media-preview", fileUrl],
            queryFn: () => getPresignedViewUrl(fileUrl),
            staleTime: 5 * 60 * 1000,
        })),
    })

    /*
    React.useEffect(() => {
      if (!editId) setLocationSource("CUSTOM")
    }, [editId])
    */

    const legacyCategoryName = React.useMemo(() => {
        const t = category.trim()
        if (!t) return null
        if (eventCategories.some((c) => c.name === t)) return null
        return t
    }, [category, eventCategories])

    React.useEffect(() => {
        if (!existing) return

        setEventName(existing.eventName)
        setEventDescription(existing.eventDescription ?? "")
        setTimezone(existing.timezone)
        setCategory(existing.category ?? "")
        setTags(existing.tags ?? [])
        setCoverImage(existing.coverImage ?? "")
        setGalleryUrls(existing.gallery ?? [])
        // setVenueId(existing.venueId ?? "") // Venue ID field commented out for now
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
                ? existing.ticketTypes.map((t) => ({
                    name: t.name,
                    price: String(t.price),
                    currency: t.currency || "PKR",
                    quantityTotal: String(t.quantityTotal),
                    salesStart: t.salesStart
                        ? toLocal(typeof t.salesStart === "string" ? t.salesStart : String(t.salesStart))
                        : "",
                    salesEnd: t.salesEnd
                        ? toLocal(typeof t.salesEnd === "string" ? t.salesEnd : String(t.salesEnd))
                        : "",
                }))
                : [defaultTicket()],
        )
    }, [existing])

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
            toast.success(editId ? "Event updated" : "Event created")
            router.push("/adminDashbaord/manageEvents")
        },
        onError: (e) => toastApiError(e, "Could not save event."),
    })

    function buildPayload(): CreateEventPayload | Partial<CreateEventPayload> {
        const gallery = galleryUrls

        const ticketPayload = tickets.map((t) => {
            const row: CreateEventPayload["ticketTypes"][0] = {
                name: t.name.trim(),
                price: Number(t.price),
                currency: t.currency.trim() || "PKR",
                quantityTotal: Number(t.quantityTotal),
            }
            if (t.salesStart) {
                row.salesStart = new Date(t.salesStart).toISOString()
            }
            if (t.salesEnd) {
                row.salesEnd = new Date(t.salesEnd).toISOString()
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

        // Optional venue UUID — re-enable when linking events to venue records:
        // if (venueId.trim()) {
        //   return { ...base, venueId: venueId.trim() } as CreateEventPayload
        // }
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
        if (hint.addressLine) setAddress(hint.addressLine)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!category.trim()) {
            toast.error("Select a category.")
            return
        }
        if (!coverImage.trim()) {
            toast.error("Upload a cover image before saving.")
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
            toast.success("Cover image uploaded to storage")
        } catch (err) {
            toastApiError(err, "Upload failed")
        } finally {
            setCoverUploading(false)
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
                    ? "Gallery image uploaded"
                    : `${list.length} images uploaded`,
            )
        } catch (err) {
            toastApiError(err, "Gallery upload failed")
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
                            {editId ? "Edit event" : "Create event"}
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Fields match the API: name, schedule, venue, location, ticket types.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/adminDashbaord/manageEvents")}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saveMutation.isPending}>
                            {saveMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : editId ? (
                                "Update event"
                            ) : (
                                "Create event"
                            )}
                        </Button>
                    </div>
                </div>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">Basics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label>Event name</Label>
                            <Input
                                required
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                                required
                                rows={4}
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                className="border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2 w-full">
                            <Label>Category</Label>
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
                                                ? "Loading categories…"
                                                : eventCategoriesError
                                                    ? "Could not load categories"
                                                    : eventCategories.length === 0 && !legacyCategoryName
                                                        ? "No active categories"
                                                        : "Select a category"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {legacyCategoryName ? (
                                        <SelectItem value={legacyCategoryName}>
                                            {legacyCategoryName}{" "}
                                            <span className="text-zinc-500">(current value)</span>
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
                                    Refresh the page or check your connection.
                                </p>
                            ) : null}
                            {!eventCategoriesError &&
                                !loadingEventCategories &&
                                eventCategories.length === 0 &&
                                !legacyCategoryName ? (
                                <p className="text-xs text-zinc-400">
                                    Add an active category under{" "}
                                    <Link
                                        href="/adminDashbaord/events"
                                        className="text-primary underline underline-offset-2"
                                    >
                                        Event categories
                                    </Link>{" "}
                                    first.
                                </p>

                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Input
                                required
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                placeholder="Asia/Dubai"
                                className="border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Start</Label>
                            <DateTimePicker
                                value={startLocal}
                                onChange={setStartLocal}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End</Label>
                            <DateTimePicker
                                value={endLocal}
                                onChange={setEndLocal}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">Media</CardTitle>
                        <p className="text-sm text-zinc-400">
                            Images are uploaded to your cloud storage; only the returned links are saved with the event.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label>Cover image</Label>
                            <p className="text-xs text-zinc-500">
                                Required. JPEG, PNG, or WebP — uploaded via the platform.
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
                                            Uploading…
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload cover image
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
                                                alt="Cover preview"
                                                className="max-h-48 w-full max-w-md rounded-md object-cover"
                                            />
                                        </>
                                    ) : (
                                        <div className="flex h-24 items-center gap-2 rounded-md border border-zinc-700 px-3 text-sm text-zinc-400">
                                            {loadingCoverPreview ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading cover preview...
                                                </>
                                            ) : (
                                                "Could not load cover preview. File is saved and will still submit."
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
                                        Remove cover
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-amber-200/90">
                                    No cover yet — upload an image to continue.
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 border-t border-zinc-800 pt-6">
                            <Label>Gallery</Label>
                            <p className="text-xs text-zinc-500">
                                Optional. Add multiple images; each file is uploaded and its URL stored.
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
                                            Uploading…
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Add gallery images
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
                                                        ? "Loading preview..."
                                                        : "Preview unavailable"}
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
                                                    aria-label="Remove image"
                                                    onClick={() => removeGalleryAt(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">No gallery images yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader>
                        <CardTitle className="text-base text-primary">
                            Venue &amp; location
                        </CardTitle>
                        <p className="text-sm text-zinc-400">
                            Venue details and where the event takes place. Coordinates are stored
                            with the event in the database.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-xl border border-zinc-800 bg-black/30 p-4 md:p-5">
                            <h3 className="mb-4 text-sm font-semibold tracking-wide text-primary">
                                Venue
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/*
                <div className="space-y-2">
                  <Label>Venue ID (optional UUID)</Label>
                  <Input
                    value={venueId}
                    onChange={(e) => setVenueId(e.target.value)}
                    className="border-zinc-700"
                  />
                </div>
                */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Venue name</Label>
                                    <Input
                                        required
                                        value={venueName}
                                        onChange={(e) => setVenueName(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Venue phone</Label>
                                    <Input
                                        required
                                        value={venuePhone}
                                        onChange={(e) => setVenuePhone(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Venue website</Label>
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
                                Location
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/*
                Location source + address/lat-lng inputs — hidden for now; values
                still come from defaults, edit load, and map search / drag.

                <div className="space-y-2 md:col-span-2">
                  <Label>Location source</Label>
                  <div className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200">
                    {locationSource === "VENUE" ? (
                      <>Venue coordinates (from saved event)</>
                    ) : (
                      <>Custom address</>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    New events default to <strong className="font-medium text-zinc-400">custom address</strong>.
                    Use the map to search or drag the pin; latitude and longitude are
                    saved with the event.
                  </p>
                </div>
                */}

                                <div className="md:col-span-2">
                                    <LocationPickerMap
                                        latitude={latitude}
                                        longitude={longitude}
                                        onPositionChange={applyMapPosition}
                                        onAddressHint={applyAddressHint}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Country code</Label>
                                    <Input
                                        required
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        required
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>State / region</Label>
                                    <Input
                                        required
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Address</Label>
                                    <Input
                                        required
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>ZIP / postal code</Label>
                                    <Input
                                        required
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Latitude</Label>
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
                                    <Label>Longitude</Label>
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
                        <CardTitle className="text-base text-primary">Tags</CardTitle>
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
                                placeholder="Type tag"
                                className="border-zinc-700 sm:flex-1"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addTagFromInput}
                                disabled={!tagInput.trim()}
                                className="sm:w-auto"
                            >
                                Add
                            </Button>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Click Add (or press Enter). Tags are saved as a JSON string array in
                            the database.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs"
                                    onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                                >
                                    #{tag} ×
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-[#0e0e0e]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base text-primary">Ticket types</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-zinc-600"
                            onClick={() => setTickets((t) => [...t, defaultTicket()])}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add type
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {tickets.map((t, i) => (
                            <div
                                key={i}
                                className="grid gap-3 rounded-lg border border-zinc-800 p-4 md:grid-cols-2"
                            >
                                <div className="space-y-2 md:col-span-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-300">
                                        Ticket {i + 1}
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
                                    <Label>Name</Label>
                                    <Input
                                        required
                                        value={t.name}
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
                                    <Label>Price</Label>
                                    <Input
                                        required
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={t.price}
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
                                    <Label>Currency</Label>
                                    <Input
                                        value={t.currency}
                                        onChange={(e) =>
                                            setTickets((rows) =>
                                                rows.map((r, j) =>
                                                    j === i ? { ...r, currency: e.target.value } : r,
                                                ),
                                            )
                                        }
                                        className="border-zinc-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity total</Label>
                                    <Input
                                        required
                                        type="number"
                                        min={1}
                                        value={t.quantityTotal}
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
                                {/*
                <div className="space-y-2">
                  <Label>Sales start (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={t.salesStart}
                    onChange={(e) =>
                      setTickets((rows) =>
                        rows.map((r, j) =>
                          j === i ? { ...r, salesStart: e.target.value } : r,
                        ),
                      )
                    }
                    className="border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sales end (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={t.salesEnd}
                    onChange={(e) =>
                      setTickets((rows) =>
                        rows.map((r, j) =>
                          j === i ? { ...r, salesEnd: e.target.value } : r,
                        ),
                      )
                    }
                    className="border-zinc-700"
                  />
                </div>
                */}
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
}: {
    value: string
    onChange: (value: string) => void
    required?: boolean
}) {
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
            {/* Hidden native input keeps required-form behavior. */}
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
                        {prettyDateTime(value)}
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
                        <Label className="mb-1 block text-xs text-zinc-400">Time</Label>
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
