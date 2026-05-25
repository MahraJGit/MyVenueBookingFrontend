"use client";

import React, { useState } from "react";
import "@/styles/Home.css";
import Image from "next/image";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar"
import { CalendarPicker } from "@/components/pages/home/CalendarPicker";
import { HotEventsSection } from "@/components/events/HotEventsSection";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
// import { BadgeQuestionMark } from "lucide-react";


const Home = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [randomCardImages] = React.useState(() => {
    const pool = [
      "/images/card-img-2.jpg",
      "/images/card-img-3.jpg",
      "/images/card-img-4.png",
      "/images/card-img-5.jpg",
      "/images/card-img-6.jpg",
      "/images/card-img-7.jpg",
      "/images/card-img-8.jpg",
      "/images/card-img-9.png",
      "/images/card-img-10.jpg",
    ];

    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    const list = (count: number) => Array.from({ length: count }, pick);

    return {
      concerts: list(4),
      shows: list(4),
      sport: list(4),
      festivals: list(4),
      topVenuesRow1: list(12),
      topVenuesRow2: list(12),
    };
  });

  return (
    <>
      {/* hero section start */}
      <section className="hero">
        <div className="container mx-auto px-4">
          <div className="inner min-h-screen flex items-center md:justify-center justify-end flex-col md:gap-20 gap-8">
            <div className="description text-center">
              <h1 className="mb-8">
                Find Your Perfect <span className="text-primary">Venue</span>
              </h1>
              <p className="text-lg!">
                More than 100 concerts in different countries are now available
                to you.
              </p>
            </div>
            <div className="fillter-wrapper max-w-[81.4%] w-full flex flex-col gap-4 items-center">
              <div className="filters py-6 md:px-10 px-1 bg-[#1B1B1BCC] border border-[#303030] rounded-2xl backdrop-blur-md w-full">
                <div className="top flex flex-wrap justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2 p-3 px-6 mb-4">
                    <Image
                      src="/svg/MusicNote.svg"
                      alt="Concerts"
                      width={20}
                      height={20}
                    />
                    <span className="text-sm text-white font-medium">
                      Concerts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 px-6 mb-4">
                    <Image
                      src="/svg/Masks.svg"
                      alt="Shows"
                      width={20}
                      height={20}
                    />
                    <span className="text-sm text-white font-medium">
                      Shows
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 px-6 mb-4">
                    <Image
                      src="/svg/DumbbellLarge.svg"
                      alt="Sports"
                      width={20}
                      height={20}
                    />
                    <span className="text-sm text-white font-medium">
                      Sports
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-3 px-6 mb-4">
                    <Image
                      src="/svg/FerrisWheel.svg"
                      alt="Corporate meetings"
                      width={20}
                      height={20}
                    />
                    <span className="text-sm text-white font-medium">
                      Corporate meetings
                    </span>
                  </div>
                </div>

                {/* Bottom filters row */}
                <div className="body flex flex-wrap items-end justify-between gap-3 p-4">
                  {/* What */}
                  <div className="flex flex-col md:py-1 md:px-4 md:w-auto w-full">
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
                      <SelectTrigger className="md:w-[180px] w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concert">Concert</SelectItem>
                        <SelectItem value="show">Show</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="corporate">
                          Corporate Meeting
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Where */}
                  <div className="flex flex-col md:py-1 md:px-4 md:w-auto w-full md:border-l border-[#242424]">
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
                      <SelectTrigger className="md:w-[180px] w-full bg-transparent border border-[#303030] text-gray-400 mt-1">
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
                  <div className="flex flex-col md:py-1 md:px-4 md:w-auto w-full md:border-l border-[#242424]">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 text-sm text-white mb-1">
                        <Image
                          src="/svg/Calendar.svg"
                          alt="When"
                          width={20}
                          height={20}
                        />
                        when
                      </span>
                      <CalendarPicker
                        selectedDate={date}
                        onDateChange={setDate}
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <Button
                    size="icon"
                    variant="default"
                    className="md:w-[34px] w-full"
                  >
                    <Image
                      src="/svg/Magnifer.svg"
                      alt="Search"
                      width={24}
                      height={24}
                    />
                  </Button>
                </div>
              </div>
              <div className="tags flex gap-8">
                <div className="tag flex gap-4">
                  <span>Book Anytime</span>
                </div>

                <div className="tag flex gap-4">
                  <span>Refundable Tickets</span>
                </div>

                <div className="tag flex gap-4">
                  <span>Smart Deals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* hero section end */}

      {/* concert section start */}
      <section className="concerts py-10">
        <div className="container mx-auto px-4">
          <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
            <h2>Concert</h2>
            <span className="text-sm">See all</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "All",
              "Pop",
              "Rock",
              "Jazz & Blues",
              "Hip-Hop & Rap",
              "Alternative",
              "Classical",
              "Opera",
              "Country",
            ].map((button) => (
              <button
                key={button}
                onClick={() => setActiveFilter(button)} // Set active filter on click
                className={`text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px]
        ${activeFilter === button
                    ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
                    : "text-[#B3B3B3] border-[#B3B3B3]"
                  } 
      `}
              >
                {button}
              </button>
            ))}
          </div>

          <div className="concert-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
              <Image
                src={randomCardImages.concerts[0]}
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
                src={randomCardImages.concerts[1]}
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
                src={randomCardImages.concerts[2]}
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
                src={randomCardImages.concerts[3]}
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
        </div>
      </section>
      {/* concert section end */}

      {/* shows section start */}
      <section className="shows py-10">
        <div className="container mx-auto px-4">
          <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
            <h2>Shows</h2>
            <span className="text-sm">See all</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "All",
              "Theater",
              "Comedy",
              "Magic",
              "Musical",
              "Circus",
              "Dance",
              "Puppetry",
              "Live Drama",
            ].map((button) => (
              <button
                key={button}
                onClick={() => setActiveFilter(button)}
                className={`text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px]
        ${activeFilter === button
                    ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
                    : "text-[#B3B3B3] border-[#B3B3B3]"
                  } 
      `}
              >
                {button}
              </button>
            ))}
          </div>

          <div className="shows-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
              <Image
                src={randomCardImages.shows[0]}
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
                src={randomCardImages.shows[1]}
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
                src={randomCardImages.shows[2]}
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
                src={randomCardImages.shows[3]}
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
        </div>
      </section>
      {/* shows section end */}

      <HotEventsSection />

      {/* top venues section start */}
      <section className="top-venues py-10 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="section-header mb-8 text-center">
            <h2>Top Venues</h2>
            <p>Find the singers you're looking for quickly. You can see more.</p>
          </div>
        </div>

        {/* ✅ Full-width marquee outside container */}
        <div className="marquee-container relative -mx-4 overflow-hidden">
          {/* Row 1 → scrolls left */}
          <div className="wrapper flex gap-3 animate-marquee-left mb-4">
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                {/* First loop of cards */}
                {[...Array(6)].map((_, index) => (
                  <div
                    key={`${i}-${index}`}
                    className="card flex gap-3 items-center bg-[#1A1A1A] border border-[#303030] rounded-[12px] p-1 w-[280px]"
                  >
                    <Image
                      src={randomCardImages.topVenuesRow1[i * 6 + index]}
                      alt="Top Venue"
                      width={75}
                      height={75}
                      className="rounded-[10px]"
                    />
                    <div className="detail">
                      <h5 className="mb-1">Taylor Swift</h5>
                      <p>10 July, Nashville</p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Row 2 → scrolls right */}
          <div className="wrapper flex gap-3 animate-marquee-right">
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                {/* Second loop of cards */}
                {[...Array(6)].map((_, index) => (
                  <div
                    key={`bottom-${i}-${index}`}
                    className="card flex gap-3 items-center bg-[#1A1A1A] border border-[#303030] rounded-[12px] p-1 w-[280px]"
                  >
                    <Image
                      src={randomCardImages.topVenuesRow2[i * 6 + index]}
                      alt="Top Venue"
                      width={75}
                      height={75}
                      className="rounded-[10px]"
                    />
                    <div className="detail">
                      <h5 className="mb-1">Taylor Swift</h5>
                      <p>10 July, Nashville</p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* top venues section end */}

      {/* Sport section start */}
      <section className="sport py-10">
        <div className="container mx-auto px-4">
          <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
            <h2>Sport</h2>
            <span className="text-sm">See all</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "All",
              "Running",
              "Basketball",
              "Football",
              "Socer",
              "Golf",
              "Vollyball",
              "Tennis",
              "Hockey",
            ].map((button) => (
              <button
                key={button}
                onClick={() => setActiveFilter(button)} // Set active filter on click
                className={`text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px]
        ${activeFilter === button
                    ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
                    : "text-[#B3B3B3] border-[#B3B3B3]"
                  } 
      `}
              >
                {button}
              </button>
            ))}
          </div>

          <div className="sport-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
              <Image
                src={randomCardImages.sport[0]}
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
                src={randomCardImages.sport[1]}
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
                src={randomCardImages.sport[2]}
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
                src={randomCardImages.sport[3]}
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
        </div>
      </section>
      {/* Sport section end */}

      {/* Festivals section start */}
      <section className="festivals py-10">
        <div className="container mx-auto px-4">
          <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
            <h2>Festivals</h2>
            <span className="text-sm">See all</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              "All",
              "Dance",
              "Seasonal",
              "Food & Drink",
              "Cultural",
              "Film & Cinema",
              "Tech",
              "Music",
            ].map((button) => (
              <button
                key={button}
                onClick={() => setActiveFilter(button)} // Set active filter on click
                className={`text-sm py-2 px-4 bg-[#242424] border border-[#303030] rounded-[18px]
        ${activeFilter === button
                    ? `text-[#D580F2] border-[#D7498E] bg-[linear-gradient(180deg,rgba(215,73,142,0.3)_0%,rgba(27,27,27,0)_100%)]`
                    : "text-[#B3B3B3] border-[#B3B3B3]"
                  } 
      `}
              >
                {button}
              </button>
            ))}
          </div>

          <div className="festivals-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
              <Image
                src={randomCardImages.festivals[0]}
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
                src={randomCardImages.festivals[1]}
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
                src={randomCardImages.festivals[2]}
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
                src={randomCardImages.festivals[3]}
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
        </div>
      </section>
      {/* Festivals section end */}

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
                    <h3>Refundable Tickets</h3>
                    <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
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
                    <h3>Refundable Tickets</h3>
                    <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-[40%] w-full">
              <div className="card py-8 px-12 flex flex-col gap-16 rounded-2xl items-center">
                <div className="flex flex-col gap-2 text-center">
                  <h3>Book Anytime</h3>
                  <p>You can pay a ticket in 2 portions throughout a fixed period of time.Start invoicing for free.</p>
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
    </>
  );
};

export default Home;