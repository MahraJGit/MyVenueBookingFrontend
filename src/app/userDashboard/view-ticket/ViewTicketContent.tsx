'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
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
import { getFallbackEventImage } from '@/features/events/utils'
import { DisplayPrice } from '@/components/currency/DisplayPrice'
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

export default function ViewTicketContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('viewTicket')
  const tEntity = useTranslations('entityStatus')
  const orderGroupId = searchParams.get('orderGroupId')

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['my-ticket-order', orderGroupId],
    queryFn: () => getMyTicketOrder(orderGroupId!),
    enabled: Boolean(orderGroupId),
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, t('loadError'))
  }, [isError, error, t])

  const statusLabel = (status: string) => {
    if (status === 'pending') return tEntity('pending')
    if (status === 'completed') return tEntity('completed')
    if (status === 'canceled') return tEntity('canceled')
    return status
  }

  if (!orderGroupId) {
    return (
      <Card className="bg-[#121212] p-4 text-center text-white sm:p-8">
        <p className="text-muted-foreground mb-4">{t('noOrderSelected')}</p>
        <Button asChild variant="outline">
          <Link href="/userDashboard/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToTickets')}
          </Link>
        </Button>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center gap-4 bg-[#121212] p-4 py-16 text-white sm:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('loadingOrder')}</p>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="bg-[#121212] p-4 text-center text-white sm:p-8">
        <p className="text-muted-foreground mb-4">{t('orderNotFound')}</p>
        <Button asChild variant="outline">
          <Link href="/userDashboard/tickets">{t('backToTickets')}</Link>
        </Button>
      </Card>
    )
  }

  const imageSrc =
    order.eventImage ?? getFallbackEventImage(order.eventId)

  return (
    <Card className="bg-[#121212] p-4 text-white sm:p-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="px-0 text-muted-foreground">
          <Link href="/userDashboard/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToTickets')}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col flex-wrap items-start justify-between gap-6 lg:flex-row">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:gap-6 lg:w-auto">
          <Image
            src={imageSrc}
            alt={order.eventName}
            width={120}
            height={120}
            className="h-[120px] w-full max-w-[120px] rounded-xl object-cover"
          />

          <div className="min-w-0">
            <h3 className="text-pink-500 font-semibold">{t('orderDetails')}</h3>
            <h2 className="mt-2 text-xl font-bold">{order.eventName}</h2>

            <div className="mt-4 text-sm text-muted-foreground">
              <p>{t('orderTrackingCode')}</p>
              <p className="text-white">{order.orderCode}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" disabled>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('refundTicket')}
          </Button>
          <Button size="sm" className="w-full bg-pink-500 hover:bg-pink-600 sm:w-auto" disabled>
            <Download className="mr-2 h-4 w-4" />
            {t('downloadTicket')}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-1 mb-4">
          <h4 className="text-pink-500 font-semibold">{t('eventDetails')}</h4>
          <Separator className="bg-zinc-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex gap-3">
            <MapPin className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">{t('location')}</p>
              <p className="text-muted-foreground whitespace-pre-line">
                {formatLocation(order)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Calendar className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">{t('eventDate')}</p>
              <p className="text-muted-foreground">
                {formatEventDateTime(order.eventStartDateTime)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Ticket className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">{t('tickets')}</p>
              <p className="text-muted-foreground">
                {ticketTypesSummary(order.items)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-1 mb-4">
          <h4 className="text-pink-500 font-semibold">{t('payment')}</h4>
          <Separator className="bg-zinc-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">{t('ticketCount')}</p>
            <p className="font-medium">
              {order.ticketCount}{' '}
              {order.ticketCount === 1 ? t('ticketSingular') : t('ticketPlural')}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('orderStatus')}</p>
            <p className="font-medium capitalize">{statusLabel(order.status)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('totalPaid')}</p>
            <p className="font-medium">
              <DisplayPrice amount={order.totalAmount} currency={order.currency} />
            </p>
          </div>

          <div className="flex justify-start md:col-span-1 md:row-span-2 md:justify-end">
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-pink-500/30 bg-pink-500/20 p-4 text-center text-xs text-muted-foreground">
              {t('qrComingSoon')}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground">{t('orderDate')}</p>
            <p className="font-medium">
              {formatEventDateTime(order.orderDate)}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('paymentMethod')}</p>
            <p className="font-medium">{t('stripe')}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('orderId')}</p>
            <p className="font-medium break-all">{order.orderGroupId}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
