"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
// import { Card, CardAction, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlarmClock, ChevronDown, CircleArrowRight, CircleDollarSign, Clock1, CreditCard, Search } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Label,
} from "recharts"
// import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

/* ---------------- LINE CHART DATA ---------------- */

const lineChartData = [
  { month: "Jan", desktop: 120 },
  { month: "Feb", desktop: 200 },
  { month: "Mar", desktop: 150 },
  { month: "Apr", desktop: 180 },
  { month: "May", desktop: 240 },
  { month: "Jun", desktop: 300 },
]

const lineChartConfig = {
  desktop: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

/* ---------------- PIE CHART DATA ---------------- */

const pieChartData = [
  { browser: "Chrome", visitors: 275, fill: "var(--chart-1)" },
  { browser: "Safari", visitors: 200, fill: "var(--chart-2)" },
  { browser: "Firefox", visitors: 287, fill: "var(--chart-3)" },
  { browser: "Edge", visitors: 173, fill: "var(--chart-4)" },
]

const pieChartConfig = {
  visitors: {
    label: "Visitors",
  },
  Chrome: { label: "Chrome", color: "var(--chart-1)" },
  Safari: { label: "Safari", color: "var(--chart-2)" },
  Firefox: { label: "Firefox", color: "var(--chart-3)" },
  Edge: { label: "Edge", color: "var(--chart-4)" },
} satisfies ChartConfig

const totalVisitors = pieChartData.reduce(
  (acc, item) => acc + item.visitors,
  0
)
/* ---------------- DATA ---------------- */

const upcomingEvents = [
  {
    title: "Cynosure Festival",
    date: "24 March 2025",
    image: "/images/event.png",
  },
  {
    title: "Cynosure Festival",
    date: "24 March 2025",
    image: "/images/event.png",
  },
  {
    title: "Cynosure Festival",
    date: "24 March 2025",
    image: "/images/event.png",
  },
  {
    title: "Cynosure Festival",
    date: "24 March 2025",
    image: "/images/event.png",
  },
  {
    title: "Cynosure Festival",
    date: "24 March 2025",
    image: "/images/event.png",
  },
]

const notifications = [
  {
    icon: CreditCard,
    text: "Paycheck released for artists @Wayo Event",
  },
  {
    icon: CircleDollarSign,
    text: "Total revenue has been transferred to bank",
  },
  {
    icon: AlarmClock,
    text: "@Alan Walker Event in 3 days",
  },
  {
    icon: CreditCard,
    text: "Paycheck released for artists @Cynderex Event",
  },
  {
    icon: CreditCard,
    text: "Paycheck released for artists @Get Together Event",
  },
]
const Dashboard = () => {
  return (
    <>
      <div className="topbar flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center p-4 bg-[#0D0D0D] rounded-2xl">

        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/images/avatar.png" alt="User Avatar" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <h2 className="text-white font-semibold text-sm sm:text-base">
              Welcome Asanda!
            </h2>
            <span className="text-gray-400 text-xs">
              System Administrator
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end w-full lg:w-auto">

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search
              size={18}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-white/70"
            />
            <Input
              type="text"
              placeholder="Search..."
              className="
          pl-10 pr-4 h-10 rounded-full
          bg-[#D7498E75] text-white
          placeholder:text-white/70
          border-none
          w-full
          focus-visible:ring-2 focus-visible:ring-pink-500
        "
            />
          </div>

          {/* Icons */}
          <div className="flex gap-3 justify-end">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#EAE9E9] cursor-pointer hover:scale-105 transition">
              <Image
                src="/svg/bell.svg"
                alt="Notifications"
                width={22}
                height={22}
              />
            </div>

            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#EAE9E9] cursor-pointer hover:scale-105 transition">
              <Image
                src="/svg/EventAcc.svg"
                alt="Events"
                width={22}
                height={22}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ================= LEFT SECTION ================= */}
        <div className="xl:col-span-9 space-y-4">

          {/* ===== TOP STATS ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">

            {/* Card 1 */}
            <div className="bg-[#151515] p-5 rounded-2xl text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/booking.svg" alt="Total Events" width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">Total Events</h3>
                  <p className="text-xl font-semibold">280</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#151515] p-5 rounded-2xl text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/tickets.svg" alt="Total Tickets" width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">Total Tickets</h3>
                  <p className="text-xl font-semibold">1,420</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#151515] p-5 rounded-2xl text-white">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/carbon_currency.svg" alt="Total Revenue" width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">Total Revenue</h3>
                  <p className="text-xl font-semibold">$24,680</p>
                </div>
              </div>
            </div>

          </div>

          {/* ===== CHARTS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LINE CHART */}
            <Card className="bg-[#151515] lg:col-span-2">
              <CardHeader>
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    Net Sales <ChevronDown />
                  </CardTitle>
                  <Button variant="outline">Filter: Weekly</Button>
                </div>

                <div className="flex flex-wrap gap-6 mt-4 text-sm">
                  <div>
                    <p>Total Revenue</p>
                    <span className="text-primary text-xl font-bold">156,500 LKR</span>
                  </div>
                  <div>
                    <p>Total Tickets</p>
                    <span className="text-primary text-xl font-bold">2438</span>
                  </div>
                  <div>
                    <p>Total Events</p>
                    <span className="text-primary text-xl font-bold">32</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ChartContainer config={lineChartConfig}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line dataKey="desktop" stroke="var(--chart-1)" strokeWidth={2} dot />
                  </LineChart>
                </ChartContainer>
              </CardContent>

              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground">Showing last 6 months revenue</div>
              </CardFooter>
            </Card>

            {/* PIE CHART */}
            <Card className="bg-[#151515]">
              <CardHeader>
                <CardTitle>Customer Activities</CardTitle>
              </CardHeader>

              <CardContent className="pb-0">
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square max-h-60"
                >
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Pie
                      data={pieChartData}
                      dataKey="visitors"
                      innerRadius={60}
                      strokeWidth={4}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (!viewBox || !("cx" in viewBox)) return null
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan className="text-lg font-bold fill-white">
                                {totalVisitors}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 20}
                                className="text-sm fill-muted-foreground"
                              >
                                Visitors
                              </tspan>
                            </text>
                          )
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>

              <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground">Showing total visitors</div>
              </CardFooter>
            </Card>

          </div>

          {/* ===== LATEST EVENT ===== */}
          <div className="bg-[#151515] p-6 rounded-2xl mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <div>
              <h2 className="text-lg text-primary">Latest Event</h2>
              <p className="text-sm mt-2">Alan Walker EDM Festival</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 bg-primary rounded-full" /> Paid Seats
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 bg-white rounded-full" /> Reserved Seats
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-6 gap-3 justify-items-center">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded ${i % 3 === 0 ? "bg-white" : "bg-primary"}`}
                />
              ))}
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDEBAR ================= */}
        <div className="xl:col-span-3 space-y-4 mt-4">

          {/* UPCOMING EVENTS */}
          <div className="bg-[#0D0D0D] rounded-2xl p-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-semibold">Upcoming Events</h3>
              <CircleArrowRight className="text-primary" />
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex gap-2 border border-primary/50 p-3 rounded-lg">
                  <Avatar>
                    <AvatarImage src={event.image} />
                    <AvatarFallback>EV</AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <p className="font-medium text-primary">{event.title}</p>
                    <p className="text-muted-foreground">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="bg-primary rounded-2xl p-4 text-black">
            <h3 className="text-sm font-semibold mb-4">Notifications</h3>
            <div className="space-y-3">
              {notifications.map((n, i) => (
                <div key={i} className="flex gap-3">
                  <n.icon className="w-5 h-5" />
                  <p className="text-sm">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </>
  )
}

export default Dashboard