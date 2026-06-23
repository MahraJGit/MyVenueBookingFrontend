"use client";

import { useTranslations } from "next-intl";
import "@/styles/notFound.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <div className="notFound-hero">
      <div className="container mx-auto px-4">
        <div className="inner h-screen flex items-center justify-center flex-col gap-32">
          <div className="notFound-top flex flex-col items-center">
            <p className="text-xl! mb-6 text-center">{t("message")}</p>
            <Button variant="default" size="lg" asChild>
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
          <div className="notFound-bottom">
            <h1 className="text-[220px]!">404</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
