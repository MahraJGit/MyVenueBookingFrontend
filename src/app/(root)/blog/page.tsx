"use client";

import React from 'react'
import Image from 'next/image';
import "@/styles/blog.css"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

const BlogPage = () => {
    const t = useTranslations('blog');
    const tCommon = useTranslations('common');

    return (
        <>
            <section className="blog-hero page-below-header">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="inner flex min-h-[60vh] flex-col items-center justify-center py-10 sm:min-h-[70vh] sm:py-16">
                        <div className="description max-w-3xl text-center">
                            <h1 className='page-title mb-6 text-white sm:mb-8'>
                                {t('heroTitle')}{' '}
                                <span className="text-gradient-accent">{t('heroTitleHighlight')}</span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-[#B3B3B3]">{t('heroSubtitle')}</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="our-articles py-10">
                <div className="container mx-auto px-4">
                    <div className="inner">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                            <h2 className="text-2xl font-semibold text-white">{t('ourArticles')}</h2>
                            <div className="flex items-center bg-black p-2 rounded-lg w-full md:w-auto">
                                <div className="relative flex-1">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#424242]"
                                    />
                                    <Input
                                        type="text"
                                        placeholder={t('searchPlaceholder')}
                                        className="pl-9 bg-black border-0 text-sm text-[#707070] py-2 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                                    />
                                </div>
                                <Button size="sm" variant="default" className="ml-2">
                                    {tCommon('search')}
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="w-full lg:w-1/2">
                                <div className="card">
                                    <div className="card-img h-[250px] sm:h-[300px] md:h-[350px] w-full relative">
                                        <Image
                                            src="/images/blogcard-1-img.jpg"
                                            className="rounded-2xl object-cover"
                                            alt={t('blogAlt')}
                                            fill
                                        />
                                    </div>
                                    <div className="card-body mt-4">
                                        <span className="text-sm text-[#707070] font-normal mb-2 block">
                                            {t('minRead', { minutes: 10 })}
                                        </span>
                                        <h4 className="mb-3 text-lg font-semibold">
                                            {t('sampleTitle1')}
                                        </h4>
                                        <p className="text-[#707070] mb-4 text-sm leading-relaxed">
                                            {t('sampleDesc1')}
                                        </p>
                                        <span
                                            className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                                            aria-hidden
                                        >
                                            {t('readMore')} <ArrowUpRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                                {[1, 2].map((_, i) => (
                                    <div
                                        key={i}
                                        className="card flex flex-col sm:flex-row gap-5 border-b border-[#2a2a2a] pb-4"
                                    >
                                        <div className="card-img w-full sm:w-1/3 relative h-[200px] sm:h-[180px] md:h-[200px]">
                                            <Image
                                                src="/images/blogcard-2-img.jpg"
                                                className="rounded-2xl object-cover"
                                                alt={t('blogAlt')}
                                                fill
                                            />
                                        </div>
                                        <div className="card-body w-full sm:w-2/3 mt-2 sm:mt-0">
                                            <span className="text-sm text-[#707070] font-normal mb-2 block">
                                                {t('minRead', { minutes: 8 })}
                                            </span>
                                            <h4 className="mb-2 text-base font-semibold">
                                                {t('sampleTitle2')}
                                            </h4>
                                            <p className="text-[#707070] mb-3 text-sm leading-relaxed">
                                                {t('sampleDesc2')}
                                            </p>
                                            <span
                                                className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                                                aria-hidden
                                            >
                                                {t('readMore')} <ArrowUpRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className='latest-blog py-10'>
                <div className="container mx-auto px-4">
                    <div className="inner">
                        <h2 className='mb-10'>{t('latestBlog')}</h2>
                        <div className="card-wrapper flex flex-wrap gap-8">
                            {[1, 2, 3].map((card) => (
                                <div key={card} className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]">
                                    <div className="card-img h-[263px] w-full relative">
                                        <Image src="/images/blogcard-1-img.jpg" className='rounded-2xl object-cover' alt={t('blogAlt')} fill />
                                    </div>
                                    <div className="card-body">
                                        <span className='text-sm text-[#707070] font-normal mb-4'>{t('minRead', { minutes: 10 })}</span>
                                        <h4 className='mb-4'>{t('sampleTitle1')}</h4>
                                        <p className='text-[#707070] mb-4'>
                                            {t('sampleDesc1')}
                                        </p>
                                        <span
                                            className="inline-flex cursor-default items-center gap-1 text-sm font-normal text-primary"
                                            aria-hidden
                                        >
                                            {t('readMore')} <ArrowUpRight size={14} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pegination mt-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                            <button className="text-white hover:text-primary transition flex items-center gap-1 cursor-pointer text-sm sm:text-base">
                                <ArrowLeft size={16} /> {t('previous')}
                            </button>

                            <div className="flex flex-wrap justify-center sm:justify-center gap-2">
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-white cursor-pointer hover:text-primary text-sm transition">
                                    1
                                </button>
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-md border border-white bg-primary text-white text-sm">
                                    2
                                </button>
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-white cursor-pointer hover:text-primary text-sm transition">
                                    3
                                </button>
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-white cursor-pointer hover:text-primary text-sm transition">
                                    4
                                </button>
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-white cursor-pointer text-sm transition">
                                    ...
                                </button>
                                <button className="px-3 py-1.5 sm:px-4 sm:py-2 text-white cursor-pointer hover:text-primary text-sm transition">
                                    5
                                </button>
                            </div>

                            <button className="text-white hover:text-primary transition flex items-center gap-1 cursor-pointer text-sm sm:text-base">
                                {t('next')} <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </section>
        </>
    )
}

export default BlogPage
