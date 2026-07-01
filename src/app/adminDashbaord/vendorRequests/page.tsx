"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
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
  listAdminVendorProfiles,
  updateVendorVerification,
  type AdminVendorProfile,
  type VendorVerificationStatus,
} from "@/features/vendor/api"
import { getPresignedViewUrl } from "@/features/uploads/api"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { toastApiError } from "@/lib/toasts"
import { cn } from "@/lib/utils"
import { useClientPagination } from "@/hooks/use-client-pagination"
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardScrollableTabs,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardDialogContentClass,
  dashboardSelectTriggerClass,
  dashboardOutlineButtonClass,
  dashboardDropdownContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui"
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared"

type StatusFilter = "ALL" | VendorVerificationStatus

function statusBadgeVariant(status: VendorVerificationStatus) {
  if (status === "APPROVED") return "default"
  if (status === "REJECTED") return "destructive"
  return "secondary"
}

function formatDate(dateString: string) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return d.toLocaleDateString()
}

export default function VendorRequests() {
  const t = useTranslations("adminVendorRequests")
  const tCommon = useTranslations("common")
  const tStatus = useTranslations("entityStatus")
  const tAdmin = useTranslations("adminDashboard")
  const tForms = useTranslations("forms")
  const tListing = useTranslations("listing")
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [activeDetails, setActiveDetails] = useState<AdminVendorProfile | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminVendorProfile | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const statusLabel = (status: VendorVerificationStatus) => {
    if (status === "APPROVED") return tStatus("approved")
    if (status === "REJECTED") return tStatus("rejected")
    return tStatus("pending")
  }

  const {
    data: requests = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-vendors", statusFilter],
    queryFn: () => listAdminVendorProfiles(statusFilter),
  })

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string
      verificationStatus: VendorVerificationStatus
      rejectedReason?: string
    }) => updateVendorVerification(vars.id, vars),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] })
      setActiveDetails((prev) => (prev?.id === result.id ? result : prev))
      toast.success(
        result.verificationStatus === "APPROVED"
          ? t("vendorApproved")
          : result.verificationStatus === "REJECTED"
            ? t("vendorRejected")
            : t("statusUpdated"),
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

  const {
    page,
    setPage,
    resetPage,
    total,
    totalPages,
    paginatedItems: paginatedRequests,
  } = useClientPagination(requests)

  useEffect(() => {
    resetPage()
  }, [statusFilter, resetPage])

  const handleRejectSubmit = () => {
    if (!rejectTarget || !rejectReason.trim()) return
    updateMutation.mutate(
      {
        id: rejectTarget.id,
        verificationStatus: "REJECTED",
        rejectedReason: rejectReason.trim(),
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
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("title")}
          description={t("description")}
          action={
            isFetching && !isLoading ? (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {tCommon("refreshing")}
              </span>
            ) : null
          }
        />

        <DashboardScrollableTabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          items={(
            ["ALL", "PENDING", "APPROVED", "REJECTED"] as const
          ).map((value) => ({
            value,
            label:
              value === "ALL"
                ? tCommon("all")
                : statusLabel(value as VendorVerificationStatus),
          }))}
        />

      {errorMessage ? (
        <DashboardErrorAlert
          message={errorMessage}
          onRetry={() => void refetch()}
          retryLabel={tCommon("retry")}
        />
      ) : null}

      <DashboardDataTable
        pagination={{
          label: tListing("pageOfWithCount", {
            page,
            totalPages,
            total,
            type: t("title").toLowerCase(),
          }),
          page,
          totalPages,
          total,
          onPageChange: setPage,
          previousLabel: tCommon("previous"),
          nextLabel: tCommon("next"),
          isLoading,
        }}
      >
        <Table className={dashboardTableClass} containerClassName="overflow-visible">
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="w-[14%] text-muted-foreground">{tCommon("vendor")}</TableHead>
              <TableHead className="w-[10%] text-muted-foreground">{tCommon("businessType")}</TableHead>
              <TableHead className="w-[12%] text-muted-foreground">{tCommon("owner")}</TableHead>
              <TableHead className="w-[22%] text-muted-foreground">{tCommon("email")}</TableHead>
              <TableHead className="w-[12%] text-muted-foreground">{tCommon("phone")}</TableHead>
              <TableHead className="w-[10%] text-muted-foreground">{tCommon("status")}</TableHead>
              <TableHead className="w-[10%] text-muted-foreground">{tCommon("submitted")}</TableHead>
              <TableHead className="w-[10%] text-right text-muted-foreground">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={8} />
            ) : (
              <>
                {paginatedRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={dashboardTableRowClass}
                  >
                    <TableCell className="whitespace-normal break-words font-medium">
                      {request.vendorName}
                    </TableCell>
                    <TableCell className="whitespace-normal">{request.businessType}</TableCell>
                    <TableCell className="whitespace-normal">{request.ownerName}</TableCell>
                    <TableCell className="whitespace-normal break-all">
                      {request.email}
                    </TableCell>
                    <TableCell className="whitespace-normal">{request.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(request.verificationStatus)}>
                        {statusLabel(request.verificationStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                          onClick={() => setActiveDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                          {tCommon("view")}
                        </Button>

                        <Select
                          value={request.verificationStatus}
                          disabled={pendingRowId === request.id}
                          onValueChange={(value: VendorVerificationStatus) => {
                            if (value === "REJECTED") {
                              setRejectTarget(request)
                              return
                            }
                            if (value === request.verificationStatus) return
                            updateMutation.mutate({
                              id: request.id,
                              verificationStatus: value,
                            })
                          }}
                        >
                          <SelectTrigger
                            size="sm"
                            className={cn("h-8 min-w-[130px]", dashboardSelectTriggerClass)}
                          >
                            <span className="flex w-full items-center gap-2">
                              {pendingRowId === request.id ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                              ) : null}
                              <SelectValue placeholder={t("setStatus")} />
                            </span>
                          </SelectTrigger>
                          <SelectContent className={dashboardDropdownContentClass}>
                            <SelectItem value="PENDING">{tStatus("pending")}</SelectItem>
                            <SelectItem value="APPROVED">{tAdmin("approve")}</SelectItem>
                            <SelectItem value="REJECTED">{tAdmin("reject")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-gray-400"
                    >
                      {t("noRequests")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>
      </DashboardPanel>

      <Dialog
        open={Boolean(activeDetails)}
        onOpenChange={(open) => !open && setActiveDetails(null)}
      >
        <DialogContent className={cn("max-h-[85vh] overflow-y-auto", dashboardDialogContentClass)}>
          <DialogHeader>
            <DialogTitle>{t("detailsTitle")}</DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {activeDetails ? (
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <DetailRow label={t("vendorName")} value={activeDetails.vendorName} />
              <DetailRow label={tCommon("businessType")} value={activeDetails.businessType} />
              <DetailRow label={t("ownerName")} value={activeDetails.ownerName} />
              <DetailRow label={tCommon("email")} value={activeDetails.email} />
              <DetailRow label={tCommon("phone")} value={activeDetails.phone} />
              <DetailRow label={tForms("address")} value={activeDetails.address} />
              <DetailRow label={t("eidNumber")} value={activeDetails.eidNumber} />
              <DetailRow label={t("eidExpiry")} value={formatDate(activeDetails.eidExpiry)} />
              <DetailRow label={t("passportNumber")} value={activeDetails.passportNumber} />
              <DetailRow
                label={t("passportExpiry")}
                value={formatDate(activeDetails.passportExpiry)}
              />
              <DetailRow label={t("legalEntity")} value={activeDetails.legalEntityName} />
              <DetailRow
                label={t("incorporationDate")}
                value={formatDate(activeDetails.incorporationDate)}
              />
              <DetailRow label={t("tradeLicenseNo")} value={activeDetails.tradeLicenseNumber} />
              <DetailRow
                label={t("tradeLicenseExpiry")}
                value={formatDate(activeDetails.tradeLicenseExpiry)}
              />
              <DetailRow label={t("taxId")} value={activeDetails.taxId} />
              <DetailRow label={t("paymentTerms")} value={activeDetails.paymentTerms} />
              <DetailRow
                label={tCommon("status")}
                value={statusLabel(activeDetails.verificationStatus)}
              />
              <DetailRow label={t("submittedAt")} value={formatDate(activeDetails.createdAt)} />

              {activeDetails.rejectedReason ? (
                <div className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  <p className="font-semibold">{t("rejectionReason")}</p>
                  <p className="mt-1">{activeDetails.rejectedReason}</p>
                </div>
              ) : null}

              <div className="md:col-span-2 space-y-2 rounded-md border border-zinc-700 p-3">
                <p className="font-semibold">{t("uploadedFiles")}</p>
                <FileLink label={t("eidCopy")} url={activeDetails.eidCopyUrl} notProvided={tCommon("notProvided")} openError={t("couldNotOpenDoc")} />
                <FileLink label={t("passportCopy")} url={activeDetails.passportCopyUrl} notProvided={tCommon("notProvided")} openError={t("couldNotOpenDoc")} />
                <FileLink label={t("tradeLicenseCopy")} url={activeDetails.tradeLicenseCopyUrl} notProvided={tCommon("notProvided")} openError={t("couldNotOpenDoc")} />
                {activeDetails.verificationDocuments.map((fileUrl, index) => (
                  <FileLink
                    key={`${fileUrl}-${index}`}
                    label={t("verificationDocument", { n: index + 1 })}
                    url={fileUrl}
                    notProvided={tCommon("notProvided")}
                    openError={t("couldNotOpenDoc")}
                  />
                ))}
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
        <DialogContent className={cn("border", dashboardDialogContentClass)}>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              {t("vendorLabel")}{" "}
              <span className="font-semibold text-white">{rejectTarget?.vendorName}</span>
            </p>
            <Textarea
              placeholder={t("rejectPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={dashboardTextareaClass}
              disabled={updateMutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null)
                setRejectReason("")
              }}
              disabled={updateMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("submitting")}
                </>
              ) : (
                t("confirmReject")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-700 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}

function FileLink({
  label,
  url,
  notProvided,
  openError,
}: {
  label: string
  url: string
  notProvided: string
  openError: string
}) {
  const [loading, setLoading] = useState(false)

  const openSecure = useCallback(async () => {
    try {
      setLoading(true)
      const viewUrl = await getPresignedViewUrl(url)
      window.open(viewUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toastApiError(err, openError)
    } finally {
      setLoading(false)
    }
  }, [url, openError])

  if (!url?.trim()) {
    return (
      <p className="text-sm text-zinc-500">
        {label}: <span className="text-zinc-600">{notProvided}</span>
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void openSecure()}
      disabled={loading}
      className="flex items-center gap-2 text-left text-sm text-primary hover:underline disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <ExternalLink className="h-4 w-4 shrink-0" />
      )}
      {label}
    </button>
  )
}
