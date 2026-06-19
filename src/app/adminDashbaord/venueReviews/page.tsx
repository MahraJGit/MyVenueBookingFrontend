"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Clock, DollarSign, Eye, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getManagedVenue, listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { ManagedVenue } from "@/features/venues/types";
import {
  DAY_NAMES,
  decimalToNumber,
  formatVenuePrice,
  pricingModelLabel,
} from "@/features/venues/utils";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { toastApiError } from "@/lib/toasts";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function VenueReviewsPage() {
  const queryClient = useQueryClient();
  const [viewVenue, setViewVenue] = useState<ManagedVenue | null>(null);
  const [rejectVenue, setRejectVenue] = useState<ManagedVenue | null>(null);
  const [reason, setReason] = useState("");

  const listParams = {
    status: "PENDING" as const,
    vendorOnly: true,
    readyForReview: true,
    limit: 50,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: venueKeys.managedList(listParams),
    queryFn: () => listManagedVenues(listParams),
  });

  const { data: venueDetail, isLoading: detailLoading } = useQuery({
    queryKey: venueKeys.managedDetail(viewVenue?.id ?? ""),
    queryFn: () => getManagedVenue(viewVenue!.id),
    enabled: !!viewVenue?.id,
  });

  const statusMut = useMutation({
    mutationFn: ({
      id,
      status,
      reason: r,
    }: {
      id: string;
      status: "APPROVED" | "ACTIVE" | "REJECTED";
      reason?: string;
    }) => updateVenueStatus(id, { status, reason: r }),
    onSuccess: () => {
      toast.success("Venue status updated");
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      setRejectVenue(null);
      setViewVenue(null);
      setReason("");
    },
    onError: (e) => toastApiError(e),
  });

  const pendingVenueId = statusMut.isPending ? statusMut.variables?.id : null;
  const pendingStatus = statusMut.isPending ? statusMut.variables?.status : null;
  const venues = data?.data ?? [];
  const detail = venueDetail ?? viewVenue;

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Venue reviews</h1>
          <p className="text-sm text-muted-foreground">
            Only venues with pricing and schedule configured appear here — vendors must
            complete setup before submission.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Pending submissions
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading review queue…"
                  : `${venues.length} venue${venues.length === 1 ? "" : "s"} ready for approval`}
              </CardDescription>
            </div>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Venue</TableHead>
                  <TableHead className="text-muted-foreground">Vendor</TableHead>
                  <TableHead className="text-muted-foreground">Pricing</TableHead>
                  <TableHead className="text-muted-foreground">Schedule</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton cols={5} />
                ) : venues.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                      No venues pending review. Vendors must finish pricing and schedule,
                      then submit for approval.
                  </TableEmptyRow>
                ) : (
                  venues.map((venue) => {
                    const openDays =
                      venue.schedules?.filter((s) => s.isOpen).length ?? 0;
                    const isApproving =
                      pendingVenueId === venue.id && pendingStatus === "ACTIVE";
                    const isRejecting =
                      pendingVenueId === venue.id && pendingStatus === "REJECTED";

                    return (
                      <TableRow key={venue.id} className="border-border">
                        <TableCell>
                          <div className="space-y-1.5">
                            <p className="font-medium text-foreground">{venue.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {venue.city ?? venue.address}
                              </span>
                              {venue.venueType?.name && (
                                <Badge variant="outline" className="text-[10px]">
                                  {venue.venueType.name}
                                </Badge>
                              )}
                            </div>
                            {venue.status && <StatusBadge status={venue.status} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {venue.vendor?.vendorName ?? "—"}
                        </TableCell>
                        <TableCell>
                          {venue.pricing ? (
                            <Badge variant="secondary" className="gap-1 font-normal">
                              <DollarSign className="h-3 w-3" />
                              {pricingModelLabel(venue.pricing.modelType)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-normal">
                            <Clock className="h-3 w-3" />
                            {openDays} open day{openDays === 1 ? "" : "s"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border"
                              onClick={() => setViewVenue(venue)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              className="bg-primary"
                              disabled={isApproving || isRejecting}
                              onClick={() =>
                                statusMut.mutate({ id: venue.id, status: "ACTIVE" })
                              }
                            >
                              {isApproving ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Approving…
                                </>
                              ) : (
                                "Approve"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isApproving || isRejecting}
                              onClick={() => setRejectVenue(venue)}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!viewVenue}
        onOpenChange={(open) => {
          if (!open) setViewVenue(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto border-border bg-card text-foreground sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.name ?? "Venue details"}</DialogTitle>
            <DialogDescription>
              Full submission details from the vendor for your review.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && !venueDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {detail.status && <StatusBadge status={detail.status} />}
                {detail.venueType?.name && (
                  <Badge variant="outline">{detail.venueType.name}</Badge>
                )}
              </div>

              {detail.coverImage && (
                <div className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.coverImage}
                    alt={detail.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow label="Vendor" value={detail.vendor?.vendorName ?? "—"} />
                <DetailRow label="Vendor email" value={detail.vendor?.email ?? "—"} />
                <DetailRow label="City" value={detail.city ?? "—"} />
                <DetailRow label="Address" value={detail.address} />
                <DetailRow label="Timezone" value={detail.timezone} />
                <DetailRow
                  label="Capacity"
                  value={
                    detail.capacityMin || detail.capacityMax
                      ? `${detail.capacityMin ?? "—"} – ${detail.capacityMax ?? "—"}`
                      : "—"
                  }
                />
              </div>

              {detail.description ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">
                    {detail.description}
                  </p>
                </div>
              ) : null}

              <Separator />

              {detail.pricing ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Pricing</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <DollarSign className="h-3 w-3" />
                      {pricingModelLabel(detail.pricing.modelType)}
                    </Badge>
                    <span className="text-foreground">
                      {formatVenuePrice(
                        decimalToNumber(detail.pricing.basePrice),
                        detail.pricing.currency,
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      · Tax {decimalToNumber(detail.pricing.taxRate)}%
                    </span>
                  </div>
                </div>
              ) : null}

              {detail.schedules && detail.schedules.some((s) => s.isOpen) ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Open schedule</p>
                  <ul className="space-y-1 text-foreground">
                    {detail.schedules
                      .filter((s) => s.isOpen)
                      .map((s) => (
                        <li key={s.dayOfWeek} className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {DAY_NAMES[s.dayOfWeek]} · {s.openTime} – {s.closeTime}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {detail.amenities && detail.amenities.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Amenities</p>
                  <ul className="flex flex-wrap gap-2">
                    {detail.amenities.map((a) => (
                      <Badge key={a.id} variant="outline">
                        {a.catalog?.name ?? a.id}
                      </Badge>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  className="bg-primary"
                  disabled={
                    statusMut.isPending &&
                    pendingVenueId === detail.id &&
                    pendingStatus === "ACTIVE"
                  }
                  onClick={() => statusMut.mutate({ id: detail.id, status: "ACTIVE" })}
                >
                  {statusMut.isPending &&
                  pendingVenueId === detail.id &&
                  pendingStatus === "ACTIVE" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving…
                    </>
                  ) : (
                    "Approve"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  disabled={statusMut.isPending && pendingVenueId === detail.id}
                  onClick={() => {
                    setRejectVenue(detail);
                    setViewVenue(null);
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectVenue}
        onOpenChange={(open) => {
          if (!open) {
            setRejectVenue(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Reject venue</DialogTitle>
            <DialogDescription>
              {rejectVenue
                ? `Tell the vendor why "${rejectVenue.name}" was not approved. They can fix issues and resubmit.`
                : "Provide a rejection reason for the vendor."}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border-border bg-input/50 min-h-24"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectVenue(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                !reason.trim() ||
                (statusMut.isPending &&
                  pendingVenueId === rejectVenue?.id &&
                  pendingStatus === "REJECTED")
              }
              onClick={() =>
                rejectVenue &&
                statusMut.mutate({
                  id: rejectVenue.id,
                  status: "REJECTED",
                  reason: reason.trim(),
                })
              }
            >
              {statusMut.isPending &&
              pendingVenueId === rejectVenue?.id &&
              pendingStatus === "REJECTED" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting…
                </>
              ) : (
                "Reject venue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
