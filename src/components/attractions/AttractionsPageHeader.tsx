"use client";

import { useTranslations } from "next-intl";

export function AttractionsPageHeader() {
  const t = useTranslations("attractions");

  return (
    <div className="mb-10 max-w-3xl">
      <h1 className="page-title mb-3 text-white">
        {t("discoverTitle")}{" "}
        <span className="text-gradient-accent">{t("title")}</span>
      </h1>
      <p className="text-muted-foreground">{t("listingSubtitle")}</p>
    </div>
  );
}
