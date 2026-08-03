"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-time-picker";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { createInstantServiceBooking, createServiceInquiry } from "@/features/marketplace/api";
import type {
  PublicMarketplaceService,
  ServicePackage,
} from "@/features/marketplace/types";
import {
  contactInfoBlockedMessage,
  textContainsContactInfo,
} from "@/features/marketplace/contact-guard";
import { decimalToNumber } from "@/features/marketplace/utils";
import { listCountries } from "@/features/locations/api";
import { findActiveCountry } from "@/features/locations/match";
import { locationKeys } from "@/features/locations/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const OVERLAY_Z = "z-[90]";
const FIELD_CLASS = "border-[#303030] bg-transparent dark:bg-input/30";
const FIELD_TRIGGER_CLASS =
  "border-[#303030] bg-transparent text-white dark:bg-input/30 hover:bg-input/40";

type ServiceInquiryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: PublicMarketplaceService;
  initialStartDate?: string;
  initialEndDate?: string;
  /** When true, event date comes from the detail calendar and cannot be changed. */
  lockEventDate?: boolean;
  /** inquire = proposal flow; instant = pay now via listed pricing */
  mode?: "inquire" | "instant";
};

function serviceAreaCities(service: PublicMarketplaceService): string[] {
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

export function ServiceInquiryDialog({
  open,
  onOpenChange,
  service,
  initialStartDate = "",
  initialEndDate = "",
  lockEventDate = false,
  mode = "inquire",
}: ServiceInquiryDialogProps) {
  const t = useTranslations("userDashboard");
  const tMarketplace = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuth();
  const isInstant = mode === "instant";

  const packages = useMemo(
    () =>
      (service.packages ?? []).filter(
        (p) => p.isActive !== false && Boolean(p.id),
      ),
    [service.packages],
  );

  const addOns = useMemo(
    () =>
      (service.addOns ?? []).filter(
        (a) => a.isActive !== false && Boolean(a.id),
      ),
    [service.addOns],
  );

  const menuItems = useMemo(
    () =>
      (service.menuItems ?? []).filter(
        (m) => m.isActive !== false && Boolean(m.id),
      ),
    [service.menuItems],
  );

  const allowedCities = useMemo(() => serviceAreaCities(service), [service]);
  const lockedCountryCode = service.countryCode?.trim().toUpperCase() ?? "";

  const [eventDate, setEventDate] = useState(
    initialStartDate || initialEndDate || "",
  );
  const [guestCount, setGuestCount] = useState("");
  const [packageId, setPackageId] = useState("");
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [menuSelections, setMenuSelections] = useState<Record<string, string[]>>(
    {},
  );
  const [hours, setHours] = useState("");
  const [countryCode, setCountryCode] = useState(lockedCountryCode);
  const [city, setCity] = useState(service.baseCity ?? "");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
    enabled: open,
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

  const isMenuBuilder = service.customizationMode === "MENU_BUILDER";

  useEffect(() => {
    if (!open) return;
    setEventDate(initialStartDate || initialEndDate || "");
    setPackageId("");
    setAddOnIds([]);
    setMenuSelections({});
    setGuestCount("");
    setHours("");
    setVenueName("");
    setAddress("");
    setNotes("");
    setCountryCode(lockedCountryCode);
    setCity(
      service.baseCity?.trim() ||
        allowedCities[0] ||
        "",
    );
  }, [
    open,
    initialStartDate,
    initialEndDate,
    lockedCountryCode,
    service.baseCity,
    allowedCities,
  ]);

  useEffect(() => {
    setMenuSelections({});
  }, [packageId]);

  useEffect(() => {
    if (!open || !isReady) return;
    if (!isAuthenticated) {
      onOpenChange(false);
      const redirect = encodeURIComponent(
        pathname || `/marketplace/${service.slug}`,
      );
      router.push(`/login?redirect=${redirect}`);
    }
  }, [
    open,
    isReady,
    isAuthenticated,
    onOpenChange,
    pathname,
    router,
    service.slug,
  ]);

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
      if (textContainsContactInfo(notes)) {
        throw new Error(contactInfoBlockedMessage(t("notes")));
      }
      if (textContainsContactInfo(venueName)) {
        throw new Error(contactInfoBlockedMessage(t("venueName")));
      }
      if (textContainsContactInfo(address)) {
        throw new Error(contactInfoBlockedMessage(t("eventAddress")));
      }
      const body = {
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
      };
      if (isInstant) {
        return createInstantServiceBooking(body);
      }
      return createServiceInquiry(body);
    },
    onSuccess: (result) => {
      onOpenChange(false);
      if (isInstant && "booking" in result) {
        toast.success(tMarketplace("instantBookSuccess"));
        router.push(`/marketplace/booking/${result.booking.id}/checkout`);
        return;
      }
      toast.success(t("inquirySubmitted"));
      if ("id" in result) {
        router.push(`/userDashboard/service-inquiries/${result.id}`);
      }
    },
    onError: (e) => {
      if (e instanceof Error && e.message.includes("cannot include")) {
        toast.error(e.message);
        return;
      }
      toastApiError(
        e,
        isInstant
          ? tMarketplace("instantBookFailed")
          : t("inquirySubmitFailed"),
      );
    },
  });

  const needsPackage =
    service.customizationMode === "PACKAGE" ||
    service.customizationMode === "MENU_BUILDER";
  const needsGuests = service.pricingModel === "PER_GUEST";
  const needsHours = service.pricingModel === "HOURLY";
  const menuReady = !isMenuBuilder || menuCompleteForPackage(selectedPackage, menuSelections);
  const contactFieldsClean =
    !textContainsContactInfo(notes) &&
    !textContainsContactInfo(venueName) &&
    !textContainsContactInfo(address);

  const canSubmit =
    Boolean(service.id) &&
    Boolean(eventDate) &&
    Boolean(countryCode) &&
    Boolean(city) &&
    (!needsPackage || Boolean(packageId)) &&
    menuReady &&
    contactFieldsClean &&
    (!needsGuests || Number(guestCount) > 0) &&
    (!needsHours || Number(hours) > 0);

  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#303030] bg-[#1B1B1B] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-left">
            {isInstant
              ? tMarketplace("instantBookTitle")
              : t("newServiceInquiry")}
          </DialogTitle>
          <DialogDescription className="text-left text-zinc-400">
            {isInstant ? (
              <>
                <span className="block">{tMarketplace("instantBookDesc")}</span>
                <span className="mt-1 block text-zinc-500">
                  {service.title}
                  {service.vendor?.vendorName
                    ? ` · ${service.vendor.vendorName}`
                    : ""}
                </span>
              </>
            ) : (
              <>
                {service.title}
                {service.vendor?.vendorName
                  ? ` · ${service.vendor.vendorName}`
                  : ""}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) createMut.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>{t("eventDate")}</Label>
            <DatePicker
              value={eventDate}
              required
              disabled={lockEventDate}
              disabledDates={lockEventDate ? undefined : disablePastDates}
              placeholder={tCommon("pickDate")}
              triggerClassName={FIELD_TRIGGER_CLASS}
              popoverClassName={OVERLAY_Z}
              onChange={setEventDate}
            />
            {lockEventDate ? (
              <p className="text-xs text-muted-foreground">
                {t("eventDateLockedHint")}
              </p>
            ) : null}
          </div>

          {needsPackage ? (
            <div className="space-y-2">
              <Label>{t("selectPackage")}</Label>
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
                        onClick={() => setPackageId(pkg.id!)}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-[#303030] bg-black/40 hover:border-primary/50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white">{pkg.name}</p>
                            {pkg.description ? (
                              <p className="mt-1 text-xs text-zinc-400">
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
            <div className="space-y-4 rounded-xl border border-[#303030] bg-black/30 p-4">
              <div>
                <Label className="text-base">{t("customizeMenu")}</Label>
                <p className="mt-1 text-xs text-zinc-500">{t("customizeMenuHint")}</p>
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
              <p className="text-xs text-zinc-500">{t("selectAddOnsHint")}</p>
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
                          : "border-[#303030] bg-black/40 hover:border-primary/40",
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
                          <span className="mt-1 block text-xs text-zinc-400">
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

          {needsGuests ? (
            <div className="space-y-2">
              <Label htmlFor="inquiry-guests">{t("guests")}</Label>
              <Input
                id="inquiry-guests"
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                required
                className={FIELD_CLASS}
              />
            </div>
          ) : null}

          {needsHours ? (
            <div className="space-y-2">
              <Label htmlFor="inquiry-hours">{t("hours")}</Label>
              <Input
                id="inquiry-hours"
                type="number"
                min={1}
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                className={FIELD_CLASS}
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
                  className={FIELD_CLASS}
                />
              ) : (
                <Select
                  value={countryCode || undefined}
                  onValueChange={(code) => {
                    setCountryCode(code);
                    setCity("");
                  }}
                >
                  <SelectTrigger className={cn("w-full", FIELD_TRIGGER_CLASS)}>
                    <SelectValue placeholder={t("selectCountry")} />
                  </SelectTrigger>
                  <SelectContent className={OVERLAY_Z}>
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
                  <SelectTrigger className={cn("w-full", FIELD_TRIGGER_CLASS)}>
                    <SelectValue placeholder={t("selectCity")} />
                  </SelectTrigger>
                  <SelectContent className={OVERLAY_Z}>
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
            <Label htmlFor="inquiry-venue">{t("venueName")}</Label>
            <Input
              id="inquiry-venue"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-address">{t("eventAddress")}</Label>
            <Input
              id="inquiry-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={FIELD_CLASS}
            />
            <p className="text-xs text-muted-foreground">{t("addressUnlockHint")}</p>
            {textContainsContactInfo(address) ? (
              <p className="text-xs text-destructive">
                {t("noContactDetailsHint")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-notes">{t("notes")}</Label>
            <Textarea
              id="inquiry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className={FIELD_CLASS}
            />
            <p className="text-xs text-muted-foreground">{t("noContactDetailsHint")}</p>
            {textContainsContactInfo(notes) ||
            textContainsContactInfo(venueName) ? (
              <p className="text-xs text-destructive">
                {t("noContactDetailsBlocked")}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary"
            disabled={!canSubmit || createMut.isPending || !isAuthenticated}
          >
            {createMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              isInstant ? tMarketplace("instantBookCta") : t("submitInquiry")
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
