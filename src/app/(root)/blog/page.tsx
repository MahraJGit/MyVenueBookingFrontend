"use client";

import Image from "next/image";
import "@/styles/blog.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/features/i18n/locale-context";

const BlogPage = () => {
  const t = useTranslations("blog");
  const tCommon = useTranslations("common");
  const { isRtl } = useLocaleContext();

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <>
      <section className="blog-hero page-below-header">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="inner flex min-h-[60vh] flex-col items-center justify-center py-10 sm:min-h-[70vh] sm:py-16">
            <div className="description max-w-3xl text-center">
              <h1 className="page-title mb-6 text-white sm:mb-8">
                {t("heroTitle")}{" "}
                <span className="text-gradient-accent">
                  {t("heroTitleHighlight")}
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-[#B3B3B3]">{t("heroSubtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="our-articles py-10">
        <div className="container mx-auto px-4">
          <div className="inner">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-start text-2xl font-semibold text-white">
                {t("ourArticles")}
              </h2>
              <div className="flex w-full items-center rounded-lg bg-black p-2 md:w-auto">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-[#424242]"
                  />
                  <Input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className="w-full border-0 bg-black py-2 ps-9 text-sm text-[#707070] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button size="sm" variant="default" className="ms-2 shrink-0">
                  {tCommon("search")}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="w-full lg:w-1/2">
                <div className="card">
                  <div className="card-img relative h-[250px] w-full sm:h-[300px] md:h-[350px]">
                    <Image
                      src="/images/blogcard-1-img.jpg"
                      className="rounded-2xl object-cover"
                      alt={t("blogAlt")}
                      fill
                    />
                  </div>
                  <div className="card-body mt-4 text-start">
                    <span className="mb-2 block text-sm font-normal text-[#707070]">
                      {t("minRead", { minutes: 10 })}
                    </span>
                    <h4 className="mb-3 text-lg font-semibold" dir="auto">
                      {t("sampleTitle1")}
                    </h4>
                    <p
                      className="mb-4 text-sm leading-relaxed text-[#707070]"
                      dir="auto"
                    >
                      {t("sampleDesc1")}
                    </p>
                    <span
                      className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                      aria-hidden
                    >
                      {t("readMore")} <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-6 lg:w-1/2">
                {[1, 2].map((_, i) => (
                  <div
                    key={i}
                    className="card flex flex-col gap-5 border-b border-[#2a2a2a] pb-4 sm:flex-row"
                  >
                    <div className="card-img relative h-[200px] w-full sm:h-[180px] sm:w-1/3 md:h-[200px]">
                      <Image
                        src="/images/blogcard-2-img.jpg"
                        className="rounded-2xl object-cover"
                        alt={t("blogAlt")}
                        fill
                      />
                    </div>
                    <div className="card-body mt-2 w-full text-start sm:mt-0 sm:w-2/3">
                      <span className="mb-2 block text-sm font-normal text-[#707070]">
                        {t("minRead", { minutes: 8 })}
                      </span>
                      <h4 className="mb-2 text-base font-semibold" dir="auto">
                        {t("sampleTitle2")}
                      </h4>
                      <p
                        className="mb-3 text-sm leading-relaxed text-[#707070]"
                        dir="auto"
                      >
                        {t("sampleDesc2")}
                      </p>
                      <span
                        className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                        aria-hidden
                      >
                        {t("readMore")} <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="latest-blog py-10">
        <div className="container mx-auto px-4">
          <div className="inner">
            <h2 className="mb-10 text-start">{t("latestBlog")}</h2>
            <div className="card-wrapper flex flex-wrap gap-8">
              {[1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]"
                >
                  <div className="card-img relative h-[263px] w-full">
                    <Image
                      src="/images/blogcard-1-img.jpg"
                      className="rounded-2xl object-cover"
                      alt={t("blogAlt")}
                      fill
                    />
                  </div>
                  <div className="card-body text-start">
                    <span className="mb-4 text-sm font-normal text-[#707070]">
                      {t("minRead", { minutes: 10 })}
                    </span>
                    <h4 className="mb-4" dir="auto">
                      {t("sampleTitle1")}
                    </h4>
                    <p className="mb-4 text-[#707070]" dir="auto">
                      {t("sampleDesc1")}
                    </p>
                    <span
                      className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                      aria-hidden
                    >
                      {t("readMore")} <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pegination mt-8">
            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 rounded-md border border-transparent px-2.5 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:text-base"
              >
                <PrevIcon size={16} /> {t("previous")}
              </button>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-transparent px-3 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:px-4 sm:py-2"
                >
                  1
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white bg-primary px-3 py-1.5 text-sm text-white sm:px-4 sm:py-2"
                >
                  2
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-transparent px-3 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:px-4 sm:py-2"
                >
                  3
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-transparent px-3 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:px-4 sm:py-2"
                >
                  4
                </button>
                <button
                  type="button"
                  className="cursor-pointer px-3 py-1.5 text-sm text-white transition sm:px-4 sm:py-2"
                >
                  …
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-transparent px-3 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:px-4 sm:py-2"
                >
                  5
                </button>
              </div>

              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 rounded-md border border-transparent px-2.5 py-1.5 text-sm text-white transition hover:border-primary hover:text-primary sm:text-base"
              >
                {t("next")} <NextIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
