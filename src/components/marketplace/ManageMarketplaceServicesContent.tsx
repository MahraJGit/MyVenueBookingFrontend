"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Eye, Loader2, Pencil, Plus, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { ServicePublicPreviewDialog } from "@/components/marketplace/ServicePublicPreviewDialog";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
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
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { usePathname } from "next/navigation";
import {
  listManagedMarketplaceServices,
  submitMarketplaceServiceForReview,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { EntityStatus, ManagedMarketplaceService } from "@/features/marketplace/types";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";

const selectTriggerClass = cn("w-full sm:w-[180px]", dashboardSelectTriggerClass);

function ServiceThumb({ service }: { service: ManagedMarketplaceService }) {
  const src = service.coverImage?.trim();
  if (!src) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
        —
      </div>
    );
  }
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
      <SecureStoredImage
        src={src}
        alt=""
        className="h-full w-full"
      />
    </div>
  );
}

export function ManageMarketplaceServicesContent() {
  const paths = useDashboardPaths();
  const pathname = usePathname();
  const surfaceScope: "workspace" | "platform" = pathname.startsWith("/vendorDashboard")
    ? "workspace"
    : "platform";
  const t = useTranslations("vendorMarketplace");
  const tStatus = useTranslations("entityStatus");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const queryClient = useQueryClient();
  const [previewService, setPreviewService] =
    useState<ManagedMarketplaceService | null>(null);
  const table = useTableQueryState<{ status: EntityStatus | "ALL" }>({
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
    initialFilters: { status: "ALL" },
  });

  const listParams = {
    page: table.page,
    limit: table.pageSize,
    scope: surfaceScope,
    ...(table.debouncedSearch ? { search: table.debouncedSearch } : {}),
    ...(table.filters.status === "ALL" ? {} : { status: table.filters.status }),
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: marketplaceKeys.managedList(listParams),
    queryFn: () => listManagedMarketplaceServices(listParams),
  });

  const submitMut = useMutation({
    mutationFn: (id: string) => submitMarketplaceServiceForReview(id),
    onSuccess: () => {
      toast.success(t("submittedForReview"));
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const services = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("myServicesTitle")} description={t("myServicesDesc")} />

        <DashboardDataTable
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: t("searchPlaceholder"),
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
                  <SelectItem value="INACTIVE">{tStatus("inactive")}</SelectItem>
                  <SelectItem value="REJECTED">{tStatus("rejected")}</SelectItem>
                </SelectContent>
              </Select>
            ),
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: isFetching && !isLoading,
            trailing: (
              <Button asChild className="w-full sm:w-auto">
                <Link href={paths.addMarketplaceService}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("newService")}
                </Link>
              </Button>
            ),
          }}
          pagination={
            showPagination
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: meta?.total ?? services.length,
                    showingLabel: (values) => tTables("showing", values),
                  }),
                  page: table.page,
                  totalPages,
                  total: meta?.total ?? services.length,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading,
                }
              : undefined
          }
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[1200px]")}
            containerClassName={cn(
              dashboardTableContainerClass,
              "max-w-full overflow-x-auto",
            )}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead className="min-w-[260px] whitespace-nowrap text-muted-foreground">
                  {t("service")}
                </TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                  {t("category")}
                </TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                  {t("city")}
                </TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                  {tCommon("status")}
                </TableHead>
                <TableHead className="min-w-[420px] whitespace-nowrap text-right text-muted-foreground">
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={5} />
              ) : services.length === 0 ? (
                <TableEmptyRow colSpan={5}>{t("noServicesYet")}</TableEmptyRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id} className={dashboardTableRowClass}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <ServiceThumb service={service} />
                        <span className="truncate font-medium">{service.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {service.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {service.baseCity ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <StatusBadge status={service.status} />
                        {service.status === "REJECTED" && service.rejectionReason ? (
                          <p className="line-clamp-2 text-xs text-destructive">
                            {service.rejectionReason}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className={dashboardTableActionsClass}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                          onClick={() => setPreviewService(service)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {t("preview")}
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                        >
                          <Link href={paths.editMarketplaceService(service.id)}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            {tCommon("edit")}
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className={dashboardOutlineButtonClass}
                        >
                          <Link href={paths.manageMarketplaceSchedule(service.id)}>
                            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                            {t("schedule")}
                          </Link>
                        </Button>
                        {service.status === "DRAFT" || service.status === "REJECTED" ? (
                          <Button
                            size="sm"
                            disabled={submitMut.isPending && submitMut.variables === service.id}
                            onClick={() => submitMut.mutate(service.id)}
                          >
                            {submitMut.isPending && submitMut.variables === service.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {t("submit")}
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

      <ServicePublicPreviewDialog
        service={previewService}
        onClose={() => setPreviewService(null)}
        editHref={
          previewService
            ? paths.editMarketplaceService(previewService.id)
            : undefined
        }
      />
    </DashboardPageShell>
  );
}
