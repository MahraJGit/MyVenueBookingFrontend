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

const page = () => {

    return (
        <>
            {/* eventslist section start */}
            <section className="eventslist py-10">
                <div className="container mx-auto px-4">

                    <div className="top-bar mb-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {/* What */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/svg/Widget.svg"
                                        alt="What"
                                        width={20}
                                        height={20}
                                    />
                                    what
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder="Event Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="concert">Concert</SelectItem>
                                        <SelectItem value="show">Show</SelectItem>
                                        <SelectItem value="sports">Sports</SelectItem>
                                        <SelectItem value="corporate">Corporate Meeting</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Where */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/svg/MapPoint.svg"
                                        alt="Where"
                                        width={20}
                                        height={20}
                                    />
                                    where
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder="Location" />
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
                                        alt="When"
                                        width={20}
                                        height={20}
                                    />
                                    when
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder="Date" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All dates</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="thisweekend">This weekend</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* price */}
                            <div className="flex flex-col md:py-1 md:w-auto w-full">
                                <span className="flex items-center gap-2 text-sm text-white">
                                    <Image
                                        src="/images/dollar.png"
                                        alt="Price"
                                        width={20}
                                        height={20}
                                    />
                                    price
                                </span>
                                <Select>
                                    <SelectTrigger className="w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                                        <SelectValue placeholder="Price Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="under1000">Under 1000</SelectItem>
                                        <SelectItem value="1000-5000">1000 - 5000</SelectItem>
                                        <SelectItem value="above5000">Above 5000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>

                        <h4 className="font-normal!">your search:</h4>
                    </div>

                    <div className="event-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img.png"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-2.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-3.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-4.png"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                        src="/images/card-img-5.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-6.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-10.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
                            <Image
                                src="/images/card-img-8.jpg"
                                alt="concert image"
                                width={500}
                                height={343}
                                layout="intrinsic"
                                className="rounded-[20px] object-cover h-[343px]! "
                            />
                            <div className="card-body max-w-[92%] w-full border border-[#303030] rounded-2xl bg-[#1B1B1B] -mt-10 relative z-0 group-hover:rounded-t-none transition-all duration-300 ease-in-out">
                                {/* Timer */}
                                <div className="timer flex justify-between bg-[#850D06] rounded-t-2xl py-2 px-4 opacity-0 group-hover:opacity-100 visibility-hidden group-hover:visible max-h-0 group-hover:max-h-10 overflow-hidden absolute -top-10 left-0 right-0 z-10 transition-all duration-300 ease-in-out">
                                    <span>Time to end</span>
                                    <span>06:34:15</span>
                                </div>
                                {/* Card Body Content */}
                                <div className="p-4 flex flex-col gap-4">
                                    <h4>Slave’s Snow</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs">Mar 6, 2025</span>
                                        <span className="text-xs">Chelyabinsk</span>
                                    </div>
                                    <div className="price text-md font-bold text-primary">
                                        from <span>$473.85</span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                    </div>

                    <div className="flex justify-center">
                        <Button variant="default" size="lg" className='cursor-pointer'>View More Concerts</Button>
                    </div>
                </div>
            </section>
            {/* eventslist section end */}

            {/* explore section start */}
            <section className="explore py-6">
                <div className="wrapper py-10 rounded-xl">
                    <div className="container mx-auto px-4">
                        <h2 className="text-2xl font-bold mb-4">Start exploring event today!</h2>
                        <p>Find concerts,shows,and more near you.</p>
                        <Button variant="default" size="lg" className='mt-6 cursor-pointer'>Start</Button>
                    </div>
                </div>
            </section>
            {/* explore section end */}

            {/* faq section start */}
            <section className="faq py-10">
                <div className="container mx-auto px-4">
                    <div className="section-header mb-8 text-center max-w-[600px] mx-auto">
                        <h2 className="mb-2">Frequently Asked <span className="text-primary">Questions</span></h2>
                        <p>Explore the most common questions and detailed answers about our events, concerts, and security to help guide your journey in the EVENJO.</p>
                    </div>

                    <div className="faq-items">
                        <Accordion type="single" collapsible className="space-y-5">
                            <AccordionItem value="item-1" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                                    <div className="head flex items-center gap-2 text-xs">
                                        <Image
                                            src="/images/faq-icon.png"
                                            alt="FAQ Icon"
                                            width={24}
                                            height={24}
                                            className="object-contain"
                                        />
                                        When Exclusive Private Market for Event ticket sale Opportunities?
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="mt-2 text-xs">
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae fuga voluptates voluptas. Minima, error.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                                    <div className="head flex items-center gap-2 text-xs">
                                        <Image
                                            src="/images/faq-icon.png"
                                            alt="FAQ Icon"
                                            width={24}
                                            height={24}
                                            className="object-contain"
                                        />
                                        How can I purchase tickets for exclusive events?
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="mt-2 text-xs">
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae fuga voluptates voluptas. Minima, error.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                                    <div className="head flex items-center gap-2 text-xs">
                                        <Image
                                            src="/images/faq-icon.png"
                                            alt="FAQ Icon"
                                            width={24}
                                            height={24}
                                            className="object-contain"
                                        />
                                        What is the refund policy for events?
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="mt-2 text-xs">
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae fuga voluptates voluptas. Minima, error.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4" className="py-5 px-4 bg-[#1B1B1B] border border-[#1F1F1F] rounded-2xl">
                                <AccordionTrigger className="flex items-center gap-2 hover:no-underline">
                                    <div className="head flex items-center gap-2 text-xs">
                                        <Image
                                            src="/images/faq-icon.png"
                                            alt="FAQ Icon"
                                            width={24}
                                            height={24}
                                            className="object-contain"
                                        />
                                        How secure is my personal information with EVENJO?
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="mt-2 text-xs">
                                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae fuga voluptates voluptas. Minima, error.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </section>
            {/* faq section start */}
        </>
    )
}

export default page