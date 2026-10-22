"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MarketplaceCoverImage } from "@/components/marketplace/MarketplaceCoverImage";
import { useMarketplaceCompare } from "@/features/marketplace/use-marketplace-compare";

export function MarketplaceCompareTray() {
  const t = useTranslations("marketplace");
  const {
    items,
    count,
    max,
    hydrated,
    remove,
    clear,
    canCompare,
    compareHref,
    categoriesDiffer,
  } = useMarketplaceCompare();

  if (!hydrated || count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4">
      <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-[#303030] bg-[#151515]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              {t("compareTrayTitle", { count, max })}
            </p>
            {categoriesDiffer ? (
              <p className="mt-0.5 text-xs text-amber-300/90">
                {t("compareCategoryMismatch")}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-400">
                {canCompare ? t("compareTrayReady") : t("compareTrayPickMore")}
              </p>
            )}
            <ul className="mt-2 flex flex-wrap gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex max-w-[11rem] items-center gap-2 rounded-full border border-[#303030] bg-[#1B1B1B] py-1 pe-1 ps-1"
                >
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">
                    <MarketplaceCoverImage
                      coverImage={item.coverImage}
                      serviceTitle={item.title}
                      seed={item.id}
                      className="h-7 w-7 object-cover"
                    />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">
                    {item.title}
                  </span>
                  <button
                    type="button"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
                    onClick={() => remove(item.id)}
                    aria-label={t("compareRemoveNamed", { name: item.title })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={clear}
            >
              {t("compareClear")}
            </Button>
            {canCompare ? (
              <Button asChild size="sm" className="bg-primary">
                <Link href={compareHref}>{t("compareNow")}</Link>
              </Button>
            ) : (
              <Button size="sm" className="bg-primary" disabled>
                {t("compareNow")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
