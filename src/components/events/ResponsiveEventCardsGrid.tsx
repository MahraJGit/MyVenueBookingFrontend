"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ResponsiveEventCardsGridProps = {
  children: ReactNode;
  className?: string;
  /** Cap listing grids at three columns (events/venues pages). */
  maxThreeColumns?: boolean;
};

export function ResponsiveEventCardsGrid({
  children,
  className,
  maxThreeColumns = false,
}: ResponsiveEventCardsGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-6 [&>*]:min-w-0",
        maxThreeColumns
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
