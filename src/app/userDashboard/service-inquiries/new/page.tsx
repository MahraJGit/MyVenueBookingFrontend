"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-time-picker";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import {
  createServiceInquiry,
  getPublicMarketplaceService,
  getPublicMarketplaceServiceBySlug,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServicePackage } from "@/features/marketplace/types";
import {
  contactInfoBlockedMessage,
  textContainsContactInfo,
} from "@/features/marketplace/contact-guard";
import { decimalToNumber, guestBoundsError, hasGuestBounds } from "@/features/marketplace/utils";
import { listCountries } from "@/features/locations/api";
import { findActiveCountry } from "@/features/locations/match";
import { locationKeys } from "@/features/locations/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

function serviceAreaCities(service: {
  baseCity?: string | null;
  citiesServed?: string[] | null;
}): string[] {
  const names = [
    service.baseCity?.trim(),
    ...(service.citiesServed ?? []).map((c) => c.trim()),
  ].filter(Boolean) as string[];
  return [...new Set(names)];
}

function menuCompleteForPackage(
  pkg: ServicePackage | undefined,
  menuSelections: Record<string, string[]>,
): boolean {
  const rules = pkg?.menuRules ?? [];
  if (rules.length === 0) return true;
  return rules.every((rule) => {
    const selected = menuSelections[rule.course] ?? [];
    return selected.length >= rule.chooseCount;
  });
}

function NewServiceInquiryForm() {
  const t = useTranslations("userDashboard");
  const tMarketplace = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIdParam = searchParams.get("serviceId");
  const slugParam = searchParams.get("slug");
  const { isAuthenticated, isReady } = useAuth();
  const queryClient = useQueryClient();

  const serviceQuery = useQuery({
    queryKey: marketplaceKeys.publicDetail(serviceIdParam || slugParam || "none"),
    queryFn: async () => {
      if (serviceIdParam) return getPublicMarketplaceService(serviceIdParam);
      if (slugParam) return getPublicMarketplaceServiceBySlug(slugParam);
      throw new Error("Missing service");
    },
    enabled: isAuthenticated && isReady && Boolean(serviceIdParam || slugParam),
  });

  const service = serviceQuery.data;

  const packages = useMemo(
    () =>
      (service?.packages ?? []).filter(
        (p) => p.isActive !== false && Boolean(p.id),
      ),
    [service?.packages],
  );

  const addOns = useMemo(
    () =>
      (service?.addOns ?? []).filter(
        (a) => a.isActive !== false && Boolean(a.id),
      ),
    [service?.addOns],
  );

  const menuItems = useMemo(
    () =>
      (service?.menuItems ?? []).filter(
        (m) => m.isActive !== false && Boolean(m.id),
      ),
    [service?.menuItems],
  );

  const allowedCities = useMemo(
    () => (service ? serviceAreaCities(service) : []),
    [service],
  );
  const lockedCountryCode = service?.countryCode?.trim().toUpperCase() ?? "";

  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [packageId, setPackageId] = useState("");
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [menuSelections, setMenuSelections] = useState<Record<string, string[]>>(
    {},
  );
  const [hours, setHours] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [city, setCity] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!service) return;
    setCountryCode(service.countryCode?.trim().toUpperCase() ?? "");
    setCity(
      service.baseCity?.trim() || serviceAreaCities(service)[0] || "",
    );
    setPackageId("");
    setAddOnIds([]);
    setMenuSelections({});
  }, [service]);

  useEffect(() => {
    setMenuSelections({});
  }, [packageId]);

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  });

  const availableCountries = useMemo(() => {
    if (!lockedCountryCode) return countries;
    return countries.filter(
      (c) => c.code.toUpperCase() === lockedCountryCode,
    );
  }, [countries, lockedCountryCode]);

  const selectedCountry = useMemo(
    () => findActiveCountry(countries, countryCode),
    [countries, countryCode],
  );

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === packageId),
    [packages, packageId],
  );

  const isMenuBuilder = service?.customizationMode === "MENU_BUILDER";

  const toggleAddOn = (id: string, checked: boolean) => {
    setAddOnIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const toggleMenuItem = (course: string, itemId: string, chooseCount: number) => {
    setMenuSelections((prev) => {
      const current = prev[course] ?? [];
      if (current.includes(itemId)) {
        return { ...prev, [course]: current.filter((id) => id !== itemId) };
      }
      if (current.length >= chooseCount) {
        return {
          ...prev,
          [course]: [...current.slice(1), itemId],
        };
      }
      return { ...prev, [course]: [...current, itemId] };
    });
  };

  const createMut = useMutation({
    mutationFn: () => {
      if (!service?.id) throw new Error("Service required");
      if (textContainsContactInfo(notes)) {
        throw new Error(contactInfoBlockedMessage(t("notes")));
      }
      if (textContainsContactInfo(venueName)) {
        throw new Error(contactInfoBlockedMessage(t("venueName")));
      }
      if (textContainsContactInfo(address)) {
        throw new Error(contactInfoBlockedMessage(t("eventAddress")));
      }
      return createServiceInquiry({
        serviceId: service.id,
        packageId: packageId || null,
        startDate: eventDate,
        endDate: eventDate,
        guestCount: guestCount ? Number(guestCount) : null,
        location: {
          country: selectedCountry?.name || countryCode || undefined,
          city: city || undefined,
          venueName: venueName || null,
          address: address || null,
        },
        selection: {
          packageId: packageId || null,
          addOnIds,
          menuSelections: Object.entries(menuSelections).map(
            ([course, menuItemIds]) => ({ course, menuItemIds }),
          ),
          hours: hours ? Number(hours) : null,
        },
        notes: notes || null,
      });
    },
    onSuccess: (inquiry) => {
      void queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      toast.success(t("inquirySubmitted"));
      router.push(`/userDashboard/service-inquiries/${inquiry.id}`);
    },
    onError: (e) => {
      if (e instanceof Error && e.message.includes("cannot include")) {
        toast.error(e.message);
        return;
      }
      toastApiError(e, t("inquirySubmitFailed"));
    },
  });

  const needsPackage =
    service?.customizationMode === "PACKAGE" ||
    service?.customizationMode === "MENU_BUILDER";
  const needsGuests = service?.pricingModel === "PER_GUEST";
  const showGuests =
    needsGuests ||
    hasGuestBounds(service?.guestMin, service?.guestMax);
  const guestsBoundsErr = showGuests
    ? guestBoundsError(guestCount, service?.guestMin, service?.guestMax, {
        invalid: tMarketplace("guestsInvalid"),
        min: tMarketplace("guestsMin", { min: service?.guestMin ?? 1 }),
        max: tMarketplace("guestsMax", { max: service?.guestMax ?? 0 }),
      })
    : null;
  const needsHours = service?.pricingModel === "HOURLY";
  const menuReady =
    !isMenuBuilder || menuCompleteForPackage(selectedPackage, menuSelections);
  const contactFieldsClean =
    !textContainsContactInfo(notes) &&
    !textContainsContactInfo(venueName) &&
    !textContainsContactInfo(address);

  const canSubmit =
    Boolean(service?.id) &&
    Boolean(eventDate) &&
    Boolean(countryCode) &&
    Boolean(city) &&
    menuReady &&
    contactFieldsClean &&
    (!needsGuests || Number(guestCount) > 0) &&
    !guestsBoundsErr &&
    (!needsHours || Number(hours) > 0);

  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (!serviceIdParam && !slugParam) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("inquiryMissingService")}
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/marketplace">{t("browseMarketplace")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (serviceQuery.isLoading || !service) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) createMut.mutate();
      }}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-primary">
          {t("newServiceInquiry")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{service.title}</h1>
        {service.vendor?.vendorName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {service.vendor.vendorName}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>{t("eventDate")}</Label>
        <DatePicker
          value={eventDate}
          required
          disabledDates={disablePastDates}
          placeholder={tCommon("pickDate")}
          onChange={setEventDate}
        />
      </div>

      {needsPackage ? (
        <div className="space-y-2">
          <Label>
            {t("selectPackage")}{" "}
            <span className="font-normal text-muted-foreground">
              ({tCommon("optional")})
            </span>
          </Label>
          {packages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#303030] px-3 py-4 text-sm text-zinc-500">
              {t("noPackagesAvailable")}
            </p>
          ) : (
            <div className="grid gap-2">
              {packages.map((pkg) => {
                const selected = packageId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() =>
                      setPackageId((current) =>
                        current === pkg.id ? "" : pkg.id!,
                      )
                    }
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-[#303030] bg-[#151515] hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{pkg.name}</p>
                        {pkg.description ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {pkg.description}
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        <DisplayPrice
                          amount={decimalToNumber(pkg.price)}
                          currency={service.currency}
                        />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {isMenuBuilder && selectedPackage ? (
        <div className="space-y-4 rounded-xl border border-[#303030] bg-[#151515] p-4">
          <div>
            <Label className="text-base">{t("customizeMenu")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("customizeMenuHint")}
            </p>
          </div>
          {(selectedPackage.menuRules ?? []).length === 0 ? (
            <p className="text-sm text-zinc-500">{t("noMenuRules")}</p>
          ) : (
            (selectedPackage.menuRules ?? []).map((rule) => {
              const poolIds = new Set(rule.menuItemIds ?? []);
              const options = menuItems.filter((item) => {
                if (poolIds.size > 0) return poolIds.has(item.id!);
                return (
                  (item.course ?? "").trim().toLowerCase() ===
                  rule.course.trim().toLowerCase()
                );
              });
              const selected = menuSelections[rule.course] ?? [];
              return (
                <div key={`${rule.course}-${rule.chooseCount}`} className="space-y-2">
                  <p className="text-sm font-medium text-white">
                    {t("chooseCourse", {
                      count: rule.chooseCount,
                      course: rule.course,
                      selected: selected.length,
                    })}
                  </p>
                  <div className="grid gap-2">
                    {options.map((item) => {
                      const checked = selected.includes(item.id!);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            toggleMenuItem(
                              rule.course,
                              item.id!,
                              rule.chooseCount,
                            )
                          }
                          className={cn(
                            "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                            checked
                              ? "border-primary bg-primary/10"
                              : "border-[#303030] hover:border-primary/40",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                              checked
                                ? "border-primary bg-primary text-white"
                                : "border-zinc-600",
                            )}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm text-white">
                              {item.name}
                            </span>
                            {item.description ? (
                              <span className="mt-0.5 block text-xs text-zinc-500">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {addOns.length > 0 ? (
        <div className="space-y-2">
          <Label>{t("selectAddOns")}</Label>
          <p className="text-xs text-muted-foreground">{t("selectAddOnsHint")}</p>
          <div className="grid gap-2">
            {addOns.map((addon) => {
              const checked = addOnIds.includes(addon.id!);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddOn(addon.id!, !checked)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    checked
                      ? "border-primary bg-primary/10"
                      : "border-[#303030] bg-[#151515] hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-white"
                        : "border-zinc-600",
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-medium text-white">{addon.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        <DisplayPrice
                          amount={decimalToNumber(addon.price)}
                          currency={service.currency}
                        />
                      </span>
                    </span>
                    {addon.description ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {addon.description}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {showGuests ? (
        <div className="space-y-2">
          <Label htmlFor="guestCount">{t("guests")}</Label>
          <Input
            id="guestCount"
            type="number"
            min={service?.guestMin ?? 1}
            max={service?.guestMax ?? undefined}
            value={guestCount}
            onChange={(e) => setGuestCount(e.target.value)}
            required={needsGuests}
          />
          {service?.guestMin != null && service?.guestMax != null ? (
            <p className="text-xs text-muted-foreground">
              {tMarketplace("guestsRangeHint", {
                min: service.guestMin,
                max: service.guestMax,
              })}
            </p>
          ) : service?.guestMin != null ? (
            <p className="text-xs text-muted-foreground">
              {tMarketplace("guestsMin", { min: service.guestMin })}
            </p>
          ) : service?.guestMax != null ? (
            <p className="text-xs text-muted-foreground">
              {tMarketplace("guestsMax", { max: service.guestMax })}
            </p>
          ) : null}
          {guestsBoundsErr ? (
            <p className="text-xs text-destructive">{guestsBoundsErr}</p>
          ) : null}
        </div>
      ) : null}

      {needsHours ? (
        <div className="space-y-2">
          <Label htmlFor="hours">{t("hours")}</Label>
          <Input
            id="hours"
            type="number"
            min={1}
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("country")}</Label>
          {lockedCountryCode ? (
            <Input
              value={
                selectedCountry
                  ? `${selectedCountry.name} (${selectedCountry.code})`
                  : lockedCountryCode
              }
              disabled
            />
          ) : (
            <Select
              value={countryCode || undefined}
              onValueChange={(code) => {
                setCountryCode(code);
                setCity("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                {availableCountries.map((country) => (
                  <SelectItem key={country.id} value={country.code}>
                    {country.name} ({country.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs text-muted-foreground">
            {t("serviceAreaOnlyHint")}
          </p>
        </div>
        <div className="space-y-2">
          <Label>{t("city")}</Label>
          {allowedCities.length === 0 ? (
            <p className="text-sm text-zinc-500">{t("noServiceCities")}</p>
          ) : (
            <Select value={city || undefined} onValueChange={setCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectCity")} />
              </SelectTrigger>
              <SelectContent>
                {allowedCities.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venueName">{t("venueName")}</Label>
        <Input
          id="venueName"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("eventAddress")}</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("addressUnlockHint")}</p>
        {textContainsContactInfo(address) ? (
          <p className="text-xs text-destructive">{t("noContactDetailsHint")}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground">{t("noContactDetailsHint")}</p>
        {textContainsContactInfo(notes) || textContainsContactInfo(venueName) ? (
          <p className="text-xs text-destructive">{t("noContactDetailsBlocked")}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!canSubmit || createMut.isPending}
      >
        {createMut.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tCommon("loading")}
          </>
        ) : (
          t("submitInquiry")
        )}
      </Button>
    </form>
  );
}

export default function NewServiceInquiryPage() {
  const t = useTranslations("userDashboard");

  return (
    <RoleGuard allowedRoles={["BUYER", "VENDOR", "ADMIN"]}>
      <DashboardContentPanel>
        <Button
          asChild
          variant="ghost"
          className="mb-6 px-0 text-muted-foreground hover:text-foreground"
        >
          <Link href="/marketplace" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("browseMarketplace")}
          </Link>
        </Button>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <NewServiceInquiryForm />
        </Suspense>
      </DashboardContentPanel>
    </RoleGuard>
  );
}
