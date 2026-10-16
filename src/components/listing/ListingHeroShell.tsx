"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ListingHeroVariant =
  | "events"
  | "venues"
  | "attractions"
  | "marketplace";

type ListingHeroShellProps = {
  variant: ListingHeroVariant;
  title: string;
  titleHighlight: string;
  subtitle: string;
  children: ReactNode;
};

export function ListingHeroShell({
  variant,
  title,
  titleHighlight,
  subtitle,
  children,
}: ListingHeroShellProps) {
  return (
    <div className="listing-hero-wrap relative mb-10 sm:mb-12">
      <div
        className={cn(
          "listing-hero overflow-hidden rounded-2xl border border-[#303030]",
          `listing-hero--${variant}`,
        )}
      >
        <div className="listing-hero__inner relative px-4 pb-28 pt-14 sm:px-6 sm:pb-32 sm:pt-16 lg:px-8 lg:pb-36 lg:pt-20">
          <div className="relative z-[1] mx-auto max-w-3xl text-center">
            <h1 className="page-title mb-3 text-white">
              {title}{" "}
              <span className="text-gradient-accent">{titleHighlight}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="listing-hero-filter-bar relative z-10 mx-auto -mt-16 w-[min(100%,68rem)] px-3 sm:-mt-[4.5rem] sm:px-4 lg:-mt-20">
        <div className="rounded-2xl border border-[#303030] bg-[#161616]/95 p-5 shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-md sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ListingFieldLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "mb-2 block text-xs font-medium tracking-wide text-[#B3B3B3]",
        className,
      )}
    >
      {children}
    </label>
  );
}

export const listingControlClass =
  "h-12 w-full min-w-0 border-[#303030] bg-[#0C0C0C] text-white hover:bg-[#0C0C0C] data-[size=default]:h-12";

export const listingSelectTriggerClass = cn(
  listingControlClass,
  "justify-between dark:hover:bg-[#0C0C0C] data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px]",
);

export const listingFieldShellClass = "flex min-w-0 flex-col";
