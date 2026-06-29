"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowUpDown, CalendarDays, Loader2 } from "lucide-react";
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import {
  UserBookingsEmptyState,
  UserBookingsList,
} from "@/components/bookings/UserBookingsList";
import {
  type BookingSortOption,
  type BookingTabValue,
  countBookingsByTab,
  filterBookingsByTab,
  sortBookings,
} from "@/components/bookings/user-booking-utils";
import { Button } from "@/components/ui/button";
import {
  DashboardContentPanel,
  dashboardFilterBarBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
} from "@/components/userDashboard/DashboardScrollableTabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listBookings } from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { toastApiError } from "@/lib/toasts";

const TAB_VALUES: BookingTabValue[] = ["all", "HOLD", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function UserBookingsPage() {
  const t = useTranslations("userDashboard");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<BookingTabValue>("all");
  const [sortBy, setSortBy] = useState<BookingSortOption>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: bookingKeys.list({ scope: "buyer" }),
    queryFn: () => listBookings({ limit: 50 }),
  });

  const bookings = data?.data ?? [];

  const counts = useMemo(() => countBookingsByTab(bookings), [bookings]);

  const filteredBookings = useMemo(() => {
    const byTab = filterBookingsByTab(bookings, activeTab);
    return sortBookings(byTab, sortBy);
  }, [bookings, activeTab, sortBy]);

  const tabLabel = (value: BookingTabValue) => {
    if (value === "all") return t("tabAll", { count: counts.all });
    if (value === "HOLD") return `${t("onHold")} (${counts.HOLD ?? 0})`;
    if (value === "CONFIRMED") return `${tBooking("confirmed")} (${counts.CONFIRMED ?? 0})`;
    if (value === "CANCELLED") return `${tBooking("cancelled")} (${counts.CANCELLED ?? 0})`;
    return `${tBooking("completed")} (${counts.COMPLETED ?? 0})`;
  };

  const sortLabel =
    sortBy === "newest"
      ? t("newestFirst")
      : sortBy === "oldest"
        ? t("oldestFirst")
        : sortBy === "amount-high"
          ? t("highestAmount")
          : t("lowestAmount");

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadBookingsToast"));
  }, [isError, error, t]);

  return (
    <DashboardContentPanel>
      <DashboardFilterBar
        className={dashboardFilterBarBorderClass}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground sm:w-auto">
                {sortLabel}
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-[#242424] bg-[#151515]">
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                {t("newestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                {t("oldestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-high")}>
                {t("highestAmount")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-low")}>
                {t("lowestAmount")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setSelectedId(null);
          }}
          items={TAB_VALUES.map((value) => ({
            value,
            label: tabLabel(value),
          }))}
        />
      </DashboardFilterBar>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{t("loadingBookings")}</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("couldNotLoadBookings")}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            {tCommon("tryAgain")}
          </Button>
        </div>
      ) : bookings.length === 0 ? (
        <UserBookingsEmptyState tab="all" />
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("noBookingsMatchFilter")}</p>
          <Button variant="outline" onClick={() => setActiveTab("all")}>
            {t("showAllBookings")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-5">
          <div className={selectedId ? "xl:col-span-2" : "xl:col-span-5"}>
            <UserBookingsList
              bookings={filteredBookings}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>

          {selectedId ? (
            <div className="xl:col-span-3">
              <BookingDetailPanel
                bookingId={selectedId}
                onClose={() => setSelectedId(null)}
                allowReschedule
                allowCancel
                variant="user"
              />
            </div>
          ) : (
            <div className="hidden xl:flex xl:col-span-3">
              <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#242424] bg-[#151515]">
                <div className="py-16 text-center">
                  <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    {t("selectBookingDetails")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("selectBookingHint")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardContentPanel>
  );
}
