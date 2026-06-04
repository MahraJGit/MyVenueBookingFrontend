'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  MapPin,
  Ticket,
  Download,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { getMyTicketOrder } from '@/features/ticket-purchases/api'
import { formatTicketPrice, getFallbackEventImage } from '@/features/events/utils'
import { toastApiError } from '@/lib/toasts'
import React from 'react'

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
  return `${datePart} • ${timePart}`
}

function formatLocation(order: {
  venueName: string | null
  address: string | null
  city: string
  state: string | null
}) {
  const lines = [
    order.venueName,
    [order.address, order.city, order.state].filter(Boolean).join(', '),
  ].filter(Boolean)
  return lines.length ? lines.join('\n') : order.city
}

function ticketTypesSummary(
  items: Array<{ ticketName: string; quantity: number }>,
) {
  return items
    .map((item) => `${item.quantity}× ${item.ticketName}`)
    .join(', ')
}

export default function ViewTicket() {
  const searchParams = useSearchParams()
  const orderGroupId = searchParams.get('orderGroupId')

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['my-ticket-order', orderGroupId],
    queryFn: () => getMyTicketOrder(orderGroupId!),
    enabled: Boolean(orderGroupId),
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, 'Could not load ticket details.')
  }, [isError, error])

  if (!orderGroupId) {
    return (
      <Card className="bg-[#121212] p-8 text-white text-center">
        <p className="text-muted-foreground mb-4">No order selected.</p>
        <Button asChild variant="outline">
          <Link href="/userDashboard/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Link>
        </Button>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="bg-[#121212] p-8 text-white flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading order…</p>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="bg-[#121212] p-8 text-white text-center">
        <p className="text-muted-foreground mb-4">Ticket order not found.</p>
        <Button asChild variant="outline">
          <Link href="/userDashboard/tickets">Back to tickets</Link>
        </Button>
      </Card>
    )
  }

  const imageSrc =
    order.eventImage ?? getFallbackEventImage(order.eventId)

  return (
    <Card className="bg-[#121212] p-8 text-white">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground px-0">
          <Link href="/userDashboard/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-6">
        <div className="flex gap-6">
          <Image
            src={imageSrc}
            alt={order.eventName}
            width={120}
            height={120}
            className="rounded-xl object-cover"
          />

          <div>
            <h3 className="text-pink-500 font-semibold">Order Details</h3>
            <h2 className="mt-2 text-xl font-bold">{order.eventName}</h2>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>Order Tracking Code</p>
              <p className="text-white">{order.orderCode}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" disabled>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refund ticket
          </Button>
          <Button size="sm" className="bg-pink-500 hover:bg-pink-600" disabled>
            <Download className="mr-2 h-4 w-4" />
            Download ticket
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-1 mb-4">
          <h4 className="text-pink-500 font-semibold">Event Details</h4>
          <Separator className="bg-zinc-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex gap-3">
            <MapPin className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground whitespace-pre-line">
                {formatLocation(order)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Calendar className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">Event Date</p>
              <p className="text-muted-foreground">
                {formatEventDateTime(order.eventStartDateTime)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Ticket className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">Tickets</p>
              <p className="text-muted-foreground">
                {ticketTypesSummary(order.items)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-1 mb-4">
          <h4 className="text-pink-500 font-semibold">Payment</h4>
          <Separator className="bg-zinc-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Ticket count</p>
            <p className="font-medium">
              {order.ticketCount} {order.ticketCount === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Order status</p>
            <p className="font-medium capitalize">{order.status}</p>
          </div>

          <div>
            <p className="text-muted-foreground">Total paid</p>
            <p className="font-medium">
              {formatTicketPrice(order.totalAmount, order.currency)}
            </p>
          </div>

          <div className="row-span-2 flex justify-end">
            <div className="h-32 w-32 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
              QR code coming soon
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">Order date</p>
            <p className="font-medium">
              {formatEventDateTime(order.orderDate)}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">Payment method</p>
            <p className="font-medium">Stripe</p>
          </div>

          <div>
            <p className="text-muted-foreground">Order ID</p>
            <p className="font-medium break-all">{order.orderGroupId}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
