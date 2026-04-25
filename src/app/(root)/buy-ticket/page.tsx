"use client";

import React, { useState } from 'react'
import "@/styles/buyTicket.css"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bookmark, CalendarDays, Clock, MapPin, Minus, Plus } from 'lucide-react'
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from '@/components/ui/checkbox';

const buyTicket = () => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(2);
  const [seatedTogether, setSeatedTogether] = useState(false);

  const openTicketModal = () => setTicketModalOpen(true);
  const closeTicketModal = () => setTicketModalOpen(false);

  const handleStart = () => {
    closeTicketModal();
    router.push('/checkout');
  };

  return (
    <>
      {/* Ticket selection modal */}
      <Dialog open={ticketModalOpen} onOpenChange={setTicketModalOpen}>
        <DialogContent
          showCloseButton={true}
          className="bg-[#1B1B1B] border-[#303030] rounded-2xl p-0 gap-0 max-w-md overflow-hidden text-white"
        >
          <div className="p-6 pt-8 flex flex-col gap-6">
            <DialogTitle className="sr-only">Select tickets</DialogTitle>
            {/* Seat layout image */}
            <div className="w-full rounded-xl overflow-hidden border border-[#303030]">
              <Image
                src="/images/seats.png"
                alt="Cinema seat layout"
                width={600}
                height={200}
                className="w-full h-auto object-cover"
              />
            </div>
            {/* How many tickets */}
            <div className='flex flex-col gap-3 justify-center items-center'>
              <h3 className="font-bold text-white mb-3">How Many Tickets ?</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white border border-[#454545] hover:opacity-90 transition-opacity"
                  aria-label="Decrease tickets"
                >
                  <Minus className="size-5" />
                </button>
                <span className="font-bold text-lg min-w-8 text-center">{ticketCount}</span>
                <button
                  type="button"
                  onClick={() => setTicketCount((c) => c + 1)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-white border border-[#454545] hover:opacity-90 transition-opacity"
                  aria-label="Increase tickets"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </div>
            {/* Seated together option */}
            <div className="flex flex-col gap-1 justify-center items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={seatedTogether}
                  onCheckedChange={(checked) => setSeatedTogether(checked === true)}
                  className="border-[#454545] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-white font-medium">We want to be seated together</span>
              </label>
              <p className="text-sm text-[#888] pl-7">Most Popular Quality On Our Site</p>
            </div>
            {/* Start button */}
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 rounded-xl"
              onClick={handleStart}
            >
              Start
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="buyTicket-hero">
        <div className="container mx-auto px-4">
          <div className="inner min-h-screen flex items-start justify-end flex-col pb-10">
            <div className="description text-left">
              <h1 className='mb-8'>Adele</h1>
              <p>"A Night to Remember: Adele Live with Her Greatest Hits " 🎶✨</p>
            </div>
          </div>
        </div>
      </section>
      <section className="eventList flex">
        <div className="container mx-auto px-4">
          <div className="inner flex flex-col lg:flex-row gap-5">
            {/* Left Section */}
            <div className="w-full lg:w-[80%]">
              <div className="eventList-header flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 border-b border-[#1B1B1B] gap-4">
                <h2 className="text-xl font-semibold">All days and times</h2>
                <div className="select flex items-center gap-2">
                  <MapPin size={18} className="text-white" />
                  <Select>
                    <SelectTrigger className="w-[180px] location-menu text-white">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Locations</SelectLabel>
                        <SelectItem value="las-vegas">Las Vegas</SelectItem>
                        <SelectItem value="miami">Miami</SelectItem>
                        <SelectItem value="newyork">New York</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Event Cards */}
              <div className="eventlist-cards">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="card bg-[#191919] p-6 rounded-2xl my-6 hover:bg-[#202020] transition-all"
                  >
                    <div className="card-header border-b border-[#454545] py-6 border-dashed flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="header-text flex items-center gap-2 text-sm md:text-base">
                        <MapPin size={24} className="text-primary shrink-0" />
                        <h4 className="font-medium">
                          Fontainebleau Las Vegas - Complex, Las Vegas, Nevada, USA
                        </h4>
                      </div>
                      <div className="header-btn flex items-center gap-3 justify-end">
                        <Share2 size={22} />
                        <Bookmark size={22} />
                        <Button variant="secondary" size="sm" onClick={openTicketModal}>
                          Get Tickets
                        </Button>
                      </div>
                    </div>

                    <div className="card-body flex flex-col sm:flex-row sm:items-end sm:justify-between mt-6 gap-6">
                      <div className="event-date-time flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarDays size={16} />
                          <span>Mar 06 - 2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>08:00 PM</span>
                        </div>
                      </div>

                      <div className="event-tags flex flex-wrap items-center gap-2">
                        {["Popular", "Best Selling", "VIP"].map((tag) => (
                          <span
                            key={tag}
                            className="tag text-xs text-[#FFBE5D] py-1.5 px-3 bg-[#FFBE5D14] rounded-2xl"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-[20%] flex flex-col gap-6 lg:-mt-20">
              <div className="venue-img h-[250px] sm:h-80 lg:h-[370px] w-full relative rounded-2xl overflow-hidden">
                <Image
                  src="/images/venue.jpg"
                  alt="venue-image"
                  fill
                  className="object-cover"
                />
              </div>

              <div className="relative w-full h-[200px] sm:h-[220px] bg-[url('/images/map-screenshot.png')] bg-center bg-cover flex flex-col items-center justify-center font-inter text-white rounded-2xl">
                {/* Glowing pin */}
                <div className="absolute w-[60px] h-[60px] rounded-full bg-[radial-gradient(circle,#ff0099_20%,transparent_70%)] animate-pulse-glow flex items-center justify-center">
                  <MapPin size={32} className="text-primary" />
                </div>

                {/* Location info */}
                <div className="mt-20 text-center z-10">
                  <div className="px-4 py-2 rounded-lg text-sm sm:text-base font-semibold">
                    Complex, Las Vegas, Nevada, USA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='event-banner py-4'>
        <div className="container mx-auto px-4">
          <div className='inner text-center w-full lg:w-[80%] py-12 rounded-2xl'>
            <p>In Las Vegas</p>
            <h2 className='text-5xl! mb-4'>MUSIC FESTIVAL</h2>
            <p>MEHDI LORESTANI WITH DJ HAMED</p>
          </div>
        </div>
      </section>
      <section className="upcommming-events">
        <div className="container mx-auto px-4">
          <div className="inner ww-full lg:w-[80%]">
            <h2 className='py-6 border-b border-[#1B1B1B]'>Until 6 months</h2>
            <div className="upcomming-events-cards">
              {/* <div className="card bg-[#191919] p-6 rounded-2xl my-6">
                <div className="card-header border-b border-[#454545] py-6 border-dashed flex items-center justify-between">
                  <div className="header-text flex items-center gap-1">
                    <MapPin size={24} className='text-primary' />
                    <h4>Fontainebleau Las Vegas - Complex, Las Vegas, Nevada, USA</h4>
                  </div>
                  <div className="header-btn flex items-center gap-4">
                    <Share2 size={24} />
                    <Bookmark size={24} />
                    <Button variant="secondary" onClick={openTicketModal}>Get Tickets</Button>
                  </div>
                </div>
                <div className="card-body flex items-end justify-between mt-6">
                  <div className="event-date-time flex flex-col gap-4">
                    <div className='flex items-center gap-1'> <CalendarDays size={16} /><span>Mar 06 - 2025</span></div>
                    <div className='flex items-center gap-1'> <Clock size={16} /><span>08:00 PM</span></div>
                  </div>
                  <div className="event-tags flex items-center gap-4">
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Popular</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Best Selling</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>VIP</span>
                  </div>
                </div>
              </div>
              <div className="card bg-[#191919] p-6 rounded-2xl my-6">
                <div className="card-header border-b border-[#454545] py-6 border-dashed flex items-center justify-between">
                  <div className="header-text flex items-center gap-1">
                    <MapPin size={24} className='text-primary' />
                    <h4>Fontainebleau Las Vegas - Complex, Las Vegas, Nevada, USA</h4>
                  </div>
                  <div className="header-btn flex items-center gap-4">
                    <Share2 size={24} />
                    <Bookmark size={24} />
                    <Button variant="secondary" onClick={openTicketModal}>Get Tickets</Button>
                  </div>
                </div>
                <div className="card-body flex items-end justify-between mt-6">
                  <div className="event-date-time flex flex-col gap-4">
                    <div className='flex items-center gap-1'> <CalendarDays size={16} /><span>Mar 06 - 2025</span></div>
                    <div className='flex items-center gap-1'> <Clock size={16} /><span>08:00 PM</span></div>
                  </div>
                  <div className="event-tags flex items-center gap-4">
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Popular</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Best Selling</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>VIP</span>
                  </div>
                </div>
              </div>
              <div className="card bg-[#191919] p-6 rounded-2xl my-6">
                <div className="card-header border-b border-[#454545] py-6 border-dashed flex items-center justify-between">
                  <div className="header-text flex items-center gap-1">
                    <MapPin size={24} className='text-primary' />
                    <h4>Fontainebleau Las Vegas - Complex, Las Vegas, Nevada, USA</h4>
                  </div>
                  <div className="header-btn flex items-center gap-4">
                    <Share2 size={24} />
                    <Bookmark size={24} />
                    <Button variant="secondary" onClick={openTicketModal}>Get Tickets</Button>
                  </div>
                </div>
                <div className="card-body flex items-end justify-between mt-6">
                  <div className="event-date-time flex flex-col gap-4">
                    <div className='flex items-center gap-1'> <CalendarDays size={16} /><span>Mar 06 - 2025</span></div>
                    <div className='flex items-center gap-1'> <Clock size={16} /><span>08:00 PM</span></div>
                  </div>
                  <div className="event-tags flex items-center gap-4">
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Popular</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>Best Selling</span>
                    <span className='tag text-xs text-[#FFBE5D] py-2 px-4 bg-[#FFBE5D14] rounded-2xl'>VIP</span>
                  </div>
                </div>
              </div> */}
              {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="card bg-[#191919] p-6 rounded-2xl my-6 hover:bg-[#202020] transition-all"
                  >
                    <div className="card-header border-b border-[#454545] py-6 border-dashed flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="header-text flex items-center gap-2 text-sm md:text-base">
                        <MapPin size={24} className="text-primary shrink-0" />
                        <h4 className="font-medium">
                          Fontainebleau Las Vegas - Complex, Las Vegas, Nevada, USA
                        </h4>
                      </div>
                      <div className="header-btn flex items-center gap-3 justify-end">
                        <Share2 size={22} />
                        <Bookmark size={22} />
                        <Button variant="secondary" size="sm" onClick={openTicketModal}>
                          Get Tickets
                        </Button>
                      </div>
                    </div>

                    <div className="card-body flex flex-col sm:flex-row sm:items-end sm:justify-between mt-6 gap-6">
                      <div className="event-date-time flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarDays size={16} />
                          <span>Mar 06 - 2025</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>08:00 PM</span>
                        </div>
                      </div>

                      <div className="event-tags flex flex-wrap items-center gap-2">
                        {["Popular", "Best Selling", "VIP"].map((tag) => (
                          <span
                            key={tag}
                            className="tag text-xs text-[#FFBE5D] py-1.5 px-3 bg-[#FFBE5D14] rounded-2xl"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>
      <section className="shows py-10">
        <div className="container mx-auto px-4">
          <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
            <h2>Concert near you</h2>
            <span className="text-sm">See all</span>
          </div>
          <div className="shows-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link href="/buy-ticket" className="card flex flex-col items-center group relative cursor-pointer">
              <Image
                src="/images/card-img1.png"
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
                src="/images/card-img1.png"
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
                src="/images/card-img1.png"
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
                src="/images/card-img1.png"
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
    </>
  )
}

export default buyTicket