'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
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

import { ArrowRight, ArrowUpDown, ChevronRight, Loader2, Ticket } from 'lucide-react'
import {
  getMyTicketOrders,
  type MyTicketOrder,
  type TicketOrderTabStatus,
} from '@/features/ticket-purchases/api'
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
  const t = useTranslations('userDashboard')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
  const tEntity = useTranslations('entityStatus')
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  const { data: orders = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-ticket-orders'],
    queryFn: getMyTicketOrders,
  })

  React.useEffect(() => {
    if (isError) toastApiError(error, t('couldNotLoadTicketsToast'))
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
      ? t('newestFirst')
      : sortBy === 'oldest'
        ? t('oldestFirst')
        : sortBy === 'amount-high'
          ? t('highestAmount')
          : t('lowestAmount')

  const tabLabels: Record<TabValue, string> = {
    all: t('tabAll', { count: counts.all }),
    pending: t('tabPending', { count: counts.pending }),
    canceled: t('tabCanceled', { count: counts.canceled }),
    completed: t('tabCompleted', { count: counts.completed }),
  }

  const statusLabel = (status: TicketOrderTabStatus) => {
    if (status === 'pending') return tEntity('pending')
    if (status === 'completed') return tEntity('completed')
    if (status === 'canceled') return tEntity('canceled')
    return status
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
          onValueChange={setActiveTab}
          items={(['all', 'pending', 'canceled', 'completed'] as const).map((value) => ({
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
            {t('noTabTickets', { tab: activeTab })}
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
                <TableHead className="min-w-[100px] whitespace-nowrap text-right text-muted-foreground">{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableEmptyRow colSpan={8}>
                  {t('noTabTickets', { tab: tabLabels[activeTab] })}
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
                        {statusLabel(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" size="sm" className="h-auto p-0">
                        <Link
                          href={`/userDashboard/view-ticket?orderGroupId=${encodeURIComponent(ticket.orderGroupId)}`}
                        >
                          {t('details')}
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
      </DashboardPanel>
    </DashboardPageShell>
  )
}

export default Tickets
