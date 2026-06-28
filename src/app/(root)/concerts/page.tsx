"use client";

import React from 'react'
import Image from "next/image";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import '@/styles/event-list.css';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useTranslations } from 'next-intl';

const EventCard = ({
    concertImageAlt,
    timeToEnd,
    fromLabel,
}: {
    concertImageAlt: string;
    timeToEnd: string;
    fromLabel: string;
}) => (
    <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
        <Image
            src="/images/card-img.png"
            alt={concertImageAlt}
            width={500}
            height={343}
            layout="intrinsic"
            className="rounded-[20px] object-cover h-[343px]! "
        />
        <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
            <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                <span>{timeToEnd}</span>
                <span>06:34:15</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
                <h4>Slave&apos;s Snow</h4>
                <div className="flex justify-between items-center">
                    <span className="text-xs">Mar 6, 2025</span>
                    <span className="text-xs">Chelyabinsk</span>
                </div>
                <div className="price text-md font-bold text-primary">
                    {fromLabel} <span>$473.85</span>
                </div>
            </div>
        </div>
    </Link>
);

const concerts = () => {
    const t = useTranslations('eventList');
    const tHome = useTranslations('home');
    const tEvents = useTranslations('events');
    const tCommon = useTranslations('common');

    const faqItems = ['faqQ1', 'faqQ2', 'faqQ3', 'faqQ4'] as const;

    return (
        <>
            {/* eventslist section start */}
            <section className="eventslist public-listing-section">
                <div className="container mx-auto px-4">

                    <div className="top-bar mb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {/* What */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/svg/Widget.svg"
                                        alt={tHome('what')}
                                        width={20}
                                        height={20}
                                    />
                                    {tHome('what')}
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder={tHome('eventType')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="concert">{tHome('concert')}</SelectItem>
                                        <SelectItem value="show">{tHome('show')}</SelectItem>
                                        <SelectItem value="sports">{tHome('sports')}</SelectItem>
                                        <SelectItem value="corporate">{tHome('corporateMeeting')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Where */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/svg/MapPoint.svg"
                                        alt={tHome('where')}
                                        width={20}
                                        height={20}
                                    />
                                    {tHome('where')}
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder={tHome('location')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lahore">Lahore</SelectItem>
                                        <SelectItem value="karachi">Karachi</SelectItem>
                                        <SelectItem value="islamabad">Islamabad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* When */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/svg/Calendar.svg"
                                        alt={tHome('when')}
                                        width={20}
                                        height={20}
                                    />
                                    {tHome('when')}
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder={tCommon('date')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allDates')}</SelectItem>
                                        <SelectItem value="today">{tCommon('today')}</SelectItem>
                                        <SelectItem value="thisweekend">{t('thisWeekend')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* price */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/images/dollar.png"
                                        alt={t('price')}
                                        width={20}
                                        height={20}
                                    />
                                    {t('price')}
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder={t('priceRange')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{tCommon('all')}</SelectItem>
                                        <SelectItem value="under1000">{t('under1000')}</SelectItem>
                                        <SelectItem value="1000-5000">{t('priceRangeMid')}</SelectItem>
                                        <SelectItem value="above5000">{t('above5000')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>

                        <h4 className="font-normal!">{t('yourSearch')}</h4>
                    </div>

                    <div className="event-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <EventCard
                                key={index}
                                concertImageAlt={t('concertImageAlt')}
                                timeToEnd={tEvents('timeToEnd')}
                                fromLabel={tCommon('from')}
                            />
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <Button variant="default" size="lg" className='cursor-pointer'>{t('viewMoreConcerts')}</Button>
                    </div>
                </div>
            </section>
            {/* eventslist section end */}

            {/* explore section start */}
            <section className="explore py-6">
                <div className="wrapper py-10 rounded-xl">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold mb-4">{t('exploreTitle')}</h2>
                        <p>{t('exploreDesc')}</p>
                        <Button variant="default" size="lg" className='mt-6 cursor-pointer'>{t('start')}</Button>
                    </div>
                </div>
            </section>
            {/* explore section end */}

            {/* faq section start */}
            <section className="faq py-10">
                <div className="container mx-auto px-4">
                    <div className="section-header mb-8 text-center max-w-[600px] mx-auto">
                        <h2 className="mb-2">{tHome('faqTitle')} <span className="text-primary">{tHome('faqTitleHighlight')}</span></h2>
                        <p>{tHome('faqSubtitle')}</p>
                    </div>

                    <div className="faq-items">
                        <Accordion type="single" collapsible className="space-y-5">
                            {faqItems.map((key, index) => (
                                <AccordionItem
                                    key={key}
                                    value={`item-${index + 1}`}
                                    className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl"
                                >
                                    <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                                        <div className="head flex items-center gap-2 text-xs">
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
                                    <AccordionContent className="mt-2 text-xs">
                                        {tHome('faqAnswerPlaceholder')}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>
            {/* faq section start */}
        </>
    )
}

export default concerts
