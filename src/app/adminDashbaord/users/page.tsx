"use client"

import { useTranslations } from "next-intl"
import {
  DashboardComingSoon,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared"

export default function UsersPage() {
  const t = useTranslations("adminUsers")

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={t("title")} />
      <DashboardComingSoon title={t("title")} description={t("comingSoon")} />
    </div>
  )
}
