"use client";

import React from "react";
import "@/styles/Home.css";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { HotEventsSection } from "@/components/events/HotEventsSection";
import { HomeHeroSection } from "@/components/pages/home/HomeHeroSection";
import { HomeTopVenuesSection } from "@/components/pages/home/HomeTopVenuesSection";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const Home = () => {
  const t = useTranslations("home");

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
                      alt="concert image"
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="sm:w-[50%] w-full self-center text-center px-8">
                    <h3>Refundable Tickets</h3>
                    <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
                  </div>
                </div>
                <div className="card flex sm:flex-row sm:gap-0 gap-16 flex-col-reverse rounded-2xl h-[50%] sm:py-4 py-12">
                  <div className="w-[50%] self-center">
                    <Image
                      src="/images/badge-icon.png"
                      alt="concert image"
                      width={160}
                      height={144}
                      className="mx-auto"
                    />
                  </div>
                  <div className="sm:w-[50%] w-full self-center text-center px-8">
                    <h3>Refundable Tickets</h3>
                    <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-[40%] w-full">
              <div className="card py-8 px-12 flex flex-col gap-16 rounded-2xl items-center">
                <div className="flex flex-col gap-2 text-center">
                  <h3>Book Anytime</h3>
                  <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
                </div>
                <Image
                  src="/images/service-24.png"
                  alt="concert image"
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
      <section className="testimonials py-10 overflow-hidden relative">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8 text-center">
            <h2 className="mb-2">{t("lovedByThousands")}</h2>
            <p>{t("testimonialsSubtitle")}</p>
          </div>

          <div className="marquee flex gap-6 mb-6">
            <div className="marquee-track flex gap-6">
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="testimonial min-w-[280px] max-w-[300px] rounded-2xl py-3 px-4 bg-[#1B1B1B]"
                    >
                      <p className="text-xs!">
                        Vestibulum eu quam nec neque pellentesque efficitur id eget
                        nisl. Proin porta est convallis lacus bl
                      </p>
                      <div className="profile flex gap-2 mt-4">
                        <Image
                          src="/images/profile.png"
                          alt="user image"
                          width={32}
                          height={32}
                          className="rounded-[50%]"
                        />
                        <div className="name">
                          <h5>Jane Cooper</h5>
                          <Image
                            src="/images/stars.png"
                            alt="rating stars"
                            width={60}
                            height={12}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="marquee flex gap-6">
            <div className="marquee-track reverse flex gap-6">
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="testimonial min-w-[280px] max-w-[300px] rounded-2xl py-3 px-4 bg-[#1B1B1B]"
                    >
                      <p className="text-xs!">
                        Vestibulum eu quam nec neque pellentesque efficitur id eget
                        nisl. Proin porta est convallis lacus bl
                      </p>
                      <div className="profile flex gap-2 mt-4">
                        <Image
                          src="/images/profile.png"
                          alt="user image"
                          width={32}
                          height={32}
                          className="rounded-[50%]"
                        />
                        <div className="name">
                          <h5>Jane Cooper</h5>
                          <Image
                            src="/images/stars.png"
                            alt="rating stars"
                            width={60}
                            height={12}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
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

          <div className="faq-items">
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