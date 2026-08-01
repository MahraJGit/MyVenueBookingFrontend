"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Eye, Loader2, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { ServiceReviewDetails } from "@/components/marketplace/ServiceReviewDetails";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getPreviewMarketplaceService,
  listManagedMarketplaceServices,
  updateMarketplaceServiceStatus,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ManagedMarketplaceService } from "@/features/marketplace/types";
import { serviceCustomizationLabel, servicePricingModelLabel } from "@/features/marketplace/utils";
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
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

export default function MarketplaceReviewsPage() {
  const t = useTranslations("adminMarketplaceReviews");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("adminDashboard");
  const queryClient = useQueryClient();
  const [viewService, setViewService] = useState<ManagedMarketplaceService | null>(
    null,
  );
  const [rejectService, setRejectService] =
    useState<ManagedMarketplaceService | null>(null);
  const [reason, setReason] = useState("");

  const listParams = {
    status: "PENDING" as const,
    limit: 50,
  };

  const { data, isLoading, isFetching } = useQuery({
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
  const detail = serviceDetail ?? viewService;

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <DashboardPanel>
          <DashboardPageHeader title={t("title")} description={t("description")} />

          <Card className={dashboardCardClass}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Store className="h-5 w-5 text-primary" />
                  {t("pendingSubmissions")}
                </CardTitle>
                <CardDescription>
                  {isLoading
                    ? t("loadingQueue")
                    : t("serviceCount", { count: services.length })}
                </CardDescription>
              </div>
              {isFetching && !isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </CardHeader>

            <CardContent className="p-0">
              <DashboardTableWrapper className="rounded-none border-0 border-t border-[#303030]">
                <Table
                  className={cn(dashboardTableClass, "min-w-[1000px]")}
                  containerClassName={dashboardTableContainerClass}
                >
                  <TableHeader>
                    <TableRow className={dashboardTableHeaderRowClass}>
                      <TableHead className="min-w-[240px] text-muted-foreground">
                        {t("service")}
                      </TableHead>
                      <TableHead className="min-w-[160px] text-muted-foreground">
                        {tCommon("vendor")}
                      </TableHead>
                      <TableHead className="min-w-[130px] text-muted-foreground">
                        {t("pricing")}
                      </TableHead>
                      <TableHead className="min-w-[130px] text-muted-foreground">
                        {t("customization")}
                      </TableHead>
                      <TableHead className="min-w-[300px] text-right text-muted-foreground">
                        {tCommon("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton cols={5} />
                    ) : services.length === 0 ? (
                      <TableEmptyRow colSpan={5}>{t("noPending")}</TableEmptyRow>
                    ) : (
                      services.map((service) => {
                        const isApproving =
                          pendingId === service.id && pendingStatus === "ACTIVE";
                        const isRejecting =
                          pendingId === service.id && pendingStatus === "REJECTED";

                        return (
                          <TableRow
                            key={service.id}
                            className={dashboardTableRowClass}
                          >
                            <TableCell>
                              <div className="space-y-1.5">
                                <p className="font-medium text-foreground">
                                  {service.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {service.baseCity ?? "—"}
                                  </span>
                                  {service.category?.name ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      {service.category.name}
                                    </Badge>
                                  ) : null}
                                </div>
                                {service.status ? (
                                  <StatusBadge status={service.status} />
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {service.vendor?.vendorName ?? "—"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="secondary" className="gap-1 font-normal">
                                <DollarSign className="h-3 w-3" />
                                {servicePricingModelLabel(service.pricingModel)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="font-normal">
                                {serviceCustomizationLabel(service.customizationMode)}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-right">
                              <div className={dashboardTableActionsClass}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewService(service)}
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  {tCommon("view")}
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-primary"
                                  disabled={isApproving || isRejecting}
                                  onClick={() =>
                                    statusMut.mutate({
                                      id: service.id,
                                      status: "ACTIVE",
                                    })
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
                                  disabled={isApproving || isRejecting}
                                  onClick={() => setRejectService(service)}
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
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  className="bg-primary"
                  disabled={
                    statusMut.isPending &&
                    pendingId === serviceDetail.id &&
                    pendingStatus === "ACTIVE"
                  }
                  onClick={() =>
                    statusMut.mutate({ id: serviceDetail.id, status: "ACTIVE" })
                  }
                >
                  {tAdmin("approve")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={statusMut.isPending && pendingId === serviceDetail.id}
                  onClick={() => {
                    setRejectService(serviceDetail);
                    setViewService(null);
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
            placeholder={t("rejectPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-24 border-border bg-input/50"
          />
          <DialogFooter>
            <Button
              variant="outline"
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
              onClick={() =>
                rejectService &&
                statusMut.mutate({
                  id: rejectService.id,
                  status: "REJECTED",
                  reason: reason.trim(),
                })
              }
            >
              {t("rejectService")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
