"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker, parseDateValue } from "@/components/ui/date-time-picker";
import {
  dashboardDropdownContentClass,
  dashboardSelectTriggerClass,
} from "@/components/dashboard/dashboard-ui";
import { listVendorDirectory } from "@/features/vendor/api";
import { listManagedVenues } from "@/features/venues/api";
import { listManagedMarketplaceServices } from "@/features/marketplace/api";
import {
  isSalesPeriodPreset,
  type SalesPeriodPreset,
} from "@/features/sales/sales-period";
import { cn } from "@/lib/utils";

export const SALES_FILTER_ALL = "ALL";

const OPTION_LIMIT = 100;

export type SalesFilterOption = { value: string; label: string };

/** Maps the `ALL` sentinel used by selects to the empty value the APIs expect. */
export function fromSalesFilterValue(value: string) {
  return value === SALES_FILTER_ALL ? "" : value;
}

export function toSalesFilterValue(value: string) {
  return value ? value : SALES_FILTER_ALL;
}

function SalesSelectFilter({
  value,
  onChange,
  options,
  allLabel,
  placeholder,
  width = "w-full",
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SalesFilterOption[];
  allLabel: string;
  placeholder: string;
  width?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      value={toSalesFilterValue(value)}
      onValueChange={(next) => onChange(fromSalesFilterValue(next))}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("h-9 w-full min-w-0", dashboardSelectTriggerClass, width)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={dashboardDropdownContentClass}>
        <SelectItem value={SALES_FILTER_ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SalesVendorFilter({
  value,
  onChange,
  enabled = true,
}: {
  value: string;
  onChange: (vendorId: string) => void;
  enabled?: boolean;
}) {
  const t = useTranslations("salesFilters");

  const { data } = useQuery({
    queryKey: ["sales-filters", "vendors"],
    queryFn: () =>
      listVendorDirectory({ limit: OPTION_LIMIT, sortBy: "vendorName", sortOrder: "asc" }),
    enabled,
    staleTime: 5 * 60_000,
  });

  const options = useMemo<SalesFilterOption[]>(
    () =>
      (data?.data ?? []).map((vendor) => ({
        value: vendor.id,
        label: vendor.vendorName,
      })),
    [data?.data],
  );

  if (!enabled) return null;

  return (
    <SalesSelectFilter
      value={value}
      onChange={onChange}
      options={options}
      allLabel={t("allVendors")}
      placeholder={t("vendor")}
      width="w-full"
    />
  );
}

export function SalesVenueFilter({
  value,
  onChange,
  scope,
}: {
  value: string;
  onChange: (venueId: string) => void;
  scope: "platform" | "workspace";
}) {
  const t = useTranslations("salesFilters");

  const { data } = useQuery({
    queryKey: ["sales-filters", "venues", scope],
    queryFn: () =>
      listManagedVenues({
        limit: OPTION_LIMIT,
        sortBy: "name",
        sortOrder: "asc",
        ...(scope === "platform" ? { allPlatform: true } : { vendorOnly: true }),
      }),
    staleTime: 5 * 60_000,
  });

  const options = useMemo<SalesFilterOption[]>(
    () => (data?.data ?? []).map((venue) => ({ value: venue.id, label: venue.name })),
    [data?.data],
  );

  return (
    <SalesSelectFilter
      value={value}
      onChange={onChange}
      options={options}
      allLabel={t("allVenues")}
      placeholder={t("venue")}
    />
  );
}

export function SalesServiceFilter({
  value,
  onChange,
  scope,
}: {
  value: string;
  onChange: (serviceId: string) => void;
  scope: "platform" | "workspace";
}) {
  const t = useTranslations("salesFilters");

  const { data } = useQuery({
    queryKey: ["sales-filters", "services", scope],
    queryFn: () =>
      listManagedMarketplaceServices({
        limit: OPTION_LIMIT,
        sortBy: "title",
        sortOrder: "asc",
        scope,
      }),
    staleTime: 5 * 60_000,
  });

  const options = useMemo<SalesFilterOption[]>(
    () => (data?.data ?? []).map((service) => ({ value: service.id, label: service.title })),
    [data?.data],
  );

  return (
    <SalesSelectFilter
      value={value}
      onChange={onChange}
      options={options}
      allLabel={t("allServices")}
      placeholder={t("service")}
    />
  );
}

export function SalesPeriodFilter({
  period,
  dateFrom,
  dateTo,
  onPeriodChange,
  onCustomRangeChange,
}: {
  period: string;
  dateFrom: string;
  dateTo: string;
  onPeriodChange: (period: SalesPeriodPreset) => void;
  onCustomRangeChange: (next: { dateFrom?: string; dateTo?: string }) => void;
}) {
  const t = useTranslations("salesFilters");
  const selected = isSalesPeriodPreset(period) ? period : "ALL";
  const fromDate = parseDateValue(dateFrom);
  const toDate = parseDateValue(dateTo);

  if (selected !== "CUSTOM") {
    return (
      <Select
        value={selected}
        onValueChange={(value) => {
          if (!isSalesPeriodPreset(value)) return;
          onPeriodChange(value);
        }}
      >
        <SelectTrigger
          className={cn("h-9 w-full min-w-0", dashboardSelectTriggerClass)}
        >
          <SelectValue placeholder={t("period")} />
        </SelectTrigger>
        <SelectContent className={dashboardDropdownContentClass}>
          <SelectItem value="ALL">{t("periodAll")}</SelectItem>
          <SelectItem value="WEEK">{t("periodWeek")}</SelectItem>
          <SelectItem value="MONTH">{t("periodMonth")}</SelectItem>
          <SelectItem value="LAST_30">{t("periodLast30")}</SelectItem>
          <SelectItem value="CUSTOM">{t("periodCustom")}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="col-span-full grid min-w-0 grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3">
      <Select
        value={selected}
        onValueChange={(value) => {
          if (!isSalesPeriodPreset(value)) return;
          onPeriodChange(value);
        }}
      >
        <SelectTrigger
          className={cn("h-9 w-full min-w-0", dashboardSelectTriggerClass)}
        >
          <SelectValue placeholder={t("period")} />
        </SelectTrigger>
        <SelectContent className={dashboardDropdownContentClass}>
          <SelectItem value="ALL">{t("periodAll")}</SelectItem>
          <SelectItem value="WEEK">{t("periodWeek")}</SelectItem>
          <SelectItem value="MONTH">{t("periodMonth")}</SelectItem>
          <SelectItem value="LAST_30">{t("periodLast30")}</SelectItem>
          <SelectItem value="CUSTOM">{t("periodCustom")}</SelectItem>
        </SelectContent>
      </Select>
      <DatePicker
        value={dateFrom}
        onChange={(value) => onCustomRangeChange({ dateFrom: value })}
        placeholder={t("dateFrom")}
        disabledDates={toDate ? { after: toDate } : undefined}
        className="min-w-0"
        triggerClassName={cn("h-9", dashboardSelectTriggerClass)}
      />
      <DatePicker
        value={dateTo}
        onChange={(value) => onCustomRangeChange({ dateTo: value })}
        placeholder={t("dateTo")}
        disabledDates={fromDate ? { before: fromDate } : undefined}
        className="min-w-0"
        triggerClassName={cn("h-9", dashboardSelectTriggerClass)}
      />
    </div>
  );
}

export { SalesSelectFilter };
