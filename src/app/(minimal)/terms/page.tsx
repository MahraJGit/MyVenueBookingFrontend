import { getTranslations } from "next-intl/server";
import React from "react";

export default async function TermsPage() {
  const t = await getTranslations("legal");

  const sections = [
    {
      title: t("termsSection1Title"),
      items: [t("termsSection1Item1"), t("termsSection1Item2"), t("termsSection1Item3")],
    },
    {
      title: t("termsSection2Title"),
      items: [t("termsSection2Item1"), t("termsSection2Item2"), t("termsSection2Item3")],
    },
    {
      title: t("termsSection3Title"),
      items: [t("termsSection3Item1"), t("termsSection3Item2"), t("termsSection3Item3")],
    },
    {
      title: t("termsSection4Title"),
      items: [t("termsSection4Item1"), t("termsSection4Item2"), t("termsSection4Item3")],
    },
    {
      title: t("termsSection5Title"),
      items: [t("termsSection5Item1"), t("termsSection5Item2"), t("termsSection5Item3")],
    },
    {
      title: t("termsSection6Title"),
      items: [t("termsSection6Item1"), t("termsSection6Item2"), t("termsSection6Item3")],
    },
  ];

  return (
    <>
      <div className="header-space h-[75px] bg-transparent"></div>

      <section className="terms py-10 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inner w-full max-w-6xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-12">
              {t("termsTitle")}
            </h1>

            <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
              {t("termsIntro")}
            </p>

            <ol className="list-decimal flex flex-col gap-6 sm:gap-10 my-6 sm:my-10 marker:text-lg pl-5 sm:pl-8">
              {sections.map((section) => (
                <li key={section.title}>
                  <h5 className="text-lg sm:text-xl font-semibold mb-2">{section.title}</h5>
                  <ul className="list-disc pl-5 sm:pl-8 space-y-2 text-base sm:text-lg leading-relaxed">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            <p className="mt-8 text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t("termsFooter")}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
