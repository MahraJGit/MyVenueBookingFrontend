"use client";

import { useTranslations } from "next-intl";
import "@/styles/notFound.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <div className="notFound-hero page-below-header">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="inner flex min-h-[calc(100svh-var(--site-header-offset))] flex-col items-center justify-center gap-12 py-10 sm:gap-20 md:gap-28">
          <div className="notFound-top flex flex-col items-center text-center">
            <p className="mb-6 max-w-md text-base sm:text-lg md:text-xl">
              {t("message")}
            </p>
            <Button variant="default" size="lg" asChild>
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
          <div className="notFound-bottom">
            <h1
              className="font-bold tracking-tight text-[100px] sm:text-[150px] md:text-[200px] lg:text-[220px]"
              aria-hidden
            >
              404
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
