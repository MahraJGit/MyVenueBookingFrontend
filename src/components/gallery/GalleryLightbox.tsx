"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMediaProxyUrl } from "@/features/uploads/media-url";

type GalleryLightboxProps = {
  images: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialIndex?: number;
  title?: string;
  getAlt?: (index: number) => string;
  resolveImage?: (url: string) => string;
};

function resolveGalleryImage(url: string, resolveImage = getMediaProxyUrl) {
  const src = resolveImage(url);
  return {
    src,
    unoptimized: src.startsWith("/api/media"),
  };
}

export function GalleryLightbox({
  images,
  open,
  onOpenChange,
  initialIndex = 0,
  title,
  getAlt,
  resolveImage = getMediaProxyUrl,
}: GalleryLightboxProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!api || !open) return;
    api.scrollTo(initialIndex, true);
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, open, initialIndex]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[95vh] w-[min(100vw-1rem,72rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-none bg-black/95 p-0 shadow-2xl sm:max-w-[min(100vw-2rem,72rem)]"
        closeButtonClassName="rounded-full border border-white/20 bg-black/50 text-white opacity-100 backdrop-blur-md hover:bg-black/70 hover:opacity-100"
      >
        <DialogTitle className="sr-only">
          {title ?? getAlt?.(activeIndex) ?? "Gallery"}
        </DialogTitle>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <Carousel
            opts={{ loop: images.length > 1, align: "center" }}
            setApi={setApi}
            className="w-full flex-1"
          >
            <CarouselContent className="ml-0 h-full">
              {images.map((img, i) => {
                const { src, unoptimized } = resolveGalleryImage(img, resolveImage);
                return (
                  <CarouselItem key={`${img}-${i}`} className="basis-full pl-0">
                    <div className="relative flex h-[min(78vh,720px)] w-full items-center justify-center px-4 py-12 sm:px-10">
                      <Image
                        src={src}
                        alt={getAlt?.(i) ?? `Gallery image ${i + 1}`}
                        fill
                        unoptimized={unoptimized}
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 72rem"
                        priority={i === initialIndex}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {images.length > 1 ? (
              <>
                <CarouselPrevious className="left-2 h-10 w-10 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white sm:left-4 sm:h-11 sm:w-11" />
                <CarouselNext className="right-2 h-10 w-10 border-white/20 bg-black/60 text-white hover:bg-black/80 hover:text-white sm:right-4 sm:h-11 sm:w-11" />
              </>
            ) : null}
          </Carousel>

          {images.length > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-5 pt-10">
              <p className="text-sm font-medium text-white/90">
                {activeIndex + 1} / {images.length}
              </p>
              <div className="flex items-center gap-1.5">
                {images.map((img, i) => (
                  <button
                    key={`lightbox-dot-${img}-${i}`}
                    type="button"
                    aria-label={`${i + 1} / ${images.length}`}
                    onClick={() => api?.scrollTo(i)}
                    className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                      i === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
