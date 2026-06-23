"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

const PrivacyPolicy = () => {
    const t = useTranslations('legal');

    const sections = [
        {
            title: t('privacySection1Title'),
            items: [
                t('privacySection1Item1'),
                t('privacySection1Item2'),
                t('privacySection1Item3'),
                t('privacySection1Item4'),
                t('privacySection1Item5'),
            ],
        },
        {
            title: t('privacySection2Title'),
            items: [
                t('privacySection2Item1'),
                t('privacySection2Item2'),
                t('privacySection2Item3'),
                t('privacySection2Item4'),
                t('privacySection2Item5'),
            ],
        },
        {
            title: t('privacySection3Title'),
            items: [
                t('privacySection3Item1'),
                t('privacySection3Item2'),
                t('privacySection3Item3'),
                t('privacySection3Item4'),
            ],
        },
        {
            title: t('privacySection4Title'),
            items: [
                t('privacySection4Item1'),
                t('privacySection4Item2'),
            ],
        },
        {
            title: t('privacySection5Title'),
            items: [
                t('privacySection5Item1'),
                t('privacySection5Item2'),
            ],
        },
        {
            title: t('privacySection6Title'),
            items: [
                t('privacySection6Item1'),
                t('privacySection6Item2'),
                t('privacySection6Item3'),
            ],
        },
    ];

    return (
        <>
            <div className="header-space h-[75px] bg-transparent"></div>

            <section className="privacy-policy py-10 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="inner w-full max-w-6xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-12">
                            {t('privacyTitle')}
                        </h1>

                        <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed">
                            {t('privacyIntro')}
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
                            {t('privacyFooter')}
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default PrivacyPolicy;
