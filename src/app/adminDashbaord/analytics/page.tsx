"use client"

// ================= UI Components =================
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// ================= Charts =================
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
} from "recharts"

// ================= Icons =================
import {
  CalendarRange,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  MapPin,
  Heart,
  Activity,
  type LucideIcon,
} from "lucide-react"

// ================= Next / React =================
import Image from "next/image"
import React from "react"

const titles = [
  "ATTENDEE AGE",
  "ATTENDEE GENDER",
  "ATTENDEE LOCATION",
  "ATTENDEE INTERESTS",
  "TOTAL ENGAGEMENT",
] as const

type CardTitle = typeof titles[number]

const cardIcons: Record<CardTitle, LucideIcon> = {
  "ATTENDEE AGE": CalendarRange,
  "ATTENDEE GENDER": Users,
  "ATTENDEE LOCATION": MapPin,
  "ATTENDEE INTERESTS": Heart,
  "TOTAL ENGAGEMENT": Activity,
}


// ----- Data & Config -----

const barChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const barChartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig

const pieChartData = [
  { browser: "Chrome", visitors: 275, fill: "var(--chart-1)" },
  { browser: "Safari", visitors: 200, fill: "var(--chart-2)" },
  { browser: "Firefox", visitors: 187, fill: "var(--chart-3)" },
  { browser: "Edge", visitors: 173, fill: "var(--chart-4)" },
  { browser: "Other", visitors: 90, fill: "var(--chart-5)" },
]

const pieChartConfig = {
  visitors: { label: "Visitors" },
  Chrome: { label: "Chrome", color: "var(--chart-1)" },
  Safari: { label: "Safari", color: "var(--chart-2)" },
  Firefox: { label: "Firefox", color: "var(--chart-3)" },
  Edge: { label: "Edge", color: "var(--chart-4)" },
  Other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig
const analytics = () => {
  return (
    <>
      <div className="topbar bg-[#0D0D0D] rounded-2xl p-4
                flex flex-col gap-4
                lg:flex-row lg:items-center lg:justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-3 shrink-0">
          <Users />
          <h2 className="text-white font-semibold text-sm sm:text-base">
            All Attendee Insights
          </h2>
        </div>

        {/* CENTER (SEARCH) */}
        <div className="relative w-full sm:max-w-xs lg:max-w-sm">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
          />
          <Input
            type="text"
            placeholder="Search..."
            className="
        w-full h-10 rounded-full
        pl-10 pr-4
        bg-[#D7498E75] text-white
        placeholder:text-white/70
        border-none
        focus-visible:ring-2 focus-visible:ring-pink-500
      "
          />
        </div>

        {/* RIGHT */}
        <div className="flex flex-col sm:flex-row gap-3
                  w-full lg:w-auto
                  sm:justify-end sm:items-center">

          <Button variant="outline" className="w-full sm:w-auto flex gap-2">
            Attendees: 7523 <Users size={16} />
          </Button>

          <Button variant="outline" className="w-full sm:w-auto flex gap-2">
            <SlidersHorizontal size={16} /> Filter
          </Button>
        </div>

      </div>
      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        {/* Left Stats Column */}
        <div className="w-full lg:w-2/6 flex flex-col gap-6">
          {titles.map((title) => {
            const Icon = cardIcons[title]

            return (
              <div
                key={title}
                className="bg-[#1E1E1E] p-6 rounded-3xl text-white shadow-lg hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm text-gray-400">{title}</h3>
                  <Icon className="text-gray-300 hover:text-white cursor-pointer" />
                </div>

                <h2 className="text-lg font-bold mb-4">18 - 24 Years</h2>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs flex items-center gap-2 text-green-400">
                    <TrendingUp className="w-5 h-5" /> 30% Increase
                  </span>
                  <span className="text-lg font-semibold">2,345</span>
                </div>
              </div>
            )
          })}
        </div>



        {/* Right Charts Column */}
        <div className="w-full lg:w-4/6 flex flex-col gap-4">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Bar Chart - Multiple</CardTitle>
              <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barChartConfig}>
                <BarChart data={barChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(val) => val.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                  <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 leading-none font-medium">
                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                Showing total visitors for the last 6 months
              </div>
            </CardFooter>
          </Card>

          {/* Pie Charts */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Donut Pie */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle>Pie Chart - Donut</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={pieChartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={pieChartData} dataKey="visitors" nameKey="browser" innerRadius={60} />
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

            {/* Label Pie */}
            <Card className="flex-1 flex flex-col">
              <CardHeader className="items-center pb-0">
                <CardTitle>Pie Chart - Label</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={pieChartConfig}
                  className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie data={pieChartData} dataKey="visitors" label nameKey="browser" />
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
          </div>
        </div>
      </div>

    </>
  )
}

export default analytics