"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CalendarDays, Eye, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { VenuePublicPreviewDialog } from "@/components/venues/VenuePublicPreviewDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DashboardPanel,
  DashboardPageShell,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardDataTable,
  DashboardSortableHeader,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { EntityStatus, ManagedVenue } from "@/features/venues/types";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";

const selectTriggerClass = cn("w-full sm:w-[180px]", dashboardSelectTriggerClass);

export default function ManageVenuesPage() {
  const paths = useDashboardPaths();
  const pathname = usePathname();
  const isAdmin = paths.scope === "admin";
  const isAdminOwnList = isAdmin && pathname.includes("/myVenues");
  const t = useTranslations(isAdmin ? "adminDashboard" : "vendorDashboard");
  const tPreview = useTranslations("adminDashboard");
  const tStatus = useTranslations("entityStatus");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tListing = useTranslations("listing");
  const tTables = useTranslations("tables");
  const tVenues = useTranslations("venues");
  const queryClient = useQueryClient();
  const [viewVenue, setViewVenue] = useState<ManagedVenue | null>(null);
  const table = useTableQueryState<{ status: EntityStatus | "ALL" }>({
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { status: "ALL" },
  });

  const listParams = {
    ...table.queryParams,
    ...(table.filters.status === "ALL" ? {} : { status: table.filters.status }),
    ...(isAdminOwnList ? { mine: true } : isAdmin ? { allPlatform: true } : {}),
    sortBy: table.sortBy as "createdAt" | "name",
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: venueKeys.managedList(listParams),
    queryFn: () => listManagedVenues(listParams),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EntityStatus }) =>
      updateVenueStatus(id, {
        status: status as "APPROVED" | "ACTIVE" | "INACTIVE" | "CANCELLED",
      }),
    onSuccess: () => {
      toast.success(t("statusUpdated"));
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const venues = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;

  const pageTitle = isAdminOwnList
    ? t("myVenues")
    : isAdmin
      ? t("manageVenues")
      : t("myVenuesTitle");
  const pageDesc = isAdminOwnList
    ? t("myVenuesDesc")
    : isAdmin
      ? t("manageVenuesDesc")
      : t("myVenuesDesc");

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={pageTitle} description={pageDesc} />

      <DashboardDataTable
        toolbar={{
          search: {
            value: table.search,
            onChange: table.setSearch,
            placeholder: tListing("searchVenues"),
          },
          filters: (
            <Select
              value={table.filters.status}
              onValueChange={(v) => table.setFilter("status", v as EntityStatus | "ALL")}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dashboardDropdownContentClass}>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                <SelectItem value="DRAFT">{tStatus("draft")}</SelectItem>
                <SelectItem value="PENDING">{tStatus("pendingReview")}</SelectItem>
                <SelectItem value="ACTIVE">{tStatus("active")}</SelectItem>
                {isAdmin ? <SelectItem value="APPROVED">{tStatus("approved")}</SelectItem> : null}
                <SelectItem value="INACTIVE">{tStatus("inactive")}</SelectItem>
                <SelectItem value="REJECTED">{tStatus("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          ),
          pageSize: { value: table.pageSize, onChange: table.setPageSize },
          onReset: table.reset,
          showReset: table.hasActiveFilters,
          isRefreshing: isFetching && !isLoading,
          trailing:
            isAdminOwnList || !isAdmin ? (
              <Button asChild className="w-full sm:w-auto">
                <Link href={paths.addVenue}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addVenue")}
                </Link>
              </Button>
            ) : undefined,
        }}
        pagination={
          showPagination
            ? {
                label: formatTableRangeLabel({
                  page: table.page,
                  pageSize: table.pageSize,
                  total: meta?.total ?? venues.length,
                  showingLabel: (values) => tTables("showing", values),
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
          className={cn(dashboardTableClass, "min-w-[900px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <DashboardSortableHeader
                className="min-w-[220px]"
                label={tCommon("name")}
                column="name"
                sortBy={table.sortBy}
                sortOrder={table.sortOrder}
                onSort={table.toggleSort}
              />
              {isAdmin && !isAdminOwnList ? (
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                  {t("vendorCol")}
                </TableHead>
              ) : null}
              <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                {tForms("city")}
              </TableHead>
              <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                {tCommon("status")}
              </TableHead>
              <TableHead className="min-w-[160px] whitespace-nowrap text-right text-muted-foreground">
                {tCommon("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={isAdmin && !isAdminOwnList ? 5 : 4} />
            ) : venues.length === 0 ? (
              <TableEmptyRow colSpan={isAdmin && !isAdminOwnList ? 5 : 4}>
                {isAdmin ? tVenues("noVenuesFound") : t("noVenuesYet")}
              </TableEmptyRow>
            ) : (
              venues.map((venue) => (
                <TableRow
                  key={venue.id}
                  className={dashboardTableRowClass}
                >
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <VenueThumb venue={venue} />
                      <span className="truncate font-medium">{venue.name}</span>
                    </div>
                  </TableCell>
                  {isAdmin && !isAdminOwnList ? (
                    <TableCell className="text-muted-foreground">
                      {venue.vendor?.vendorName ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {venue.city ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-1">
                      {venue.status ? <StatusBadge status={venue.status} /> : null}
                      {!isAdmin && venue.status === "DRAFT" && venue.readiness ? (
                        <p className="text-xs text-muted-foreground">
                          {t("setup")} {venue.readiness.requiredComplete}/
                          {venue.readiness.requiredTotal}
                        </p>
                      ) : null}
                      {!isAdmin && venue.status === "REJECTED" && venue.rejectionReason ? (
                        <p className="line-clamp-2 text-xs text-destructive">
                          {venue.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className={dashboardTableActionsClass}>
                      {isAdmin ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                          onClick={() => setViewVenue(venue)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {tCommon("view")}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={tPreview("viewVenue")}
                          onClick={() => setViewVenue(venue)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {!isAdmin || isAdminOwnList ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Manage schedule"
                            asChild
                          >
                            <Link href={paths.manageVenueSchedule(venue.id)}>
                              <CalendarDays className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={tCommon("edit")}
                            asChild
                          >
                            <Link href={paths.editVenue(venue.id)}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </>
                      ) : null}
                      {isAdmin && venue.status !== "ACTIVE" && venue.status !== "DRAFT" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                          disabled={statusMut.isPending}
                          onClick={() =>
                            statusMut.mutate({ id: venue.id, status: "ACTIVE" })
                          }
                        >
                          {t("activate")}
                        </Button>
                      ) : null}
                      {isAdmin && venue.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                          disabled={statusMut.isPending}
                          onClick={() =>
                            statusMut.mutate({ id: venue.id, status: "INACTIVE" })
                          }
                        >
                          {t("deactivate")}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>
      </DashboardPanel>

      <VenuePublicPreviewDialog
        venue={viewVenue}
        onClose={() => setViewVenue(null)}
        editHref={(!isAdmin || isAdminOwnList) && viewVenue ? paths.editVenue(viewVenue.id) : undefined}
      />
    </DashboardPageShell>
  );
}

function VenueThumb({ venue }: { venue: ManagedVenue }) {
  const src = venue.thumbnail?.trim() || venue.coverImage?.trim();

  if (src) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
        <Image src={src} alt="" fill className="object-cover" sizes="44px" />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#151515] text-muted-foreground">
      <Building2 className="h-4 w-4" />
    </div>
  );
}
