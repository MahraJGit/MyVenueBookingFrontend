'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
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

import { OpenChatButton } from '@/components/chat/OpenChatButton'
import { ArrowRight, ArrowUpDown, ChevronRight, Loader2, Star, Ticket } from 'lucide-react'
import {
  getMyTicketOrders,
  type MyTicketOrder,
  type TicketOrderTabValue,
} from '@/features/ticket-purchases/api'
import {
  countOrdersByTab,
  filterOrdersByTab,
  getTicketStatusLabel,
  ticketStatusBadgeClass,
} from '@/features/ticket-purchases/order-display'
import { DisplayPrice } from '@/components/currency/DisplayPrice'
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
  DashboardPanel,
  DashboardPageShell,
  DashboardSortButton,
  dashboardDropdownContentClass,
} from '@/components/dashboard/dashboard-ui'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-shared'
import { myTicketOrdersQueryKey } from '@/features/auth/auth-cache'
import { useAuth } from '@/features/auth/auth-context'
import { VendorReviewDialog } from '@/components/reviews/VendorReviewDialog'
import { toastApiError } from '@/lib/toasts'
import { useLocaleContext } from '@/features/i18n/locale-context'
import { formatLocalizedDateTime } from '@/lib/date-locale'

type SortOption = 'newest' | 'oldest' | 'amount-high' | 'amount-low'

const TAB_ORDER: TicketOrderTabValue[] = ['upcoming', 'attended', 'all', 'canceled']

type ReviewTarget = {
  eventId: string
  eventName: string
  vendorId: string
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

const Tickets = () => {
  const t = useTranslations('userDashboard')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
  const { locale } = useLocaleContext()
  const { user, isAuthenticated, isReady } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TicketOrderTabValue>('upcoming')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null)

  const { data: orders = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: myTicketOrdersQueryKey(user?.id),
    queryFn: getMyTicketOrders,
    enabled: isAuthenticated && isReady && !!user?.id,
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, t('couldNotLoadTicketsToast'))
  }, [isError, error, t])

  const counts = useMemo(() => countOrdersByTab(orders), [orders])

  const filteredTickets = useMemo(() => {
    const byTab = filterOrdersByTab(orders, activeTab)
    return sortOrders(byTab, sortBy)
  }, [orders, activeTab, sortBy])

  const sortLabel =
    sortBy === 'newest'
      ? t('newestFirst')
      : sortBy === 'oldest'
        ? t('oldestFirst')
        : sortBy === 'amount-high'
          ? t('highestAmount')
          : t('lowestAmount')

  const tabLabels: Record<TicketOrderTabValue, string> = {
    all: t('tabAll', { count: counts.all }),
    upcoming: t('tabUpcoming', { count: counts.upcoming }),
    attended: t('tabAttended', { count: counts.attended }),
    canceled: t('tabCanceled', { count: counts.canceled }),
  }

  const emptyTabLabel =
    activeTab === 'upcoming'
      ? t('tabUpcomingLabel')
      : activeTab === 'attended'
        ? t('tabAttendedLabel')
        : activeTab === 'canceled'
          ? t('tabCanceledLabel')
          : t('tabAllLabel')

  const statusLabel = (order: MyTicketOrder) =>
    getTicketStatusLabel(order, (key) => t(key))

  const openReview = (ticket: MyTicketOrder) => {
    if (!ticket.vendorId) return
    setReviewTarget({
      eventId: ticket.eventId,
      eventName: ticket.eventName,
      vendorId: ticket.vendorId,
    })
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader title={t('tickets')} />
      <DashboardPanel className="space-y-0">
      <DashboardFilterBar
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <DashboardSortButton>
                {sortLabel}
                <ArrowUpDown className="h-4 w-4" />
              </DashboardSortButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className={dashboardDropdownContentClass}
            >
              <DropdownMenuItem onClick={() => setSortBy('newest')}>
                {t('newestFirst')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                {t('oldestFirst')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('amount-high')}>
                {t('highestAmount')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('amount-low')}>
                {t('lowestAmount')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TicketOrderTabValue)}
          items={TAB_ORDER.map((value) => ({
            value,
            label: tabLabels[value],
          }))}
        />
      </DashboardFilterBar>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{t('loadingTickets')}</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">{t('couldNotLoadTickets')}</p>
          <Button variant="outline" onClick={() => refetch()}>
            {tCommon('tryAgain')}
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 text-center py-10">
          <Image src="/svg/no-tickets.svg" alt={t('noTicketsYet')} width={250} height={250} />
          <h3 className="text-lg font-semibold">{t('noTicketsYet')}</h3>
          <p className="text-muted-foreground max-w-sm">
            {t('noTicketsDesc')}
          </p>
          <Button asChild>
            <Link href="/events" className="flex items-center gap-2">
              {t('browseEvents')} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {t('noTabTickets', { tab: emptyTabLabel })}
          </p>
          <Button variant="outline" onClick={() => setActiveTab('all')}>
            {t('showAllTickets')}
          </Button>
        </div>
      ) : (
        <TableShell variant="dashboard" contentClassName="p-0">
          <Table
            containerClassName="overscroll-x-contain"
            className="[&_td]:px-4 [&_td]:text-sm [&_th]:px-4 [&_th]:text-sm"
          >
            <TableHeader className="whitespace-nowrap">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">{tNav('events')}</TableHead>
                <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">{t('order')}</TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">{t('orderDate')}</TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">{t('eventDate')}</TableHead>
                <TableHead className="min-w-[100px] whitespace-nowrap text-muted-foreground">{tCommon('total')}</TableHead>
                <TableHead className="min-w-[90px] whitespace-nowrap text-muted-foreground">{t('ticketsCol')}</TableHead>
                <TableHead className="min-w-[100px] whitespace-nowrap text-muted-foreground">{tCommon('status')}</TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap text-right text-muted-foreground">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableEmptyRow colSpan={8}>
                  {t('noTabTickets', { tab: emptyTabLabel })}
                </TableEmptyRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.orderGroupId} className="border-border">
                    <TableCell className="font-medium text-foreground" dir="auto">
                      {ticket.eventName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.orderCode}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLocalizedDateTime(ticket.orderDate, locale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLocalizedDateTime(ticket.eventStartDateTime, locale)}
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
                      <Badge
                        variant="outline"
                        className={ticketStatusBadgeClass(
                          ticket.attendancePhase,
                          ticket.paymentStatus,
                        )}
                      >
                        {statusLabel(ticket)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-2">
                        {ticket.canReviewOrganizer ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => openReview(ticket)}
                          >
                            <Star className="h-3.5 w-3.5" />
                            {t('reviewOrganizer')}
                          </Button>
                        ) : ticket.hasReviewedOrganizer ? (
                          <span className="text-xs text-muted-foreground">
                            {t('reviewedOrganizer')}
                          </span>
                        ) : null}
                        {ticket.paymentStatus === 'confirmed' ? (
                          <OpenChatButton
                            kind="ticket"
                            referenceId={ticket.orderGroupId}
                            messagesPath="/userDashboard/messages"
                          />
                        ) : null}
                        <Button asChild variant="link" size="sm" className="h-auto p-0">
                          <Link
                            href={`/userDashboard/view-ticket?orderGroupId=${encodeURIComponent(ticket.orderGroupId)}`}
                          >
                            {t('details')}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      )}
      </DashboardPanel>

      {reviewTarget ? (
        <VendorReviewDialog
          open={Boolean(reviewTarget)}
          onOpenChange={(open) => {
            if (!open) setReviewTarget(null)
          }}
          eventId={reviewTarget.eventId}
          eventName={reviewTarget.eventName}
          vendorId={reviewTarget.vendorId}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: myTicketOrdersQueryKey(user?.id) })
          }}
        />
      ) : null}
    </DashboardPageShell>
  )
}

export default Tickets
