"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Filter, Instagram, Facebook, Twitter, MapPin, Music, Rocket, Headphones, UtensilsCrossed } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import "@/styles/attendeeinsights.css";

const socialData = [
    { platform: "Instagram Mentions", count: 5200, icon: '/svg/Instagram.svg' },
    { platform: "Facebook Shares", count: 3800, icon: '/svg/Facebook.svg' },
    { platform: "Twitter Tweets", count: 1200, icon: '/svg/TwitterBird.svg' },
    { platform: "Event Check-ins (QR scans)", count: 9500, icon: '/svg/QrCode.svg' },
];


const locations = [
    { location: "Colombo", count: 227, color: "bg-pink-500" },
    { location: "Kandy", count: 123, color: "bg-red-500" },
    { location: "Galle", count: 143, color: "bg-purple-500" },
    { location: "Jaffna", count: 70, color: "bg-yellow-500" },
    { location: "International", count: 52, color: "bg-green-500" },
];

import { TrendingUp } from "lucide-react"
export const description = "A donut chart"

const chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Chrome",
        color: "var(--chart-1)",
    },
    safari: {
        label: "Safari",
        color: "var(--chart-2)",
    },
    firefox: {
        label: "Firefox",
        color: "var(--chart-3)",
    },
    edge: {
        label: "Edge",
        color: "var(--chart-4)",
    },
    other: {
        label: "Other",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

export default function AttendeeInsights() {
    return (
        <>
            {/* Header Section */}
            <div className="topbar flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-[#0D0D0D] rounded-2xl gap-6 mb-6">
                {/* Event Info */}
                <div className="flex-1">
                    <h2 className="text-base lg:text-lg font-bold text-primary">
                        Attendee Insights - PRAUDA THE 2ND EDITION
                    </h2>
                    <div className="mt-2 lg:mt-4 space-y-1 text-muted-foreground text-sm lg:text-base">
                        <p>• Event Venue: Musaeus College Auditorium</p>
                        <p>• Event Date: 2025-07-12</p>
                        <p>• Event Time: 19:00:00</p>
                    </div>
                </div>

                {/* Search + Buttons Container */}
                <div className="flex flex-col gap-4 w-full lg:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full lg:w-[280px]">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"
                            size={18}
                        />
                        <Input
                            placeholder="Search..."
                            className="pl-10 bg-primary/20 text-white rounded-full border-none w-full"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 lg:gap-4 mt-2 lg:mt-0">
                        <Button variant="secondary" className="gap-2">
                            <Users className="h-4 w-4" />
                            Attendees: 7523
                        </Button>
                        <Button variant="secondary" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filter
                        </Button>
                    </div>
                </div>
            </div>



            {/* Main Grid - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Attendee Interests - Pie Chart */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Pie Chart - Donut</CardTitle>
                        <CardDescription>January - June 2024</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[250px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="visitors"
                                    nameKey="browser"
                                    innerRadius={60}
                                />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground leading-none">
                            Showing total visitors for the last 6 months
                        </div>
                    </CardFooter>
                </Card>

                {/* Engagement & Social Media Reach */}
                <Card className="bg-transparent shadow-none border-0">
                    <CardHeader>
                        <CardTitle>Engagement & Social Media Reach</CardTitle>
                        <p className="text-sm text-muted-foreground">How attendees engaged with the event</p>
                    </CardHeader>
                    <CardContent className="space-y-6 h-80 overflow-auto scrollbar-hidden">
                        {socialData.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.platform} className="flex items-center justify-between border-b p-4 last:border-0">
                                    <div className="flex items-center gap-4">

                                        <img src={item.icon} alt={item.platform} className="w-8 h-8" />
                                        <span className="text-muted-foreground text-xs">{item.platform}</span>
                                    </div>
                                    <p className="text-xs text-primary">{item.count}</p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Attendee Locations */}
                {/* Attendee Locations */}
                <Card className="bg-transparent shadow-none border-0">
                    <CardHeader>
                        <CardTitle>Attendee Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table className="w-full border-3 border-white border-collapse">
                            <TableHeader>
                                <TableRow className="border-3 border-white">
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {locations.map((loc) => (
                                    <TableRow key={loc.location} className="border-3 border-white">
                                        <TableCell className="font-medium">{loc.location}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-medium">{loc.count}</span>
                                                <div className={`w-4 h-4 rounded-full ${loc.color}`} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

        </>
    );
}
