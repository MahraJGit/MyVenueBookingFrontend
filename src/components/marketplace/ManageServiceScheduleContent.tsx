"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
  dashboardCardClass,
  dashboardInputClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  VenueScheduleEditor,
  type ScheduleRow,
} from "@/components/venues/VenueScheduleEditor";
import {
  addServiceBlock,
  getManagedMarketplaceService,
  listServiceBlocks,
  listServiceSchedules,
  removeServiceBlock,
  replaceServiceSchedules,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import {
  defaultWeeklyServiceSchedules,
  formatDateKey,
} from "@/features/marketplace/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { toastApiError } from "@/lib/toasts";

export function ManageServiceScheduleContent() {
  const params = useParams();
  const serviceId = String(params?.id ?? "");
  const paths = useDashboardPaths();
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();

  const [schedules, setSchedules] = React.useState<ScheduleRow[]>(
    defaultWeeklyServiceSchedules(),
  );
  const [blockDate, setBlockDate] = React.useState(formatDateKey(new Date()));
  const [blockReason, setBlockReason] = React.useState("");

  const serviceQuery = useQuery({
    queryKey: marketplaceKeys.managedDetail(serviceId),
    queryFn: () => getManagedMarketplaceService(serviceId),
    enabled: Boolean(serviceId),
  });

  const schedulesQuery = useQuery({
    queryKey: marketplaceKeys.schedules(serviceId),
    queryFn: () => listServiceSchedules(serviceId),
    enabled: Boolean(serviceId),
  });

  const blocksQuery = useQuery({
    queryKey: marketplaceKeys.blocks(serviceId),
    queryFn: () => listServiceBlocks(serviceId),
    enabled: Boolean(serviceId),
  });

  React.useEffect(() => {
    const rows = schedulesQuery.data;
    if (!rows || rows.length === 0) return;
    const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
    setSchedules(
      defaultWeeklyServiceSchedules().map((d) => {
        const found = byDay.get(d.dayOfWeek);
        return found
          ? {
              dayOfWeek: found.dayOfWeek,
              openTime: found.openTime,
              closeTime: found.closeTime,
              isOpen: found.isOpen,
            }
          : d;
      }),
    );
  }, [schedulesQuery.data]);

  const saveSchedulesMut = useMutation({
    mutationFn: () =>
      replaceServiceSchedules(serviceId, {
        schedules: schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          openTime: s.openTime,
          closeTime: s.closeTime,
          isOpen: s.isOpen,
        })),
      }),
    onSuccess: async () => {
      toast.success(t("scheduleSaved"));
      await queryClient.invalidateQueries({
        queryKey: marketplaceKeys.schedules(serviceId),
      });
    },
    onError: (e) => toastApiError(e),
  });

  const addBlockMut = useMutation({
    mutationFn: () =>
      addServiceBlock(serviceId, {
        blockDate,
        reason: blockReason.trim() || undefined,
        customOpenTime: "00:00",
        customCloseTime: "23:59",
        isBlocked: true,
      }),
    onSuccess: async () => {
      toast.success(t("blockAdded"));
      setBlockReason("");
      await queryClient.invalidateQueries({
        queryKey: marketplaceKeys.blocks(serviceId),
      });
    },
    onError: (e) => toastApiError(e),
  });

  const removeBlockMut = useMutation({
    mutationFn: (blockId: string) => removeServiceBlock(serviceId, blockId),
    onSuccess: async () => {
      toast.success(t("blockRemoved"));
      await queryClient.invalidateQueries({
        queryKey: marketplaceKeys.blocks(serviceId),
      });
    },
    onError: (e) => toastApiError(e),
  });

  if (serviceQuery.isLoading || schedulesQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (serviceQuery.isError || !serviceQuery.data) {
    return (
      <DashboardPageShell>
        <DashboardErrorAlert message={t("serviceNotFound")} />
      </DashboardPageShell>
    );
  }

  const blocks = blocksQuery.data ?? [];

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <div className="mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={paths.marketplace}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t("backToServices")}
            </Link>
          </Button>
        </div>
        <DashboardPageHeader
          title={t("scheduleTitle", { title: serviceQuery.data.title })}
          description={t("scheduleDesc")}
        />

        <div className="space-y-6">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle>{t("weeklyHours")}</CardTitle>
              <CardDescription>{t("weeklyHoursDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <VenueScheduleEditor schedules={schedules} onChange={setSchedules} />
              <div className="flex justify-end">
                <Button
                  disabled={saveSchedulesMut.isPending}
                  onClick={() => saveSchedulesMut.mutate()}
                >
                  {saveSchedulesMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t("saveSchedule")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle>{t("blockedDates")}</CardTitle>
              <CardDescription>{t("blockedDatesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("blockDate")}</Label>
                  <Input
                    type="date"
                    className={dashboardInputClass}
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("blockReason")}</Label>
                  <Input
                    className={dashboardInputClass}
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder={t("blockReasonPlaceholder")}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!blockDate || addBlockMut.isPending}
                onClick={() => addBlockMut.mutate()}
              >
                {addBlockMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t("addBlock")}
              </Button>

              {blocksQuery.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : blocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noBlocks")}</p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map((block) => (
                    <li
                      key={block.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">
                          {String(block.blockDate).slice(0, 10)}
                        </p>
                        {block.reason ? (
                          <p className="text-xs text-muted-foreground">
                            {block.reason}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        aria-label={tCommon("remove")}
                        disabled={
                          removeBlockMut.isPending &&
                          removeBlockMut.variables === block.id
                        }
                        onClick={() => removeBlockMut.mutate(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardPanel>
    </DashboardPageShell>
  );
}
