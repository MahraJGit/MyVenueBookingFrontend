"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  listAdminVendorServiceRequests,
  updateVendorServiceEnrollment,
  type AdminVendorServiceRequest,
  type VendorVerificationStatus,
} from "@/features/vendor/api";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardScrollableTabs,
  DashboardErrorAlert,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardDialogContentClass,
  dashboardOutlineButtonClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardDataTable,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";

type StatusFilter = "ALL" | VendorVerificationStatus;

function statusBadgeVariant(status: VendorVerificationStatus) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

export default function VendorServiceRequestsPage() {
  const t = useTranslations("adminVendorServiceRequests");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tAdmin = useTranslations("adminDashboard");
  const tTables = useTranslations("tables");
  const queryClient = useQueryClient();
  const table = useTableQueryState<{ status: StatusFilter }>({
    initialSortBy: "requestedAt",
    initialFilters: { status: "PENDING" },
  });
  const [rejectTarget, setRejectTarget] =
    useState<AdminVendorServiceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const statusLabel = (status: VendorVerificationStatus) => {
    if (status === "APPROVED") return tStatus("approved");
    if (status === "REJECTED") return tStatus("rejected");
    return tStatus("pending");
  };

  const listStatus =
    table.filters.status === "ALL" ? undefined : table.filters.status;

  const {
    data: listResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-vendor-service-requests", table.queryParams],
    queryFn: () =>
      listAdminVendorServiceRequests({
        page: table.page,
        limit: table.pageSize,
        search: table.search || undefined,
        status: listStatus,
        sortOrder: table.sortOrder,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: {
      vendorId: string;
      serviceType: AdminVendorServiceRequest["serviceType"];
      status: VendorVerificationStatus;
      rejectedReason?: string;
    }) =>
      updateVendorServiceEnrollment(vars.vendorId, vars.serviceType, {
        status: vars.status,
        rejectedReason: vars.rejectedReason,
      }),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["admin-vendor-service-requests"],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-vendor-detail"] });
      toast.success(
        vars.status === "APPROVED"
          ? t("serviceApproved")
          : vars.status === "REJECTED"
            ? t("serviceRejected")
            : t("statusUpdated"),
      );
    },
    onError: (err) => {
      toastApiError(err, t("couldNotUpdate"));
    },
  });

  const pendingKey = updateMutation.isPending
    ? `${updateMutation.variables?.vendorId}:${updateMutation.variables?.serviceType}`
    : undefined;

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("failedLoad");
  }, [isError, error, t]);

  const requests = listResult?.data ?? [];
  const meta = listResult?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const handleRejectSubmit = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    updateMutation.mutate(
      {
        vendorId: rejectTarget.vendorProfileId,
        serviceType: rejectTarget.serviceType,
        status: "REJECTED",
        rejectedReason: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          setRejectReason("");
          setRejectTarget(null);
        },
      },
    );
  };

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("title")} description={t("description")} />

        <DashboardScrollableTabs
          value={table.filters.status}
          onValueChange={(value) =>
            table.setFilter("status", value as StatusFilter)
          }
          items={(
            ["PENDING", "APPROVED", "REJECTED", "ALL"] as const
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
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: tCommon("search"),
            },
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: isFetching && !isLoading,
          }}
          pagination={{
            label: formatTableRangeLabel({
              page: table.page,
              pageSize: table.pageSize,
              total,
              showingLabel: (args) => tTables("showing", args),
            }),
            page: table.page,
            totalPages,
            total,
            onPageChange: table.setPage,
            previousLabel: tCommon("previous"),
            nextLabel: tCommon("next"),
            isLoading,
          }}
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[1100px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
                  {tCommon("vendor")}
                </TableHead>
                <TableHead className="min-w-[130px] whitespace-nowrap text-muted-foreground">
                  {t("service")}
                </TableHead>
                <TableHead className="min-w-[200px] whitespace-nowrap text-muted-foreground">
                  {tCommon("email")}
                </TableHead>
                <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                  {tCommon("status")}
                </TableHead>
                <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                  {t("requested")}
                </TableHead>
                <TableHead className="min-w-[240px] whitespace-nowrap text-right text-muted-foreground">
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={6} />
              ) : (
                <>
                  {requests.map((request) => {
                    const rowKey = `${request.vendorProfileId}:${request.serviceType}`;
                    const busy = pendingKey === rowKey;
                    return (
                      <TableRow
                        key={request.id}
                        className={dashboardTableRowClass}
                      >
                        <TableCell className="max-w-[200px] whitespace-normal break-words font-medium">
                          {request.vendor.vendorName}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {request.serviceType}
                        </TableCell>
                        <TableCell
                          className="max-w-[240px] truncate text-muted-foreground"
                          title={request.vendor.email}
                        >
                          {request.vendor.email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={statusBadgeVariant(request.status)}>
                            {statusLabel(request.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(request.requestedAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <div className={dashboardTableActionsClass}>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className={cn(
                                "shrink-0",
                                dashboardOutlineButtonClass,
                              )}
                            >
                              <Link
                                href={`/adminDashbaord/vendors/${request.vendorProfileId}`}
                              >
                                <Eye className="h-4 w-4" />
                                {tCommon("view")}
                              </Link>
                            </Button>

                            {request.status === "PENDING" ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() =>
                                    updateMutation.mutate({
                                      vendorId: request.vendorProfileId,
                                      serviceType: request.serviceType,
                                      status: "APPROVED",
                                    })
                                  }
                                >
                                  {busy &&
                                  updateMutation.variables?.status ===
                                    "APPROVED" ? (
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                  ) : null}
                                  {tAdmin("approve")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={busy}
                                  onClick={() => setRejectTarget(request)}
                                >
                                  {tAdmin("reject")}
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {!isLoading && requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-12 text-center text-gray-400"
                      >
                        {table.hasActiveFilters
                          ? tTables("noMatch")
                          : t("noRequests")}
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
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
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
              {t("requestLabel")}{" "}
              <span className="font-semibold text-white">
                {rejectTarget?.vendor.vendorName} · {rejectTarget?.serviceType}
              </span>
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
                setRejectTarget(null);
                setRejectReason("");
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
  );
}
