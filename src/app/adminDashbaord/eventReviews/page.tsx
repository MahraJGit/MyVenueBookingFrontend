"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, ExternalLink, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { format } from "date-fns"
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
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { TableShell } from "@/components/ui/table-shell"
import { toastApiError } from "@/lib/toasts"

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

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), "MMM d, yyyy")
  } catch {
    return dateString
  }
}

function formatDateTime(dateString: string) {
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a")
  } catch {
    return dateString
  }
}

function reviewableStatus(
  status: EventApprovalStatus | undefined,
): "APPROVED" | "REJECTED" | "PENDING" | null {
  if (status === "APPROVED" || status === "REJECTED" || status === "PENDING") {
    return status
  }
  return status === "DRAFT" ? "PENDING" : null
}

export default function EventReviewsPage() {
  const t = useTranslations("adminEventReviews")
  const tCommon = useTranslations("common")
  const tStatus = useTranslations("entityStatus")
  const tAdmin = useTranslations("adminDashboard")
  const tForms = useTranslations("forms")
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [activeDetails, setActiveDetails] = useState<ManagedEvent | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ManagedEvent | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const statusLabel = (status: EventApprovalStatus | undefined) => {
    if (!status) return tStatus("unknown")
    if (status === "PENDING") return tStatus("pending")
    if (status === "APPROVED") return tStatus("approved")
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
    queryKey: ["admin-event-reviews", statusFilter],
    queryFn: () =>
      listManagedEvents({
        page: 1,
        limit: 100,
        vendorOnly: true,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  })

  const events = listResult?.data ?? []

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string
      status: "APPROVED" | "REJECTED"
      reason?: string
    }) => updateEventStatus(vars.id, { status: vars.status, reason: vars.reason }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-event-reviews"] })
      queryClient.invalidateQueries({ queryKey: ["managed-events"] })
      setActiveDetails((prev) => (prev?.id === result.id ? result : prev))
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
    updateMutation.mutate(
      {
        id: rejectTarget.id,
        status: "REJECTED",
        reason: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          setRejectReason("")
          setRejectTarget(null)
        },
      },
    )
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden rounded-2xl bg-[#0e0e0e] p-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
          <p className="text-sm text-gray-300">{t("description")}</p>
        </div>

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
      </div>

      {errorMessage ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-400/50 text-red-100 hover:bg-red-500/20"
            onClick={() => void refetch()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      ) : null}

      <TableShell className="max-w-full">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{tAdmin("tableEvent")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("vendor")}</TableHead>
              <TableHead className="text-muted-foreground">{tAdmin("tableCity")}</TableHead>
              <TableHead className="text-muted-foreground">{t("starts")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("submitted")}</TableHead>
              <TableHead className="text-right text-muted-foreground">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={7} />
            ) : (
              <>
                {events.map((ev) => {
                  const selectValue = reviewableStatus(ev.status)
                  return (
                    <TableRow
                      key={ev.id}
                      className="border-border transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="max-w-[200px] font-medium whitespace-normal wrap-break-word">
                        {ev.eventName}
                      </TableCell>
                      <TableCell className="max-w-[180px] whitespace-normal wrap-break-word">
                        {ev.vendorProfile?.vendorName ?? "—"}
                      </TableCell>
                      <TableCell>{ev.city}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-zinc-300">
                        {formatDateTime(ev.startDateTime)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(ev.status)}>
                          {statusLabel(ev.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ev.createdAt ? formatDate(ev.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="min-w-[220px] text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700"
                            onClick={() => setActiveDetails(ev)}
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
                              if (value === ev.status) return
                              if (value === "APPROVED") {
                                updateMutation.mutate({ id: ev.id, status: "APPROVED" })
                              }
                            }}
                          >
                            <SelectTrigger
                              size="sm"
                              className="h-8 min-w-[130px] border-zinc-700"
                            >
                              <span className="flex w-full items-center gap-2">
                                {pendingRowId === ev.id ? (
                                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                                ) : null}
                                <SelectValue placeholder={t("setStatus")} />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING" disabled>
                                {tStatus("pending")}
                              </SelectItem>
                              <SelectItem value="APPROVED">{tAdmin("approve")}</SelectItem>
                              <SelectItem value="REJECTED">{tAdmin("reject")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {!isLoading && events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-gray-400"
                    >
                      {t("noEvents")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog
        open={Boolean(activeDetails)}
        onOpenChange={(open) => !open && setActiveDetails(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-700 bg-[#111111] text-white">
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
                  <Button size="sm" variant="outline" className="border-zinc-700" asChild>
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
                  value={formatDateTime(activeDetails.startDateTime)}
                />
                <DetailRow
                  label={t("ends")}
                  value={formatDateTime(activeDetails.endDateTime)}
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
                    updateMutation.isPending || activeDetails.status === "APPROVED"
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
                <Button variant="outline" className="border-zinc-700" asChild>
                  <Link
                    href={`/adminDashbaord/addEvents?id=${encodeURIComponent(activeDetails.id)}`}
                  >
                    {t("editInDashboard")}
                  </Link>
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
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
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
              className="min-h-[100px] border-zinc-700 bg-zinc-900 text-white"
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
    </div>
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
