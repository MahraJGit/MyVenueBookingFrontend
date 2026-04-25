'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ArrowRight, ArrowUpDown, ChevronRight, Ticket } from 'lucide-react'

/* -------------------- DATA -------------------- */
const ticketData = [
  {
    title: 'Adele Concert',
    id: '#R123',
    date: 'Tue 30 Sep · 7:30 PM',
    total: '$200',
    count: 2,
    status: 'completed',
  },
  {
    title: 'Dua Lipa Concert',
    id: '#R124',
    date: 'Tue 30 Sep · 7:30 PM',
    total: '$200',
    count: 2,
    status: 'completed',
  },
  {
    title: 'Dua Lipa Concert',
    id: '#R125',
    date: 'Tue 30 Sep · 7:30 PM',
    total: '$200',
    count: 2,
    status: 'canceled',
  },
  {
    title: 'Dua Lipa Concert',
    id: '#R126',
    date: 'Tue 30 Sep · 7:30 PM',
    total: '$200',
    count: 2,
    status: 'canceled',
  },
  {
    title: 'Future Event',
    id: '#R127',
    date: 'Fri 3 Oct · 8:00 PM',
    total: '$150',
    count: 1,
    status: 'pending',
  },
  {
    title: 'Jazz Night',
    id: '#R128',
    date: 'Sat 4 Oct · 9:00 PM',
    total: '$120',
    count: 3,
    status: 'pending',
  },
  {
    title: 'Rock Festival',
    id: '#R129',
    date: 'Sun 5 Oct · 6:00 PM',
    total: '$250',
    count: 4,
    status: 'pending',
  },
]

/* -------------------- COMPONENT -------------------- */
const Tickets = () => {
  const [activeTab, setActiveTab] = useState('all')

  const filteredTickets =
    activeTab === 'all'
      ? ticketData
      : ticketData.filter(ticket => ticket.status === activeTab)

  return (
    <div className="mt-5 rounded-lg bg-[#121212] p-10">

      {/* ---------- TABS HEADER ---------- */}
      <div className="flex items-center justify-between border-b border-muted mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-0 gap-6">
            {[
              ['all', `All (${ticketData.length})`],
              ['pending', `Pending (${ticketData.filter(t => t.status === 'pending').length})`],
              ['canceled', `Canceled (${ticketData.filter(t => t.status === 'canceled').length})`],
              ['completed', `Completed (${ticketData.filter(t => t.status === 'completed').length})`],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="pb-3 rounded-none text-sm
                  data-[state=active]:border-b-2 
                  data-[state=active]:border-primary
                  data-[state=active]:text-white
                  text-muted-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition">
              Sort by
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 bg-[#151515] border-[#242424]"
          >
            <DropdownMenuItem>
              Newest first
            </DropdownMenuItem>

            <DropdownMenuItem>
              Oldest first
            </DropdownMenuItem>

            <DropdownMenuItem>
              Highest amount
            </DropdownMenuItem>

            <DropdownMenuItem>
              Lowest amount
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* ---------- TICKET LIST ---------- */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
          <Image src="/svg/no-tickets.svg" alt="no tickets" width={250} height={250} />
          <h3 className="text-lg font-semibold">Ooops!!!</h3>
          <p className="text-muted-foreground max-w-sm">
            You haven’t booked any tickets yet.
            Explore exciting events and secure your spot now!
          </p>
          <Button asChild>
            <Link href="/events" className="flex items-center gap-2">
              Browse Events <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filteredTickets.map((ticket, index) => (
            <div
              key={index}
              className="w-full flex items-center justify-between rounded-xl bg-[#151515] px-5 py-4 hover:bg-[#1a1a1a] transition"
            >
              {/* Left Info */}
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div>
                    <h4 className="text-sm">{ticket.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {ticket.id}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      ticket.status === 'completed'
                        ? 'border-green-500 text-green-500'
                        : ticket.status === 'pending'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-red-500 text-red-500'
                    }
                  >
                    {ticket.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-6 text-xs text-muted-foreground border-t border-[#242424] my-4 py-2">
                  <span>Order Date · {ticket.date}</span>
                  <span>Total paid {ticket.total}</span>
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    {ticket.count} tickets
                  </span>
                  {/* Right Action */}
                  <button className="text-sm text-primary hover:underline flex items-center gap-1">
                    Ticket Details  <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Tickets
