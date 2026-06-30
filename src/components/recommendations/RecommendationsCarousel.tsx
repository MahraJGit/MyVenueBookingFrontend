"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type RecommendationsCarouselProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const panelClassName =
  "rounded-2xl border border-[#303030] bg-[#141414] p-4 sm:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

export function RecommendationsCarousel({
  title,
  subtitle,
  children,
}: RecommendationsCarouselProps) {
  return (
    <section
      className={`mb-10 ${panelClassName}`}
      aria-label={title}
    >
      <div className="mb-5 flex items-center gap-2.5 border-b border-[#303030] pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            {subtitle}
          </p>
        </div>
      </div>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {children}
        </CarouselContent>
        <CarouselPrevious className="-left-2 hidden border-[#303030] bg-[#1B1B1B] text-white hover:bg-[#242424] sm:flex" />
        <CarouselNext className="-right-2 hidden border-[#303030] bg-[#1B1B1B] text-white hover:bg-[#242424] sm:flex" />
      </Carousel>
    </section>
  );
}

export function RecommendationCarouselItem({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <CarouselItem className="basis-[85%] pl-4 sm:basis-[45%] md:basis-[38%] lg:basis-[30%] xl:basis-[24%]">
      <div className="h-[420px]">{children}</div>
    </CarouselItem>
  );
}

export function RecommendationsPanelSkeleton({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section
      className={`mb-10 ${panelClassName}`}
      aria-busy="true"
      aria-label={title}
    >
      <div className="mb-5 flex items-center gap-2.5 border-b border-[#303030] pb-4">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#242424]" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-[#242424]" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded bg-[#242424]" />
        </div>
      </div>
      <p className="sr-only">{subtitle}</p>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[420px] w-[280px] shrink-0 animate-pulse rounded-[20px] bg-[#242424]"
          />
        ))}
      </div>
    </section>
  );
}

export function ListingGridDivider({ label }: { label: string }) {
  return (
    <div className="mb-8 flex items-center gap-4">
      <div
        className="h-px flex-1 bg-gradient-to-r from-transparent via-[#404040] to-[#303030]"
        aria-hidden
      />
      <h2 className="shrink-0 text-sm font-semibold uppercase tracking-[0.12em] text-[#9A9A9A]">
        {label}
      </h2>
      <div
        className="h-px flex-1 bg-gradient-to-l from-transparent via-[#404040] to-[#303030]"
        aria-hidden
      />
    </div>
  );
}
