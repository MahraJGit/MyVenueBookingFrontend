"use client"

import * as React from "react"
import Image from "next/image"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { X } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Pencil,
    Ticket,
    Users,
    QrCode,
} from "lucide-react"

export default function AddEvents() {
    const [eventDate, setEventDate] = React.useState<Date | undefined>(
        new Date("2025-07-12")
    )
    const [tags, setTags] = React.useState<string[]>([
        "Music",
        "Festival",
    ])

    return (
        <div className="min-h-screen bg-[#121212] rounded-md p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-bold text-primary">Event Details</h2>
                    <div className="flex gap-3">
                        <Button>Save</Button>
                        <Button variant="outline">Attendee insight</Button>
                    </div>
                </div>

                {/* Top Section */}
                <Card className="bg-transparent border-0 shadow-none">
                    <CardContent className="grid gap-6 lg:grid-cols-3">
                        {/* Image */}
                        <div className="space-y-2">
                            <Label>Event Name</Label>
                            <div className="overflow-hidden rounded-md">
                                <Image
                                    src="/images/event.png"
                                    alt="Event"
                                    width={600}
                                    height={400}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                            {/* Event Name */}
                            <div className="space-y-2">
                                <Label>Event Name</Label>
                                <div className="relative">
                                    <Input placeholder="PRADUA THE 2ND EDITION" />
                                    <Pencil className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            {/* Event Date (shadcn date picker) */}
                            <div className="space-y-2">
                                <Label>Event Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between font-normal"
                                        >
                                            {eventDate
                                                ? format(eventDate, "yyyy-MM-dd")
                                                : "Pick a date"}
                                            <CalendarIcon className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={eventDate}
                                            onSelect={setEventDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Venue */}
                            <div className="space-y-2">
                                <Label>Event Venue</Label>
                                <div className="relative">
                                    <Input placeholder="Museus College Auditorium" />
                                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>

                            {/* Event Time */}
                            <div className="space-y-2">
                                <Label>Event Time</Label>
                                <div className="relative">
                                    <Input type="time"  placeholder="19:00"/>
                                    <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Description */}
                <Card className="bg-transparent border-0 shadow-none">
                    <CardContent className="space-y-2">
                        <Label>Event Description</Label>
                        <Textarea
                            rows={4}
                            placeholder="Experience an unforgettable night of legendary Sri Lankan music. Join us on the 12th of July from 7.00 PM onwards at Museus College Auditorium, Colombo, as we celebrate the timeless melodies of musical greats with exceptional performances by Sunil Edirisinghe, Amaradeva, T.M. Jayarathne and Karunarathne Divulgane."
                        />
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-transparent border-0 shadow-none">
                        <CardContent className="space-y-2">
                            <Label>Ticket Price</Label>
                            <div className="relative">
                                <Input placeholder="2500 LKR" />
                                <Ticket className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-transparent border-0 shadow-none">
                        <CardContent className="space-y-2">
                            <Label>Seat Amount</Label>
                            <div className="relative">
                                <Input placeholder="1200" />
                                <Users className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-transparent border-0 shadow-none">
                        <CardContent className="space-y-2">
                            <Label>Available Seats</Label>
                            <Input placeholder="523" />
                        </CardContent>
                    </Card>

                    <Card className="bg-transparent border-0 shadow-none">
                        <CardContent className="space-y-2">
                            <Label>Popularity</Label>

                            <Select defaultValue="high">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select popularity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                </div>

                {/* Bottom Section */}
                <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="lg:w-1/2 w-full">
                        <div className="flex flex-col">
                            <div className="flex">
                                <Card className="bg-transparent border-0 shadow-none">
                                    <CardContent className="space-y-2">
                                        <Label>Tags</Label>

                                        {/* Input */}
                                        <div className="relative">
                                            <Input
                                                placeholder="Type a tag and press Enter"
                                                className="pr-10"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        const value = e.currentTarget.value.trim()
                                                        if (!value) return

                                                        setTags((prev) =>
                                                            prev.includes(value) ? prev : [...prev, value]
                                                        )
                                                        e.currentTarget.value = ""
                                                    }
                                                }}
                                            />

                                            <Ticket className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="gap-1">
                                                    #{tag}
                                                    <button
                                                        onClick={() =>
                                                            setTags((prev) => prev.filter((t) => t !== tag))
                                                        }
                                                        className="ml-1"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-transparent border-0 shadow-none">
                                    <CardContent className="space-y-2">
                                        <Label>Expected Attendance</Label>
                                        <div className="relative">
                                            <Input placeholder="+1000" />
                                            <Users className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-transparent shadow-none">
                                <CardContent className="flex gap-3 items-center">
                                    <QrCode className="h-24 w-24 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Scan QR code for easy payments
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div className="lg:w-1/2 w-full">
                        <div className='flex flex-col items-center justify-center gap-4 p-4 rounded-xl border border-muted'>
                            <h3 className='text-lg font-bold'>Seating Allocation</h3>
                            <div className="flex md:flex-row flex-col gap-4 mb-4 text-sm text-white">
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-pink-500 rounded-full"></div> Paid Seats
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-white rounded-full"></div> Reserved Seats
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-gray-800 rounded-full border border-gray-600"></div> Available
                                </div>
                            </div>
                            <div className='flex gap-3 items-center flex-wrap'>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                            </div>
                            <div className='flex gap-3 items-center flex-wrap'>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                            </div>
                            <div className='flex gap-3 items-center flex-wrap'>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-white'></div>
                                <div className='w-10 h-10 rounded bg-primary'></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    )
}
