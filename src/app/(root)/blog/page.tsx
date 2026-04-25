import React from 'react'
import Image from 'next/image';
import "@/styles/blog.css"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

const blog = () => {
    return (
        <>
            <section className="blog-hero">
                <div className="container mx-auto px-4">
                    <div className="inner h-screen flex items-center justify-center flex-col">
                        <div className="description text-center">
                            <h1 className='mb-8'>Find Your Perfect<span className='text-primary'> Blogs</span></h1>
                            <p>More than 100 concerts in different countries are now available to you.</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="our-articles py-10">
                <div className="container mx-auto px-4">
                    <div className="inner">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                            <h2 className="text-2xl font-semibold text-white">Our Articles</h2>
                            <div className="flex items-center bg-black p-2 rounded-lg w-full md:w-auto">
                                {/* Input with icon */}
                                <div className="relative flex-1">
                                    <Search
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#424242]"
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Search your blog"
                                        className="pl-9 bg-black border-0 text-sm text-[#707070] py-2 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
                                    />
                                </div>

                                {/* Search button */}
                                <Button size="sm" variant="default" className="ml-2">
                                    Search
                                </Button>
                            </div>
                        </div>

                        {/* Articles Grid */}
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Large Card */}
                            <div className="w-full lg:w-1/2">
                                <div className="card">
                                    <div className="card-img h-[250px] sm:h-[300px] md:h-[350px] w-full relative">
                                        <Image
                                            src="/images/blogcard-1-img.jpg"
                                            className="rounded-2xl object-cover"
                                            alt="Blog"
                                            fill
                                        />
                                    </div>
                                    <div className="card-body mt-4">
                                        <span className="text-sm text-[#707070] font-normal mb-2 block">
                                            10 Min
                                        </span>
                                        <h4 className="mb-3 text-lg font-semibold">
                                            The Ultimate Guide to First-Time Home Buying
                                        </h4>
                                        <p className="text-[#707070] mb-4 text-sm leading-relaxed">
                                            Are you a first-time homebuyer? Discover essential tips, from
                                            understanding the market to securing financing, to make your
                                            home-buying journey a breeze.
                                        </p>
                                        <a
                                            className="flex items-center gap-1 text-sm font-normal text-primary"
                                            href=""
                                        >
                                            Read more <ArrowUpRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Right Smaller Cards */}
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
                                                alt="Blog"
                                                fill
                                            />
                                        </div>
                                        <div className="card-body w-full sm:w-2/3 mt-2 sm:mt-0">
                                            <span className="text-sm text-[#707070] font-normal mb-2 block">
                                                8 Min
                                            </span>
                                            <h4 className="mb-2 text-base font-semibold">
                                                10 Tips for Hosting a Memorable Event
                                            </h4>
                                            <p className="text-[#707070] mb-3 text-sm leading-relaxed">
                                                Planning an event? From venue selection to guest engagement,
                                                explore our top 10 tips to ensure your event is unforgettable.
                                            </p>
                                            <a
                                                className="flex items-center gap-1 text-sm font-normal text-primary"
                                                href=""
                                            >
                                                Read more <ArrowUpRight size={14} />
                                            </a>
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
                        <h2 className='mb-10'>Latest Blog</h2>
                        <div className="card-wrapper flex flex-wrap gap-8">
                            <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]">
                                <div className="card-img h-[263px] w-full relative">
                                    <Image src="/images/blogcard-1-img.jpg" className='rounded-2xl object-cover' alt="Blog" fill />
                                </div>
                                <div className="card-body">
                                    <span className='text-sm text-[#707070] font-normal mb-4'>10 Min</span>
                                    <h4 className='mb-4'>The Ultimate Guide to First-Time Home Buying</h4>
                                    <p className='text-[#707070] mb-4'>
                                        Are you a first-time homebuyer? Discover essential tips, from understanding the market to securing financing, to make your home-buying journey a breeze.
                                    </p>
                                    <a className='flex items-center my-3 mx-5 text-sm font-normal' href="">Read more <span className='text-primary'>
                                        <ArrowUpRight size={14} />
                                    </span></a>
                                </div>
                            </div>
                            <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]">
                                <div className="card-img h-[263px] w-full relative">
                                    <Image src="/images/blogcard-1-img.jpg" className='rounded-2xl object-cover' alt="Blog" fill />
                                </div>
                                <div className="card-body">
                                    <span className='text-sm text-[#707070] font-normal mb-4'>10 Min</span>
                                    <h4 className='mb-4'>The Ultimate Guide to First-Time Home Buying</h4>
                                    <p className='text-[#707070] mb-4'>
                                        Are you a first-time homebuyer? Discover essential tips, from understanding the market to securing financing, to make your home-buying journey a breeze.
                                    </p>
                                    <a className='flex items-center my-3 mx-5 text-sm font-normal' href="">Read more <span className='text-primary'>
                                        <ArrowUpRight size={14} />
                                    </span></a>
                                </div>
                            </div>
                            <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)]">
                                <div className="card-img h-[263px] w-full relative">
                                    <Image src="/images/blogcard-1-img.jpg" className='rounded-2xl object-cover' alt="Blog" fill />
                                </div>
                                <div className="card-body">
                                    <span className='text-sm text-[#707070] font-normal mb-4'>10 Min</span>
                                    <h4 className='mb-4'>The Ultimate Guide to First-Time Home Buying</h4>
                                    <p className='text-[#707070] mb-4'>
                                        Are you a first-time homebuyer? Discover essential tips, from understanding the market to securing financing, to make your home-buying journey a breeze.
                                    </p>
                                    <a className='flex items-center my-3 mx-5 text-sm font-normal' href="">Read more <span className='text-primary'>
                                        <ArrowUpRight size={14} />
                                    </span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pegination mt-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                            {/* Previous Button */}
                            <button className="text-white hover:text-primary transition flex items-center gap-1 cursor-pointer text-sm sm:text-base">
                                <ArrowLeft size={16} /> Previous
                            </button>

                            {/* Page Numbers */}
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

                            {/* Next Button */}
                            <button className="text-white hover:text-primary transition flex items-center gap-1 cursor-pointer text-sm sm:text-base">
                                Next <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

            </section>
        </>
    )
}

export default blog