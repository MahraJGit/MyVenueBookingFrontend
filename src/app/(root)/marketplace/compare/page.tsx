"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MarketplaceCompareTable } from "@/components/marketplace/MarketplaceCompareTable";
import { Button } from "@/components/ui/button";
import {
  getPublicMarketplaceServiceBySlug,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import {
  MARKETPLACE_COMPARE_MAX,
  type MarketplaceCompareItem,
  writeMarketplaceCompareItems,
} from "@/features/marketplace/compare";
import { useLocaleContext } from "@/features/i18n/locale-context";

function ComparePageInner() {
  const t = useTranslations("marketplace");
  const searchParams = useSearchParams();
  const { locale } = useLocaleContext();

  const slugs = useMemo(() => {
    const a = searchParams.get("a")?.trim() ?? "";
    const b = searchParams.get("b")?.trim() ?? "";
    return [...new Set([a, b].filter(Boolean))].slice(
      0,
      MARKETPLACE_COMPARE_MAX,
    );
  }, [searchParams]);

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: [...marketplaceKeys.publicDetail(slug), locale, "compare"],
      queryFn: () => getPublicMarketplaceServiceBySlug(slug),
      enabled: Boolean(slug),
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);
  const services = queries
    .map((q) => q.data)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const syncKey = services.map((s) => s.id).join("|");

  // Keep tray/session in sync with the compare URL when services load.
  useEffect(() => {
    if (!syncKey) return;
    const items: MarketplaceCompareItem[] = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      categoryId: s.categoryId,
      categoryName: s.category?.name ?? null,
      coverImage: s.coverImage ?? null,
    }));
    writeMarketplaceCompareItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey is the stable identity
  }, [syncKey]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ms-2 text-zinc-400 hover:text-white"
        >
          <Link href="/marketplace">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("backToMarketplace")}
          </Link>
        </Button>

        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm uppercase tracking-wide text-primary">
            {t("badge")}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{t("compareTitle")}</h1>
          <p className="mt-2 text-sm text-zinc-400">{t("compareSubtitle")}</p>
        </div>

        {slugs.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-[#303030] bg-[#1B1B1B]/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-200">
              {t("compareNeedTwo")}
            </p>
            <p className="mt-2 text-xs text-zinc-500">{t("compareNeedTwoDesc")}</p>
            <Button asChild className="mt-6 bg-primary">
              <Link href="/marketplace">{t("backToMarketplace")}</Link>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError || services.length < 2 ? (
          <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] px-6 py-12 text-center">
            <p className="text-sm text-red-300">{t("compareLoadError")}</p>
            <Button asChild variant="outline" className="mt-6 border-[#303030]">
              <Link href="/marketplace">{t("backToMarketplace")}</Link>
            </Button>
          </div>
        ) : (
          <MarketplaceCompareTable services={services} />
        )}
      </div>
    </div>
  );
}

export default function MarketplaceComparePage() {
  const tCommon = useTranslations("common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-label={tCommon("loading")}
          />
        </div>
      }
    >
      <ComparePageInner />
    </Suspense>
  );
}
