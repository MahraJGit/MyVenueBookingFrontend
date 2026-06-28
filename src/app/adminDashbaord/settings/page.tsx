"use client"

import { useTranslations } from "next-intl"
import {
  DashboardComingSoon,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared"

export default function SettingsPage() {
  const t = useTranslations("adminSettings")

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} />
      <DashboardComingSoon title={t("title")} description={t("comingSoon")} />
    </div>
  )
}
