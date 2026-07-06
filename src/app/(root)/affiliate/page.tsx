"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import "@/styles/affiliate.css";
import Image from "next/image";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/features/i18n/locale-context";

const TESTIMONIAL_CARD_COUNT = 4;

function TestimonialCard({
  quote,
  userName,
  userImageAlt,
  ratingStarsAlt,
}: {
  quote: string;
  userName: string;
  userImageAlt: string;
  ratingStarsAlt: string;
}) {
  return (
    <div className="testimonial min-w-[280px] max-w-[300px] shrink-0 rounded-2xl bg-[#1B1B1B] px-4 py-3">
      <p className="text-xs!" dir="auto">
        {quote}
      </p>
      <div className="profile mt-4 flex gap-2">
        <Image
          src="/images/profile.png"
          alt={userImageAlt}
          width={32}
          height={32}
          className="rounded-[50%]"
        />
        <div className="name">
          <h5 dir="auto">{userName}</h5>
          <Image
            src="/images/stars.png"
            alt={ratingStarsAlt}
            width={60}
            height={12}
          />
        </div>
      </div>
    </div>
  );
}

function TestimonialsMarqueeRow({
  reverse = false,
  cards,
}: {
  reverse?: boolean;
  cards: React.ReactNode[];
}) {
  return (
    <div className="marquee overflow-hidden" dir="ltr">
      <div className={`marquee-track flex gap-6 ${reverse ? "reverse" : ""}`}>
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {cards.map((card, index) => (
              <React.Fragment key={`${copy}-${index}`}>{card}</React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const AffiliatePage = () => {
  const t = useTranslations("affiliate");
  const tHome = useTranslations("home");
  const { locale } = useLocaleContext();

  const faqItems = ["faqQ1", "faqQ2", "faqQ3", "faqQ4"] as const;

  const testimonialCards = useMemo(
    () =>
      Array.from({ length: TESTIMONIAL_CARD_COUNT }, (_, index) => (
        <TestimonialCard
          key={index}
          quote={t("testimonialQuote")}
          userName={t("sampleUserName")}
          userImageAlt={tHome("userImageAlt")}
          ratingStarsAlt={tHome("ratingStarsAlt")}
        />
      )),
    [t, tHome],
  );

  return (
    <>
      <section className="affiliate-hero">
        <div className="container mx-auto px-4">
          <div className="inner flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center sm:min-h-[calc(100dvh-7rem)]">
            <div className="description text-center">
              <h1 className="page-title mb-6 text-white sm:mb-8">
                {t("heroTitlePrefix")}{" "}
                <span className="text-gradient-accent">
                  {t("heroTitleAccent")}
                </span>
                {t("heroTitleSuffix") ? ` ${t("heroTitleSuffix")}` : ""}
              </h1>
              <p className="text-sm text-[#B3B3B3] sm:text-base">
                {t("heroSubtitle")}
              </p>
              <Button asChild className="mt-6 w-full sm:mt-8 sm:w-auto" size="lg">
                <Link href="/affiliate/join">{t("joinNow")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="why-us py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="w-full md:w-[60%]">
              <div className="flex h-full flex-col gap-6">
                <div className="card flex h-auto min-h-[280px] flex-col-reverse gap-8 rounded-2xl py-8 sm:flex-row sm:gap-0 sm:py-4">
                  <div className="w-full self-center sm:w-1/2">
                    <Image
                      src="/images/dollor-icon.png"
                      alt={t("concertImageAlt")}
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="w-full self-center px-4 text-center sm:w-1/2 sm:px-8">
                    <h3 className="text-lg font-bold text-white">
                      {t("ourCommission")}
                    </h3>
                    <p className="text-[#B3B3B3]">{t("commissionDesc")}</p>
                  </div>
                </div>
                <div className="card flex h-auto min-h-[280px] flex-col-reverse gap-8 rounded-2xl py-8 sm:flex-row sm:gap-0 sm:py-4">
                  <div className="w-full self-center sm:w-1/2">
                    <Image
                      src="/images/badge-icon.png"
                      alt={t("concertImageAlt")}
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="w-full self-center px-4 text-center sm:w-1/2 sm:px-8">
                    <h3 className="text-lg font-bold text-white">
                      {t("audienceInsightsTitle")}
                    </h3>
                    <p className="text-[#B3B3B3]">{t("audienceInsightsDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[40%]">
              <div className="card flex h-full flex-col items-center gap-10 rounded-2xl px-6 py-8 sm:gap-16 sm:px-12">
                <div className="flex flex-col gap-2 text-center">
                  <h3 className="text-lg font-bold text-white">
                    {t("management")}
                  </h3>
                  <p className="text-[#B3B3B3]">{t("managementDesc")}</p>
                </div>
                <Image
                  src="/images/service-24.png"
                  alt={t("concertImageAlt")}
                  width={240}
                  height={240}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="why-us-blogs py-10">
        <div className="container mx-auto px-4">
          {[0, 1, 2, 3].map((block) => (
            <div
              key={block}
              className={`block-wrapper flex flex-col items-center gap-8 md:items-start md:gap-10 ${
                block > 0 ? "mt-10" : ""
              } ${block % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"}`}
            >
              <Image
                src="/images/blogcard-2-img.jpg"
                alt={t("blogImageAlt")}
                width={438}
                height={438}
                className="aspect-square w-full max-w-[438px] rounded-lg object-cover"
              />
              <div className="content w-full flex-1 text-start">
                <h3 className="mb-4 text-xl font-bold text-primary">
                  {t("whyPartner")}
                </h3>
                <p>{t("whyPartnerDesc")}</p>

                <div className="points mt-3">
                  <ul>
                    <li>
                      <h4>{t("moreBookingsTitle")}</h4>
                      <p>{t("moreBookingsDesc")}</p>
                    </li>
                    <li>
                      <h4>{t("moreBookingsTitle2")}</h4>
                      <p>{t("moreBookingsDesc")}</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="testimonials relative overflow-hidden py-10">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8 px-2 text-center">
            <h2 className="mb-2 text-xl sm:text-2xl">
              {tHome("lovedByThousands")}
            </h2>
            <p className="text-sm text-[#B3B3B3] sm:text-base">
              {tHome("testimonialsSubtitle")}
            </p>
          </div>

          <div key={`affiliate-testimonials-${locale}`} className="space-y-6">
            <TestimonialsMarqueeRow cards={testimonialCards} />
            <TestimonialsMarqueeRow cards={testimonialCards} reverse />
          </div>
        </div>
      </section>

      <section className="faq py-10">
        <div className="container mx-auto px-4">
          <div className="section-header mx-auto mb-8 max-w-[600px] px-2 text-center">
            <h2 className="mb-2 text-xl sm:text-2xl">
              {tHome("faqTitle")}{" "}
              <span className="text-primary">{tHome("faqTitleHighlight")}</span>
            </h2>
            <p className="text-sm text-[#B3B3B3] sm:text-base">
              {tHome("faqSubtitle")}
            </p>
          </div>

          <div className="faq-items max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-5">
              {faqItems.map((key, index) => (
                <AccordionItem
                  key={key}
                  value={`item-${index + 1}`}
                  className="rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] px-4 py-5"
                >
                  <AccordionTrigger className="flex items-center gap-2 text-start hover:no-underline">
                    <div className="head flex items-center gap-2 text-xs sm:text-sm">
                      <Image
                        src="/images/faq-icon.png"
                        alt={tHome("faqIconAlt")}
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                      <span dir="auto">{tHome(key)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="mt-2 text-xs sm:text-sm" dir="auto">
                    {tHome("faqAnswerPlaceholder")}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="news-letter">
        <div className="container mx-auto px-4">
          <div className="inner rounded-lg">
            <div className="content-wrapper">
              <h2 className="mb-3 text-xl sm:text-2xl">{t("joinPartnersTitle")}</h2>
              <p className="mb-6 text-sm text-[#B3B3B3] sm:text-base">
                {t("joinPartnersDesc")}
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/affiliate/join">{t("registerNow")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AffiliatePage;
