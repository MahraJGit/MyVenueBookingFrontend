"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Filter, TrendingUp } from "lucide-react";
import { PieChart, Pie } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import "@/styles/attendeeinsights.css";

const socialKeys = [
  "instagramMentions",
  "facebookShares",
  "twitterTweets",
  "eventCheckins",
] as const;

const socialCounts = [5200, 3800, 1200, 9500];
const socialIcons = [
  "/svg/Instagram.svg",
  "/svg/Facebook.svg",
  "/svg/TwitterBird.svg",
  "/svg/QrCode.svg",
];

const locations = [
  { location: "Colombo", count: 227, color: "bg-pink-500" },
  { location: "Kandy", count: 123, color: "bg-red-500" },
  { location: "Galle", count: 143, color: "bg-purple-500" },
  { location: "Jaffna", count: 70, color: "bg-yellow-500" },
  { location: "International", count: 52, color: "bg-green-500" },
];

const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
];

export default function AttendeeInsights() {
  const t = useTranslations("adminAttendeeInsights");
  const tCommon = useTranslations("common");

  const chartConfig = {
    visitors: { label: t("visitors") },
    chrome: { label: "Chrome", color: "var(--chart-1)" },
    safari: { label: "Safari", color: "var(--chart-2)" },
    firefox: { label: "Firefox", color: "var(--chart-3)" },
    edge: { label: "Edge", color: "var(--chart-4)" },
    other: { label: "Other", color: "var(--chart-5)" },
  } satisfies ChartConfig;

  return (
    <>
      <div className="topbar flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 bg-[#0D0D0D] rounded-2xl gap-6 mb-6">
        <div className="flex-1">
          <h2 className="text-base lg:text-lg font-bold text-primary">
            {t("title", { eventName: "PRAUDA THE 2ND EDITION" })}
          </h2>
          <div className="mt-2 lg:mt-4 space-y-1 text-muted-foreground text-sm lg:text-base">
            <p>• {t("eventVenue", { venue: "Musaeus College Auditorium" })}</p>
            <p>• {t("eventDate", { date: "2025-07-12" })}</p>
            <p>• {t("eventTime", { time: "19:00:00" })}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-[280px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"
              size={18}
            />
            <Input
              placeholder={tCommon("search") + "..."}
              className="pl-10 bg-primary/20 text-white rounded-full border-none w-full"
            />
          </div>

          <div className="flex gap-2 lg:gap-4 mt-2 lg:mt-0">
            <Button variant="secondary" className="gap-2">
              <Users className="h-4 w-4" />
              {t("attendeesCount", { count: 7523 })}
            </Button>
            <Button variant="secondary" className="gap-2">
              <Filter className="h-4 w-4" />
              {tCommon("filter")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>{t("pieChartDonut")}</CardTitle>
            <CardDescription>{t("chartPeriod")}</CardDescription>
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
              {t("trendingUp")} <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              {t("showingVisitors")}
            </div>
          </CardFooter>
        </Card>

        <Card className="bg-transparent shadow-none border-0">
          <CardHeader>
            <CardTitle>{t("engagementTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("engagementDesc")}</p>
          </CardHeader>
          <CardContent className="space-y-6 h-80 overflow-auto scrollbar-hidden">
            {socialKeys.map((key, index) => (
              <div key={key} className="flex items-center justify-between border-b p-4 last:border-0">
                <div className="flex items-center gap-4">
                  <img src={socialIcons[index]} alt={t(key)} className="w-8 h-8" />
                  <span className="text-muted-foreground text-xs">{t(key)}</span>
                </div>
                <p className="text-xs text-primary">{socialCounts[index]}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-transparent shadow-none border-0">
          <CardHeader>
            <CardTitle>{t("attendeeLocations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">{tCommon("location")}</TableHead>
                  <TableHead className="text-right text-muted-foreground">{tCommon("count")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc.location} className="border-border">
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
