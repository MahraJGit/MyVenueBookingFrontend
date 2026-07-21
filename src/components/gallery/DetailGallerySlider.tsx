"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import { cn } from "@/lib/utils";

type DetailGallerySliderProps = {
  images: string[];
  getAlt: (index: number) => string;
  resolveImage?: (url: string) => string;
  lightboxTitle?: string;
  header?: React.ReactNode;
  itemClassName?: string;
  thumbnailClassName?: string;
  showDots?: boolean;
  swipeHint?: string;
  className?: string;
};

function resolveGalleryImage(url: string, resolveImage = getMediaProxyUrl) {
  const src = resolveImage(url);
  return {
    src,
    unoptimized: src.startsWith("/api/media"),
  };
}

export function DetailGallerySlider({
  images,
  getAlt,
  resolveImage = getMediaProxyUrl,
  lightboxTitle,
  header,
  itemClassName = "basis-[85%] pl-3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4",
  thumbnailClassName = "aspect-[16/10] sm:aspect-auto sm:h-[140px] md:h-[150px]",
  showDots = true,
  swipeHint,
  className,
}: DetailGallerySliderProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) return null;

  return (
    <>
      <section className={cn("relative z-10", className)}>
        {header}

        <Carousel opts={{ loop: true, align: "start" }} setApi={setApi} className="w-full">
          <CarouselContent className="-ml-3">
            {images.map((img, i) => {
              const { src, unoptimized } = resolveGalleryImage(img, resolveImage);
              return (
                <CarouselItem key={`${img}-${i}`} className={itemClassName}>
                  <button
                    type="button"
                    onClick={() => openLightbox(i)}
                    className="group relative block w-full overflow-hidden rounded-xl border border-[#303030] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0e]"
                    aria-label={getAlt(i)}
                  >
                    <div className={cn("relative w-full overflow-hidden", thumbnailClassName)}>
                      <Image
                        src={src}
                        alt={getAlt(i)}
                        fill
                        unoptimized={unoptimized}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                      <div className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {images.length > 1 ? (
            <>
              <CarouselPrevious className="left-1 h-8 w-8 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white sm:left-2 sm:h-9 sm:w-9" />
              <CarouselNext className="right-1 h-8 w-8 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white sm:right-2 sm:h-9 sm:w-9" />
            </>
          ) : null}
        </Carousel>

        {showDots && images.length > 1 ? (
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={`dot-${img}-${i}`}
                  type="button"
                  aria-label={`${i + 1} / ${images.length}`}
                  onClick={() => api?.scrollTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                  }`}
                />
              ))}
            </div>
            {swipeHint ? (
              <p className="text-[11px] text-zinc-500 sm:hidden">{swipeHint}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <GalleryLightbox
        images={images}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        initialIndex={lightboxIndex}
        title={lightboxTitle}
        getAlt={getAlt}
        resolveImage={resolveImage}
      />
    </>
  );
}
