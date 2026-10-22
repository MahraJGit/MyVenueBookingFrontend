"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  RefreshCw,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { DatePicker } from "@/components/ui/date-time-picker";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import {
  DashboardPageHeader,
  dashboardFilterBarBorderClass,
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardStatCard,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardFilterBar } from "@/components/userDashboard/DashboardScrollableTabs";
import {
  getEventAttendanceSummary,
  getOccurrenceAttendanceSummary,
  listAttendanceAttractions,
  listAttendanceEvents,
  listAttendanceOccurrences,
  listEventAttendanceScans,
  listOccurrenceAttendanceScans,
  type AttendanceScope,
  type AttendanceSummary,
} from "@/features/ticket-attendance/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { formatLocalizedDateTime } from "@/lib/date-locale";

const NONE = "__none__";

export type ManageTicketAttendanceProps = {
  scope: "vendor" | "admin";
  resourceType: "event" | "attraction";
};

function progressPercent(sold: number, checkedIn: number) {
  if (sold <= 0) return 0;
  return Math.min(100, Math.round((checkedIn / sold) * 100));
}

function scanResultVariant(result: string) {
  if (result === "VALID") return "default" as const;
  if (result === "ALREADY_USED") return "secondary" as const;
  return "destructive" as const;
}

function scanResultLabel(
  t: ReturnType<typeof useTranslations<"ticketAttendance">>,
  result: string,
) {
  const known = [
    "VALID",
    "ALREADY_USED",
    "WRONG_EVENT",
    "WRONG_OCCURRENCE",
    "NOT_FOUND",
    "NOT_PAID",
    "NOT_ASSIGNED",
    "TOO_EARLY",
    "TOO_LATE",
    "INACTIVE",
  ] as const;
  if ((known as readonly string[]).includes(result)) {
    return t(`scanResult.${result}` as "scanResult.VALID");
  }
  return result;
}

export function ManageTicketAttendance({
  scope,
  resourceType,
}: ManageTicketAttendanceProps) {
  const t = useTranslations("ticketAttendance");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const apiScope: AttendanceScope =
    scope === "admin" ? "platform" : "workspace";

  const [resourceId, setResourceId] = useState("");
  const [occurrenceId, setOccurrenceId] = useState("");
  const [occurrenceDate, setOccurrenceDate] = useState("");

  const listingsQuery = useQuery({
    queryKey: ["ticket-attendance-listings", resourceType, apiScope],
    queryFn: () =>
      resourceType === "event"
        ? listAttendanceEvents(apiScope)
        : listAttendanceAttractions(apiScope),
  });

  const listings = listingsQuery.data ?? [];
  const selectedListing = listings.find((row) => row.id === resourceId);

  useEffect(() => {
    if (!resourceId && listings.length === 1 && listings[0]) {
      setResourceId(listings[0].id);
    }
  }, [listings, resourceId]);

  useEffect(() => {
    if (resourceType !== "attraction" || !selectedListing) return;
    if (occurrenceDate) return;
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: selectedListing.timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    setOccurrenceDate(today);
  }, [resourceType, selectedListing, occurrenceDate]);

  const occurrencesQuery = useQuery({
    queryKey: [
      "ticket-attendance-occurrences",
      resourceId,
      occurrenceDate,
      apiScope,
    ],
    queryFn: () =>
      listAttendanceOccurrences(resourceId, apiScope, occurrenceDate || undefined),
    enabled:
      resourceType === "attraction" && Boolean(resourceId) && Boolean(occurrenceDate),
  });

  const occurrences = occurrencesQuery.data?.items ?? [];

  useEffect(() => {
    if (resourceType !== "attraction") return;
    if (!occurrences.length) {
      setOccurrenceId("");
      return;
    }
    if (!occurrenceId || !occurrences.some((row) => row.id === occurrenceId)) {
      setOccurrenceId(occurrences[0]!.id);
    }
  }, [resourceType, occurrences, occurrenceId]);

  const summaryEnabled =
    Boolean(resourceId) &&
    (resourceType === "event" || Boolean(occurrenceId));

  const summaryQuery = useQuery({
    queryKey: [
      "ticket-attendance-summary",
      resourceType,
      resourceId,
      occurrenceId,
      apiScope,
    ],
    queryFn: () =>
      resourceType === "event"
        ? getEventAttendanceSummary(resourceId, apiScope)
        : getOccurrenceAttendanceSummary(resourceId, occurrenceId, apiScope),
    enabled: summaryEnabled,
  });

  const scansQuery = useQuery({
    queryKey: [
      "ticket-attendance-scans",
      resourceType,
      resourceId,
      occurrenceId,
      apiScope,
    ],
    queryFn: () =>
      resourceType === "event"
        ? listEventAttendanceScans(resourceId, apiScope, { limit: 40 })
        : listOccurrenceAttendanceScans(resourceId, occurrenceId, apiScope, {
            limit: 40,
          }),
    enabled: summaryEnabled,
  });

  useEffect(() => {
    if (listingsQuery.isError) {
      toastApiError(listingsQuery.error, t("couldNotLoadListings"));
    }
  }, [listingsQuery.isError, listingsQuery.error, t]);

  useEffect(() => {
    if (summaryQuery.isError) {
      toastApiError(summaryQuery.error, t("couldNotLoad"));
    }
  }, [summaryQuery.isError, summaryQuery.error, t]);

  useEffect(() => {
    if (scansQuery.isError) {
      toastApiError(scansQuery.error, t("couldNotLoadScans"));
    }
  }, [scansQuery.isError, scansQuery.error, t]);

  const summary = summaryQuery.data;
  const scans = scansQuery.data?.items ?? [];
  const isRefreshing =
    summaryQuery.isFetching || scansQuery.isFetching || occurrencesQuery.isFetching;

  const title =
    resourceType === "event" ? t("titleEvents") : t("titleAttractions");
  const description =
    scope === "admin"
      ? resourceType === "event"
        ? t("descriptionEventsAdmin")
        : t("descriptionAttractionsAdmin")
      : resourceType === "event"
        ? t("descriptionEventsVendor")
        : t("descriptionAttractionsVendor");

  const whenLabel = useMemo(() => {
    if (!summary?.startDateTime) return null;
    return formatLocalizedDateTime(
      summary.startDateTime,
      locale,
      undefined,
      summary.timezone,
    );
  }, [summary, locale]);

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={title} description={description} />

        <DashboardFilterBar
          className={dashboardFilterBarBorderClass}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-9 shrink-0", dashboardSurfaceBorderClass)}
              disabled={!summaryEnabled || isRefreshing}
              onClick={() => {
                void summaryQuery.refetch();
                void scansQuery.refetch();
                if (resourceType === "attraction") {
                  void occurrencesQuery.refetch();
                }
              }}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              {tCommon("refresh")}
            </Button>
          }
        >
          <div className="grid w-full min-w-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {resourceType === "event" ? t("selectEvent") : t("selectAttraction")}
              </Label>
              <Select
                value={resourceId || NONE}
                onValueChange={(value) => {
                  setResourceId(value === NONE ? "" : value);
                  setOccurrenceId("");
                }}
              >
                <SelectTrigger
                  className={cn("h-9 w-full min-w-0", dashboardSelectTriggerClass)}
                >
                  <SelectValue
                    placeholder={
                      resourceType === "event"
                        ? t("selectEvent")
                        : t("selectAttraction")
                    }
                  />
                </SelectTrigger>
                <SelectContent className={dashboardDropdownContentClass}>
                  <SelectItem value={NONE}>{t("selectPlaceholder")}</SelectItem>
                  {listings.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.name}
                      {scope === "admin" && row.vendorName
                        ? ` · ${row.vendorName}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {resourceType === "attraction" ? (
              <>
                <div className="min-w-0 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("showDate")}
                  </Label>
                  <DatePicker
                    value={occurrenceDate}
                    onChange={(value) => {
                      setOccurrenceDate(value);
                      setOccurrenceId("");
                    }}
                    placeholder={t("showDate")}
                    disabled={!resourceId}
                    className="min-w-0"
                    triggerClassName={cn("h-9", dashboardSelectTriggerClass)}
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("selectShow")}
                  </Label>
                  <Select
                    value={occurrenceId || NONE}
                    onValueChange={(value) =>
                      setOccurrenceId(value === NONE ? "" : value)
                    }
                    disabled={!resourceId || occurrences.length === 0}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-9 w-full min-w-0",
                        dashboardSelectTriggerClass,
                      )}
                    >
                      <SelectValue placeholder={t("selectShow")} />
                    </SelectTrigger>
                    <SelectContent className={dashboardDropdownContentClass}>
                      <SelectItem value={NONE}>
                        {t("selectShowPlaceholder")}
                      </SelectItem>
                      {occurrences.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {(row.slotName || t("showFallback")).trim()}
                          {" · "}
                          {formatLocalizedDateTime(
                            row.startDateTime,
                            locale,
                            undefined,
                            selectedListing?.timezone,
                          )}
                          {` (${row.progress.checkedIn}/${row.progress.sold})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}
          </div>
        </DashboardFilterBar>

        {!resourceId ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("pickListingHint")}</p>
        ) : resourceType === "attraction" && !occurrenceId ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {occurrencesQuery.isLoading
              ? t("loadingShows")
              : t("noShowsForDate")}
          </p>
        ) : summaryQuery.isLoading && !summary ? (
          <div className="mt-8 flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : summary ? (
          <AttendanceBody
            summary={summary}
            scans={scans}
            scansLoading={scansQuery.isLoading && scans.length === 0}
            whenLabel={whenLabel}
            t={t}
            tCommon={tCommon}
          />
        ) : null}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function AttendanceBody({
  summary,
  scans,
  scansLoading,
  whenLabel,
  t,
  tCommon,
}: {
  summary: AttendanceSummary;
  scans: Awaited<ReturnType<typeof listEventAttendanceScans>>["items"];
  scansLoading: boolean;
  whenLabel: string | null;
  t: ReturnType<typeof useTranslations<"ticketAttendance">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const pct = progressPercent(
    summary.progress.sold,
    summary.progress.checkedIn,
  );

  return (
    <div className="mt-6 space-y-8">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{summary.name}</h3>
        {summary.slotName ? (
          <p className="text-sm text-muted-foreground">{summary.slotName}</p>
        ) : null}
        {whenLabel ? (
          <p className="text-sm text-muted-foreground">{whenLabel}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatCard
          icon={<Ticket className="h-5 w-5 text-primary" />}
          label={t("sold")}
          value={String(summary.progress.sold)}
        />
        <DashboardStatCard
          icon={<UserCheck className="h-5 w-5 text-primary" />}
          label={t("checkedIn")}
          value={`${summary.progress.checkedIn} (${pct}%)`}
        />
        <DashboardStatCard
          icon={<Users className="h-5 w-5 text-primary" />}
          label={t("remaining")}
          value={String(summary.progress.remaining)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t("checkInProgress")}</span>
          <span>
            {summary.progress.checkedIn}/{summary.progress.sold}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h4 className="font-semibold text-foreground">{t("recentCheckIns")}</h4>
        <Table
          className={cn(dashboardTableClass, "min-w-[720px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="text-muted-foreground">{t("guest")}</TableHead>
              <TableHead className="text-muted-foreground">{t("ticketType")}</TableHead>
              <TableHead className="text-muted-foreground">{t("seatOrEntry")}</TableHead>
              <TableHead className="text-muted-foreground">{t("verifier")}</TableHead>
              <TableHead className="text-muted-foreground">{t("checkedInAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.recentCheckIns.length === 0 ? (
              <TableEmptyRow colSpan={5}>{t("noCheckInsYet")}</TableEmptyRow>
            ) : (
              summary.recentCheckIns.map((row) => (
                <TableRow key={row.id} className={dashboardTableRowClass}>
                  <TableCell className="font-medium">{row.fullName}</TableCell>
                  <TableCell>{row.ticketName ?? "—"}</TableCell>
                  <TableCell>
                    {[row.seatLabel, row.entryLabel].filter(Boolean).join(" · ") ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    {row.verifier?.displayName ?? t("unknownVerifier")}
                  </TableCell>
                  <TableCell>
                    {row.checkInTime
                      ? new Date(row.checkInTime).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-3">
        <h4 className="font-semibold text-foreground">{t("scanLog")}</h4>
        <Table
          className={cn(dashboardTableClass, "min-w-[800px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
              <TableHead className="text-muted-foreground">{t("guest")}</TableHead>
              <TableHead className="text-muted-foreground">{t("seatOrEntry")}</TableHead>
              <TableHead className="text-muted-foreground">{t("verifier")}</TableHead>
              <TableHead className="text-muted-foreground">{t("scannedAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scansLoading ? (
              <TableSkeleton cols={5} rows={5} />
            ) : scans.length === 0 ? (
              <TableEmptyRow colSpan={5}>{t("noScansYet")}</TableEmptyRow>
            ) : (
              scans.map((row) => (
                <TableRow key={row.id} className={dashboardTableRowClass}>
                  <TableCell>
                    <Badge variant={scanResultVariant(row.result)}>
                      {scanResultLabel(t, row.result)}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.attendeeName ?? "—"}</TableCell>
                  <TableCell>{row.seatLabel ?? "—"}</TableCell>
                  <TableCell>{row.verifier.displayName}</TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
