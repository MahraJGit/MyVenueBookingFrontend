"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Eye, Loader2 } from "lucide-react"
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
  getPreviewAttraction,
  listManagedAttractions,
  updateAttractionStatus,
  type AttractionApprovalStatus,
  type ManagedAttraction,
} from "@/features/attractions/api"
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
import { DashboardDataTable, DashboardSortableHeader } from "@/components/dashboard/dashboard-data-table"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"
import { useTableQueryState } from "@/hooks/use-table-query-state"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type StatusFilter = "ALL" | AttractionApprovalStatus

const REVIEW_STATUSES: AttractionApprovalStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "DRAFT",
]

function statusBadgeVariant(status: AttractionApprovalStatus | undefined) {
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

function reviewableStatus(
  status: AttractionApprovalStatus | undefined,
): "APPROVED" | "REJECTED" | "PENDING" | null {
  if (status === "APPROVED" || status === "ACTIVE") return "APPROVED"
  if (status === "REJECTED" || status === "PENDING") return status
  return status === "DRAFT" ? "PENDING" : null
}

function isLiveAttractionStatus(
  status: AttractionApprovalStatus | undefined,
): boolean {
  return status === "APPROVED" || status === "ACTIVE"
}

function formatDaysOfWeek(days: number[]): string {
  if (!days.length) return ""
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? String(d))
    .join(", ")
}

export default function AttractionReviewsPage() {
  const t = useTranslations("adminAttractionReviews")
  const tCommon = useTranslations("common")
  const tStatus = useTranslations("entityStatus")
  const tAdmin = useTranslations("adminDashboard")
  const tForms = useTranslations("forms")
  const tListing = useTranslations("listing")
  const tTables = useTranslations("tables")
  const queryClient = useQueryClient()
  const table = useTableQueryState<{ status: StatusFilter }>({
    initialSortBy: "createdAt",
    initialFilters: { status: "ALL" },
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<ManagedAttraction | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const statusLabel = (status: AttractionApprovalStatus | undefined) => {
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
    queryKey: ["admin-attraction-reviews", table.queryParams],
    queryFn: () =>
      listManagedAttractions({
        ...table.queryParams,
        vendorOnly: true,
        ...(table.filters.status !== "ALL" ? { status: table.filters.status } : {}),
        sortBy: table.sortBy as "createdAt" | "name" | "scheduleStartDate" | undefined,
      }),
  })

  const detailsQuery = useQuery({
    queryKey: ["admin-attraction-review-detail", activeId],
    queryFn: () => getPreviewAttraction(activeId!),
    enabled: Boolean(activeId),
  })

  const attractions = listResult?.data ?? []
  const meta = listResult?.meta
  const totalPages = meta?.totalPages ?? 1
  const showPagination = !isLoading && (meta?.total ?? 0) > 0
  const activeDetails = detailsQuery.data ?? null

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string
      status: "APPROVED" | "REJECTED"
      reason?: string
    }) => updateAttractionStatus(vars.id, { status: vars.status, reason: vars.reason }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-attraction-reviews"] })
      queryClient.invalidateQueries({ queryKey: ["managed-attractions"] })
      queryClient.invalidateQueries({
        queryKey: ["admin-attraction-review-detail", result.id],
      })
      setActiveId(null)
      setRejectTarget(null)
      setRejectReason("")
      toast.success(
        result.status === "APPROVED" ? t("attractionApproved") : t("attractionRejected"),
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

  const attractionColumnHeader = tAdmin("tableAttraction")
  const locationLine = activeDetails
    ? [
        activeDetails.address,
        activeDetails.city,
        activeDetails.state,
        activeDetails.countryCode,
        activeDetails.zipCode,
      ]
        .filter(Boolean)
        .join(", ")
    : ""

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
                variant={table.filters.status === "ALL" ? "default" : "outline"}
                onClick={() => table.setFilter("status", "ALL")}
                disabled={isLoading}
              >
                {tCommon("all")}
              </Button>
              {REVIEW_STATUSES.map((s) => (
                <Button
                  key={s}
                  variant={table.filters.status === s ? "default" : "outline"}
                  onClick={() => table.setFilter("status", s)}
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
        toolbar={{
          search: { value: table.search, onChange: table.setSearch, placeholder: tCommon("search") },
          pageSize: { value: table.pageSize, onChange: table.setPageSize },
          onReset: table.reset,
          showReset: table.hasActiveFilters,
          isRefreshing: isFetching && !isLoading,
        }}
        pagination={
          showPagination
            ? {
                label: tListing("pageOfWithCount", {
                  page: meta?.page ?? table.page,
                  totalPages,
                  total: meta?.total ?? attractions.length,
                  type: t("attractionsCount"),
                }),
                page: table.page,
                totalPages,
                total: meta?.total ?? attractions.length,
                onPageChange: table.setPage,
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
              <DashboardSortableHeader className="min-w-[200px]" label={attractionColumnHeader} column="name" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
              <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                {tCommon("vendor")}
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                {tAdmin("tableCity")}
              </TableHead>
              <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                {tCommon("status")}
              </TableHead>
              <DashboardSortableHeader className="min-w-[110px]" label={tCommon("submitted")} column="createdAt" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
              <TableHead className="min-w-[240px] whitespace-nowrap text-right text-muted-foreground">
                {tCommon("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={6} />
            ) : attractions.length === 0 ? (
              <TableEmptyRow colSpan={6}>
                {table.hasActiveFilters ? tTables("noMatch") : t("noAttractions")}
              </TableEmptyRow>
            ) : (
              attractions.map((row) => {
                  const selectValue = reviewableStatus(row.status)
                  return (
                    <TableRow
                      key={row.id}
                      className={dashboardTableRowClass}
                    >
                      <TableCell className="max-w-[240px] whitespace-normal break-words font-medium">
                        <button
                          type="button"
                          className="text-left hover:text-primary hover:underline"
                          onClick={() => setActiveId(row.id)}
                        >
                          {row.name}
                        </button>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate text-muted-foreground"
                        title={row.vendorProfile?.vendorName ?? undefined}
                      >
                        {row.vendorProfile?.vendorName ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.city}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={statusBadgeVariant(row.status)}>
                          {statusLabel(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {row.createdAt ? formatDate(row.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className={dashboardTableActionsClass}>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn("shrink-0", dashboardOutlineButtonClass)}
                            onClick={() => setActiveId(row.id)}
                          >
                            <Eye className="h-4 w-4" />
                            {tCommon("view")}
                          </Button>

                          <Select
                            value={selectValue ?? undefined}
                            disabled={!selectValue || pendingRowId === row.id}
                            onValueChange={(value: "APPROVED" | "REJECTED" | "PENDING") => {
                              if (value === "REJECTED") {
                                setRejectTarget(row)
                                return
                              }
                              if (value === "APPROVED") {
                                if (isLiveAttractionStatus(row.status)) return
                                updateMutation.mutate({
                                  id: row.id,
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
                                {pendingRowId === row.id ? (
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
        open={Boolean(activeId)}
        onOpenChange={(open) => !open && setActiveId(null)}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
            dashboardDialogContentClass,
          )}
        >
          <DialogHeader>
            <DialogTitle>{activeDetails?.name ?? tAdmin("tableAttraction")}</DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {detailsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detailsQuery.isError ? (
            <p className="text-sm text-destructive">
              {detailsQuery.error instanceof Error
                ? detailsQuery.error.message
                : t("failedLoadDetails")}
            </p>
          ) : activeDetails ? (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusBadgeVariant(activeDetails.status)}>
                  {statusLabel(activeDetails.status)}
                </Badge>
                {activeDetails.status === "APPROVED" ||
                activeDetails.status === "ACTIVE" ? (
                  <Button size="sm" variant="outline" className={dashboardOutlineButtonClass} asChild>
                    <Link
                      href={`/attractions/${activeDetails.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      {t("viewOnSite")}
                    </Link>
                  </Button>
                ) : null}
              </div>

              {(activeDetails.coverImage || activeDetails.thumbnail) ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t("media")}
                  </p>
                  <div className="relative h-44 w-full overflow-hidden rounded-lg border border-border bg-muted/20">
                    <Image
                      src={
                        (activeDetails.coverImage || activeDetails.thumbnail || "").trim()
                      }
                      alt={activeDetails.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                  </div>
                </div>
              ) : null}

              {activeDetails.gallery?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t("gallery")}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {activeDetails.gallery.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted/20"
                      >
                        <Image
                          src={url}
                          alt={`${activeDetails.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

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
                <DetailRow label={tForms("timezone")} value={activeDetails.timezone} />
                <DetailRow
                  label={t("daysOfWeek")}
                  value={
                    activeDetails.daysOfWeek?.length
                      ? formatDaysOfWeek(activeDetails.daysOfWeek)
                      : t("everyDay")
                  }
                />
                <DetailRow
                  label={t("seating")}
                  value={
                    activeDetails.seatingEnabled
                      ? t("seatingEnabled")
                      : t("seatingDisabled")
                  }
                />
                <DetailRow
                  label={tForms("venueName")}
                  value={activeDetails.venueName ?? "—"}
                />
                <DetailRow
                  label={t("phone")}
                  value={activeDetails.venuePhone ?? "—"}
                />
                <DetailRow
                  label={t("website")}
                  value={activeDetails.venueWebsite ?? "—"}
                />
                <DetailRow
                  label={t("location")}
                  value={locationLine || "—"}
                />
                <DetailRow
                  label={t("coordinates")}
                  value={`${activeDetails.latitude}, ${activeDetails.longitude}`}
                />
              </div>

              {activeDetails.tags?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t("tags")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDetails.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeDetails.description ? (
                <div>
                  <p className="font-semibold text-zinc-400">{tCommon("description")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-zinc-200">
                    {activeDetails.description}
                  </p>
                </div>
              ) : null}

              {activeDetails.slots?.length ? (
                <div>
                  <p className="font-semibold text-zinc-400">{t("slots")}</p>
                  <ul className="mt-2 space-y-1.5 text-zinc-200">
                    {activeDetails.slots.map((slot) => (
                      <li
                        key={`${slot.name}-${slot.startTime}`}
                        className="rounded-md border border-border bg-muted/20 px-3 py-2"
                      >
                        <span className="font-medium">{slot.name}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {slot.startTime} – {slot.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
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
                          quantity: tt.quantityPerOccurrence,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  className="bg-primary text-black hover:bg-primary/90"
                  disabled={
                    updateMutation.isPending ||
                    isLiveAttractionStatus(activeDetails.status)
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
              {t("attractionLabel")}{" "}
              <span className="font-semibold text-white">{rejectTarget?.name}</span>
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
    </DashboardPageShell>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 break-words text-zinc-100">{value}</p>
    </div>
  )
}
