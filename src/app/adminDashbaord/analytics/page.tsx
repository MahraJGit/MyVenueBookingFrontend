"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  CalendarRange,
  SlidersHorizontal,
  TrendingUp,
  Users,
  MapPin,
  Heart,
  Activity,
  type LucideIcon,
} from "lucide-react"
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardSearchInput,
  dashboardTopbarClass,
  dashboardStatCardClass,
  dashboardCardClass,
} from "@/components/dashboard/dashboard-ui"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const cardKeys = [
  "attendeeAge",
  "attendeeGender",
  "attendeeLocation",
  "attendeeInterests",
  "totalEngagement",
] as const

type CardKey = (typeof cardKeys)[number]

const barChartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const pieChartData = [
  { browser: "Chrome", visitors: 275, fill: "var(--chart-1)" },
  { browser: "Safari", visitors: 200, fill: "var(--chart-2)" },
  { browser: "Firefox", visitors: 187, fill: "var(--chart-3)" },
  { browser: "Edge", visitors: 173, fill: "var(--chart-4)" },
  { browser: "Other", visitors: 90, fill: "var(--chart-5)" },
]

export default function AnalyticsPage() {
  const t = useTranslations("adminAnalytics")
  const tCommon = useTranslations("common")

  const cardIcons: Record<CardKey, LucideIcon> = {
    attendeeAge: CalendarRange,
    attendeeGender: Users,
    attendeeLocation: MapPin,
    attendeeInterests: Heart,
    totalEngagement: Activity,
  }

  const barChartConfig = {
    desktop: { label: t("desktop"), color: "var(--chart-1)" },
    mobile: { label: t("mobile"), color: "var(--chart-2)" },
  } satisfies ChartConfig

  const pieChartConfig = {
    visitors: { label: t("visitors") },
    Chrome: { label: "Chrome", color: "var(--chart-1)" },
    Safari: { label: "Safari", color: "var(--chart-2)" },
    Firefox: { label: "Firefox", color: "var(--chart-3)" },
    Edge: { label: "Edge", color: "var(--chart-4)" },
    Other: { label: "Other", color: "var(--chart-5)" },
  } satisfies ChartConfig

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("title")} />

      <div className={dashboardTopbarClass}>
        <div className="flex items-center gap-3 shrink-0">
          <Users />
          <h2 className="text-white font-semibold text-sm sm:text-base">
            {t("title")}
          </h2>
        </div>

        <div className="w-full max-w-sm">
          <DashboardSearchInput
            type="text"
            placeholder={tCommon("search") + "..."}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3
                  w-full lg:w-auto
                  sm:justify-end sm:items-center">

          <Button variant="outline" className="w-full sm:w-auto flex gap-2">
            {t("attendeesCount", { count: 7523 })} <Users size={16} />
          </Button>

          <Button variant="outline" className="w-full sm:w-auto flex gap-2">
            <SlidersHorizontal size={16} /> {tCommon("filter")}
          </Button>
        </div>

      </div>
      <div className="mt-4 flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/6 flex flex-col gap-6">
          {cardKeys.map((key) => {
            const Icon = cardIcons[key]

            return (
              <div
                key={key}
                className={dashboardStatCardClass}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm text-gray-400">{t(key)}</h3>
                  <Icon className="text-gray-300 hover:text-white cursor-pointer" />
                </div>

                <h2 className="text-lg font-bold mb-4">{t("ageRange")}</h2>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs flex items-center gap-2 text-green-400">
                    <TrendingUp className="w-5 h-5" /> {t("percentIncrease")}
                  </span>
                  <span className="text-lg font-semibold">2,345</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="w-full lg:w-4/6 flex flex-col gap-4">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle>{t("barChartTitle")}</CardTitle>
              <CardDescription>{t("barChartPeriod")}</CardDescription>
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
                {t("trendingUp")} <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                {t("showingVisitors")}
              </div>
            </CardFooter>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Card className={cn("flex flex-1 flex-col", dashboardCardClass)}>
              <CardHeader className="items-center pb-0">
                <CardTitle>{t("pieChartDonut")}</CardTitle>
                <CardDescription>{t("barChartPeriod")}</CardDescription>
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
                  {t("trendingUp")} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                  {t("showingVisitors")}
                </div>
              </CardFooter>
            </Card>

            <Card className={cn("flex flex-1 flex-col", dashboardCardClass)}>
              <CardHeader className="items-center pb-0">
                <CardTitle>{t("pieChartLabel")}</CardTitle>
                <CardDescription>{t("barChartPeriod")}</CardDescription>
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
                  {t("trendingUp")} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                  {t("showingVisitors")}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      </DashboardPanel>
    </DashboardPageShell>
  )
}
