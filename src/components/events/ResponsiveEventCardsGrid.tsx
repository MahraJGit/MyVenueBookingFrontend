"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ResponsiveEventCardsGridProps = {
  children: ReactNode;
  className?: string;
};

export function ResponsiveEventCardsGrid({
  children,
  className,
}: ResponsiveEventCardsGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&>*]:min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
