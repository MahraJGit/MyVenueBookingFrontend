"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Loader2,
  Minus,
  Plus,
  Store,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/venues/StatusBadge";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { DatePicker, TimePicker } from "@/components/ui/date-time-picker";
import {
  cancelAttractionOccurrence,
  closeAttractionScheduleDay,
  createAttractionOccurrence,
  getAttractionScheduleDay,
  getAttractionScheduleMonth,
  getManagedAttraction,
  openAttractionScheduleDay,
  recordAttractionOccurrenceOfflineSales,
  updateAttractionOccurrence,
  type AttractionScheduleMonthDay,
} from "@/features/attractions/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getDateFnsLocale } from "@/lib/date-locale";

function formatDateKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKeyLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function ManageAttractionSchedulePage() {
  const params = useParams();
  const attractionId = String(params?.id ?? "");
  const paths = useDashboardPaths();
  const queryClient = useQueryClient();
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);

  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = React.useState(() =>
    formatDateKeyLocal(new Date()),
  );

  const [addName, setAddName] = React.useState("");
  const [addStartTime, setAddStartTime] = React.useState("10:00");
  const [addEndTime, setAddEndTime] = React.useState("11:00");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editStartTime, setEditStartTime] = React.useState("");
  const [editEndTime, setEditEndTime] = React.useState("");
  const [localSalesId, setLocalSalesId] = React.useState<string | null>(null);

  const monthKey = monthKeyFromDate(month);

  const attractionQuery = useQuery({
    queryKey: ["managed-attraction", attractionId],
    queryFn: () => getManagedAttraction(attractionId),
    enabled: Boolean(attractionId),
  });

  const monthQuery = useQuery({
    queryKey: ["attraction-schedule-month", attractionId, monthKey],
    queryFn: () => getAttractionScheduleMonth(attractionId, monthKey),
    enabled: Boolean(attractionId),
  });

  const dayQuery = useQuery({
    queryKey: ["attraction-schedule-day", attractionId, selectedDate],
    queryFn: () => getAttractionScheduleDay(attractionId, selectedDate),
    enabled: Boolean(attractionId && selectedDate),
  });

  const invalidateSchedule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["attraction-schedule-month", attractionId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["attraction-schedule-day", attractionId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["managed-attraction-occurrences", attractionId],
      }),
    ]);
  };

  const closeDayMutation = useMutation({
    mutationFn: () => closeAttractionScheduleDay(attractionId, selectedDate),
    onSuccess: async () => {
      toast.success("Day closed");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not close day"),
  });

  const openDayMutation = useMutation({
    mutationFn: () => openAttractionScheduleDay(attractionId, selectedDate),
    onSuccess: async () => {
      toast.success("Day opened");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not open day"),
  });

  const cancelMutation = useMutation({
    mutationFn: (occurrenceId: string) =>
      cancelAttractionOccurrence(attractionId, occurrenceId),
    onSuccess: async () => {
      toast.success("Show cancelled");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not cancel show"),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      createAttractionOccurrence(attractionId, {
        date: selectedDate,
        name: addName.trim(),
        startTime: addStartTime,
        endTime: addEndTime,
      }),
    onSuccess: async () => {
      toast.success("Show added");
      setAddName("");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not add show"),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateAttractionOccurrence(attractionId, editingId!, {
        name: editName.trim(),
        startTime: editStartTime,
        endTime: editEndTime,
      }),
    onSuccess: async () => {
      toast.success("Show updated");
      setEditingId(null);
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not update show"),
  });

  const offlineSalesMutation = useMutation({
    mutationFn: (vars: {
      occurrenceId: string;
      inventoryId: string;
      delta: number;
    }) =>
      recordAttractionOccurrenceOfflineSales(
        attractionId,
        vars.occurrenceId,
        [{ inventoryId: vars.inventoryId, delta: vars.delta }],
      ),
    onSuccess: async (_data, vars) => {
      toast.success(
        vars.delta > 0 ? "Marked as sold locally" : "Local sale released",
      );
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not update local sales"),
  });

  const dayByDate = React.useMemo(() => {
    const map = new Map<string, AttractionScheduleMonthDay>();
    for (const day of monthQuery.data?.days ?? []) {
      map.set(day.date, day);
    }
    return map;
  }, [monthQuery.data]);

  const selected = parseDateKeyLocal(selectedDate);
  const day = dayQuery.data;
  const isLoading = attractionQuery.isLoading || monthQuery.isLoading;
  const isError = attractionQuery.isError || monthQuery.isError;
  const error = attractionQuery.error ?? monthQuery.error;

  const busy =
    closeDayMutation.isPending ||
    openDayMutation.isPending ||
    cancelMutation.isPending ||
    addMutation.isPending ||
    editMutation.isPending ||
    offlineSalesMutation.isPending;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={
            attractionQuery.data
              ? `Schedule · ${attractionQuery.data.name}`
              : "Schedule"
          }
          action={
            <Button variant="outline" asChild>
              <Link href={paths.attractions}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          }
        />

        {isError ? (
          <DashboardErrorAlert
            message={
              error instanceof Error
                ? error.message
                : "Failed to load schedule"
            }
            onRetry={() => {
              void attractionQuery.refetch();
              void monthQuery.refetch();
            }}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-border bg-card p-3">
            {isLoading ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Calendar
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={selected}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(formatDateKeyLocal(date));
                  setEditingId(null);
                  setLocalSalesId(null);
                }}
                locale={dateFnsLocale}
                className="w-full"
                modifiers={{
                  hasShows: (date) => {
                    const key = formatDateKeyLocal(date);
                    const info = dayByDate.get(key);
                    return Boolean(info && info.scheduledCount > 0 && !info.closed);
                  },
                  closed: (date) => {
                    const key = formatDateKeyLocal(date);
                    return Boolean(dayByDate.get(key)?.closed);
                  },
                }}
                modifiersClassNames={{
                  hasShows: "font-semibold text-foreground",
                  closed: "text-destructive/80 line-through",
                }}
              />
            )}
            <p className="mt-3 px-2 text-xs text-muted-foreground">
              Select a day to add, cancel, or close shows. Default slots come
              from the attraction template.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {selectedDate}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {day?.closed
                    ? "Closed — buyers will not see shows this day."
                    : `${day?.occurrences.filter((o) => o.status === "SCHEDULED").length ?? 0} scheduled show(s)`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {day?.closed ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openDayMutation.mutate()}
                  >
                    {openDayMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="mr-2 h-4 w-4" />
                    )}
                    Open day
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !confirm(
                          "Close this day? Scheduled shows will be cancelled and rematerialization will skip it.",
                        )
                      ) {
                        return;
                      }
                      closeDayMutation.mutate();
                    }}
                  >
                    {closeDayMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="mr-2 h-4 w-4" />
                    )}
                    Close day
                  </Button>
                )}
              </div>
            </div>

            {dayQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : dayQuery.isError ? (
              <DashboardErrorAlert
                message={
                  dayQuery.error instanceof Error
                    ? dayQuery.error.message
                    : "Failed to load day"
                }
                onRetry={() => void dayQuery.refetch()}
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {(day?.occurrences ?? []).length === 0 ? (
                    <li className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No shows on this day yet.
                    </li>
                  ) : (
                    day!.occurrences.map((row) => {
                      const sold = (row.inventories ?? []).reduce(
                        (sum, inv) => sum + (inv.quantitySold ?? 0),
                        0,
                      );
                      const total = (row.inventories ?? []).reduce(
                        (sum, inv) => sum + (inv.quantityTotal ?? 0),
                        0,
                      );
                      const canCancel = row.status === "SCHEDULED";
                      const isEditing = editingId === row.id;
                      const showLocalSales = localSalesId === row.id;
                      const seatingEnabled = Boolean(
                        row.seatingEnabled ??
                          attractionQuery.data?.seatingEnabled,
                      );
                      const startTime =
                        row.scheduleKey.split("|")[1] ?? "";
                      const endTime = formatLocalTime(
                        row.endDateTime,
                        attractionQuery.data?.timezone,
                      );
                      const offlineSold = (row.inventories ?? []).reduce(
                        (sum, inv) => sum + (inv.quantityOfflineSold ?? 0),
                        0,
                      );

                      return (
                        <li
                          key={row.id}
                          className={cn(
                            "rounded-lg border border-border bg-card px-4 py-3",
                            row.status !== "SCHEDULED" && "opacity-70",
                          )}
                        >
                          {isEditing ? (
                            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-input/50"
                              />
                              <TimePicker
                                value={editStartTime}
                                onChange={setEditStartTime}
                                className="w-full sm:w-32"
                              />
                              <TimePicker
                                value={editEndTime}
                                onChange={setEditEndTime}
                                className="w-full sm:w-32"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={
                                    busy ||
                                    !editName.trim() ||
                                    !editStartTime ||
                                    !editEndTime
                                  }
                                  onClick={() => editMutation.mutate()}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-medium">
                                    {row.slotName || "Show"} · {startTime} –{" "}
                                    {endTime}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatShowTime(
                                      row.startDateTime,
                                      attractionQuery.data?.timezone,
                                    )}{" "}
                                    · {sold}/{total} sold
                                    {offlineSold > 0
                                      ? ` · ${offlineSold} local`
                                      : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={row.status} />
                                  {canCancel ? (
                                    <>
                                      {seatingEnabled ? (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          asChild
                                        >
                                          <Link
                                            href={paths.manageAttractionOccurrenceSeating(
                                              attractionId,
                                              row.id,
                                            )}
                                          >
                                            <Store className="mr-1.5 h-3.5 w-3.5" />
                                            Local sales
                                          </Link>
                                        </Button>
                                      ) : (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          disabled={busy}
                                          onClick={() =>
                                            setLocalSalesId((prev) =>
                                              prev === row.id ? null : row.id,
                                            )
                                          }
                                        >
                                          <Store className="mr-1.5 h-3.5 w-3.5" />
                                          Local sales
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        onClick={() => {
                                          setEditingId(row.id);
                                          setLocalSalesId(null);
                                          setEditName(row.slotName || "Show");
                                          setEditStartTime(startTime);
                                          setEditEndTime(endTime);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                        aria-label="Cancel show"
                                        disabled={busy}
                                        onClick={() => {
                                          if (
                                            !confirm(
                                              "Cancel this show? Existing ticket holders keep their tickets until you handle refunds separately.",
                                            )
                                          ) {
                                            return;
                                          }
                                          cancelMutation.mutate(row.id);
                                        }}
                                      >
                                        <Ban className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : null}
                                </div>
                              </div>

                              {showLocalSales &&
                              !seatingEnabled &&
                              canCancel ? (
                                <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                                  <p className="text-xs text-muted-foreground">
                                    Record walk-in / box-office sales for this
                                    show. Online buyers see the remaining count.
                                  </p>
                                  {(row.inventories ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      No ticket types on this show.
                                    </p>
                                  ) : (
                                    (row.inventories ?? []).map((inv) => {
                                      const remaining = Math.max(
                                        0,
                                        inv.quantityTotal - inv.quantitySold,
                                      );
                                      const local = inv.quantityOfflineSold ?? 0;
                                      return (
                                        <div
                                          key={inv.id}
                                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-3 py-2"
                                        >
                                          <div>
                                            <p className="text-sm font-medium">
                                              {inv.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {inv.quantitySold}/
                                              {inv.quantityTotal} sold · {local}{" "}
                                              local · {remaining} left
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="outline"
                                              className="h-8 w-8"
                                              disabled={busy || local <= 0}
                                              aria-label={`Release one ${inv.name} local sale`}
                                              onClick={() =>
                                                offlineSalesMutation.mutate({
                                                  occurrenceId: row.id,
                                                  inventoryId: inv.id,
                                                  delta: -1,
                                                })
                                              }
                                            >
                                              <Minus className="h-3.5 w-3.5" />
                                            </Button>
                                            <span className="min-w-8 text-center text-sm tabular-nums">
                                              {local}
                                            </span>
                                            <Button
                                              type="button"
                                              size="icon"
                                              variant="outline"
                                              className="h-8 w-8"
                                              disabled={busy || remaining <= 0}
                                              aria-label={`Mark one ${inv.name} sold locally`}
                                              onClick={() =>
                                                offlineSalesMutation.mutate({
                                                  occurrenceId: row.id,
                                                  inventoryId: inv.id,
                                                  delta: 1,
                                                })
                                              }
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>

                {!day?.closed ? (
                  <div className="rounded-lg border border-border bg-muted/10 p-4">
                    <h3 className="mb-3 text-sm font-semibold">Add show</h3>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
                      <div className="space-y-1.5">
                        <Label htmlFor="add-slot-name">Name</Label>
                        <Input
                          id="add-slot-name"
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          placeholder="Evening Show"
                          className="bg-input/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Start</Label>
                        <TimePicker
                          value={addStartTime}
                          onChange={setAddStartTime}
                          className="w-full sm:w-32"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>End</Label>
                        <TimePicker
                          value={addEndTime}
                          onChange={setAddEndTime}
                          className="w-full sm:w-32"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          disabled={
                            busy ||
                            !addName.trim() ||
                            !addStartTime ||
                            !addEndTime
                          }
                          onClick={() => addMutation.mutate()}
                        >
                          {addMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Add
                        </Button>
                      </div>
                    </div>
                    {(day?.templateSlots?.length ?? 0) > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day!.templateSlots.map((slot) => (
                          <Button
                            key={`${slot.name}-${slot.startTime}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setAddName(slot.name);
                              setAddStartTime(slot.startTime);
                              setAddEndTime(slot.endTime);
                            }}
                          >
                            Use {slot.name} ({slot.startTime}–{slot.endTime})
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function formatShowTime(iso: string, timeZone?: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    });
  } catch {
    return iso;
  }
}

function formatLocalTime(iso: string, timeZone?: string) {
  try {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...(timeZone ? { timeZone } : {}),
    });
  } catch {
    return "";
  }
}
