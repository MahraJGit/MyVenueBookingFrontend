"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type ModalHeroBannerProps = {
  src: string;
  alt: string;
  title: string;
  gradientClassName?: string;
  className?: string;
  titleClassName?: string;
};

export function ModalHeroBanner({
  src,
  alt,
  title,
  gradientClassName = "from-[#1B1B1B] via-[#1B1B1B]/55",
  className,
  titleClassName,
}: ModalHeroBannerProps) {
  return (
    <div
      className={cn(
        "relative h-44 w-full shrink-0 overflow-hidden sm:h-52 md:h-56",
        className,
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" priority />
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t to-black/25",
          gradientClassName,
        )}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-end px-4 pb-5 text-center sm:justify-center sm:pb-0">
        <h2
          className={cn(
            "line-clamp-3 max-w-3xl text-xl font-bold tracking-tight text-white sm:text-2xl sm:tracking-[0.08em] md:text-3xl md:uppercase",
            titleClassName,
          )}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}
