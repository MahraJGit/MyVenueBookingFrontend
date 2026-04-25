import React from 'react'
import "@/styles/about.css"
import Image from 'next/image'
import { PhoneCall } from 'lucide-react';
import { Mail } from 'lucide-react';
import { MapPinPlusInside } from 'lucide-react';

const about = () => {
    return (
        <>
            <section className="about-hero py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="inner min-h-[80vh] flex items-center justify-center flex-col text-center">
                        <div className="description max-w-3xl">
                            <h1 className=" font-bold mb-10 flex items-center justify-center flex-wrap leading-tight">
                                Ab
                                <span className="relative top-4 md:top-8 -left-2 md:-left-4">
                                    <Image src="/svg/mike.svg" alt="microphone" width={60} height={60} className="w-[50px] md:w-[80px] h-auto" />
                                </span>
                                ut us
                            </h1>
                            <p className="text-gray-300 text-base md:text-lg leading-relaxed px-2 md:px-0">
                                Welcome to <span className="font-semibold text-white">Evenjo</span> – your go-to platform for finding,
                                booking, and enjoying top events worldwide. From concerts and sports to theater and festivals, we make
                                unforgettable experiences easy to access. <br className="hidden md:block" />
                                Behind the scenes, our friendly and passionate team is here to support you every step of the way. Got a
                                question or need help? We’re just a message away!
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="why-choose py-12">
                <div className="container mx-auto px-4">
                    <div className="inner text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose Evenjo?</h2>
                        <p className="text-gray-300 mb-8">Experience excellence with a team that truly cares</p>

                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Left Column (big card) */}
                            <div className="md:col-span-2">
                                <div className="card lgcard flex flex-col md:flex-row items-center bg-[#161616A6] rounded-2xl overflow-hidden h-full">

                                    {/* Text Section */}
                                    <div className="w-full md:w-[60%] text-left space-y-3 md:ms-14 p-6">
                                        <h4 className="text-xl font-semibold">Your Ticket is on the Way!</h4>
                                        <p className="text-sm text-gray-300">
                                            We’re sending your ticket straight to your email. Just confirm your name and email below, and you’re all set for an unforgettable experience! 🚀
                                        </p>
                                    </div>

                                    {/* Image Section */}
                                    <div className="w-full md:w-[40%] relative h-[300px] self-end">
                                        <div className="absolute bottom-0 right-0 w-full h-[280px]">
                                            <Image
                                                src="/images/mobile.png"
                                                alt="ticket"
                                                fill
                                                className="object-contain object-bottom"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div>
                                <div className="card smcards flex flex-col items-center text-center bg-[#161616A6] rounded-2xl p-6 h-full">
                                    <div className="mb-5">
                                        <Image
                                            src="/svg/online-ticket.svg"
                                            alt="Online Ticket"
                                            width={100}
                                            height={100}
                                            className="object-contain mx-auto"
                                        />
                                    </div>
                                    <div className="text-left space-y-3">
                                        <h4 className="text-lg font-semibold">Online Ticket Purchasing</h4>
                                        <p className="text-sm text-gray-300">
                                            Browse events, select seats, and buy tickets instantly with secure payment methods 🎭
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            {/* Left Column */}
                            <div>
                                <div className="card smcards flex flex-col justify-between bg-[#161616A6] rounded-2xl p-6 h-full text-center md:text-left">
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">Customer Support</h4>
                                        <p className="text-sm text-gray-300">
                                            24/7 live chat, email, or phone support for booking issues 🌟
                                        </p>
                                    </div>
                                    <div className="mt-6 flex justify-center md:justify-end">
                                        <Image
                                            src="/svg/support.svg"
                                            alt="Support"
                                            width={100}
                                            height={100}
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (wide card) */}
                            <div className="md:col-span-2">
                                <div className="lgcard flex flex-col md:flex-row items-center bg-[#161616A6] rounded-2xl overflow-hidden h-full p-6">
                                    {/* Text Section */}
                                    <div className="w-full md:w-[80%] text-left space-y-3 md:pr-6">
                                        <h4 className="text-xl font-semibold">Event Discovery</h4>
                                        <p className="text-sm text-gray-300">
                                            Get personalized suggestions based on your preferences, location, and past bookings. Filter by categories, venues, and price ranges for the perfect event 💰
                                        </p>
                                    </div>

                                    {/* Image Section */}
                                    <div className="w-full md:w-[20%] flex justify-center md:justify-end mt-6 md:mt-0">
                                        <Image
                                            src="/svg/discovery.svg"
                                            alt="discovery"
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
                        {/* First Section */}
                        <div className="beyond-card flex flex-col md:flex-row items-center justify-center gap-8">
                            {/* Image Section */}
                            <div className="w-full md:w-[40%] h-[280px] md:h-[440px]">
                                <div className="relative w-full h-full">
                                    <Image
                                        src="/images/beyond-ticket.jpg"
                                        alt="beyond ticket"
                                        fill
                                        className="object-cover rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Text Section */}
                            <div className="w-full md:w-[60%] flex justify-center md:justify-end h-auto md:h-[440px]">
                                <div className="w-full md:w-2/3 flex flex-col justify-center text-center md:text-left mt-4 md:mt-0">
                                    <h2 className=" font-semibold mb-4 leading-snug">
                                        More Than Just a Ticket — The Evenjo Experience
                                    </h2>
                                    <ol className="list-decimal pl-6 space-y-2 text-gray-300">
                                        <li>
                                            <p>Every ticket is the start of a memory, not just entry to an event.</p>
                                        </li>
                                        <li>
                                            <p>
                                                Whether it’s a concert, sports match, or theater show – your full experience matters.
                                            </p>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Second Section */}
                        <div className="beyond-card flex flex-col md:flex-row-reverse items-center justify-center gap-8">
                            {/* Image Section */}
                            <div className="w-full md:w-[40%] h-[280px] md:h-[440px]">
                                <div className="relative w-full h-full">
                                    <Image
                                        src="/images/beyond-ticket-2.jpg"
                                        alt="beyond ticket"
                                        fill
                                        className="object-cover rounded-2xl"
                                    />
                                </div>
                            </div>

                            {/* Text Section */}
                            <div className="w-full md:w-[60%] flex justify-center md:justify-start h-auto md:h-[440px]">
                                <div className="w-full md:w-2/3 flex flex-col justify-center text-center md:text-left mt-4 md:mt-0">
                                    <ol className="list-decimal pl-6 space-y-2 text-gray-300">
                                        <li>
                                            <p>Evenjo ensures a smooth and enjoyable journey from booking to the final moment.</p>
                                        </li>
                                        <li>
                                            <p>We connect you to world-class events with just a few clicks.</p>
                                        </li>
                                        <li>
                                            <p>Our platform is designed for ease, speed, and excitement.</p>
                                        </li>
                                        <li>
                                            <p>With Evenjo, every step feels like part of the show.</p>
                                        </li>
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
                        {/* Heading */}
                        <div className="evenjo-story-text mb-8">
                            <h2 className="font-semibold mb-3">
                                What is the story of Evenjo?
                            </h2>
                            <p className="text-gray-300 text-base md:text-lg">
                                Every great journey begins with a single step — this is ours
                            </p>
                        </div>

                        {/* Image */}
                        <div className="relative w-full h-[280px] sm:h-[360px] md:h-[480px] lg:h-[550px] mt-10">
                            <Image
                                src="/images/evenjo-story.png"
                                alt="evenjo story"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </section>
            <section className="contact-us">
                <div className='container mx-auto px-4'>
                    <div className="inner">
                        <div className="contact-us-cards flex flex-wrap justify-center gap-6 w-full">
                            {/* Card 1 */}
                            <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] flex flex-col items-center text-center p-6 rounded-2xl shadow-lg bg-[#1F1F1F]">
                                <div className="card-icon w-[126px] h-[126px] flex items-center justify-center text-primary">
                                    <PhoneCall size={30} />
                                </div>
                                <div className="card-text mt-4">
                                    <h5 className="text-lg font-semibold">+132458900</h5>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] flex flex-col items-center text-center p-6 rounded-2xl shadow-lg bg-[#1F1F1F]">
                                <div className="card-icon w-[126px] h-[126px] flex items-center justify-center text-primary">
                                    <Mail size={30} />
                                </div>
                                <div className="card-text mt-4">
                                    <h5 className="text-lg font-semibold">Evenjo.info@yahoo.com</h5>
                                </div>
                            </div>

                            {/* Card 3 */}
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
                                alt="map"
                                fill
                                className="object-cover mt-10 rounded-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default about