"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardCardClass,
  dashboardDropdownContentClass,
  dashboardInputClass,
  dashboardSelectTriggerClass,
  dashboardTabsListClass,
} from "@/components/dashboard/dashboard-ui";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function LocationsAdminPage() {
  const t = useTranslations("adminDashboard");
  const tForms = useTranslations("forms");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [selectedCountryCode, setSelectedCountryCode] = useState("AE");
  const [cityName, setCityName] = useState("");
  const [cityTimezone, setCityTimezone] = useState("Asia/Dubai");
  const [countrySearch, setCountrySearch] = useState("");

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
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Search countries..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className={inputClass}
                  />
                  {loadingCountries ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    countries
                      .filter(
                        (country) =>
                          !countrySearch.trim() ||
                          country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                          country.code.toLowerCase().includes(countrySearch.toLowerCase()),
                      )
                      .map((country) => (
                      <div
                        key={country.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {country.name} ({country.code})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {country.defaultTimezone ?? "No default timezone"}
                          </p>
                        </div>
                        <Switch
                          checked={country.isActive}
                          disabled={toggleCountryMut.isPending}
                          onCheckedChange={(checked) =>
                            toggleCountryMut.mutate({ id: country.id, isActive: checked })
                          }
                        />
                      </div>
                    ))
                  )}
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
                    <Select
                      value={selectedCountryCode}
                      onValueChange={setSelectedCountryCode}
                    >
                      <SelectTrigger id="country-code" className={selectTriggerClass}>
                        <SelectValue placeholder={tForms("country")} />
                      </SelectTrigger>
                      <SelectContent className={dashboardDropdownContentClass}>
                        {countries
                          .filter((country) => country.isActive)
                          .map((country) => (
                            <SelectItem key={country.id} value={country.code}>
                              {country.name} ({country.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                      <Select value={cityTimezone} onValueChange={setCityTimezone}>
                        <SelectTrigger id="city-timezone" className={selectTriggerClass}>
                          <SelectValue placeholder={tForms("timezone")} />
                        </SelectTrigger>
                        <SelectContent className={cn(dashboardDropdownContentClass, "max-h-72")}>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {formatTimezoneLabel(tz)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                <CardContent className="space-y-3">
                  {loadingCities ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : cities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No featured cities yet.</p>
                  ) : (
                    cities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">{city.name}</p>
                          <p className="text-xs text-muted-foreground">{city.timezone ?? "—"}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive"
                          disabled={deleteCityMut.isPending}
                          onClick={() => deleteCityMut.mutate(city.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DashboardPanel>
      </DashboardPageShell>
    </RoleGuard>
  );
}
