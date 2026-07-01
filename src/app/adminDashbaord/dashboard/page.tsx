"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, CircleArrowRight, Search } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useQuery } from '@tanstack/react-query'
import { listNotifications } from '@/features/notifications/api'
import Link from 'next/link'
import { TrendingUp } from "lucide-react"
import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Label,
} from "recharts"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DashboardPageShell,
  dashboardTopbarClass,
  dashboardStatCardClass,
} from '@/components/dashboard/dashboard-ui'
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

/* ---------------- PIE CHART DATA ---------------- */

const pieChartData = [
  { browser: "Chrome", visitors: 275, fill: "var(--chart-1)" },
  { browser: "Safari", visitors: 200, fill: "var(--chart-2)" },
  { browser: "Firefox", visitors: 287, fill: "var(--chart-3)" },
  { browser: "Edge", visitors: 173, fill: "var(--chart-4)" },
]

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

const Dashboard = () => {
  const t = useTranslations('adminDashboard')
  const tCommon = useTranslations('common')
  const tNotifications = useTranslations('notifications')

  const lineChartConfig = {
    desktop: {
      label: t('revenueLabel'),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const pieChartConfig = {
    visitors: {
      label: t('visitors'),
    },
    Chrome: { label: "Chrome", color: "var(--chart-1)" },
    Safari: { label: "Safari", color: "var(--chart-2)" },
    Firefox: { label: "Firefox", color: "var(--chart-3)" },
    Edge: { label: "Edge", color: "var(--chart-4)" },
  } satisfies ChartConfig

  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['notifications', 'dashboard-preview'],
    queryFn: () => listNotifications('all'),
    select: (items) => items.slice(0, 5),
  })

  return (
    <DashboardPageShell>
      <div className={dashboardTopbarClass}>

        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/images/avatar.png" alt={t('userAvatarAlt')} />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>

          <div className="leading-tight">
            <h2 className="text-white font-semibold text-sm sm:text-base">
              {t('welcomeAdmin', { name: 'Asanda' })}
            </h2>
            <span className="text-gray-400 text-xs">
              {t('systemAdministrator')}
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
              placeholder={t('searchPlaceholder')}
              className={cn(
                'h-10 w-full rounded-full border-none pl-10 pr-4',
                'bg-[#D7498E75] text-white placeholder:text-white/70',
                'focus-visible:ring-2 focus-visible:ring-pink-500',
              )}
            />
          </div>

          {/* Icons */}
          <div className="flex gap-3 justify-end">
            <NotificationBell
              href="/adminDashbaord/notifications"
              variant="admin"
            />

            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-[#EAE9E9] cursor-pointer hover:scale-105 transition">
              <Image
                src="/svg/EventAcc.svg"
                alt={t('eventsAlt')}
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
            <div className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/booking.svg" alt={t('totalEvents')} width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">{t('totalEvents')}</h3>
                  <p className="text-xl font-semibold">280</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/tickets.svg" alt={t('totalTickets')} width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">{t('totalTickets')}</h3>
                  <p className="text-xl font-semibold">1,420</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#D7498E]">
                  <Image src="/svg/carbon_currency.svg" alt={t('totalRevenue')} width={28} height={28} />
                </div>
                <div>
                  <h3 className="text-sm text-gray-300">{t('totalRevenue')}</h3>
                  <p className="text-xl font-semibold">$24,680</p>
                </div>
              </div>
            </div>

          </div>

          {/* ===== CHARTS ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LINE CHART */}
            <Card className={cn(dashboardStatCardClass, 'lg:col-span-2')}>
              <CardHeader>
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-primary">
                    {t('netSales')} <ChevronDown />
                  </CardTitle>
                  <Button variant="outline">{t('filterWeekly')}</Button>
                </div>

                <div className="flex flex-wrap gap-6 mt-4 text-sm">
                  <div>
                    <p>{t('totalRevenue')}</p>
                    <span className="text-primary text-xl font-bold">156,500 LKR</span>
                  </div>
                  <div>
                    <p>{t('totalTickets')}</p>
                    <span className="text-primary text-xl font-bold">2438</span>
                  </div>
                  <div>
                    <p>{t('totalEvents')}</p>
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
                  {t('trendingUp')} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground">{t('showingRevenue')}</div>
              </CardFooter>
            </Card>

            {/* PIE CHART */}
            <Card className={dashboardStatCardClass}>
              <CardHeader>
                <CardTitle>{t('customerActivities')}</CardTitle>
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
                                {t('visitors')}
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
                  {t('trendingUp')} <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground">{t('showingVisitors')}</div>
              </CardFooter>
            </Card>

          </div>

          {/* ===== LATEST EVENT ===== */}
          <div className={cn(dashboardStatCardClass, 'mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2')}>
            {/* LEFT */}
            <div>
              <h2 className="text-lg text-primary">{t('latestEvent')}</h2>
              <p className="text-sm mt-2">Alan Walker EDM Festival</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 bg-primary rounded-full" /> {t('paidSeats')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 bg-white rounded-full" /> {t('reservedSeats')}
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
          <div className={cn(dashboardTopbarClass, 'mt-4')}>
            <div className="flex justify-between mb-4">
              <h3 className="text-sm font-semibold">{t('upcomingEvents')}</h3>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{tNotifications('title')}</h3>
              <Link
                href="/adminDashbaord/notifications"
                className="text-xs font-medium underline"
              >
                {tCommon('viewAll')}
              </Link>
            </div>
            <div className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-sm">{t('noNotificationsYet')}</p>
              ) : (
                recentNotifications.map((n) => (
                  <Link
                    key={n.id}
                    href="/adminDashbaord/notifications"
                    className="block hover:opacity-80"
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs line-clamp-2 opacity-80">{n.description}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardPageShell>
  )
}

export default Dashboard
