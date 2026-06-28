"use client"

import { useTranslations } from "next-intl"
import {
  DashboardComingSoon,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared"

export default function AttendeesPage() {
  const t = useTranslations("adminAttendees")

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} />
      <DashboardComingSoon title={t("title")} description={t("comingSoon")} />
    </div>
  )
}
