"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, ExternalLink, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  listManagedEvents,
  updateEventStatus,
  type EventApprovalStatus,
  type ManagedEvent,
} from "@/features/events/api"
import { EventPublicPreviewDialog } from "@/components/events/EventPublicPreviewDialog"
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton"
import { toastApiError } from "@/lib/toasts"
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardDialogContentClass,
  dashboardOutlineButtonClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui"
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

type StatusFilter = "ALL" | EventApprovalStatus

const REVIEW_STATUSES: EventApprovalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DRAFT",
]

function statusBadgeVariant(status: EventApprovalStatus | undefined) {
  if (status === "APPROVED" || status === "ACTIVE") return "default"
  if (status === "REJECTED" || status === "CANCELLED") return "destructive"
  return "secondary"
}

function formatDate(dateString: string, timeZone?: string | null) {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(timeZone ? { timeZone } : {}),
    })
  } catch {
    return dateString
  }
}

function formatDateTime(dateString: string, timeZone?: string | null) {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    })
  } catch {
    return dateString
  }
}

function reviewableStatus(
  status: EventApprovalStatus | undefined,
): "APPROVED" | "REJECTED" | "PENDING" | null {
  if (status === "APPROVED" || status === "ACTIVE") return "APPROVED"
  if (status === "REJECTED" || status === "PENDING") return status
  return status === "DRAFT" ? "PENDING" : null
}

function isLiveEventStatus(status: EventApprovalStatus | undefined): boolean {
  return status === "APPROVED" || status === "ACTIVE"
}

export default function EventReviewsPage() {
  const t = useTranslations("adminEventReviews")
  const tCommon = useTranslations("common")
  const tStatus = useTranslations("entityStatus")
  const tAdmin = useTranslations("adminDashboard")
  const tForms = useTranslations("forms")
  const tListing = useTranslations("listing")
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [page, setPage] = useState(1)
  const [viewEvent, setViewEvent] = useState<ManagedEvent | null>(null)
  const [activeDetails, setActiveDetails] = useState<ManagedEvent | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ManagedEvent | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const statusLabel = (status: EventApprovalStatus | undefined) => {
    if (!status) return tStatus("unknown")
    if (status === "PENDING") return tStatus("pending")
    if (status === "APPROVED" || status === "ACTIVE") return tStatus("approved")
    if (status === "REJECTED") return tStatus("rejected")
    if (status === "DRAFT") return tStatus("draft")
    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  const {
    data: listResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-event-reviews", statusFilter, page],
    queryFn: () =>
      listManagedEvents({
        page,
        limit: PAGE_SIZE,
        vendorOnly: true,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  })

  const events = listResult?.data ?? []
  const meta = listResult?.meta
  const totalPages = meta?.totalPages ?? 1
  const showPagination = !isLoading && (meta?.total ?? 0) > 0

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string
      status: "APPROVED" | "REJECTED"
      reason?: string
    }) => updateEventStatus(vars.id, { status: vars.status, reason: vars.reason }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-event-reviews"] })
      queryClient.invalidateQueries({ queryKey: ["managed-events"] })
      setActiveDetails(null)
      setViewEvent(null)
      setRejectTarget(null)
      setRejectReason("")
      toast.success(
        result.status === "APPROVED" ? t("eventApproved") : t("eventRejected"),
      )
    },
    onError: (err) => {
      toastApiError(err, t("couldNotUpdate"))
    },
  })

  const pendingRowId = updateMutation.isPending
    ? updateMutation.variables?.id
    : undefined

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null
    return error instanceof Error ? error.message : t("failedLoad")
  }, [isError, error, t])

  const handleRejectSubmit = () => {
    if (!rejectTarget || !rejectReason.trim()) return
    updateMutation.mutate({
      id: rejectTarget.id,
      status: "REJECTED",
      reason: rejectReason.trim(),
    })
  }

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("title")}
          description={t("description")}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {isFetching && !isLoading ? (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {tCommon("refreshing")}
                </span>
              ) : null}
              <Button
                variant={statusFilter === "ALL" ? "default" : "outline"}
                onClick={() => setStatusFilter("ALL")}
                disabled={isLoading}
              >
                {tCommon("all")}
              </Button>
              {REVIEW_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                  disabled={isLoading}
                >
                  {statusLabel(s)}
                </Button>
              ))}
            </div>
          }
        />

      {errorMessage ? (
        <DashboardErrorAlert
          message={errorMessage}
          onRetry={() => void refetch()}
          retryLabel={tCommon("retry")}
        />
      ) : null}

      <DashboardDataTable
        pagination={
          showPagination
            ? {
                label: tListing("pageOfWithCount", {
                  page: meta?.page ?? page,
                  totalPages,
                  total: meta?.total ?? events.length,
                  type: tListing("eventsCount"),
                }),
                page,
                totalPages,
                total: meta?.total ?? events.length,
                onPageChange: setPage,
                previousLabel: tCommon("previous"),
                nextLabel: tCommon("next"),
                isLoading,
              }
            : undefined
        }
      >
        <Table
          className={cn(dashboardTableClass, "min-w-[1100px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="min-w-[200px] whitespace-nowrap text-muted-foreground">
                {tAdmin("tableEvent")}
              </TableHead>
              <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                {tCommon("vendor")}
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                {tAdmin("tableCity")}
              </TableHead>
              <TableHead className="min-w-[170px] whitespace-nowrap text-muted-foreground">
                {t("starts")}
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                {tCommon("status")}
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                {tCommon("submitted")}
              </TableHead>
              <TableHead className="min-w-[240px] whitespace-nowrap text-right text-muted-foreground">
                {tCommon("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={7} />
            ) : events.length === 0 ? (
              <TableEmptyRow colSpan={7}>{t("noEvents")}</TableEmptyRow>
            ) : (
              events.map((ev) => {
                  const selectValue = reviewableStatus(ev.status)
                  return (
                    <TableRow
                      key={ev.id}
                      className={dashboardTableRowClass}
                    >
                      <TableCell className="max-w-[240px] whitespace-normal break-words font-medium">
                        <button
                          type="button"
                          className="text-left hover:text-primary hover:underline"
                          onClick={() => setActiveDetails(ev)}
                        >
                          {ev.eventName}
                        </button>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-muted-foreground"
                        title={ev.vendorProfile?.vendorName ?? undefined}
                      >
                        {ev.vendorProfile?.vendorName ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {ev.city}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(ev.startDateTime, ev.timezone)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={statusBadgeVariant(ev.status)}>
                          {statusLabel(ev.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {ev.createdAt ? formatDate(ev.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className={dashboardTableActionsClass}>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn("shrink-0", dashboardOutlineButtonClass)}
                            onClick={() => setViewEvent(ev)}
                          >
                            <Eye className="h-4 w-4" />
                            {tCommon("view")}
                          </Button>

                          <Select
                            value={selectValue ?? undefined}
                            disabled={!selectValue || pendingRowId === ev.id}
                            onValueChange={(value: "APPROVED" | "REJECTED" | "PENDING") => {
                              if (value === "REJECTED") {
                                setRejectTarget(ev)
                                return
                              }
                              if (value === "APPROVED") {
                                if (isLiveEventStatus(ev.status)) return
                                updateMutation.mutate({
                                  id: ev.id,
                                  status: "APPROVED",
                                })
                              }
                            }}
                          >
                            <SelectTrigger
                              size="sm"
                              className={cn("h-8 w-[130px] shrink-0", dashboardSelectTriggerClass)}
                            >
                              <span className="flex w-full items-center gap-2">
                                {pendingRowId === ev.id ? (
                                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                                ) : null}
                                <SelectValue placeholder={t("setStatus")} />
                              </span>
                            </SelectTrigger>
                            <SelectContent className={dashboardDropdownContentClass}>
                              <SelectItem value="PENDING" disabled>
                                {tStatus("pending")}
                              </SelectItem>
                              <SelectItem value="APPROVED">
                                {tStatus("approved")}
                              </SelectItem>
                              <SelectItem value="REJECTED">
                                {tStatus("rejected")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>

      <Dialog
        open={Boolean(activeDetails)}
        onOpenChange={(open) => !open && setActiveDetails(null)}
      >
        <DialogContent className={cn("max-h-[85vh] overflow-y-auto", dashboardDialogContentClass)}>
          <DialogHeader>
            <DialogTitle>{activeDetails?.eventName}</DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {activeDetails ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(activeDetails.status)}>
                  {statusLabel(activeDetails.status)}
                </Badge>
                {activeDetails.status === "APPROVED" ? (
                  <Button size="sm" variant="outline" className={dashboardOutlineButtonClass} asChild>
                    <Link
                      href={`/events/${activeDetails.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      {t("viewOnSite")}
                    </Link>
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DetailRow
                  label={tCommon("vendor")}
                  value={activeDetails.vendorProfile?.vendorName ?? "—"}
                />
                <DetailRow
                  label={t("vendorEmail")}
                  value={activeDetails.vendorProfile?.email ?? "—"}
                />
                <DetailRow label={tCommon("category")} value={activeDetails.category ?? "—"} />
                <DetailRow label={tForms("city")} value={activeDetails.city} />
                <DetailRow
                  label={t("starts")}
                  value={formatDateTime(activeDetails.startDateTime, activeDetails.timezone)}
                />
                <DetailRow
                  label={t("ends")}
                  value={formatDateTime(activeDetails.endDateTime, activeDetails.timezone)}
                />
                <DetailRow label={tForms("venueName")} value={activeDetails.venueName ?? "—"} />
                <DetailRow label={tForms("address")} value={activeDetails.address ?? "—"} />
              </div>

              {activeDetails.eventDescription ? (
                <div>
                  <p className="font-semibold text-zinc-400">{tCommon("description")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-200">
                    {activeDetails.eventDescription}
                  </p>
                </div>
              ) : null}

              {activeDetails.ticketTypes.length > 0 ? (
                <div>
                  <p className="font-semibold text-zinc-400">{t("ticketTypes")}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-200">
                    {activeDetails.ticketTypes.map((tt) => (
                      <li key={tt.id ?? tt.name}>
                        {t("ticketAvailable", {
                          name: tt.name,
                          currency: tt.currency,
                          price: String(tt.price),
                          quantity: tt.quantityTotal,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  className="bg-primary text-black hover:bg-primary/90"
                  disabled={
                    updateMutation.isPending ||
                    isLiveEventStatus(activeDetails.status)
                  }
                  onClick={() =>
                    updateMutation.mutate({
                      id: activeDetails.id,
                      status: "APPROVED",
                    })
                  }
                >
                  {tAdmin("approve")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={
                    updateMutation.isPending || activeDetails.status === "REJECTED"
                  }
                  onClick={() => setRejectTarget(activeDetails)}
                >
                  {tAdmin("reject")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null)
            setRejectReason("")
          }
        }}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-zinc-300">
              {t("eventLabel")}{" "}
              <span className="font-semibold text-white">{rejectTarget?.eventName}</span>
            </p>
            <Textarea
              placeholder={t("rejectPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={dashboardTextareaClass}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason("")
              }}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("rejecting")}
                </>
              ) : (
                t("confirmReject")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </DashboardPanel>

      <EventPublicPreviewDialog
        event={viewEvent}
        onClose={() => setViewEvent(null)}
      />
    </DashboardPageShell>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-zinc-100">{value}</p>
    </div>
  )
}
