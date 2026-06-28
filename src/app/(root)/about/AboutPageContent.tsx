"use client";

import Image from "next/image";
import { PhoneCall, Mail, MapPinPlusInside } from "lucide-react";
import { useTranslations } from "next-intl";
import "@/styles/about.css";

export default function AboutPageContent() {
  const t = useTranslations("about");

  return (
    <>
      <section className="about-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="inner min-h-[70vh] flex flex-col items-center justify-center py-10 sm:min-h-[75vh] sm:py-16">
            <div className="description max-w-3xl">
              <h1 className="font-bold mb-10 flex items-center justify-center flex-wrap leading-tight">
                Ab
                <span className="relative top-4 md:top-8 -left-2 md:-left-4">
                  <Image
                    src="/svg/mike.svg"
                    alt={t("microphoneAlt")}
                    width={60}
                    height={60}
                    className="w-[50px] md:w-[80px] h-auto"
                  />
                </span>
                ut us
              </h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed px-2 md:px-0">
                {t("heroDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="why-choose py-12">
        <div className="container mx-auto px-4">
          <div className="inner text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("whyChoose")}</h2>
            <p className="text-gray-300 mb-8">{t("whyChooseSubtitle")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="card lgcard flex flex-col md:flex-row items-center bg-[#161616A6] rounded-2xl overflow-hidden h-full">
                  <div className="w-full md:w-[60%] text-left space-y-3 md:ms-14 p-6">
                    <h4 className="text-xl font-semibold">{t("ticketOnWay")}</h4>
                    <p className="text-sm text-gray-300">{t("ticketOnWayDesc")}</p>
                  </div>
                  <div className="w-full md:w-[40%] relative h-[300px] self-end">
                    <div className="absolute bottom-0 right-0 w-full h-[280px]">
                      <Image
                        src="/images/mobile.png"
                        alt={t("ticketAlt")}
                        fill
                        className="object-contain object-bottom"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="card smcards flex flex-col items-center text-center bg-[#161616A6] rounded-2xl p-6 h-full">
                  <div className="mb-5">
                    <Image
                      src="/svg/online-ticket.svg"
                      alt={t("onlineTicketAlt")}
                      width={100}
                      height={100}
                      className="object-contain mx-auto"
                    />
                  </div>
                  <div className="text-left space-y-3">
                    <h4 className="text-lg font-semibold">{t("onlineTicket")}</h4>
                    <p className="text-sm text-gray-300">{t("onlineTicketDesc")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <div className="card smcards flex flex-col justify-between bg-[#161616A6] rounded-2xl p-6 h-full text-center md:text-left">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">{t("customerSupport")}</h4>
                    <p className="text-sm text-gray-300">{t("customerSupportDesc")}</p>
                  </div>
                  <div className="mt-6 flex justify-center md:justify-end">
                    <Image
                      src="/svg/support.svg"
                      alt={t("supportAlt")}
                      width={100}
                      height={100}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="lgcard flex flex-col md:flex-row items-center bg-[#161616A6] rounded-2xl overflow-hidden h-full p-6">
                  <div className="w-full md:w-[80%] text-left space-y-3 md:pr-6">
                    <h4 className="text-xl font-semibold">{t("eventDiscovery")}</h4>
                    <p className="text-sm text-gray-300">{t("eventDiscoveryDesc")}</p>
                  </div>
                  <div className="w-full md:w-[20%] flex justify-center md:justify-end mt-6 md:mt-0">
                    <Image
                      src="/svg/discovery.svg"
                      alt={t("discoveryAlt")}
                      height={100}
                      width={100}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="beyond-the-ticket py-12">
        <div className="container mx-auto px-4">
          <div className="inner space-y-12">
            <div className="beyond-card flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="w-full md:w-[40%] h-[280px] md:h-[440px]">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/beyond-ticket.jpg"
                    alt={t("beyondTicketAlt")}
                    fill
                    className="object-cover rounded-2xl"
                  />
                </div>
              </div>
              <div className="w-full md:w-[60%] flex justify-center md:justify-end h-auto md:h-[440px]">
                <div className="w-full md:w-2/3 flex flex-col justify-center text-center md:text-left mt-4 md:mt-0">
                  <h2 className="font-semibold mb-4 leading-snug">{t("beyondTicket")}</h2>
                  <ol className="list-decimal pl-6 space-y-2 text-gray-300">
                    <li><p>{t("beyondTicket1")}</p></li>
                    <li><p>{t("beyondTicket2")}</p></li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="beyond-card flex flex-col md:flex-row-reverse items-center justify-center gap-8">
              <div className="w-full md:w-[40%] h-[280px] md:h-[440px]">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/beyond-ticket-2.jpg"
                    alt={t("beyondTicketAlt")}
                    fill
                    className="object-cover rounded-2xl"
                  />
                </div>
              </div>
              <div className="w-full md:w-[60%] flex justify-center md:justify-start h-auto md:h-[440px]">
                <div className="w-full md:w-2/3 flex flex-col justify-center text-center md:text-left mt-4 md:mt-0">
                  <ol className="list-decimal pl-6 space-y-2 text-gray-300">
                    <li><p>{t("beyondTicket3")}</p></li>
                    <li><p>{t("beyondTicket4")}</p></li>
                    <li><p>{t("beyondTicket5")}</p></li>
                    <li><p>{t("beyondTicket6")}</p></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="evenjo-story py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="inner text-center">
            <div className="evenjo-story-text mb-8">
              <h2 className="font-semibold mb-3">{t("storyTitle")}</h2>
              <p className="text-gray-300 text-base md:text-lg">{t("storySubtitle")}</p>
            </div>
            <div className="relative w-full h-[280px] sm:h-[360px] md:h-[480px] lg:h-[550px] mt-10">
              <Image
                src="/images/evenjo-story.png"
                alt={t("storyImageAlt")}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="contact-us pb-16" id="contact-us">
        <div className="container mx-auto px-4">
          <div className="inner">
            <div className="contact-us-cards flex flex-wrap justify-center gap-6 w-full">
              <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] flex flex-col items-center text-center p-6 rounded-2xl shadow-lg bg-[#1F1F1F]">
                <div className="card-icon w-[126px] h-[126px] flex items-center justify-center text-primary">
                  <PhoneCall size={30} />
                </div>
                <div className="card-text mt-4">
                  <h5 className="text-lg font-semibold">+132458900</h5>
                </div>
              </div>
              <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] flex flex-col items-center text-center p-6 rounded-2xl shadow-lg bg-[#1F1F1F]">
                <div className="card-icon w-[126px] h-[126px] flex items-center justify-center text-primary">
                  <Mail size={30} />
                </div>
                <div className="card-text mt-4">
                  <h5 className="text-lg font-semibold">Evenjo.info@yahoo.com</h5>
                </div>
              </div>
              <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] flex flex-col items-center text-center p-6 rounded-2xl shadow-lg bg-[#1F1F1F]">
                <div className="card-icon w-[126px] h-[126px] flex items-center justify-center text-primary">
                  <MapPinPlusInside size={30} />
                </div>
                <div className="card-text mt-4">
                  <h5 className="text-lg font-semibold">Las Vegas</h5>
                </div>
              </div>
            </div>
            <div className="map-img h-80 relative mt-20">
              <Image
                src="/images/map.png"
                alt={t("mapAlt")}
                fill
                className="object-cover mt-10 rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
