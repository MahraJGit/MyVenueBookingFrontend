'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TableEmptyRow } from '@/components/ui/table-skeleton'
import { TableShell } from '@/components/ui/table-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { DisplayPrice } from '@/components/currency/DisplayPrice'
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
    <Card className="mt-5 border-border bg-card">
      <CardContent className="p-10">
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
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              {sortLabel}
              <ArrowUpDown className="h-4 w-4" />
            </Button>
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
        <TableShell>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Event</TableHead>
                <TableHead className="text-muted-foreground">Order</TableHead>
                <TableHead className="text-muted-foreground">Order date</TableHead>
                <TableHead className="text-muted-foreground">Event date</TableHead>
                <TableHead className="text-muted-foreground">Total</TableHead>
                <TableHead className="text-muted-foreground">Tickets</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableEmptyRow colSpan={8}>
                  No {activeTab} tickets in this view.
                </TableEmptyRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.orderGroupId} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {ticket.eventName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.orderCode}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatOrderDateTime(ticket.orderDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatEventDateTime(ticket.eventStartDateTime)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <DisplayPrice amount={ticket.totalAmount} currency={ticket.currency} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {ticket.ticketCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" size="sm" className="h-auto p-0">
                        <Link
                          href={`/userDashboard/view-ticket?orderGroupId=${encodeURIComponent(ticket.orderGroupId)}`}
                        >
                          Details
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      )}
      </CardContent>
    </Card>
  )
}

export default Tickets
