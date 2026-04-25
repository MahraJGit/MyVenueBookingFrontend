"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { CalendarDays, Plus, Search, Eye, Calendar as CalendarIcon, Ticket, DollarSign } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";

export default function ManageEvents() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  const events = [
    {
      title: "PRAUDA THE EDITION",
      image: "/images/card-img2.png",
      priceLKR: 4000,
      ticketsAvailable: 2500,
      ticketsSold: 1800,
      venue: "Museaus College Auditorium",
      date: "12 April 2025",
      time: "09.00PM to 11.30PM",
      status: "Up Coming",
    },
    {
      title: "MARIANS LIVE AT THE EDGE",
      image: "/images/card-img1.png",
      priceLKR: 5000,
      ticketsAvailable: 2500,
      ticketsSold: 1800,
      venue: "Waters Edge Outdoor",
      date: "12 April 2025",
      time: "09.00PM to 11.30PM",
      status: "Pending",
    },
    {
      title: "AALA KATHA",
      image: "/images/card-img2.png",
      priceLKR: 3000,
      ticketsAvailable: 2500,
      ticketsSold: 1800,
      venue: "Museaus College Auditorium",
      date: "12 April 2025",
      time: "09.00PM to 11.30PM",
      status: "Closed",
    },
  ];

  const statusColors: Record<string, string> = {
    "Up Coming": "bg-pink-500",
    Pending: "bg-yellow-400",
    Closed: "bg-red-600",
  };

  return (
    <div className="w-full flex flex-col gap-8">

      <div className="bg-[#0e0e0e] rounded-2xl p-6 text-white space-y-6 w-full">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
          <h2 className="text-xl font-bold text-primary w-full lg:w-auto">
            Event Management Section
          </h2>

          <div className="relative w-full lg:w-[280px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70"
              size={18}
            />
            <Input
              placeholder="Search..."
              className="pl-10 bg-primary/20 text-white rounded-full border-none w-full"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 w-full">
          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <Button className="bg-primary hover:bg-primary/80 text-black text-xs flex items-center gap-2 px-4 py-2 rounded-xl h-auto! w-full sm:w-full lg:w-auto">
              <Plus size={18} /> New Event
            </Button>

            <Select>
              <SelectTrigger className="w-full md:w-full lg:w-[180px] rounded-xl border-white/40 text-white h-10!">
                <SelectValue placeholder="Attendee Insights" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insights">Attendee Insights</SelectItem>
                <SelectItem value="reports">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 border border-white/40 px-3 py-2 rounded-xl w-full sm:w-full lg:w-auto">
              <span className="text-xs opacity-80 whitespace-nowrap">Sort By:</span>
              <Select>
                <SelectTrigger className="lg:w-[70px] w-full border-none bg-transparent! p-0 h-auto! text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/40 text-white flex items-center gap-2 h-auto! w-full sm:w-full lg:w-auto"
                >
                  <CalendarDays size={18} />
                  {date ? format(date, "PPP") : "Pick Date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="bg-[#1a1a1a] border-white/20 text-white p-2 rounded-xl">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>


      <div className="bg-[#121212] rounded-2xl px-3 py-6 text-white">

        <div className="flex lg:flex-row flex-col lg:items-center justify-between mb-6">
          <h3 className="text-lg text-primary font-semibold">All Events</h3>

          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-pink-500"></span> Up Coming Events
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-yellow-400"></span> Pending Events
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-600"></span> Closed Events
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-[#000000] p-2.5 rounded-2xl overflow-hidden relative border border-white/10 shadow-lg"
            >
              <div className="absolute top-3 right-3 bg-[#1a1a1a] px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold text-white select-none shadow">
                <span
                  className={`w-3 h-3 rounded-full ${statusColors[event.status]}`}
                ></span>
                {event.status}
              </div>

              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover rounded-2xl"
              />

              <div className="pt-5 text-white flex flex-col gap-4">
              
                <h4 className="font-semibold uppercase text-md flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-white" />
                  {event.title}
                </h4>

                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-6 gap-2 border-b border-primary pb-3">
                  <div className="flex items-center gap-1 text-green-400 font-semibold">
                    <DollarSign className="w-5 h-5" />
                    {event.priceLKR}LKR
                  </div>

                  <div className="flex items-center gap-1 text-orange-500 font-semibold">
                    <Ticket className="w-5 h-5" />
                    {event.ticketsAvailable}
                  </div>

                  <div className="flex items-center gap-1 text-purple-600 font-semibold">
                    <Eye className="w-5 h-5" />
                    {event.ticketsSold}
                  </div>
                </div>

                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <span className="text-primary">Venue :</span>{" "}
                    {event.venue}
                  </p>
                  <p>
                    <span className="text-primary">Date :</span>{" "}
                    {event.date}
                  </p>
                  <p>
                    <span className="text-primary">Time :</span>{" "}
                    {event.time}
                  </p>
                </div>

                {/* View Button */}
                <button
                  type="button"
                  className="w-full border border-white rounded-lg py-2 mt-3 flex items-center justify-center gap-2 text-white text-sm lowercase font-semibold hover:bg-white/10 transition"
                >
                  <Eye className="w-5 h-5" />
                  view
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}