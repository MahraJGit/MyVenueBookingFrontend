"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  DashboardDataTable,
  DashboardSortableHeader,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardCardClass,
  dashboardDropdownContentClass,
  dashboardInputClass,
  dashboardSelectTriggerClass,
  dashboardTabsListClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
} from "@/components/dashboard/dashboard-ui";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { toastApiError } from "@/lib/toasts";
import { isBlank } from "@/lib/form-validation";
import { formatTimezoneLabel, listTimezones } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import {
  createCity,
  deleteCity,
  listCitiesByCountryCode,
  listCountries,
  updateCountry,
} from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";

const inputClass = dashboardInputClass;
const selectTriggerClass = cn("w-full", dashboardSelectTriggerClass);
const TIMEZONE_OPTIONS = listTimezones();
const TIMEZONE_SELECT_OPTIONS = TIMEZONE_OPTIONS.map((tz) => ({
  value: tz,
  label: formatTimezoneLabel(tz),
}));

export default function LocationsAdminPage() {
  const t = useTranslations("adminDashboard");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const queryClient = useQueryClient();
  const [selectedCountryCode, setSelectedCountryCode] = useState("AE");
  const [cityName, setCityName] = useState("");
  const [cityTimezone, setCityTimezone] = useState("Asia/Dubai");
  const countryTable = useTableQueryState({
    initialSortBy: "name",
    initialSortOrder: "asc",
  });
  const cityTable = useTableQueryState({
    initialSortBy: "name",
    initialSortOrder: "asc",
  });

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: locationKeys.countries(false),
    queryFn: () => listCountries(),
  });

  const { data: cities = [], isLoading: loadingCities } = useQuery({
    queryKey: locationKeys.cities(selectedCountryCode, { activeOnly: true }),
    queryFn: () => listCitiesByCountryCode(selectedCountryCode, { activeOnly: true }),
    enabled: !isBlank(selectedCountryCode),
  });

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === selectedCountryCode),
    [countries, selectedCountryCode],
  );

  const activeCountryOptions = useMemo(
    () =>
      countries
        .filter((country) => country.isActive)
        .map((country) => ({
          value: country.code,
          label: `${country.name} (${country.code})`,
        })),
    [countries],
  );
  const filteredCountries = useMemo(() => {
    const search = countryTable.debouncedSearch.toLocaleLowerCase();
    return countries
      .filter(
        (country) =>
          !search ||
          country.name.toLocaleLowerCase().includes(search) ||
          country.code.toLocaleLowerCase().includes(search),
      )
      .sort((a, b) => {
        const direction = countryTable.sortOrder === "asc" ? 1 : -1;
        return direction * a.name.localeCompare(b.name);
      });
  }, [countries, countryTable.debouncedSearch, countryTable.sortOrder]);
  const countryPagination = useClientPagination(filteredCountries, countryTable.pageSize, {
    page: countryTable.page,
    setPage: countryTable.setPage,
  });
  const filteredCities = useMemo(() => {
    const search = cityTable.debouncedSearch.toLocaleLowerCase();
    return cities
      .filter(
        (city) =>
          !search ||
          city.name.toLocaleLowerCase().includes(search) ||
          city.timezone?.toLocaleLowerCase().includes(search),
      )
      .sort((a, b) => {
        const direction = cityTable.sortOrder === "asc" ? 1 : -1;
        return direction * a.name.localeCompare(b.name);
      });
  }, [cities, cityTable.debouncedSearch, cityTable.sortOrder]);
  const cityPagination = useClientPagination(filteredCities, cityTable.pageSize, {
    page: cityTable.page,
    setPage: cityTable.setPage,
  });

  const toggleCountryMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateCountry(id, { isActive }),
    onSuccess: () => {
      toast.success("Country updated");
      queryClient.invalidateQueries({ queryKey: locationKeys.countries(false) });
      queryClient.invalidateQueries({ queryKey: locationKeys.countries(true) });
    },
    onError: (error) => toastApiError(error),
  });

  const createCityMut = useMutation({
    mutationFn: () =>
      createCity({
        countryCode: selectedCountryCode,
        name: cityName.trim(),
        timezone: cityTimezone,
        isActive: true,
        isFeatured: true,
      }),
    onSuccess: () => {
      toast.success("City created");
      setCityName("");
      setCityTimezone("Asia/Dubai");
      queryClient.invalidateQueries({
        queryKey: locationKeys.cities(selectedCountryCode, { activeOnly: true }),
      });
    },
    onError: (error) => toastApiError(error),
  });

  const deleteCityMut = useMutation({
    mutationFn: (cityId: string) => deleteCity(cityId),
    onSuccess: () => {
      toast.success("City deleted");
      queryClient.invalidateQueries({
        queryKey: locationKeys.cities(selectedCountryCode, { activeOnly: true }),
      });
    },
    onError: (error) => toastApiError(error),
  });

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <DashboardPanel>
          <DashboardPageHeader title={t("locations")} description={t("venueLocationDesc")} />

          <Tabs defaultValue="countries" className="space-y-4">
            <TabsList className={dashboardTabsListClass}>
              <TabsTrigger value="countries" className="gap-1.5">
                <Globe2 className="h-4 w-4" />
                {tForms("country")}
              </TabsTrigger>
              <TabsTrigger value="cities" className="gap-1.5">
                <MapPin className="h-4 w-4" />
                {tForms("city")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="countries" className="space-y-4">
              <Card className={dashboardCardClass}>
                <CardHeader>
                  <CardTitle>{tForms("country")}</CardTitle>
                  <CardDescription>Enable only countries you currently support.</CardDescription>
                </CardHeader>
                <CardContent>
                  <DashboardDataTable
                    toolbar={{
                      search: {
                        value: countryTable.search,
                        onChange: countryTable.setSearch,
                        placeholder: "Search countries...",
                      },
                      pageSize: {
                        value: countryTable.pageSize,
                        onChange: countryTable.setPageSize,
                      },
                      onReset: countryTable.reset,
                      showReset: countryTable.hasActiveFilters,
                    }}
                    pagination={{
                      label: formatTableRangeLabel({
                        page: countryTable.page,
                        pageSize: countryTable.pageSize,
                        total: countryPagination.total,
                        showingLabel: (values) => tTables("showing", values),
                      }),
                      page: countryTable.page,
                      totalPages: countryPagination.totalPages,
                      total: countryPagination.total,
                      onPageChange: countryTable.setPage,
                      previousLabel: tCommon("previous"),
                      nextLabel: tCommon("next"),
                      isLoading: loadingCountries,
                    }}
                  >
                    <Table
                      className={cn(dashboardTableClass, "min-w-[720px]")}
                      containerClassName={dashboardTableContainerClass}
                    >
                      <TableHeader>
                        <TableRow className={dashboardTableHeaderRowClass}>
                          <DashboardSortableHeader
                            className="min-w-[200px]"
                            label={tCommon("name")}
                            column="name"
                            sortBy={countryTable.sortBy}
                            sortOrder={countryTable.sortOrder}
                            onSort={countryTable.toggleSort}
                          />
                          <TableHead>{tForms("timezone")}</TableHead>
                          <TableHead className="text-right">{tCommon("status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingCountries ? (
                          <TableSkeleton cols={3} />
                        ) : (
                          <>
                            {countryPagination.paginatedItems.map((country) => (
                              <TableRow key={country.id} className={dashboardTableRowClass}>
                                <TableCell className="font-medium">
                                  {country.name} ({country.code})
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {country.defaultTimezone ?? "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Switch
                                    checked={country.isActive}
                                    disabled={toggleCountryMut.isPending}
                                    onCheckedChange={(checked) =>
                                      toggleCountryMut.mutate({
                                        id: country.id,
                                        isActive: checked,
                                      })
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                            {!countryPagination.paginatedItems.length ? (
                              <TableEmptyRow colSpan={3}>
                                {countryTable.debouncedSearch
                                  ? tTables("noMatch")
                                  : tTables("noData")}
                              </TableEmptyRow>
                            ) : null}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </DashboardDataTable>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cities" className="space-y-4">
              <Card className={dashboardCardClass}>
                <CardHeader>
                  <CardTitle>Featured Cities</CardTitle>
                  <CardDescription>Manage cities shown in country-specific selectors.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label={tForms("country")} htmlFor="country-code">
                    <SearchableSelect
                      value={selectedCountryCode}
                      onValueChange={(value) => {
                        setSelectedCountryCode(value);
                        cityTable.setPage(1);
                      }}
                      options={activeCountryOptions}
                      placeholder={tForms("country")}
                      searchPlaceholder="Search countries..."
                      triggerClassName={selectTriggerClass}
                      contentClassName={dashboardDropdownContentClass}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label={tForms("city")} htmlFor="city-name">
                      <Input
                        id="city-name"
                        value={cityName}
                        onChange={(e) => setCityName(e.target.value)}
                        placeholder={tForms("city")}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label={tForms("timezone")} htmlFor="city-timezone">
                      <SearchableSelect
                        value={cityTimezone}
                        onValueChange={setCityTimezone}
                        options={TIMEZONE_SELECT_OPTIONS}
                        placeholder={tForms("timezone")}
                        searchPlaceholder="Search timezones..."
                        triggerClassName={selectTriggerClass}
                        contentClassName={cn(dashboardDropdownContentClass, "max-h-80")}
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    disabled={
                      createCityMut.isPending || isBlank(cityName) || isBlank(cityTimezone)
                    }
                    onClick={() => createCityMut.mutate()}
                  >
                    {createCityMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {tCommon("add")}
                  </Button>
                </CardContent>
              </Card>

              <Card className={dashboardCardClass}>
                <CardHeader>
                  <CardTitle>
                    {selectedCountry?.name ?? selectedCountryCode} {tForms("city")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DashboardDataTable
                    toolbar={{
                      search: {
                        value: cityTable.search,
                        onChange: cityTable.setSearch,
                        placeholder: "Search cities...",
                      },
                      pageSize: {
                        value: cityTable.pageSize,
                        onChange: cityTable.setPageSize,
                      },
                      onReset: cityTable.reset,
                      showReset: cityTable.hasActiveFilters,
                    }}
                    pagination={{
                      label: formatTableRangeLabel({
                        page: cityTable.page,
                        pageSize: cityTable.pageSize,
                        total: cityPagination.total,
                        showingLabel: (values) => tTables("showing", values),
                      }),
                      page: cityTable.page,
                      totalPages: cityPagination.totalPages,
                      total: cityPagination.total,
                      onPageChange: cityTable.setPage,
                      previousLabel: tCommon("previous"),
                      nextLabel: tCommon("next"),
                      isLoading: loadingCities,
                    }}
                  >
                    <Table
                      className={cn(dashboardTableClass, "min-w-[640px]")}
                      containerClassName={dashboardTableContainerClass}
                    >
                      <TableHeader>
                        <TableRow className={dashboardTableHeaderRowClass}>
                          <DashboardSortableHeader
                            className="min-w-[180px]"
                            label={tCommon("name")}
                            column="name"
                            sortBy={cityTable.sortBy}
                            sortOrder={cityTable.sortOrder}
                            onSort={cityTable.toggleSort}
                          />
                          <TableHead>{tForms("timezone")}</TableHead>
                          <TableHead className="text-right">{tCommon("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingCities ? (
                          <TableSkeleton cols={3} />
                        ) : (
                          <>
                            {cityPagination.paginatedItems.map((city) => (
                              <TableRow key={city.id} className={dashboardTableRowClass}>
                                <TableCell className="font-medium">{city.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {city.timezone ?? "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive"
                                    disabled={deleteCityMut.isPending}
                                    onClick={() => deleteCityMut.mutate(city.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {!cityPagination.paginatedItems.length ? (
                              <TableEmptyRow colSpan={3}>
                                {cityTable.debouncedSearch
                                  ? tTables("noMatch")
                                  : tTables("noData")}
                              </TableEmptyRow>
                            ) : null}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </DashboardDataTable>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DashboardPanel>
      </DashboardPageShell>
    </RoleGuard>
  );
}
