"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  MARKETPLACE_COMPARE_EVENT,
  MARKETPLACE_COMPARE_MAX,
  type MarketplaceCompareItem,
  buildMarketplaceCompareHref,
  marketplaceCompareCategoriesDiffer,
  readMarketplaceCompareItems,
  writeMarketplaceCompareItems,
} from "./compare";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(MARKETPLACE_COMPARE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(MARKETPLACE_COMPARE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  return JSON.stringify(readMarketplaceCompareItems());
}

function getServerSnapshot() {
  return "[]";
}

export function useMarketplaceCompare() {
  const t = useTranslations("marketplace");
  const serialized = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items: MarketplaceCompareItem[] = hydrated
    ? (JSON.parse(serialized) as MarketplaceCompareItem[])
    : [];

  const isSelected = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items],
  );

  const clear = useCallback(() => {
    writeMarketplaceCompareItems([]);
  }, []);

  const remove = useCallback((id: string) => {
    writeMarketplaceCompareItems(
      readMarketplaceCompareItems().filter((item) => item.id !== id),
    );
  }, []);

  const toggle = useCallback(
    (item: MarketplaceCompareItem) => {
      const current = readMarketplaceCompareItems();
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) {
        writeMarketplaceCompareItems(
          current.filter((entry) => entry.id !== item.id),
        );
        return;
      }
      if (current.length >= MARKETPLACE_COMPARE_MAX) {
        toast.error(t("compareMaxReached", { max: MARKETPLACE_COMPARE_MAX }));
        return;
      }
      const next = [...current, item];
      writeMarketplaceCompareItems(next);
      if (marketplaceCompareCategoriesDiffer(next)) {
        toast.message(t("compareCategoryMismatch"));
      }
    },
    [t],
  );

  const addOrReplace = useCallback(
    (item: MarketplaceCompareItem) => {
      const current = readMarketplaceCompareItems();
      if (current.some((entry) => entry.id === item.id)) return;
      if (current.length < MARKETPLACE_COMPARE_MAX) {
        toggle(item);
        return;
      }
      // Replace the oldest selection when already full (detail-page convenience).
      const next = [current[1]!, item];
      writeMarketplaceCompareItems(next);
      toast.message(t("compareReplacedOldest"));
      if (marketplaceCompareCategoriesDiffer(next)) {
        toast.message(t("compareCategoryMismatch"));
      }
    },
    [t, toggle],
  );

  const compareHref = buildMarketplaceCompareHref(items.map((item) => item.slug));
  const canCompare = items.length === MARKETPLACE_COMPARE_MAX;
  const categoriesDiffer = marketplaceCompareCategoriesDiffer(items);

  return {
    items,
    count: items.length,
    max: MARKETPLACE_COMPARE_MAX,
    hydrated,
    isSelected,
    toggle,
    addOrReplace,
    remove,
    clear,
    canCompare,
    compareHref,
    categoriesDiffer,
  };
}
