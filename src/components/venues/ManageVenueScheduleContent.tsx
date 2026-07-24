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
  Store,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cancelBooking } from "@/features/bookings/api";
import {
  closeVenueScheduleDay,
  createVenueOfflineBooking,
  getManagedVenue,
  getMonthAvailability,
  getVenueOpsDay,
  openVenueScheduleDay,
} from "@/features/venues/api";
import type {
  AvailabilitySlot,
  MonthAvailabilityDay,
  VenueOpsDayBooking,
} from "@/features/venues/types";
import {
  formatDateKey,
  formatInVenueTimezone,
  slotRangeToUtc,
} from "@/features/venues/timezone";
import { toastApiError } from "@/lib/toasts";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getDateFnsLocale } from "@/lib/date-locale";

function parseMaxAdvanceDays(rules: unknown): number {
  if (!rules || typeof rules !== "object") return 365;
  const policy = (rules as Record<string, unknown>).bookingPolicy;
  if (!policy || typeof policy !== "object") return 365;
  const n = Number((policy as Record<string, unknown>).maxAdvanceDays);
  return Number.isFinite(n) && n > 0 ? n : 365;
}

function parseDateKeyLocal(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthPartsFromDate(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function bookingOverlapsSlot(
  booking: VenueOpsDayBooking,
  slot: AvailabilitySlot,
  date: string,
  timezone: string,
): boolean {
  const range = slotRangeToUtc(date, slot.startTime, slot.endTime, timezone);
  const slotStart = new Date(range.startTime).getTime();
  const slotEnd = new Date(range.endTime).getTime();
  const bookStart = new Date(booking.startTime).getTime();
  const bookEnd = new Date(booking.endTime).getTime();
  return bookStart < slotEnd && bookEnd > slotStart;
}

export function ManageVenueScheduleContent() {
  const params = useParams();
  const venueId = String(params?.id ?? "");
  const paths = useDashboardPaths();
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
  const [localFormSlot, setLocalFormSlot] = React.useState<AvailabilitySlot | null>(
    null,
  );
  const [guestName, setGuestName] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [note, setNote] = React.useState("");

  const { year, month: monthNum } = monthPartsFromDate(month);

  const venueQuery = useQuery({
    queryKey: ["managed-venue", venueId],
    queryFn: () => getManagedVenue(venueId),
    enabled: Boolean(venueId),
  });

  const monthQuery = useQuery({
    queryKey: ["venue-schedule-month", venueId, year, monthNum],
    queryFn: () => getMonthAvailability(venueId, year, monthNum),
    enabled: Boolean(venueId),
  });

  const dayQuery = useQuery({
    queryKey: ["venue-ops-day", venueId, selectedDate],
    queryFn: () => getVenueOpsDay(venueId, selectedDate),
    enabled: Boolean(venueId && selectedDate),
  });

  const invalidateSchedule = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["venue-schedule-month", venueId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["venue-ops-day", venueId],
      }),
      queryClient.invalidateQueries({ queryKey: ["managed-venue", venueId] }),
    ]);
  };

  const closeDayMutation = useMutation({
    mutationFn: () => closeVenueScheduleDay(venueId, selectedDate),
    onSuccess: async () => {
      toast.success("Day closed");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not close day"),
  });

  const openDayMutation = useMutation({
    mutationFn: () => openVenueScheduleDay(venueId, selectedDate),
    onSuccess: async () => {
      toast.success("Day opened");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not open day"),
  });

  const offlineMutation = useMutation({
    mutationFn: () => {
      if (!localFormSlot || !dayQuery.data) {
        throw new Error("Select a slot first");
      }
      const range = slotRangeToUtc(
        selectedDate,
        localFormSlot.startTime,
        localFormSlot.endTime,
        dayQuery.data.timezone,
      );
      return createVenueOfflineBooking(venueId, {
        startTime: range.startTime,
        endTime: range.endTime,
        guestName: guestName.trim() || null,
        guestPhone: guestPhone.trim() || null,
        specialRequests: note.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Local booking recorded");
      setLocalFormSlot(null);
      setGuestName("");
      setGuestPhone("");
      setNote("");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not record local booking"),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: async () => {
      toast.success("Local booking cancelled");
      await invalidateSchedule();
    },
    onError: (e) => toastApiError(e, "Could not cancel booking"),
  });

  const day = dayQuery.data;
  const monthDays: MonthAvailabilityDay[] = monthQuery.data ?? [];
  const dayByDate = React.useMemo(() => {
    const map = new Map<string, MonthAvailabilityDay>();
    for (const d of monthDays) map.set(d.date, d);
    return map;
  }, [monthDays]);

  const dayClosed = Boolean(day?.block?.isBlocked) || day?.reason === "BLOCKED";
  const maxAdvanceDays = parseMaxAdvanceDays(venueQuery.data?.rules);
  const isLoading = venueQuery.isLoading || monthQuery.isLoading;
  const isError = venueQuery.isError || monthQuery.isError;
  const error = venueQuery.error ?? monthQuery.error;
  const busy =
    closeDayMutation.isPending ||
    openDayMutation.isPending ||
    offlineMutation.isPending ||
    cancelMutation.isPending;

  const findBookingForSlot = (slot: AvailabilitySlot) => {
    if (!day) return undefined;
    return day.bookings.find((b) =>
      bookingOverlapsSlot(b, slot, selectedDate, day.timezone),
    );
  };

  const availableSlotCount = (day?.slots ?? []).filter((s) => s.available).length;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={
            venueQuery.data
              ? `Schedule · ${venueQuery.data.name}`
              : "Schedule"
          }
          action={
            <Button variant="outline" asChild>
              <Link href={paths.venues}>
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
              void venueQuery.refetch();
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
                locale={dateFnsLocale}
                month={month}
                onMonthChange={setMonth}
                selected={parseDateKeyLocal(selectedDate)}
                onSelect={(date) => {
                  if (!date) return;
                  setSelectedDate(formatDateKey(date));
                  setLocalFormSlot(null);
                }}
                modifiers={{
                  hasShows: (date) => {
                    const info = dayByDate.get(formatDateKey(date));
                    return Boolean(info?.available);
                  },
                  closed: (date) => {
                    const info = dayByDate.get(formatDateKey(date));
                    return Boolean(
                      info && !info.available && info.reason === "BLOCKED",
                    );
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
              Select a day to close it or record a local booking. Guests can
              book up to {maxAdvanceDays} day{maxAdvanceDays === 1 ? "" : "s"}{" "}
              ahead (same-day online booking is not allowed).
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
                  {dayClosed
                    ? "Closed — buyers will not see this day."
                    : dayByDate.get(selectedDate)?.reason === "OUT_OF_WINDOW"
                      ? "Outside guest booking window (ops can still manage)."
                      : day?.dayHours.isAvailable
                        ? `Open ${day.dayHours.openTime ?? "—"} – ${day.dayHours.closeTime ?? "—"} · ${availableSlotCount} available slot(s)`
                        : day?.reason === "CLOSED"
                          ? "Closed by weekly schedule."
                          : "No availability for this day."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dayClosed ? (
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
                          "Close this day? Buyers will not be able to book it online.",
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
                  {(day?.slots ?? []).length === 0 &&
                  (day?.bookings ?? []).length === 0 ? (
                    <li className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No slots on this day.
                    </li>
                  ) : null}

                  {(day?.slots ?? []).map((slot) => {
                    const booking = findBookingForSlot(slot);
                    const isLocalForm =
                      localFormSlot?.startTime === slot.startTime &&
                      localFormSlot?.endTime === slot.endTime;
                    const label =
                      slot.name || `${slot.startTime} – ${slot.endTime}`;

                    return (
                      <li
                        key={`${slot.startTime}-${slot.endTime}`}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.startTime} – {slot.endTime}
                              {booking
                                ? ` · ${booking.source === "OFFLINE" ? "Local" : "Online"}: ${booking.buyerLabel}`
                                : slot.available
                                  ? " · Available"
                                  : " · Unavailable"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {slot.available && !booking ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  setLocalFormSlot(slot);
                                  setGuestName("");
                                  setGuestPhone("");
                                  setNote("");
                                }}
                              >
                                <Store className="mr-1.5 h-3.5 w-3.5" />
                                Mark local booking
                              </Button>
                            ) : null}
                            {booking?.source === "OFFLINE" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    !confirm(
                                      "Cancel this local booking and free the slot?",
                                    )
                                  ) {
                                    return;
                                  }
                                  cancelMutation.mutate(booking.id);
                                }}
                              >
                                Cancel local
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        {isLocalForm ? (
                          <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor="local-guest-name">Guest name</Label>
                              <Input
                                id="local-guest-name"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Optional"
                                className="bg-input/50"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="local-guest-phone">
                                Guest phone
                              </Label>
                              <Input
                                id="local-guest-phone"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                                placeholder="Optional"
                                className="bg-input/50"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor="local-note">Note</Label>
                              <Input
                                id="local-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optional"
                                className="bg-input/50"
                              />
                            </div>
                            <div className="flex gap-2 sm:col-span-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={busy}
                                onClick={() => offlineMutation.mutate()}
                              >
                                {offlineMutation.isPending ? (
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                Save local booking
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setLocalFormSlot(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {(day?.bookings ?? []).length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Bookings this day</h3>
                    <ul className="space-y-2">
                      {day!.bookings.map((booking) => (
                        <li
                          key={booking.id}
                          className="rounded-lg border border-border bg-card px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">
                                {booking.source === "OFFLINE" ? "Local" : "Online"}{" "}
                                · {booking.buyerLabel}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatInVenueTimezone(
                                  booking.startTime,
                                  day!.timezone,
                                  locale,
                                )}{" "}
                                –{" "}
                                {formatInVenueTimezone(
                                  booking.endTime,
                                  day!.timezone,
                                  locale,
                                  { timeStyle: "short" },
                                )}
                              </p>
                            </div>
                            {booking.source === "OFFLINE" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    !confirm(
                                      "Cancel this local booking and free the slot?",
                                    )
                                  ) {
                                    return;
                                  }
                                  cancelMutation.mutate(booking.id);
                                }}
                              >
                                Cancel local
                              </Button>
                            ) : (
                              <span className="text-xs capitalize text-muted-foreground">
                                {booking.status.toLowerCase()}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
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
