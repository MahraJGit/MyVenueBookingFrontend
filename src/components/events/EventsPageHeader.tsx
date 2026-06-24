"use client";

import { useTranslations } from "next-intl";

export function EventsPageHeader() {
  const tEvents = useTranslations("events");

  return (
    <div className="mb-10 max-w-3xl">
      <h1 className="page-title mb-3 text-white">
        {tEvents("discoverTitle")}{" "}
        <span className="text-gradient-accent">{tEvents("title")}</span>
      </h1>
      <p className="text-muted-foreground">{tEvents("listingSubtitle")}</p>
    </div>
  );
}
