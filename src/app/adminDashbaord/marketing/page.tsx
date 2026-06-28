"use client"

import { useTranslations } from "next-intl"
import {
  DashboardComingSoon,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared"

export default function MarketingPage() {
  const t = useTranslations("adminMarketing")

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} />
      <DashboardComingSoon title={t("title")} description={t("comingSoon")} />
    </div>
  )
}
