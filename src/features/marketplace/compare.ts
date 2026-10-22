export const MARKETPLACE_COMPARE_MAX = 2;
export const MARKETPLACE_COMPARE_STORAGE_KEY = "marketplace-compare-v1";
export const MARKETPLACE_COMPARE_EVENT = "marketplace-compare-change";

export type MarketplaceCompareItem = {
  id: string;
  slug: string;
  title: string;
  categoryId?: string | null;
  categoryName?: string | null;
  coverImage?: string | null;
};

export function buildMarketplaceCompareHref(slugs: string[]): string {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(
    0,
    MARKETPLACE_COMPARE_MAX,
  );
  const sp = new URLSearchParams();
  if (unique[0]) sp.set("a", unique[0]);
  if (unique[1]) sp.set("b", unique[1]);
  const qs = sp.toString();
  return qs ? `/marketplace/compare?${qs}` : "/marketplace/compare";
}

export function readMarketplaceCompareItems(): MarketplaceCompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(MARKETPLACE_COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is MarketplaceCompareItem =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as MarketplaceCompareItem).id === "string" &&
              typeof (item as MarketplaceCompareItem).slug === "string" &&
              typeof (item as MarketplaceCompareItem).title === "string",
          ),
      )
      .slice(0, MARKETPLACE_COMPARE_MAX);
  } catch {
    return [];
  }
}

export function writeMarketplaceCompareItems(
  items: MarketplaceCompareItem[],
): MarketplaceCompareItem[] {
  const next = items.slice(0, MARKETPLACE_COMPARE_MAX);
  if (typeof window !== "undefined") {
    try {
      if (next.length === 0) {
        sessionStorage.removeItem(MARKETPLACE_COMPARE_STORAGE_KEY);
      } else {
        sessionStorage.setItem(
          MARKETPLACE_COMPARE_STORAGE_KEY,
          JSON.stringify(next),
        );
      }
    } catch {
      // ignore quota / private mode
    }
    window.dispatchEvent(new Event(MARKETPLACE_COMPARE_EVENT));
  }
  return next;
}

export function marketplaceCompareCategoriesDiffer(
  items: MarketplaceCompareItem[],
): boolean {
  const ids = items
    .map((item) => item.categoryId?.trim())
    .filter((id): id is string => Boolean(id));
  if (ids.length < 2) return false;
  return new Set(ids).size > 1;
}
