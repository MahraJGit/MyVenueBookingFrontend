"use client";

import React, { useMemo } from "react";
import "@/styles/Home.css";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { HotEventsSection } from "@/components/events/HotEventsSection";
import { HomeHeroSection } from "@/components/pages/home/HomeHeroSection";
import { HomeTopVenuesSection } from "@/components/pages/home/HomeTopVenuesSection";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

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
      <div
        className={`marquee-track flex gap-6 ${reverse ? "reverse" : ""}`}
      >
        {/* Duplicate the set so translateX(-50%) loops seamlessly. */}
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

const Home = () => {
  const t = useTranslations("home");
  const { locale } = useLocaleContext();

  const testimonialCards = useMemo(
    () =>
      Array.from({ length: TESTIMONIAL_CARD_COUNT }, (_, index) => (
        <TestimonialCard
          key={index}
          quote={t("testimonialQuote")}
          userName={t("sampleUserName")}
          userImageAlt={t("userImageAlt")}
          ratingStarsAlt={t("ratingStarsAlt")}
        />
      )),
    [t],
  );

  return (
    <>
      <HomeHeroSection />

      <HotEventsSection />

      <HomeTopVenuesSection />

      {/* why-us section start */}
      <section className="why-us py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-[60%] w-full">
              <div className="flex flex-col gap-6 h-full">
                <div className="card flex sm:flex-row sm:gap-0 gap-16 flex-col-reverse rounded-2xl h-[50%] sm:py-4 py-12">
                  <div className="w-[50%] self-center">
                    <Image
                      src="/images/dollor-icon.png"
                      alt=""
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="sm:w-[50%] w-full self-center text-center px-8">
                    <h3>{t("refundableTickets")}</h3>
                    <p>{t("trustFlexibleRefundsDesc")}</p>
                  </div>
                </div>
                <div className="card flex sm:flex-row sm:gap-0 gap-16 flex-col-reverse rounded-2xl h-[50%] sm:py-4 py-12">
                  <div className="w-[50%] self-center">
                    <Image
                      src="/images/badge-icon.png"
                      alt=""
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="sm:w-[50%] w-full self-center text-center px-8">
                    <h3>{t("smartDeals")}</h3>
                    <p>{t("trustSmartDealsDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-[40%] w-full">
              <div className="card py-8 px-12 flex flex-col gap-16 rounded-2xl items-center">
                <div className="flex flex-col gap-2 text-center">
                  <h3>{t("whyBookAnytimeTitle")}</h3>
                  <p>{t("whyBookAnytimeDesc")}</p>
                </div>
                <Image
                  src="/images/service-24.png"
                  alt=""
                  width={240}
                  height={240}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* why-us section end */}

      {/* testimonials section start */}
      <section className="testimonials relative overflow-hidden py-10">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8 text-center">
            <h2 className="mb-2">{t("lovedByThousands")}</h2>
            <p>{t("testimonialsSubtitle")}</p>
          </div>

          <div
            key={`testimonials-marquee-${locale}`}
            className="space-y-6"
          >
            <TestimonialsMarqueeRow cards={testimonialCards} />
            <TestimonialsMarqueeRow cards={testimonialCards} reverse />
          </div>
        </div>
      </section>
      {/* testimonials section end */}

      {/* faq section start */}
      <section className="faq py-10">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8 text-center max-w-[600px] mx-auto">
            <h2 className="mb-2">{t("faqTitle")} <span className="text-primary">{t("faqTitleHighlight")}</span></h2>
            <p>{t("faqSubtitle")}</p>
          </div>

          <div className="faq-items max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-5">
              <AccordionItem value="item-1" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                  <div className="head flex items-center gap-2 text-xs">
                    <Image
                      src="/images/faq-icon.png"
                      alt={t("faqIconAlt")}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    {t("faqQ1")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-2 text-xs">
                  {t("faqAnswerPlaceholder")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                  <div className="head flex items-center gap-2 text-xs">
                    <Image
                      src="/images/faq-icon.png"
                      alt={t("faqIconAlt")}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    {t("faqQ2")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-2 text-xs">
                  {t("faqAnswerPlaceholder")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                  <div className="head flex items-center gap-2 text-xs">
                    <Image
                      src="/images/faq-icon.png"
                      alt={t("faqIconAlt")}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    {t("faqQ3")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-2 text-xs">
                  {t("faqAnswerPlaceholder")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                  <div className="head flex items-center gap-2 text-xs">
                    <Image
                      src="/images/faq-icon.png"
                      alt={t("faqIconAlt")}
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                    {t("faqQ4")}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="mt-2 text-xs">
                  {t("faqAnswerPlaceholder")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      {/* faq section end */}
    </>
  );
};

export default Home;