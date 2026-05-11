import React from 'react'
import { Button } from '@/components/ui/button'
import "@/styles/affiliate.css";
import Image from 'next/image';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import Link from 'next/link';



const affiliate = () => {
    return (
        <>
            {/* hero section start */}
            <section className="affiliate-hero">
                <div className="container mx-auto px-4">
                    <div className="inner h-screen flex items-center justify-center flex-col">
                        <div className="description text-center">
                            <h1 className='mb-8'>Join the MyVenueBooking affiliate program</h1>
                            <p>Take your business to the next level with one of the best Venue Booking in the world!</p>
                            <Button asChild className='mt-8' size='lg'>
                                <Link href="/affiliate/join">Join Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            {/* hero section end */}

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
                                        <h3 className="text-lg font-bold text-white">Our commission</h3>
                                        <p className='text-[#B3B3B3]'>Receive a 4% commission on accommodations,</p>
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
                                        <h3 className="text-lg font-bold text-white">Refundable Tickets</h3>
                                        <p className='text-[#B3B3B3]'>Gain access to the reservation details of each booking to help understand audience behavior.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:w-[40%] w-full">
                            <div className="card py-8 px-12 flex flex-col gap-16 rounded-2xl items-center">
                                <div className="flex flex-col gap-2 text-center">
                                    <h3 className="text-lg font-bold text-white">Management</h3>
                                    <p className='text-[#B3B3B3]'>Get dedicated account management and quarterly updates on venue booking.</p>
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

            {/* why-us-blogs section start */}
            <div className="why-us-blogs py-10">
                <div className="container mx-auto px-4">

                    <div className="block-wrapper flex md:flex-row gap-10 flex-col ">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt="blog image"
                            width={300}
                            height={200}
                            className='rounded-lg w-[438px]! h-[438px]! object-cover'
                        />
                        <div className="content flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>Why Partner With Us?</h3>
                            <p>Joining hands with us is more than just listing a space. It is about building long-term growth together. Every booking means shared success and a chance to reach more people.</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>1 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                    <li>
                                        <h4>2 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper flex md:flex-row-reverse gap-10 flex-col mt-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt="blog image"
                            width={300}
                            height={200}
                            className='rounded-lg w-[438px]! h-[438px]! object-cover'
                        />
                        <div className="content flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>Why Partner With Us?</h3>
                            <p>Joining hands with us is more than just listing a space. It is about building long-term growth together. Every booking means shared success and a chance to reach more people.</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>1 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                    <li>
                                        <h4>2 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper flex md:flex-row gap-10 flex-col ">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt="blog image"
                            width={300}
                            height={200}
                            className='rounded-lg w-[438px]! h-[438px]! object-cover'
                        />
                        <div className="content flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>Why Partner With Us?</h3>
                            <p>Joining hands with us is more than just listing a space. It is about building long-term growth together. Every booking means shared success and a chance to reach more people.</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>1 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                    <li>
                                        <h4>2 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                </ul>

                            </div>
                        </div>
                    </div>
                    <div className="block-wrapper flex md:flex-row-reverse gap-10 flex-col mt-10">
                        <Image
                            src="/images/blogcard-2-img.jpg"
                            alt="blog image"
                            width={300}
                            height={200}
                            className='rounded-lg w-[438px]! h-[438px]! object-cover'
                        />
                        <div className="content flex-1">
                            <h3 className='text-xl font-bold text-primary mb-4'>Why Partner With Us?</h3>
                            <p>Joining hands with us is more than just listing a space. It is about building long-term growth together. Every booking means shared success and a chance to reach more people.</p>

                            <div className="points mt-3">
                                <ul>
                                    <li>
                                        <h4>1 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
                                    </li>
                                    <li>
                                        <h4>2 More Bookings, Less Effort:</h4>
                                        <p>Your venue gets seen by thousands of users daily. This increases the chances of bookings without extra marketing costs.</p>
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
                    <div className="section-header mb-8 text-center">
                        <h2 className="mb-2">Loved by Thousands</h2>
                        <p>Smooth, easy ticket buying — hear it from our happy users.</p>
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
            {/* faq section end */}

            {/* news-letter section start */}
            <section className="news-letter">
                <div className="container mx-auto px-4">
                    <div className="inner rounded-lg">
                        <div className="content-wrapper">
                            <h2 className="mb-3">Join as a partners today!</h2>
                            <p className="mb-6">Join our network of trusted partners and grow your business with us.
                                Whether you're a venue owner or looking to earn through referrals, we have opportunities for everyone.
                            </p>
                            <Button asChild size='lg'>
                                <Link href="/affiliate/join">Register Now</Link>
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