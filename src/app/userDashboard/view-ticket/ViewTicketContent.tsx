'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Calendar,
  MapPin,
  Ticket,
  Download,
  Loader2,
  ArrowLeft,
  Star,
} from 'lucide-react'
import { getMyTicketOrder, type MyTicketOrder } from '@/features/ticket-purchases/api'
import {
  downloadTicketPdfs,
  flattenOrderSeats,
} from '@/features/ticket-purchases/download-ticket-pdfs'
import { myTicketOrderQueryKey, myTicketOrdersQueryKey } from '@/features/auth/auth-cache'
import { useAuth } from '@/features/auth/auth-context'
import { getTicketStatusLabel } from '@/features/ticket-purchases/order-display'
import { VendorReviewDialog } from '@/components/reviews/VendorReviewDialog'
import { getFallbackEventImage } from '@/features/events/utils'
import { DisplayPrice } from '@/components/currency/DisplayPrice'
import { toastApiError } from '@/lib/toasts'
import { cn } from '@/lib/utils'
import { dashboardSurfaceClass } from '@/components/dashboard/dashboard-ui'
import { useLocaleContext } from '@/features/i18n/locale-context'
import { formatLocalizedDateTime } from '@/lib/date-locale'
import { toast } from 'sonner'
import React from 'react'

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
  items: Array<{
    ticketName: string
    quantity: number
    tickets?: Array<{ seatLabel?: string | null }>
  }>,
) {
  return items
    .map((item) => {
      const seats = (item.tickets ?? [])
        .map((t) => t.seatLabel)
        .filter(Boolean)
        .join(', ')
      const base = `${item.quantity}× ${item.ticketName}`
      return seats ? `${base} (${seats})` : base
    })
    .join(', ')
}

export default function ViewTicketContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('viewTicket')
  const tDashboard = useTranslations('userDashboard')
  const { locale } = useLocaleContext()
  const { user, isAuthenticated, isReady } = useAuth()
  const queryClient = useQueryClient()
  const orderGroupId = searchParams.get('orderGroupId')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: myTicketOrderQueryKey(user?.id, orderGroupId ?? ''),
    queryFn: () => getMyTicketOrder(orderGroupId!),
    enabled: Boolean(orderGroupId) && isAuthenticated && isReady && !!user?.id,
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, t('loadError'))
  }, [isError, error, t])

  const statusLabel = (ticketOrder: Pick<MyTicketOrder, 'attendancePhase' | 'paymentStatus'>) =>
    getTicketStatusLabel(ticketOrder, (key) => tDashboard(key))

  const handleDownloadTickets = async () => {
    if (!order || isDownloading) return

    const seats = flattenOrderSeats(order.items)
    if (seats.length === 0 || order.paymentStatus !== 'confirmed') {
      toast.error(t('downloadUnavailable'))
      return
    }

    setIsDownloading(true)
    try {
      await downloadTicketPdfs({
        orderCode: order.orderCode,
        orderGroupId: order.orderGroupId,
        eventName: order.eventName,
        eventStartDateTime: order.eventStartDateTime,
        eventEndDateTime: order.eventEndDateTime,
        timezone: order.timezone,
        venueName: order.venueName,
        address: order.address,
        city: order.city,
        state: order.state,
        currency: order.currency,
        seats,
      })
      toast.success(t('downloadSuccess', { count: seats.length }))
    } catch {
      toast.error(t('downloadError'))
    } finally {
      setIsDownloading(false)
    }
  }

  if (!orderGroupId) {
    return (
      <Card className={cn(dashboardSurfaceClass, "p-4 text-center text-white sm:p-8")}>
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
      <Card className={cn(dashboardSurfaceClass, "flex flex-col items-center gap-4 p-4 py-16 text-white sm:p-8")}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('loadingOrder')}</p>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className={cn(dashboardSurfaceClass, "p-4 text-center text-white sm:p-8")}>
        <p className="text-muted-foreground mb-4">{t('orderNotFound')}</p>
        <Button asChild variant="outline">
          <Link href="/userDashboard/tickets">{t('backToTickets')}</Link>
        </Button>
      </Card>
    )
  }

  const imageSrc =
    order.eventImage ?? getFallbackEventImage(order.eventId)
  const seatCount = flattenOrderSeats(order.items).length
  const canDownload =
    order.paymentStatus === 'confirmed' && seatCount > 0

  return (
    <Card className={cn(dashboardSurfaceClass, "p-4 text-white sm:p-8")}>
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
          {order.canReviewOrganizer && order.vendorId ? (
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setReviewOpen(true)}
            >
              <Star className="mr-2 h-4 w-4" />
              {tDashboard('reviewOrganizer')}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!canDownload || isDownloading}
            onClick={() => void handleDownloadTickets()}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? t('downloadingTickets') : t('downloadTicket')}
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
                {formatLocalizedDateTime(order.eventStartDateTime, locale, undefined, order.timezone ?? undefined)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Ticket className="text-pink-500 shrink-0" />
            <div>
              <p className="font-medium">{t('tickets')}</p>
              <p className="text-muted-foreground" dir="auto">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">{t('ticketCount')}</p>
            <p className="font-medium">
              {order.ticketCount}{' '}
              {order.ticketCount === 1 ? t('ticketSingular') : t('ticketPlural')}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('orderStatus')}</p>
            <p className="font-medium">{statusLabel(order)}</p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('totalPaid')}</p>
            <p className="font-medium">
              <DisplayPrice amount={order.totalAmount} currency={order.currency} />
            </p>
          </div>

          <div>
            <p className="text-muted-foreground">{t('orderDate')}</p>
            <p className="font-medium">
              {formatLocalizedDateTime(order.orderDate, locale)}
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
      {order.canReviewOrganizer && order.vendorId ? (
        <VendorReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          eventId={order.eventId}
          eventName={order.eventName}
          vendorId={order.vendorId}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: myTicketOrderQueryKey(user?.id, orderGroupId ?? '') })
            void queryClient.invalidateQueries({ queryKey: myTicketOrdersQueryKey(user?.id) })
          }}
        />
      ) : null}
    </Card>
  )
}
