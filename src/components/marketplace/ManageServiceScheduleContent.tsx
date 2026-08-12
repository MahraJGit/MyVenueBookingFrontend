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
  Plus,
  Settings2,
  Store,
  Trash2,
  Unlock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { TimePicker } from "@/components/ui/date-time-picker";
import {
  VenueScheduleEditor,
  type ScheduleRow,
} from "@/components/venues/VenueScheduleEditor";
import {
  addServiceBlock,
  cancelServiceBooking,
  checkServiceAvailability,
  createServiceOfflineBooking,
  getManagedMarketplaceService,
  listManagedServiceSlots,
  listServiceBlocks,
  listServiceBookings,
  listServiceSchedules,
  removeServiceBlock,
  replaceServiceSchedules,
  updateMarketplaceService,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type {
  ServiceBooking,
  ServiceSlot,
  ServiceSlotTemplate,
} from "@/features/marketplace/types";
import {
  defaultWeeklyServiceSchedules,
  formatDateKey,
  formatSlotLabel,
  monthRangeKeys,
  slotDateKey,
} from "@/features/marketplace/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { useDayNames } from "@/features/i18n/use-day-names";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { validateNamedSlotsAgainstSchedules } from "@/features/venues/pricing-validation";
import { getDateFnsLocale } from "@/lib/date-locale";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

type SlotTemplateDraft = ServiceSlotTemplate & { localId: string };

function newTemplateDraft(
  partial?: Partial<ServiceSlotTemplate>,
): SlotTemplateDraft {
  return {
    localId: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: partial?.name ?? "",
    startTime: partial?.startTime ?? "09:00",
    endTime: partial?.endTime ?? "11:00",
  };
}

function parseDateKeyLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function bookingOnDate(booking: ServiceBooking, dateKey: string): boolean {
  const start = String(booking.startDate).slice(0, 10);
  const end = String(booking.endDate).slice(0, 10);
  return start <= dateKey && end >= dateKey;
}

function bookingLabel(booking: ServiceBooking): string {
  if (booking.guestName?.trim()) return booking.guestName.trim();
  const buyer = booking.buyer;
  if (buyer?.firstName || buyer?.lastName) {
    return [buyer.firstName, buyer.lastName].filter(Boolean).join(" ");
  }
  return booking.buyerId?.slice(0, 8) ?? booking.id.slice(0, 8);
}

function isOfflineBooking(booking: ServiceBooking): boolean {
  return booking.source === "OFFLINE";
}

function bookingMatchesSlot(
  booking: ServiceBooking,
  slot: ServiceSlot,
): boolean {
  if (booking.slotKey && slot.slotKey) {
    return booking.slotKey === slot.slotKey;
  }
  if (booking.slotId && slot.id) {
    return booking.slotId === slot.id;
  }
  return false;
}

export function ManageServiceScheduleContent() {
  const params = useParams();
  const serviceId = String(params?.id ?? "");
  const paths = useDashboardPaths();
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const dayNames = useDayNames();
  const queryClient = useQueryClient();
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);

  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = React.useState(() =>
    formatDateKey(new Date()),
  );
  const [showSettings, setShowSettings] = React.useState(false);
  const [schedules, setSchedules] = React.useState<ScheduleRow[]>(
    defaultWeeklyServiceSchedules(),
  );
  const [slotTemplates, setSlotTemplates] = React.useState<SlotTemplateDraft[]>(
    [],
  );
  const [localFormKey, setLocalFormKey] = React.useState<string | null>(null);
  const [guestName, setGuestName] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [note, setNote] = React.useState("");

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;
  const range = monthRangeKeys(year, monthNum);

  const serviceQuery = useQuery({
    queryKey: marketplaceKeys.managedDetail(serviceId),
    queryFn: () => getManagedMarketplaceService(serviceId),
    enabled: Boolean(serviceId),
  });

  const isSlotMode = serviceQuery.data?.bookingMode === "SLOT";

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

  const availabilityQuery = useQuery({
    queryKey: marketplaceKeys.availability(
      serviceId,
      range.startDate,
      range.endDate,
    ),
    queryFn: () =>
      checkServiceAvailability(serviceId, range.startDate, range.endDate),
    enabled: Boolean(serviceId),
  });

  const slotsQuery = useQuery({
    queryKey: marketplaceKeys.slots(serviceId, {
      ...range,
      managed: true,
    }),
    queryFn: () =>
      listManagedServiceSlots(serviceId, {
        startDate: range.startDate,
        endDate: range.endDate,
      }),
    enabled: Boolean(serviceId) && isSlotMode,
  });

  const bookingsQuery = useQuery({
    queryKey: marketplaceKeys.bookings(undefined, {
      scope: "vendor",
      serviceId,
      limit: 100,
    }),
    queryFn: () =>
      listServiceBookings({
        scope: "vendor",
        limit: 100,
      }),
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

  React.useEffect(() => {
    const templates = serviceQuery.data?.slotTemplates;
    if (!templates) return;
    setSlotTemplates(
      templates.map((tpl) =>
        newTemplateDraft({
          name: tpl.name ?? "",
          startTime: tpl.startTime || "09:00",
          endTime: tpl.endTime || "11:00",
        }),
      ),
    );
  }, [serviceQuery.data?.slotTemplates]);

  const blockByDate = React.useMemo(() => {
    const map = new Map<string, { id: string; reason?: string | null }>();
    for (const block of blocksQuery.data ?? []) {
      if (!block.isBlocked) continue;
      map.set(String(block.blockDate).slice(0, 10), {
        id: block.id,
        reason: block.reason,
      });
    }
    return map;
  }, [blocksQuery.data]);

  const openByWeekday = React.useMemo(() => {
    const map = new Map<number, ScheduleRow>();
    for (const row of schedules) {
      map.set(row.dayOfWeek, row);
    }
    return map;
  }, [schedules]);

  const dayAvailability = React.useMemo(() => {
    const map = new Map<
      string,
      { available: boolean; remaining?: number; booked?: number }
    >();
    for (const day of availabilityQuery.data?.days ?? []) {
      map.set(day.date, {
        available: day.available,
        remaining: day.remaining,
        booked: day.booked,
      });
    }
    return map;
  }, [availabilityQuery.data?.days]);

  const daySlots = React.useMemo(() => {
    if (!isSlotMode) return [] as ServiceSlot[];
    return (slotsQuery.data ?? [])
      .filter((slot) => slotDateKey(slot.startAt) === selectedDate)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [isSlotMode, slotsQuery.data, selectedDate]);

  const dayBookings = React.useMemo(() => {
    return (bookingsQuery.data?.items ?? []).filter(
      (b) =>
        b.serviceId === serviceId &&
        bookingOnDate(b, selectedDate) &&
        b.status !== "CANCELLED" &&
        b.status !== "EXPIRED",
    );
  }, [bookingsQuery.data?.items, serviceId, selectedDate]);

  const selectedBlocked = blockByDate.get(selectedDate);
  const selectedWeekday = parseDateKeyLocal(selectedDate).getDay();
  const selectedSchedule = openByWeekday.get(selectedWeekday);
  const scheduleClosed = selectedSchedule
    ? selectedSchedule.isOpen !== true
    : false;
  const dayClosed = Boolean(selectedBlocked) || scheduleClosed;

  const invalidateSchedule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: marketplaceKeys.blocks(serviceId),
      }),
      queryClient.invalidateQueries({
        queryKey: [...marketplaceKeys.all, "availability", serviceId],
      }),
      queryClient.invalidateQueries({
        queryKey: [...marketplaceKeys.all, "slots", serviceId],
      }),
      queryClient.invalidateQueries({
        queryKey: [...marketplaceKeys.all, "bookings"],
      }),
    ]);
  };

  const closeDayMut = useMutation({
    mutationFn: async () => {
      if (selectedBlocked) return selectedBlocked;
      return addServiceBlock(serviceId, {
        blockDate: selectedDate,
        reason: t("closedForBookings"),
        customOpenTime: "00:00",
        customCloseTime: "23:59",
        isBlocked: true,
      });
    },
    onSuccess: async () => {
      toast.success(t("dayClosed"));
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e),
  });

  const openDayMut = useMutation({
    mutationFn: async () => {
      if (!selectedBlocked) return;
      await removeServiceBlock(serviceId, selectedBlocked.id);
    },
    onSuccess: async () => {
      toast.success(t("dayOpened"));
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e),
  });

  const offlineMut = useMutation({
    mutationFn: async () => {
      if (isSlotMode) {
        if (!localFormKey || localFormKey === "DATE") {
          throw new Error(t("localSlotRequired"));
        }
        return createServiceOfflineBooking(serviceId, {
          slotKey: localFormKey,
          guestName: guestName.trim() || null,
          guestPhone: guestPhone.trim() || null,
          specialRequests: note.trim() || null,
        });
      }
      return createServiceOfflineBooking(serviceId, {
        date: selectedDate,
        guestName: guestName.trim() || null,
        guestPhone: guestPhone.trim() || null,
        specialRequests: note.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success(t("localBookingSaved"));
      setLocalFormKey(null);
      setGuestName("");
      setGuestPhone("");
      setNote("");
      await invalidateSchedule();
    },
    onError: (e) => {
      if (e instanceof Error && e.message === t("localSlotRequired")) {
        toast.error(e.message);
        return;
      }
      toastApiError(e);
    },
  });

  const cancelLocalMut = useMutation({
    mutationFn: (bookingId: string) => cancelServiceBooking(bookingId),
    onSuccess: async () => {
      toast.success(t("localBookingCancelled"));
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e),
  });

  const saveSchedulesMut = useMutation({
    mutationFn: () => {
      if (isSlotMode && slotTemplates.length > 0) {
        const scheduleError = validateNamedSlotsAgainstSchedules(
          slotTemplates.map((tpl) => ({
            name: tpl.name ?? undefined,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
          })),
          schedules,
          t,
          dayNames,
        );
        if (scheduleError) {
          throw new Error(scheduleError);
        }
      }
      return replaceServiceSchedules(serviceId, {
        schedules: schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          openTime: s.openTime,
          closeTime: s.closeTime,
          isOpen: s.isOpen,
        })),
      });
    },
    onSuccess: async () => {
      toast.success(t("scheduleSaved"));
      await queryClient.invalidateQueries({
        queryKey: marketplaceKeys.schedules(serviceId),
      });
      await invalidateSchedule();
    },
    onError: (e) => {
      if (e instanceof Error) {
        toast.error(e.message);
        return;
      }
      toastApiError(e);
    },
  });

  const saveTemplatesMut = useMutation({
    mutationFn: () => {
      if (slotTemplates.some((tpl) => !(tpl.endTime > tpl.startTime))) {
        throw new Error(t("slotTimesInvalid"));
      }
      if (!schedules.some((s) => s.isOpen)) {
        throw new Error(t("scheduleOpenDayRequired"));
      }
      if (slotTemplates.length < 1) {
        throw new Error(t("slotsRequiredBeforeSubmit"));
      }
      const scheduleError = validateNamedSlotsAgainstSchedules(
        slotTemplates.map((tpl) => ({
          name: tpl.name ?? undefined,
          startTime: tpl.startTime,
          endTime: tpl.endTime,
        })),
        schedules,
        t,
        dayNames,
      );
      if (scheduleError) {
        throw new Error(scheduleError);
      }
      return updateMarketplaceService(serviceId, {
        slotTemplates: slotTemplates.map((tpl) => ({
          name: tpl.name?.trim() || null,
          startTime: tpl.startTime,
          endTime: tpl.endTime,
        })),
      });
    },
    onSuccess: async () => {
      toast.success(t("templatesSaved"));
      await queryClient.invalidateQueries({
        queryKey: marketplaceKeys.managedDetail(serviceId),
      });
      await invalidateSchedule();
    },
    onError: (e) => {
      if (e instanceof Error) {
        toast.error(e.message);
        return;
      }
      toastApiError(e);
    },
  });

  const busy =
    closeDayMut.isPending ||
    openDayMut.isPending ||
    offlineMut.isPending ||
    cancelLocalMut.isPending ||
    saveSchedulesMut.isPending ||
    saveTemplatesMut.isPending;

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

  const availInfo = dayAvailability.get(selectedDate);
  const dayStatusText = (() => {
    if (selectedBlocked) {
      return selectedBlocked.reason?.trim() || t("dayClosedHint");
    }
    if (scheduleClosed) {
      return t("closedByWeeklySchedule");
    }
    if (isSlotMode) {
      const availableCount = daySlots.filter((s) => s.available !== false).length;
      return selectedSchedule?.isOpen
        ? t("dayOpenWithSlots", {
            open: selectedSchedule.openTime,
            close: selectedSchedule.closeTime,
            count: availableCount,
          })
        : t("noAvailabilityDay");
    }
    if (availInfo) {
      return availInfo.available
        ? t("dayOpenWithCapacity", {
            remaining: availInfo.remaining ?? 0,
            booked: availInfo.booked ?? 0,
          })
        : t("dayFullyBooked");
    }
    return selectedSchedule?.isOpen
      ? t("dayOpenHours", {
          open: selectedSchedule.openTime,
          close: selectedSchedule.closeTime,
        })
      : t("noAvailabilityDay");
  })();

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("scheduleTitle", { title: serviceQuery.data.title })}
          description={
            isSlotMode ? t("scheduleOpsDescSlot") : t("scheduleOpsDesc")
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSettings((v) => !v)}
              >
                <Settings2 className="mr-1.5 h-4 w-4" />
                {showSettings ? t("hideHoursSettings") : t("manageHoursSettings")}
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={paths.marketplace}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  {t("backToServices")}
                </Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-lg border border-border bg-card p-3">
            {availabilityQuery.isLoading ||
            (isSlotMode && slotsQuery.isLoading) ? (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Calendar
                mode="single"
                locale={dateFnsLocale}
                month={month}
                onMonthChange={setMonth}
                selected={parseDateKeyLocal(selectedDate)}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(formatDateKey(date));
                }}
                modifiers={{
                  hasShows: (date) => {
                    const key = formatDateKey(date);
                    if (blockByDate.has(key)) return false;
                    if (isSlotMode) {
                      return (slotsQuery.data ?? []).some(
                        (slot) =>
                          slotDateKey(slot.startAt) === key &&
                          slot.available !== false,
                      );
                    }
                    return dayAvailability.get(key)?.available === true;
                  },
                  closed: (date) => {
                    const key = formatDateKey(date);
                    if (blockByDate.has(key)) return true;
                    const row = openByWeekday.get(date.getDay());
                    return row ? row.isOpen !== true : false;
                  },
                }}
                modifiersClassNames={{
                  hasShows: "font-semibold text-foreground",
                  closed: "text-destructive/80 line-through",
                }}
                className="w-full"
              />
            )}
            <p className="mt-3 px-2 text-xs text-muted-foreground">
              {t("scheduleCalendarHint")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {selectedDate}
                </h2>
                <p className="text-sm text-muted-foreground">{dayStatusText}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedBlocked ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || scheduleClosed}
                    onClick={() => openDayMut.mutate()}
                  >
                    {openDayMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Unlock className="mr-2 h-4 w-4" />
                    )}
                    {t("openDay")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || scheduleClosed}
                    onClick={() => {
                      if (!confirm(t("closeDayConfirm"))) return;
                      closeDayMut.mutate();
                    }}
                  >
                    {closeDayMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="mr-2 h-4 w-4" />
                    )}
                    {t("closeDay")}
                  </Button>
                )}
              </div>
            </div>

            {scheduleClosed ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                {t("closedByWeeklyScheduleHelp")}
              </div>
            ) : null}

            {isSlotMode ? (
              <ul className="space-y-2">
                {daySlots.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {t("noSlotsOnDay")}
                  </li>
                ) : (
                  daySlots.map((slot) => {
                    const key = slot.slotKey ?? slot.id;
                    const booking =
                      dayBookings.find((b) => bookingMatchesSlot(b, slot)) ??
                      null;
                    const isLocalForm = localFormKey === key;
                    const label = formatSlotLabel(
                      slot.startAt,
                      slot.endAt,
                      slot.label,
                    );
                    return (
                      <li
                        key={key}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.startTime && slot.endTime
                                ? `${slot.startTime} – ${slot.endTime}`
                                : null}
                              {booking
                                ? ` · ${
                                    isOfflineBooking(booking)
                                      ? t("localSource")
                                      : t("onlineSource")
                                  }: ${bookingLabel(booking)}`
                                : slot.available === false
                                  ? ` · ${t("slotUnavailable")}`
                                  : ` · ${t("slotAvailable")}`}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!dayClosed &&
                            !booking &&
                            slot.available !== false ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  setLocalFormKey(key);
                                  setGuestName("");
                                  setGuestPhone("");
                                  setNote("");
                                }}
                              >
                                <Store className="mr-1.5 h-3.5 w-3.5" />
                                {t("markLocalBooking")}
                              </Button>
                            ) : null}
                            {booking && isOfflineBooking(booking) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  if (!confirm(t("cancelLocalConfirm"))) return;
                                  cancelLocalMut.mutate(booking.id);
                                }}
                              >
                                {t("cancelLocal")}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {isLocalForm ? (
                          <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor={`local-name-${key}`}>
                                {t("localGuestName")}
                              </Label>
                              <Input
                                id={`local-name-${key}`}
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder={t("optional")}
                                className={dashboardInputClass}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`local-phone-${key}`}>
                                {t("localGuestPhone")}
                              </Label>
                              <Input
                                id={`local-phone-${key}`}
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder={t("optional")}
                                className={dashboardInputClass}
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor={`local-note-${key}`}>
                                {t("localNote")}
                              </Label>
                              <Input
                                id={`local-note-${key}`}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder={t("optional")}
                                className={dashboardInputClass}
                              />
                            </div>
                            <div className="flex gap-2 sm:col-span-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy}
                                onClick={() => offlineMut.mutate()}
                              >
                                {offlineMut.isPending ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                {t("saveLocalBooking")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocalFormKey(null)}
                              >
                                {tCommon("cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p>
                      {dayClosed
                        ? t("dayClosedHint")
                        : availInfo?.available
                          ? t("dayOpenWithCapacity", {
                              remaining: availInfo.remaining ?? 0,
                              booked: availInfo.booked ?? 0,
                            })
                          : t("dayFullyBooked")}
                    </p>
                    {!dayClosed && availInfo?.available ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          setLocalFormKey("DATE");
                          setGuestName("");
                          setGuestPhone("");
                          setNote("");
                        }}
                      >
                        <Store className="mr-1.5 h-3.5 w-3.5" />
                        {t("markLocalBooking")}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {localFormKey === "DATE" ? (
                  <div className="grid gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="local-name-date">{t("localGuestName")}</Label>
                      <Input
                        id="local-name-date"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder={t("optional")}
                        className={dashboardInputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="local-phone-date">
                        {t("localGuestPhone")}
                      </Label>
                      <Input
                        id="local-phone-date"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder={t("optional")}
                        className={dashboardInputClass}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="local-note-date">{t("localNote")}</Label>
                      <Input
                        id="local-note-date"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("optional")}
                        className={dashboardInputClass}
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => offlineMut.mutate()}
                      >
                        {offlineMut.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {t("saveLocalBooking")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocalFormKey(null)}
                      >
                        {tCommon("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t("dayBookings")}</h3>
              {bookingsQuery.isLoading ? (
                <div className="flex h-20 items-center justify-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : dayBookings.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("noBookingsOnDay")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {dayBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="rounded-lg border border-border bg-card px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {isOfflineBooking(booking)
                              ? t("localSource")
                              : t("onlineSource")}{" "}
                            · {bookingLabel(booking)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.slotKey
                              ? `${booking.slotKey} · `
                              : booking.slot
                                ? `${formatSlotLabel(
                                    booking.slot.startAt,
                                    booking.slot.endAt,
                                    booking.slot.label,
                                  )} · `
                                : ""}
                            {String(booking.status)}
                            {booking.totalAmount != null
                              ? ` · ${booking.totalAmount} ${booking.currency}`
                              : ""}
                          </p>
                        </div>
                        {isOfflineBooking(booking) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              if (!confirm(t("cancelLocalConfirm"))) return;
                              cancelLocalMut.mutate(booking.id);
                            }}
                          >
                            {t("cancelLocal")}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {showSettings ? (
          <div className="mt-8 space-y-6 border-t border-border pt-6">
            <div>
              <h2 className="text-lg font-semibold">{t("hoursAndTemplates")}</h2>
              <p className="text-sm text-muted-foreground">
                {isSlotMode
                  ? t("hoursAndTemplatesDescSlot")
                  : t("hoursAndTemplatesDesc")}
              </p>
            </div>

            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle>{t("weeklyHours")}</CardTitle>
                <CardDescription>
                  {isSlotMode
                    ? t("weeklyHoursSlotHint")
                    : t("weeklyHoursDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VenueScheduleEditor
                  schedules={schedules}
                  onChange={setSchedules}
                />
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

            {isSlotMode ? (
              <Card className={dashboardCardClass}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle>{t("manageSlots")}</CardTitle>
                    <CardDescription>{t("manageSlotsDesc")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSlotTemplates((prev) => [...prev, newTemplateDraft()])
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("addSlot")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {slotTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noSlots")}</p>
                  ) : (
                    <ul className="space-y-3">
                      {slotTemplates.map((tpl, idx) => (
                        <li
                          key={tpl.localId}
                          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(10.5rem,12rem)_minmax(10.5rem,12rem)_auto]"
                        >
                          <div className="space-y-2">
                            <Label>{t("slotLabel")}</Label>
                            <Input
                              className={dashboardInputClass}
                              value={tpl.name ?? ""}
                              onChange={(e) =>
                                setSlotTemplates((prev) =>
                                  prev.map((row, i) =>
                                    i === idx
                                      ? { ...row, name: e.target.value }
                                      : row,
                                  ),
                                )
                              }
                              placeholder={t("slotLabelPlaceholder")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("slotStartTime")}</Label>
                            <TimePicker
                              value={tpl.startTime}
                              onChange={(startTime) =>
                                setSlotTemplates((prev) =>
                                  prev.map((row, i) =>
                                    i === idx ? { ...row, startTime } : row,
                                  ),
                                )
                              }
                              triggerClassName={cn(
                                dashboardInputClass,
                                "h-9 w-full min-w-[10.5rem]",
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("slotEndTime")}</Label>
                            <TimePicker
                              value={tpl.endTime}
                              onChange={(endTime) =>
                                setSlotTemplates((prev) =>
                                  prev.map((row, i) =>
                                    i === idx ? { ...row, endTime } : row,
                                  ),
                                )
                              }
                              triggerClassName={cn(
                                dashboardInputClass,
                                "h-9 w-full min-w-[10.5rem]",
                              )}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              aria-label={tCommon("remove")}
                              onClick={() =>
                                setSlotTemplates((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("slotWithinHoursHint")}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      disabled={saveTemplatesMut.isPending}
                      onClick={() => saveTemplatesMut.mutate()}
                    >
                      {saveTemplatesMut.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("saveTemplates")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </DashboardPanel>
    </DashboardPageShell>
  );
}
