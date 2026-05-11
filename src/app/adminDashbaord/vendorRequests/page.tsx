"use client"

import { useMemo, useState, useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Eye, Loader2 } from "lucide-react"
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
import { toastApiError } from "@/lib/toasts"

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

function statusLabel(status: VendorVerificationStatus) {
  if (status === "APPROVED") return "Approved"
  if (status === "REJECTED") return "Rejected"
  return "Pending"
}

function TableSkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={`sk-${i}`} className="border-zinc-800">
      {Array.from({ length: 8 }).map((__, j) => (
        <TableCell key={j} className="py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-800" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export default function VendorRequests() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [activeDetails, setActiveDetails] = useState<AdminVendorProfile | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminVendorProfile | null>(null)
  const [rejectReason, setRejectReason] = useState("")

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
          ? "Vendor approved"
          : result.verificationStatus === "REJECTED"
            ? "Vendor rejected"
            : "Status updated",
      )
    },
    onError: (err) => {
      toastApiError(err, "Could not update vendor status.")
    },
  })

  const pendingRowId = updateMutation.isPending
    ? updateMutation.variables?.id
    : undefined

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null
    return error instanceof Error ? error.message : "Failed to load vendor requests."
  }, [isError, error])

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
    <div className="w-full max-w-full space-y-6 overflow-x-hidden rounded-2xl bg-[#0e0e0e] p-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">Vendor Requests</h2>
          <p className="text-sm text-gray-300">
            Review all vendor onboarding requests and manage approval status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isFetching && !isLoading ? (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing
            </span>
          ) : null}
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            onClick={() => setStatusFilter("ALL")}
            disabled={isLoading}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            onClick={() => setStatusFilter("PENDING")}
            disabled={isLoading}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "APPROVED" ? "default" : "outline"}
            onClick={() => setStatusFilter("APPROVED")}
            disabled={isLoading}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            onClick={() => setStatusFilter("REJECTED")}
            disabled={isLoading}
          >
            Rejected
          </Button>
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
            Retry
          </Button>
        </div>
      ) : null}

      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-zinc-800">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead>Vendor</TableHead>
              <TableHead>Business Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows />
            ) : (
              <>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="border-zinc-800 transition-colors hover:bg-zinc-900/50"
                  >
                    <TableCell className="max-w-[190px] whitespace-normal wrap-break-word font-medium">
                      {request.vendorName}
                    </TableCell>
                    <TableCell>{request.businessType}</TableCell>
                    <TableCell>{request.ownerName}</TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal break-all">
                      {request.email}
                    </TableCell>
                    <TableCell>{request.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(request.verificationStatus)}>
                        {statusLabel(request.verificationStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="min-w-[220px] text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                          onClick={() => setActiveDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                          View
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
                            className="h-8 min-w-[130px] border-zinc-700"
                          >
                            <span className="flex w-full items-center gap-2">
                              {pendingRowId === request.id ? (
                                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                              ) : null}
                              <SelectValue placeholder="Set status" />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approve</SelectItem>
                            <SelectItem value="REJECTED">Reject</SelectItem>
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
                      No vendor requests found for this filter.
                    </TableCell>
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(activeDetails)}
        onOpenChange={(open) => !open && setActiveDetails(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>Vendor Request Details</DialogTitle>
            <DialogDescription>
              Full registration data submitted by the vendor.
            </DialogDescription>
          </DialogHeader>

          {activeDetails ? (
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <DetailRow label="Vendor Name" value={activeDetails.vendorName} />
              <DetailRow label="Business Type" value={activeDetails.businessType} />
              <DetailRow label="Owner Name" value={activeDetails.ownerName} />
              <DetailRow label="Email" value={activeDetails.email} />
              <DetailRow label="Phone" value={activeDetails.phone} />
              <DetailRow label="Address" value={activeDetails.address} />
              <DetailRow label="EID Number" value={activeDetails.eidNumber} />
              <DetailRow label="EID Expiry" value={formatDate(activeDetails.eidExpiry)} />
              <DetailRow label="Passport Number" value={activeDetails.passportNumber} />
              <DetailRow
                label="Passport Expiry"
                value={formatDate(activeDetails.passportExpiry)}
              />
              <DetailRow label="Legal Entity" value={activeDetails.legalEntityName} />
              <DetailRow
                label="Incorporation Date"
                value={formatDate(activeDetails.incorporationDate)}
              />
              <DetailRow label="Trade License No." value={activeDetails.tradeLicenseNumber} />
              <DetailRow
                label="Trade License Expiry"
                value={formatDate(activeDetails.tradeLicenseExpiry)}
              />
              <DetailRow label="Tax ID" value={activeDetails.taxId} />
              <DetailRow label="Payment Terms" value={activeDetails.paymentTerms} />
              <DetailRow
                label="Status"
                value={statusLabel(activeDetails.verificationStatus)}
              />
              <DetailRow label="Submitted At" value={formatDate(activeDetails.createdAt)} />

              {activeDetails.rejectedReason ? (
                <div className="md:col-span-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  <p className="font-semibold">Rejection Reason</p>
                  <p className="mt-1">{activeDetails.rejectedReason}</p>
                </div>
              ) : null}

              <div className="md:col-span-2 space-y-2 rounded-md border border-zinc-700 p-3">
                <p className="font-semibold">Uploaded Files</p>
                <FileLink label="EID Copy" url={activeDetails.eidCopyUrl} />
                <FileLink label="Passport Copy" url={activeDetails.passportCopyUrl} />
                <FileLink label="Trade License Copy" url={activeDetails.tradeLicenseCopyUrl} />
                {activeDetails.verificationDocuments.map((fileUrl, index) => (
                  <FileLink
                    key={`${fileUrl}-${index}`}
                    label={`Verification Document ${index + 1}`}
                    url={fileUrl}
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
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>Reject Vendor Request</DialogTitle>
            <DialogDescription>
              Enter the rejection reason. This is stored with the application and can be
              shown to the applicant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-gray-300">
              Vendor:{" "}
              <span className="font-semibold text-white">{rejectTarget?.vendorName}</span>
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-28 border-zinc-700"
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                "Confirm Reject"
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
    <div className="rounded-md border border-zinc-700 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}

function FileLink({ label, url }: { label: string; url: string }) {
  const [loading, setLoading] = useState(false)

  const openSecure = useCallback(async () => {
    try {
      setLoading(true)
      const viewUrl = await getPresignedViewUrl(url)
      window.open(viewUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toastApiError(err, "Could not open document.")
    } finally {
      setLoading(false)
    }
  }, [url])

  if (!url?.trim()) {
    return (
      <p className="text-sm text-zinc-500">
        {label}: <span className="text-zinc-600">Not provided</span>
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
