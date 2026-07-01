"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Eye, Loader2, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StatusBadge } from "@/components/venues/StatusBadge";
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
  DashboardSearchInput,
  dashboardTableClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import {
  DashboardPageHeader,
  dashboardFilterBarBorderClass,
} from "@/components/dashboard/dashboard-shared";
import { DashboardFilterBar } from "@/components/userDashboard/DashboardScrollableTabs";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { EntityStatus, ManagedVenue } from "@/features/venues/types";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const selectTriggerClass = cn("w-full sm:w-[180px]", dashboardSelectTriggerClass);

export default function ManageVenuesPage() {
  const paths = useDashboardPaths();
  const isAdmin = paths.scope === "admin";
  const t = useTranslations(isAdmin ? "adminDashboard" : "vendorDashboard");
  const tStatus = useTranslations("entityStatus");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tListing = useTranslations("listing");
  const tVenues = useTranslations("venues");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "ALL">("ALL");

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const listParams = {
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    ...(isAdmin ? { allPlatform: true } : {}),
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
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

  const pageTitle = isAdmin ? t("manageVenues") : t("myVenuesTitle");
  const pageDesc = isAdmin ? t("manageVenuesDesc") : t("myVenuesDesc");

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={pageTitle} description={pageDesc} />

        <DashboardFilterBar
        className={dashboardFilterBarBorderClass}
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as EntityStatus | "ALL")}
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={dashboardDropdownContentClass}>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                <SelectItem value="DRAFT">{tStatus("draft")}</SelectItem>
                <SelectItem value="PENDING">{tStatus("pendingReview")}</SelectItem>
                <SelectItem value="ACTIVE">{tStatus("active")}</SelectItem>
                {isAdmin ? (
                  <SelectItem value="APPROVED">{tStatus("approved")}</SelectItem>
                ) : null}
                <SelectItem value="INACTIVE">{tStatus("inactive")}</SelectItem>
                <SelectItem value="REJECTED">{tStatus("rejected")}</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href={paths.addVenue}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addVenue")}
              </Link>
            </Button>
          </div>
        }
      >
        <div className="w-full max-w-sm">
          <DashboardSearchInput
            placeholder={tListing("searchVenues")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </DashboardFilterBar>

      {isFetching && !isLoading ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {tCommon("loading")}
        </div>
      ) : null}

      <DashboardDataTable
        pagination={
          showPagination
            ? {
                label: tListing("pageOfWithCount", {
                  page: meta?.page ?? page,
                  totalPages,
                  total: meta?.total ?? venues.length,
                  type: tListing("venuesCount"),
                }),
                page,
                totalPages,
                total: meta?.total ?? venues.length,
                onPageChange: setPage,
                previousLabel: tCommon("previous"),
                nextLabel: tCommon("next"),
                isLoading,
              }
            : undefined
        }
      >
        <Table className={dashboardTableClass} containerClassName="overflow-visible">
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="min-w-[220px] text-muted-foreground">
                {tCommon("name")}
              </TableHead>
              {isAdmin ? (
                <TableHead className="text-muted-foreground">{t("vendorCol")}</TableHead>
              ) : null}
              <TableHead className="text-muted-foreground">{tForms("city")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
              <TableHead className="text-right text-muted-foreground">
                {tCommon("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={isAdmin ? 5 : 4} />
            ) : venues.length === 0 ? (
              <TableEmptyRow colSpan={isAdmin ? 5 : 4}>
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
                  {isAdmin ? (
                    <TableCell className="text-muted-foreground">
                      {venue.vendor?.vendorName ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-muted-foreground">
                    {venue.city ?? "—"}
                  </TableCell>
                  <TableCell>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {venue.status === "ACTIVE" ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={tCommon("view")}
                          asChild
                        >
                          <Link
                            href={`/venues/${venue.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
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
    </DashboardPageShell>
  );
}

function VenueThumb({ venue }: { venue: ManagedVenue }) {
  const src = venue.coverImage?.trim();

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
