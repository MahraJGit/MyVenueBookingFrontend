"use client";

import React from 'react'
import { Button } from '@/components/ui/button'
import "@/styles/affiliate.css";
import Image from 'next/image';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const affiliate = () => {
    const t = useTranslations('affiliate');
    const tHome = useTranslations('home');

    const faqItems = ['faqQ1', 'faqQ2', 'faqQ3', 'faqQ4'] as const;

    return (
        <>
            {/* hero section start */}
            <section className="affiliate-hero">
                <div className="container mx-auto px-4">
                    <div className="inner flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center sm:min-h-[calc(100dvh-7rem)]">
                        <div className="description text-center">
                            <h1 className="page-title mb-6 text-white sm:mb-8">
                                {t('heroTitlePrefix')}{' '}
                                <span className="text-gradient-accent">{t('heroTitleAccent')}</span>
                                {t('heroTitleSuffix') ? ` ${t('heroTitleSuffix')}` : ''}
                            </h1>
                            <p className="text-sm text-[#B3B3B3] sm:text-base">{t('heroSubtitle')}</p>
                            <Button asChild className="mt-6 w-full sm:mt-8 sm:w-auto" size="lg">
                                <Link href="/affiliate/join">{t('joinNow')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            {/* hero section end */}

            {/* why-us section start */}
            <section className="why-us py-10">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col gap-6 md:flex-row">
                        <div className="w-full md:w-[60%]">
                            <div className="flex h-full flex-col gap-6">
                                <div className="card flex h-auto min-h-[280px] flex-col-reverse gap-8 rounded-2xl py-8 sm:flex-row sm:gap-0 sm:py-4">
                                    <div className="w-full self-center sm:w-1/2">
                                        <Image
                                            src="/images/dollor-icon.png"
                                            alt={t('concertImageAlt')}
                                            width={160}
                                            height={144}
                                            className="mx-auto"
                                        />
                                    </div>
                                    <div className="w-full self-center px-4 text-center sm:w-1/2 sm:px-8">
                                        <h3 className="text-lg font-bold text-white">{t('ourCommission')}</h3>
                                        <p className='text-[#B3B3B3]'>{t('commissionDesc')}</p>
                                    </div>
                                </div>
                                <div className="card flex h-auto min-h-[280px] flex-col-reverse gap-8 rounded-2xl py-8 sm:flex-row sm:gap-0 sm:py-4">
                                    <div className="w-full self-center sm:w-1/2">
                                        <Image
                                            src="/images/badge-icon.png"
                                            alt={t('concertImageAlt')}
                                            width={160}
                                            height={144}
                                            className="mx-auto"
                                        />
                                    </div>
                                    <div className="w-full self-center px-4 text-center sm:w-1/2 sm:px-8">
                                        <h3 className="text-lg font-bold text-white">{tHome('refundableTickets')}</h3>
                                        <p className='text-[#B3B3B3]'>{t('audienceInsightsDesc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[40%]">
                            <div className="card flex h-full flex-col items-center gap-10 rounded-2xl px-6 py-8 sm:gap-16 sm:px-12">
                                <div className="flex flex-col gap-2 text-center">
                                    <h3 className="text-lg font-bold text-white">{t('management')}</h3>
                                    <p className='text-[#B3B3B3]'>{t('managementDesc')}</p>
                                </div>
                                <Image
                                    src="/images/service-24.png"
                                    alt={t('concertImageAlt')}
                                    width={240}
                                    height={240}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* why-us section end */}

            {/* why-us-blogs section start */}
            <div className="why-us-blogs py-10">
                <div className="container mx-auto px-4">

                    <div className="block-wrapper flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt={t('blogImageAlt')}
                            width={438}
                            height={438}
                            className="aspect-square w-full max-w-[438px] rounded-lg object-cover"
                        />
                        <div className="content w-full flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>{t('whyPartner')}</h3>
                            <p>{t('whyPartnerDesc')}</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>{t('moreBookingsTitle')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                    <li>
                                        <h4>{t('moreBookingsTitle2')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper mt-10 flex flex-col items-center gap-8 md:flex-row-reverse md:items-start md:gap-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt={t('blogImageAlt')}
                            width={438}
                            height={438}
                            className="aspect-square w-full max-w-[438px] rounded-lg object-cover"
                        />
                        <div className="content w-full flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>{t('whyPartner')}</h3>
                            <p>{t('whyPartnerDesc')}</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>{t('moreBookingsTitle')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                    <li>
                                        <h4>{t('moreBookingsTitle2')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt={t('blogImageAlt')}
                            width={438}
                            height={438}
                            className="aspect-square w-full max-w-[438px] rounded-lg object-cover"
                        />
                        <div className="content w-full flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>{t('whyPartner')}</h3>
                            <p>{t('whyPartnerDesc')}</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>{t('moreBookingsTitle')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                    <li>
                                        <h4>{t('moreBookingsTitle2')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper mt-10 flex flex-col items-center gap-8 md:flex-row-reverse md:items-start md:gap-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt={t('blogImageAlt')}
                            width={438}
                            height={438}
                            className="aspect-square w-full max-w-[438px] rounded-lg object-cover"
                        />
                        <div className="content w-full flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>{t('whyPartner')}</h3>
                            <p>{t('whyPartnerDesc')}</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>{t('moreBookingsTitle')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                    <li>
                                        <h4>{t('moreBookingsTitle2')}</h4>
                                        <p>{t('moreBookingsDesc')}</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* why-us-blogs section end */}

            {/* testimonials section start */}
            <section className="testimonials py-10 overflow-hidden relative">
                <div className="container mx-auto px-4">
                    <div className="section-header mb-8 px-2 text-center">
                        <h2 className="mb-2 text-xl sm:text-2xl">{tHome('lovedByThousands')}</h2>
                        <p className="text-sm text-[#B3B3B3] sm:text-base">{tHome('testimonialsSubtitle')}</p>
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
                                                {t('testimonialQuote')}
                                            </p>
                                            <div className="profile flex gap-2 mt-4">
                                                <Image
                                                    src="/images/profile.png"
                                                    alt={tHome('userImageAlt')}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-[50%]"
                                                />
                                                <div className="name">
                                                    <h5>{t('sampleUserName')}</h5>
                                                    <Image
                                                        src="/images/stars.png"
                                                        alt={tHome('ratingStarsAlt')}
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
                                                {t('testimonialQuote')}
                                            </p>
                                            <div className="profile flex gap-2 mt-4">
                                                <Image
                                                    src="/images/profile.png"
                                                    alt={tHome('userImageAlt')}
                                                    width={32}
                                                    height={32}
                                                    className="rounded-[50%]"
                                                />
                                                <div className="name">
                                                    <h5>{t('sampleUserName')}</h5>
                                                    <Image
                                                        src="/images/stars.png"
                                                        alt={tHome('ratingStarsAlt')}
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
                    <div className="section-header mx-auto mb-8 max-w-[600px] px-2 text-center">
                        <h2 className="mb-2 text-xl sm:text-2xl">{tHome('faqTitle')} <span className="text-primary">{tHome('faqTitleHighlight')}</span></h2>
                        <p className="text-sm text-[#B3B3B3] sm:text-base">{tHome('faqSubtitle')}</p>
                    </div>

                    <div className="faq-items">
                        <Accordion type="single" collapsible className="space-y-5">
                            {faqItems.map((key, index) => (
                                <AccordionItem
                                    key={key}
                                    value={`item-${index + 1}`}
                                    className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl"
                                >
                                    <AccordionTrigger className="flex items-center gap-2 text-left hover:no-underline">
                                        <div className="head flex items-center gap-2 text-xs sm:text-sm">
                                            <Image
                                                src="/images/faq-icon.png"
                                                alt={tHome('faqIconAlt')}
                                                width={24}
                                                height={24}
                                                className="object-contain"
                                            />
                                            {tHome(key)}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="mt-2 text-xs sm:text-sm">
                                        {tHome('faqAnswerPlaceholder')}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>
            {/* faq section end */}

            {/* news-letter section start */}
            <section className="news-letter">
                <div className="container mx-auto px-4">
                    <div className="inner rounded-lg">
                        <div className="content-wrapper">
                            <h2 className="mb-3 text-xl sm:text-2xl">{t('joinPartnersTitle')}</h2>
                            <p className="mb-6 text-sm text-[#B3B3B3] sm:text-base">{t('joinPartnersDesc')}</p>
                            <Button asChild size="lg" className="w-full sm:w-auto">
                                <Link href="/affiliate/join">{t('registerNow')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            {/* news-letter section end */}

        </>
    )
}

export default affiliate
