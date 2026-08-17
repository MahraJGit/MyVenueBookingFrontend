"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { VenueReviewDetails } from "@/components/venues/VenueReviewDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getPreviewVenue, listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { EntityStatus, ManagedVenue } from "@/features/venues/types";
import { pricingModelLabel } from "@/features/venues/utils";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { toastApiError } from "@/lib/toasts";
import {
  DashboardErrorAlert,
  DashboardPanel,
  DashboardPageShell,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardDialogContentClass,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
  dashboardSelectTriggerClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable, DashboardSortableHeader } from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "DRAFT";
const REVIEW_STATUSES: Exclude<StatusFilter, "ALL">[] = [
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "DRAFT",
];

function formatDate(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function VenueReviewsPage() {
  const t = useTranslations("adminVenueReviews");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("adminDashboard");
  const tForms = useTranslations("forms");
  const tStatus = useTranslations("entityStatus");
  const tListing = useTranslations("listing");
  const tTables = useTranslations("tables");
  const queryClient = useQueryClient();
  const table = useTableQueryState<{ status: StatusFilter }>({
    initialSortBy: "createdAt",
    initialFilters: { status: "ALL" },
  });
  const [viewVenue, setViewVenue] = useState<ManagedVenue | null>(null);
  const [rejectVenue, setRejectVenue] = useState<ManagedVenue | null>(null);
  const [reason, setReason] = useState("");

  const listParams = {
    ...table.queryParams,
    vendorOnly: true,
    ...(table.filters.status !== "ALL"
      ? { status: table.filters.status as EntityStatus }
      : {}),
    sortBy: table.sortBy as "createdAt" | "name" | undefined,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: venueKeys.managedList(listParams),
    queryFn: () => listManagedVenues(listParams),
  });

  const { data: venueDetail, isLoading: detailLoading } = useQuery({
    queryKey: venueKeys.previewDetail(viewVenue?.id ?? ""),
    queryFn: () => getPreviewVenue(viewVenue!.id),
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
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;
  const detail = venueDetail ?? viewVenue;
  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("loadingQueue");
  }, [error, isError, t]);

  const statusLabel = (status?: EntityStatus) => {
    if (!status) return tStatus("unknown");
    if (status === "ACTIVE" || status === "APPROVED") return tStatus("approved");
    if (status === "PENDING") return tStatus("pending");
    if (status === "REJECTED") return tStatus("rejected");
    if (status === "DRAFT") return tStatus("draft");
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
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
                {REVIEW_STATUSES.map((status) => (
                  <Button
                    key={status}
                    variant={table.filters.status === status ? "default" : "outline"}
                    onClick={() => table.setFilter("status", status)}
                    disabled={isLoading}
                  >
                    {statusLabel(status)}
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
                      total: meta?.total ?? venues.length,
                      type: tListing("venuesCount"),
                    }),
                    page: table.page,
                    totalPages,
                    total: meta?.total ?? venues.length,
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
                  <DashboardSortableHeader className="min-w-[220px]" label={tForms("venueName")} column="name" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                  <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                    {tCommon("vendor")}
                  </TableHead>
                  <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                    {tAdmin("tableCity")}
                  </TableHead>
                  <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                    {t("pricing")}
                  </TableHead>
                  <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                    {tCommon("status")}
                  </TableHead>
                  <DashboardSortableHeader className="min-w-[120px]" label={tCommon("submitted")} column="createdAt" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                  <TableHead className="min-w-[240px] whitespace-nowrap text-right text-muted-foreground">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton cols={7} />
                ) : venues.length === 0 ? (
                  <TableEmptyRow colSpan={7}>
                    {table.hasActiveFilters ? tTables("noMatch") : tCommon("noResults")}
                  </TableEmptyRow>
                ) : (
                  venues.map((venue) => {
                    const selectValue =
                      venue.status === "ACTIVE" || venue.status === "APPROVED"
                        ? "ACTIVE"
                        : venue.status === "REJECTED"
                          ? "REJECTED"
                          : "PENDING";

                    return (
                      <TableRow key={venue.id} className={dashboardTableRowClass}>
                        <TableCell className="max-w-[240px] whitespace-normal break-words font-medium">
                          <button
                            type="button"
                            className="text-left hover:text-primary hover:underline"
                            onClick={() => setViewVenue(venue)}
                          >
                            {venue.name}
                          </button>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {venue.vendor?.vendorName ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {venue.city ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {venue.pricing ? (
                            <Badge variant="secondary" className="font-normal">
                              {pricingModelLabel(venue.pricing.modelType)}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {venue.status ? <StatusBadge status={venue.status} /> : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(venue.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className={dashboardTableActionsClass}>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn("shrink-0", dashboardOutlineButtonClass)}
                              onClick={() => setViewVenue(venue)}
                            >
                              <Eye className="h-4 w-4" />
                              {tCommon("view")}
                            </Button>
                            <Select
                              value={selectValue}
                              disabled={pendingVenueId === venue.id}
                              onValueChange={(value: "ACTIVE" | "REJECTED" | "PENDING") => {
                                if (value === "REJECTED") {
                                  setRejectVenue(venue);
                                  return;
                                }
                                if (
                                  value === "ACTIVE" &&
                                  venue.status !== "ACTIVE" &&
                                  venue.status !== "APPROVED"
                                ) {
                                  statusMut.mutate({ id: venue.id, status: "ACTIVE" });
                                }
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                className={cn(
                                  "h-8 w-[130px] shrink-0",
                                  dashboardSelectTriggerClass,
                                )}
                              >
                                {pendingVenueId === venue.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className={dashboardDropdownContentClass}>
                                <SelectItem value="PENDING" disabled>
                                  {tStatus("pending")}
                                </SelectItem>
                                <SelectItem value="ACTIVE">
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DashboardDataTable>
        </DashboardPanel>
      </DashboardPageShell>

      <Dialog
        open={!!viewVenue}
        onOpenChange={(open) => {
          if (!open) setViewVenue(null);
        }}
      >
        <DialogContent className={cn("max-h-[90vh] overflow-y-auto sm:max-w-3xl", dashboardDialogContentClass)}>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {detail?.name ?? t("venueDetails")}
              {detail?.status ? <StatusBadge status={detail.status} /> : null}
            </DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {detailLoading && !venueDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : venueDetail ? (
            <div className="space-y-4">
              <VenueReviewDetails venue={venueDetail} />

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  className="bg-primary"
                  disabled={
                    statusMut.isPending &&
                    pendingVenueId === venueDetail.id &&
                    pendingStatus === "ACTIVE"
                  }
                  onClick={() => statusMut.mutate({ id: venueDetail.id, status: "ACTIVE" })}
                >
                  {statusMut.isPending &&
                  pendingVenueId === venueDetail.id &&
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
                  disabled={statusMut.isPending && pendingVenueId === venueDetail.id}
                  onClick={() => {
                    setRejectVenue(venueDetail);
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
