"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { ExternalLink, Loader2, Search, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/auth/auth-context"
import {
  getTicketSales,
  type TicketSaleStatusFilter,
} from "@/features/ticket-purchases/api"
import { formatTicketPrice } from "@/features/events/utils"
import { toastApiError } from "@/lib/toasts"

function formatDateTime(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a")
  } catch {
    return iso
  }
}

function statusBadgeVariant(status: string) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "default"
  if (status === "PENDING") return "secondary"
  return "destructive"
}

function TableSkeletonRows({ cols }: { cols: number }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={`sk-${i}`} className="border-zinc-800">
      {Array.from({ length: cols }).map((__, j) => (
        <TableCell key={j} className="py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-800" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export default function ManageTicketsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  const [statusFilter, setStatusFilter] =
    useState<TicketSaleStatusFilter>("CONFIRMED")
  const [eventFilter, setEventFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const queryParams = useMemo(
    () => ({
      status: statusFilter,
      eventId: eventFilter === "ALL" ? undefined : eventFilter,
      page,
      limit: 25,
    }),
    [statusFilter, eventFilter, page],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ticket-sales", queryParams],
    queryFn: () => getTicketSales(queryParams),
  })

  const summary = data?.summary ?? []
  const records = data?.records ?? []
  const pagination = data?.pagination

  const searchLower = search.trim().toLowerCase()

  const filteredSummary = useMemo(() => {
    if (!searchLower) return summary
    return summary.filter(
      (row) =>
        row.eventName.toLowerCase().includes(searchLower) ||
        row.vendorName?.toLowerCase().includes(searchLower),
    )
  }, [summary, searchLower])

  const filteredRecords = useMemo(() => {
    if (!searchLower) return records
    return records.filter((row) => {
      const buyerName = `${row.buyer.firstName} ${row.buyer.lastName}`.toLowerCase()
      return (
        row.eventName.toLowerCase().includes(searchLower) ||
        row.ticketTypeName.toLowerCase().includes(searchLower) ||
        row.orderCode?.toLowerCase().includes(searchLower) ||
        buyerName.includes(searchLower) ||
        row.buyer.email.toLowerCase().includes(searchLower)
      )
    })
  }, [records, searchLower])

  const totals = useMemo(() => {
    return filteredSummary.reduce(
      (acc, row) => ({
        tickets: acc.tickets + row.totalTicketsSold,
        revenue: acc.revenue + row.totalRevenue,
      }),
      { tickets: 0, revenue: 0 },
    )
  }, [filteredSummary])

  const currency =
    filteredSummary[0]?.currency ?? records[0]?.currency ?? "PKR"

  useEffect(() => {
    if (isError) toastApiError(error, "Could not load ticket sales.")
  }, [isError, error])

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="w-full space-y-6 rounded-2xl bg-[#0e0e0e] p-6 text-white">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h2 className="text-xl font-bold text-primary">Ticket Sales</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {isAdmin
                ? "View confirmed and pending ticket sales across all events."
                : "View ticket sales for your events only."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
              <Input
                placeholder="Search events, buyers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-primary/20 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as TicketSaleStatusFilter)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full border-zinc-700 bg-zinc-900 sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="ALL">All statuses</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={eventFilter}
              onValueChange={(v) => {
                setEventFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full border-zinc-700 bg-zinc-900 sm:w-[200px]">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All events</SelectItem>
                {summary.map((ev) => (
                  <SelectItem key={ev.eventId} value={ev.eventId}>
                    {ev.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-600"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-[#151515] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Tickets sold</p>
                <p className="text-2xl font-semibold">{totals.tickets}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#151515] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <span className="text-lg font-bold text-primary">$</span>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Revenue (filtered)</p>
                <p className="text-2xl font-semibold">
                  {formatTicketPrice(totals.revenue, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="by-event" className="w-full">
          <TabsList className="bg-zinc-900">
            <TabsTrigger value="by-event">By event</TabsTrigger>
            <TabsTrigger value="sales-log">Sales log</TabsTrigger>
          </TabsList>

          <TabsContent value="by-event" className="mt-4">
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Event</TableHead>
                    {isAdmin ? (
                      <TableHead className="text-zinc-400">Vendor</TableHead>
                    ) : null}
                    <TableHead className="text-zinc-400">Date</TableHead>
                    <TableHead className="text-zinc-400">Ticket type</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Sold
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Inventory
                    </TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Revenue
                    </TableHead>
                    <TableHead className="text-zinc-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeletonRows cols={isAdmin ? 8 : 7} />
                  ) : filteredSummary.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell
                        colSpan={isAdmin ? 8 : 7}
                        className="py-10 text-center text-zinc-500"
                      >
                        No ticket sales found for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSummary.flatMap((event) =>
                      event.ticketTypes.length > 0
                        ? event.ticketTypes.map((tt, idx) => (
                            <TableRow
                              key={`${event.eventId}-${tt.ticketTypeId}`}
                              className="border-zinc-800"
                            >
                              <TableCell className="font-medium">
                                {idx === 0 ? event.eventName : ""}
                              </TableCell>
                              {isAdmin ? (
                                <TableCell className="text-zinc-400">
                                  {idx === 0 ? (event.vendorName ?? "—") : ""}
                                </TableCell>
                              ) : null}
                              <TableCell className="text-zinc-400">
                                {idx === 0
                                  ? formatDateTime(event.eventStartDateTime)
                                  : ""}
                              </TableCell>
                              <TableCell>{tt.name}</TableCell>
                              <TableCell className="text-right">
                                {tt.ticketsSoldInFilter}
                              </TableCell>
                              <TableCell className="text-right text-zinc-400">
                                {tt.quantitySold} / {tt.quantityTotal}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatTicketPrice(
                                  tt.revenueInFilter,
                                  tt.currency,
                                )}
                              </TableCell>
                              <TableCell>
                                {idx === 0 ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="text-primary hover:text-primary"
                                  >
                                    <Link
                                      href={`/events/${event.eventSlug}`}
                                      target="_blank"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                ) : null}
                              </TableCell>
                            </TableRow>
                          ))
                        : [
                            <TableRow
                              key={event.eventId}
                              className="border-zinc-800"
                            >
                              <TableCell className="font-medium">
                                {event.eventName}
                              </TableCell>
                              {isAdmin ? (
                                <TableCell className="text-zinc-400">
                                  {event.vendorName ?? "—"}
                                </TableCell>
                              ) : null}
                              <TableCell className="text-zinc-400">
                                {formatDateTime(event.eventStartDateTime)}
                              </TableCell>
                              <TableCell
                                colSpan={4}
                                className="text-zinc-500"
                              >
                                No ticket types
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-primary"
                                >
                                  <Link
                                    href={`/events/${event.eventSlug}`}
                                    target="_blank"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>,
                          ],
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="sales-log" className="mt-4 space-y-4">
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Order</TableHead>
                    <TableHead className="text-zinc-400">Event</TableHead>
                    <TableHead className="text-zinc-400">Ticket</TableHead>
                    <TableHead className="text-zinc-400">Buyer</TableHead>
                    {isAdmin ? (
                      <TableHead className="text-zinc-400">Vendor</TableHead>
                    ) : null}
                    <TableHead className="text-right text-zinc-400">Qty</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Amount
                    </TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-zinc-400">Purchased</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeletonRows cols={isAdmin ? 9 : 8} />
                  ) : filteredRecords.length === 0 ? (
                    <TableRow className="border-zinc-800">
                      <TableCell
                        colSpan={isAdmin ? 9 : 8}
                        className="py-10 text-center text-zinc-500"
                      >
                        No sales records on this page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((row) => (
                      <TableRow key={row.id} className="border-zinc-800">
                        <TableCell className="font-mono text-sm text-zinc-300">
                          {row.orderCode ?? "—"}
                        </TableCell>
                        <TableCell>{row.eventName}</TableCell>
                        <TableCell>{row.ticketTypeName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {row.buyer.firstName} {row.buyer.lastName}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {row.buyer.email}
                          </div>
                        </TableCell>
                        {isAdmin ? (
                          <TableCell className="text-zinc-400">
                            {row.vendorName ?? "—"}
                          </TableCell>
                        ) : null}
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatTicketPrice(row.totalAmount, row.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(row.status)}>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {formatDateTime(row.purchasedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-zinc-500">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} records)
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-600"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-600"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPage((p) =>
                        Math.min(pagination.totalPages, p + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
