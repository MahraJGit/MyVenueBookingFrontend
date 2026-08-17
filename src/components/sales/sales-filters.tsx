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
import {
  dashboardDropdownContentClass,
  dashboardSelectTriggerClass,
} from "@/components/dashboard/dashboard-ui";
import { listVendorDirectory } from "@/features/vendor/api";
import { listManagedVenues } from "@/features/venues/api";
import { listManagedMarketplaceServices } from "@/features/marketplace/api";
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
  width = "sm:w-[200px]",
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
      <SelectTrigger className={cn("w-full", width, dashboardSelectTriggerClass)}>
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
      width="sm:w-[200px]"
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

export { SalesSelectFilter };
