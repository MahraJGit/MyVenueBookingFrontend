"use client";

import { type ReactNode, useState } from "react";
import { useTranslations } from "next-intl";

type CollapsibleChipRowProps = {
  items: ReactNode[];
  maxVisible?: number;
};

/**
 * Wraps a row of filter chips (categories, types, etc.) and collapses long
 * lists behind a "Show more" toggle so the sidebar doesn't grow unbounded.
 */
export function CollapsibleChipRow({
  items,
  maxVisible = 8,
}: CollapsibleChipRowProps) {
  const tCommon = useTranslations("common");
  const [expanded, setExpanded] = useState(false);

  const canCollapse = items.length > maxVisible;
  const visibleItems = !canCollapse || expanded ? items : items.slice(0, maxVisible);
  const hiddenCount = items.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleItems}
      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex shrink-0 cursor-pointer items-center rounded-[18px] border border-dashed border-[#B3B3B3] bg-transparent px-4 py-2 text-sm whitespace-nowrap text-[#B3B3B3] transition-colors hover:border-[#D7498E] hover:text-[#D580F2]"
        >
          {expanded ? tCommon("showLess") : `${tCommon("showMore")} (+${hiddenCount})`}
        </button>
      ) : null}
    </div>
  );
}
