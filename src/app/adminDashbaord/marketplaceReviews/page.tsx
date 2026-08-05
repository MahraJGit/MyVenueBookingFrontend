"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { ServiceReviewDetails } from "@/components/marketplace/ServiceReviewDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getPreviewMarketplaceService,
  listManagedMarketplaceServices,
  updateMarketplaceServiceStatus,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type {
  EntityStatus,
  ManagedMarketplaceService,
} from "@/features/marketplace/types";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { toastApiError } from "@/lib/toasts";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardDialogContentClass,
  dashboardOutlineButtonClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const REVIEW_STATUSES: EntityStatus[] = [
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "DRAFT",
];

type StatusFilter = "ALL" | EntityStatus;

function statusBadgeVariant(status: EntityStatus | string | undefined) {
  if (status === "ACTIVE" || status === "APPROVED") return "default";
  if (status === "REJECTED" || status === "CANCELLED") return "destructive";
  return "secondary";
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/** Map DB status → select value (ACTIVE/APPROVED both show as Active). */
function reviewableStatus(
  status: EntityStatus | string | undefined,
): "ACTIVE" | "REJECTED" | "PENDING" | null {
  if (status === "ACTIVE" || status === "APPROVED") return "ACTIVE";
  if (status === "REJECTED" || status === "PENDING") return status;
  return status === "DRAFT" ? "PENDING" : null;
}

function isLiveService(status: EntityStatus | string | undefined) {
  return status === "ACTIVE" || status === "APPROVED";
}

function isPendingService(status: EntityStatus | string | undefined) {
  return status === "PENDING";
}

export default function MarketplaceReviewsPage() {
  const t = useTranslations("adminMarketplaceReviews");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("adminDashboard");
  const tStatus = useTranslations("entityStatus");
  const tListing = useTranslations("listing");
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [viewService, setViewService] =
    useState<ManagedMarketplaceService | null>(null);
  const [rejectService, setRejectService] =
    useState<ManagedMarketplaceService | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const listParams = {
    page,
    limit: PAGE_SIZE,
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: marketplaceKeys.managedList(listParams),
    queryFn: () => listManagedMarketplaceServices(listParams),
  });

  const { data: serviceDetail, isLoading: detailLoading } = useQuery({
    queryKey: marketplaceKeys.previewDetail(viewService?.id ?? ""),
    queryFn: () => getPreviewMarketplaceService(viewService!.id),
    enabled: !!viewService?.id,
  });

  const statusMut = useMutation({
    mutationFn: ({
      id,
      status,
      reason: r,
    }: {
      id: string;
      status: "ACTIVE" | "REJECTED";
      reason?: string;
    }) => updateMarketplaceServiceStatus(id, { status, reason: r }),
    onSuccess: () => {
      toast.success(t("statusUpdated"));
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      setRejectService(null);
      setViewService(null);
      setReason("");
    },
    onError: (e) => toastApiError(e),
  });

  const pendingId = statusMut.isPending ? statusMut.variables?.id : null;
  const pendingStatus = statusMut.isPending ? statusMut.variables?.status : null;
  const services = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;
  const detail = serviceDetail ?? viewService;

  const statusLabel = (status: EntityStatus | string | undefined) => {
    if (!status) return tStatus("unknown");
    if (status === "PENDING") return tStatus("pending");
    if (status === "ACTIVE" || status === "APPROVED") return tStatus("active");
    if (status === "REJECTED") return tStatus("rejected");
    if (status === "DRAFT") return tStatus("draft");
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("failedLoad");
  }, [isError, error, t]);

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
                  variant={statusFilter === "ALL" ? "default" : "outline"}
                  onClick={() => setStatusFilter("ALL")}
                  disabled={isLoading}
                >
                  {tCommon("all")}
                </Button>
                {REVIEW_STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
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
            pagination={
              showPagination
                ? {
                    label: tListing("pageOfWithCount", {
                      page: meta?.page ?? page,
                      totalPages,
                      total: meta?.total ?? services.length,
                      type: t("servicesCount"),
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
              className={cn(dashboardTableClass, "min-w-[1100px]")}
              containerClassName={dashboardTableContainerClass}
            >
              <TableHeader>
                <TableRow className={dashboardTableHeaderRowClass}>
                  <TableHead className="min-w-[200px] whitespace-nowrap text-muted-foreground">
                    {t("service")}
                  </TableHead>
                  <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                    {tCommon("vendor")}
                  </TableHead>
                  <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                    {tAdmin("tableCity")}
                  </TableHead>
                  <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                    {tCommon("status")}
                  </TableHead>
                  <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                    {tCommon("submitted")}
                  </TableHead>
                  <TableHead className="min-w-[240px] whitespace-nowrap text-right text-muted-foreground">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton cols={6} />
                ) : services.length === 0 ? (
                  <TableEmptyRow colSpan={6}>{t("noServices")}</TableEmptyRow>
                ) : (
                  services.map((service) => {
                    const selectValue = reviewableStatus(service.status);
                    return (
                      <TableRow
                        key={service.id}
                        className={dashboardTableRowClass}
                      >
                        <TableCell className="max-w-[240px] whitespace-normal break-words font-medium">
                          <button
                            type="button"
                            className="text-left hover:text-primary hover:underline"
                            onClick={() => setViewService(service)}
                          >
                            {service.title}
                          </button>
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate text-muted-foreground"
                          title={service.vendor?.vendorName ?? undefined}
                        >
                          {service.vendor?.vendorName ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {service.baseCity ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={statusBadgeVariant(service.status)}>
                            {statusLabel(service.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {service.createdAt
                            ? formatDate(service.createdAt)
                            : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className={dashboardTableActionsClass}>
                            <Button
                              size="sm"
                              variant="outline"
                              className={cn(
                                "shrink-0",
                                dashboardOutlineButtonClass,
                              )}
                              onClick={() => setViewService(service)}
                            >
                              <Eye className="h-4 w-4" />
                              {tCommon("view")}
                            </Button>

                            <Select
                              value={selectValue ?? undefined}
                              disabled={
                                !selectValue || pendingId === service.id
                              }
                              onValueChange={(
                                value: "ACTIVE" | "REJECTED" | "PENDING",
                              ) => {
                                if (value === "REJECTED") {
                                  setRejectService(service);
                                  return;
                                }
                                if (value === "ACTIVE") {
                                  if (isLiveService(service.status)) return;
                                  statusMut.mutate({
                                    id: service.id,
                                    status: "ACTIVE",
                                  });
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
                                <span className="flex w-full items-center gap-2">
                                  {pendingId === service.id ? (
                                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                                  ) : null}
                                  <SelectValue placeholder={t("setStatus")} />
                                </span>
                              </SelectTrigger>
                              <SelectContent
                                className={dashboardDropdownContentClass}
                              >
                                <SelectItem value="PENDING" disabled>
                                  {tStatus("pending")}
                                </SelectItem>
                                <SelectItem value="ACTIVE">
                                  {tStatus("active")}
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
        open={!!viewService}
        onOpenChange={(open) => {
          if (!open) setViewService(null);
        }}
      >
        <DialogContent
          className={cn(
            "max-h-[90vh] overflow-y-auto sm:max-w-3xl",
            dashboardDialogContentClass,
          )}
        >
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {detail?.title ?? t("serviceDetails")}
              {detail?.status ? <StatusBadge status={detail.status} /> : null}
            </DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {detailLoading && !serviceDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : serviceDetail ? (
            <div className="space-y-4">
              <ServiceReviewDetails service={serviceDetail} />
              {isPendingService(serviceDetail.status) ? (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button
                    className="bg-primary text-black hover:bg-primary/90"
                    disabled={
                      statusMut.isPending &&
                      pendingId === serviceDetail.id &&
                      pendingStatus === "ACTIVE"
                    }
                    onClick={() =>
                      statusMut.mutate({
                        id: serviceDetail.id,
                        status: "ACTIVE",
                      })
                    }
                  >
                    {tAdmin("approve")}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={
                      statusMut.isPending && pendingId === serviceDetail.id
                    }
                    onClick={() => {
                      setRejectService(serviceDetail);
                      setViewService(null);
                    }}
                  >
                    {tAdmin("reject")}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectService}
        onOpenChange={(open) => {
          if (!open) {
            setRejectService(null);
            setReason("");
          }
        }}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>
              {rejectService
                ? t("rejectDescNamed", { name: rejectService.title })
                : t("rejectDesc")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("rejectPlaceholder")}
            className={cn(dashboardTextareaClass, "min-h-28")}
          />
          <DialogFooter>
            <Button
              variant="outline"
              className={dashboardOutlineButtonClass}
              onClick={() => {
                setRejectService(null);
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
                  pendingId === rejectService?.id &&
                  pendingStatus === "REJECTED")
              }
              onClick={() => {
                if (!rejectService) return;
                statusMut.mutate({
                  id: rejectService.id,
                  status: "REJECTED",
                  reason: reason.trim(),
                });
              }}
            >
              {statusMut.isPending &&
              pendingId === rejectService?.id &&
              pendingStatus === "REJECTED" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("rejectService")}
                </>
              ) : (
                t("rejectService")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
