"use client"

import { useTranslations } from "next-intl"

export default function SupportPage() {
  const t = useTranslations("adminSupport")

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-white">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  )
}
