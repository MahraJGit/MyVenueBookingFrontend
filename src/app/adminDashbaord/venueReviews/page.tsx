"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Clock, DollarSign, Eye, Loader2, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
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
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardTableWrapper,
  dashboardCardClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardDialogContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default function VenueReviewsPage() {
  const t = useTranslations("adminVenueReviews");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("adminDashboard");
  const tForms = useTranslations("forms");
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
      toast.success(t("statusUpdated"));
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
      <DashboardPageShell>
        <DashboardPanel>
          <DashboardPageHeader
            title={t("title")}
            description={t("description")}
          />

        <Card className={dashboardCardClass}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                {t("pendingSubmissions")}
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? t("loadingQueue")
                  : t("venueCount", { count: venues.length })}
              </CardDescription>
            </div>
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardHeader>

          <CardContent className="p-0">
            <DashboardTableWrapper className="rounded-none border-0 border-t border-[#303030]">
            <Table
              className={cn(dashboardTableClass, "min-w-[1000px]")}
              containerClassName={dashboardTableContainerClass}
            >
              <TableHeader>
                <TableRow className={dashboardTableHeaderRowClass}>
                  <TableHead className="min-w-[240px] whitespace-nowrap text-muted-foreground">
                    {tForms("venueName")}
                  </TableHead>
                  <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                    {tCommon("vendor")}
                  </TableHead>
                  <TableHead className="min-w-[130px] whitespace-nowrap text-muted-foreground">
                    {t("pricing")}
                  </TableHead>
                  <TableHead className="min-w-[130px] whitespace-nowrap text-muted-foreground">
                    {t("schedule")}
                  </TableHead>
                  <TableHead className="min-w-[300px] whitespace-nowrap text-right text-muted-foreground">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton cols={5} />
                ) : venues.length === 0 ? (
                  <TableEmptyRow colSpan={5}>
                      {t("noPending")}
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
                      <TableRow key={venue.id} className={dashboardTableRowClass}>
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
                        <TableCell className="whitespace-nowrap">
                          {venue.pricing ? (
                            <Badge variant="secondary" className="gap-1 font-normal">
                              <DollarSign className="h-3 w-3" />
                              {pricingModelLabel(venue.pricing.modelType)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline" className="gap-1 font-normal">
                            <Clock className="h-3 w-3" />
                            {t("openDays", { count: openDays })}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className={dashboardTableActionsClass}>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn("shrink-0 border-border")}
                              onClick={() => setViewVenue(venue)}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              {tCommon("view")}
                            </Button>
                            <Button
                              size="sm"
                              className="shrink-0 bg-primary"
                              disabled={isApproving || isRejecting}
                              onClick={() =>
                                statusMut.mutate({ id: venue.id, status: "ACTIVE" })
                              }
                            >
                              {isApproving ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  {t("approving")}
                                </>
                              ) : (
                                tAdmin("approve")
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="shrink-0"
                              disabled={isApproving || isRejecting}
                              onClick={() => setRejectVenue(venue)}
                            >
                              {tAdmin("reject")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </DashboardTableWrapper>
          </CardContent>
        </Card>
        </DashboardPanel>
      </DashboardPageShell>

      <Dialog
        open={!!viewVenue}
        onOpenChange={(open) => {
          if (!open) setViewVenue(null);
        }}
      >
        <DialogContent className={cn("max-h-[85vh] overflow-y-auto sm:max-w-2xl", dashboardDialogContentClass)}>
          <DialogHeader>
            <DialogTitle>{detail?.name ?? t("venueDetails")}</DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
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
                <DetailRow label={tCommon("vendor")} value={detail.vendor?.vendorName ?? "—"} />
                <DetailRow label={t("vendorEmail")} value={detail.vendor?.email ?? "—"} />
                <DetailRow label={tForms("city")} value={detail.city ?? "—"} />
                <DetailRow label={tForms("address")} value={detail.address} />
                <DetailRow label={tForms("timezone")} value={detail.timezone} />
                <DetailRow
                  label={t("capacity")}
                  value={
                    detail.capacityMin || detail.capacityMax
                      ? `${detail.capacityMin ?? "—"} – ${detail.capacityMax ?? "—"}`
                      : "—"
                  }
                />
              </div>

              {detail.description ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{tCommon("description")}</p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">
                    {detail.description}
                  </p>
                </div>
              ) : null}

              <Separator />

              {detail.pricing ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("pricing")}</p>
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
                      {t("taxRate", { rate: decimalToNumber(detail.pricing.taxRate) })}
                    </span>
                  </div>
                </div>
              ) : null}

              {detail.schedules && detail.schedules.some((s) => s.isOpen) ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("openSchedule")}</p>
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
                  <p className="text-xs font-medium text-muted-foreground">{tForms("amenities")}</p>
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
                      {t("approving")}
                    </>
                  ) : (
                    tAdmin("approve")
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
                  {tAdmin("reject")}
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
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>
              {rejectVenue
                ? t("rejectDescNamed", { name: rejectVenue.name })
                : t("rejectDesc")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("rejectPlaceholder")}
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
              {tCommon("cancel")}
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
                  {t("rejecting")}
                </>
              ) : (
                t("rejectVenue")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
