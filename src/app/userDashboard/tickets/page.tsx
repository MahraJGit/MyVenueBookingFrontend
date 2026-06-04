'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { ArrowRight, ArrowUpDown, ChevronRight, Loader2, Ticket } from 'lucide-react'
import {
  getMyTicketOrders,
  type MyTicketOrder,
  type TicketOrderTabStatus,
} from '@/features/ticket-purchases/api'
import { formatTicketPrice } from '@/features/events/utils'
import { toastApiError } from '@/lib/toasts'

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low'
type TabValue = 'all' | TicketOrderTabStatus

function formatOrderDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart} · ${timePart}`
}

function formatEventDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${datePart} · ${timePart}`
}

function sortOrders(orders: MyTicketOrder[], sort: SortOption) {
  const copy = [...orders]
  switch (sort) {
    case 'oldest':
      return copy.sort(
        (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
      )
    case 'amount-high':
      return copy.sort((a, b) => b.totalAmount - a.totalAmount)
    case 'amount-low':
      return copy.sort((a, b) => a.totalAmount - b.totalAmount)
    case 'newest':
    default:
      return copy.sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime(),
      )
  }
}

function statusBadgeClass(status: TicketOrderTabStatus) {
  if (status === 'completed') return 'border-green-500 text-green-500'
  if (status === 'pending') return 'border-yellow-500 text-yellow-500'
  return 'border-red-500 text-red-500'
}

const Tickets = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const { data: orders = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-ticket-orders'],
    queryFn: getMyTicketOrders,
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, 'Could not load your tickets.')
  }, [isError, error])

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      canceled: orders.filter((o) => o.status === 'canceled').length,
      completed: orders.filter((o) => o.status === 'completed').length,
    }),
    [orders],
  )

  const filteredTickets = useMemo(() => {
    const byTab =
      activeTab === 'all' ? orders : orders.filter((order) => order.status === activeTab)
    return sortOrders(byTab, sortBy)
  }, [orders, activeTab, sortBy])

  const sortLabel =
    sortBy === 'newest'
      ? 'Newest first'
      : sortBy === 'oldest'
        ? 'Oldest first'
        : sortBy === 'amount-high'
          ? 'Highest amount'
          : 'Lowest amount'

  return (
    <div className="mt-5 rounded-lg bg-[#121212] p-10">
      <div className="flex items-center justify-between border-b border-muted mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="bg-transparent p-0 gap-6">
            {(
              [
                ['all', `All (${counts.all})`],
                ['pending', `Pending (${counts.pending})`],
                ['canceled', `Canceled (${counts.canceled})`],
                ['completed', `Completed (${counts.completed})`],
              ] as const
            ).map(([value, label]) => (
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
              {sortLabel}
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 bg-[#151515] border-[#242424]"
          >
            <DropdownMenuItem onClick={() => setSortBy('newest')}>
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              Oldest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('amount-high')}>
              Highest amount
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('amount-low')}>
              Lowest amount
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Loading your tickets…</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">We couldn&apos;t load your tickets.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
          <Image src="/svg/no-tickets.svg" alt="no tickets" width={250} height={250} />
          <h3 className="text-lg font-semibold">Ooops!!!</h3>
          <p className="text-muted-foreground max-w-sm">
            You haven&apos;t booked any tickets yet.
            Explore exciting events and secure your spot now!
          </p>
          <Button asChild>
            <Link href="/events" className="flex items-center gap-2">
              Browse Events <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No {activeTab} tickets in this view.
          </p>
          <Button variant="outline" onClick={() => setActiveTab('all')}>
            Show all tickets
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.orderGroupId}
              className="w-full flex items-center justify-between rounded-xl bg-[#151515] px-5 py-4 hover:bg-[#1a1a1a] transition"
            >
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div>
                    <h4 className="text-sm">{ticket.eventName}</h4>
                    <span className="text-xs text-muted-foreground">
                      {ticket.orderCode}
                    </span>
                  </div>

                  <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground border-t border-[#242424] my-4 py-2">
                  <span>Order Date · {formatOrderDateTime(ticket.orderDate)}</span>
                  <span>Event · {formatEventDateTime(ticket.eventStartDateTime)}</span>
                  <span>
                    Total paid{' '}
                    {formatTicketPrice(ticket.totalAmount, ticket.currency)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    {ticket.ticketCount}{' '}
                    {ticket.ticketCount === 1 ? 'ticket' : 'tickets'}
                  </span>
                  <Link
                    href={`/userDashboard/view-ticket?orderGroupId=${encodeURIComponent(ticket.orderGroupId)}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Ticket Details <ChevronRight className="h-4 w-4" />
                  </Link>
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
