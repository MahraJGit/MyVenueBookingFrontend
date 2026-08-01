"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  DashboardSearchInput,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
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
import {
  listManagedMarketplaceServices,
  submitMarketplaceServiceForReview,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { EntityStatus, ManagedMarketplaceService } from "@/features/marketplace/types";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
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
  const t = useTranslations("vendorMarketplace");
  const tStatus = useTranslations("entityStatus");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "ALL">("ALL");
  const [previewService, setPreviewService] =
    useState<ManagedMarketplaceService | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const listParams = {
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
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
                  <SelectItem value="INACTIVE">{tStatus("inactive")}</SelectItem>
                  <SelectItem value="REJECTED">{tStatus("rejected")}</SelectItem>
                </SelectContent>
              </Select>
              <Button asChild className="w-full sm:w-auto">
                <Link href={paths.addMarketplaceService}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("newService")}
                </Link>
              </Button>
            </div>
          }
        >
          <div className="flex w-full items-center gap-2">
            <DashboardSearchInput
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </DashboardFilterBar>

        <DashboardDataTable
          pagination={
            showPagination
              ? {
                  label: t("pageOf", {
                    page: meta?.page ?? page,
                    totalPages,
                    total: meta?.total ?? services.length,
                  }),
                  page,
                  totalPages,
                  total: meta?.total ?? services.length,
                  onPageChange: setPage,
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
