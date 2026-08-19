"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TimePicker } from "@/components/ui/date-time-picker";
import { VenueGalleryUpload } from "@/components/venues/VenueGalleryUpload";
import {
  VenueScheduleEditor,
  type ScheduleRow,
} from "@/components/venues/VenueScheduleEditor";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import { ServicePublicPreviewDialog } from "@/components/marketplace/ServicePublicPreviewDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardCardClass,
  dashboardInputClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { useDayNames } from "@/features/i18n/use-day-names";
import { validateNamedSlotsAgainstSchedules } from "@/features/venues/pricing-validation";
import {
  createMarketplaceService,
  getManagedMarketplaceService,
  listServiceCategories,
  submitMarketplaceServiceForReview,
  updateMarketplaceService,
  uploadMarketplaceMedia,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type {
  CreateMarketplaceServicePayload,
  Currency,
  ManagedMarketplaceService,
  ServiceAddOnPayload,
  ServiceBookingMode,
  ServiceCustomizationMode,
  ServicePackagePayload,
  ServicePricingModel,
  ServiceSlotTemplate,
} from "@/features/marketplace/types";
import {
  decimalToNumber,
  defaultWeeklyServiceSchedules,
} from "@/features/marketplace/utils";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { findActiveCountry } from "@/features/locations/match";
import { locationKeys } from "@/features/locations/query-keys";
import { formatTimezoneLabel } from "@/lib/timezones";
import { validateUploadFile } from "@/features/uploads/validation";
import { toastApiError } from "@/lib/toasts";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const inputClass = dashboardInputClass;

type PackageDraft = ServicePackagePayload;
type AddOnDraft = ServiceAddOnPayload;
type CourseDraft = {
  name: string;
  dishes: string[];
};

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

type Props = { serviceId?: string };

function groupMenuItemsIntoCourses(
  items: Array<{ name: string; course?: string | null }>,
): CourseDraft[] {
  const order: string[] = [];
  const byCourse = new Map<string, string[]>();
  for (const item of items) {
    const course = (item.course ?? "").trim();
    const name = item.name.trim();
    if (!name) continue;
    const key = course || "";
    if (!byCourse.has(key)) {
      byCourse.set(key, []);
      order.push(key);
    }
    byCourse.get(key)!.push(name);
  }
  if (order.length === 0) return [];
  return order.map((name) => ({
    name,
    dishes: byCourse.get(name) ?? [],
  }));
}

export function MarketplaceServiceForm({ serviceId }: Props) {
  const isEdit = Boolean(serviceId);
  const router = useRouter();
  const paths = useDashboardPaths();
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const dayNames = useDayNames();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pricingModel, setPricingModel] = useState<ServicePricingModel>("FLAT_PER_EVENT");
  const [customizationMode, setCustomizationMode] =
    useState<ServiceCustomizationMode>("NONE");
  const [currency, setCurrency] = useState<Currency | "">("");
  const [timezone, setTimezone] = useState("");
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [baseCity, setBaseCity] = useState("");
  const [citiesServed, setCitiesServed] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverPreviewRef = useRef<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<Record<string, string>>({});
  const portfolioPreviewsRef = useRef<Record<string, string>>({});
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [packages, setPackages] = useState<PackageDraft[]>([]);
  const [addOns, setAddOns] = useState<AddOnDraft[]>([]);
  const [menuCourses, setMenuCourses] = useState<CourseDraft[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>(
    defaultWeeklyServiceSchedules(),
  );
  const [instantBookingEnabled, setInstantBookingEnabled] = useState(false);
  const [bookingMode, setBookingMode] = useState<ServiceBookingMode>("DATE");
  const [bookingCapacity, setBookingCapacity] = useState(1);
  const [guestMin, setGuestMin] = useState<number | undefined>(undefined);
  const [guestMax, setGuestMax] = useState<number | undefined>(undefined);
  const [slotTemplates, setSlotTemplates] = useState<SlotTemplateDraft[]>([]);
  const [previewService, setPreviewService] =
    useState<ManagedMarketplaceService | null>(null);

  coverPreviewRef.current = coverPreview;
  portfolioPreviewsRef.current = portfolioPreviews;

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
      for (const url of Object.values(portfolioPreviewsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const categoriesQuery = useQuery({
    queryKey: marketplaceKeys.categories({ isActive: true }),
    queryFn: () => listServiceCategories({ isActive: true }),
  });

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  });

  const { data: cities = [], isFetching: citiesFetching } = useQuery({
    queryKey: locationKeys.cities(countryCode, {
      activeOnly: true,
      featuredOnly: true,
    }),
    queryFn: () =>
      listCitiesByCountryCode(countryCode, {
        activeOnly: true,
        featuredOnly: true,
      }),
    enabled: Boolean(countryCode),
  });

  const existingQuery = useQuery({
    queryKey: marketplaceKeys.managedDetail(serviceId ?? ""),
    queryFn: () => getManagedMarketplaceService(serviceId!),
    enabled: Boolean(serviceId),
  });

  useEffect(() => {
    const existing = existingQuery.data;
    if (!existing) return;
    setTitle(existing.title ?? "");
    setDescription(existing.description ?? "");
    setCategoryId(existing.categoryId ?? "");
    setPricingModel(existing.pricingModel);
    setCustomizationMode(existing.customizationMode);
    setCurrency(existing.currency ?? "");
    setTimezone(existing.timezone ?? "");
    setBasePrice(
      existing.basePrice == null ? null : decimalToNumber(existing.basePrice),
    );
    setCountryCode(existing.countryCode?.trim().toUpperCase() ?? "");
    setBaseCity(existing.baseCity ?? "");
    const base = (existing.baseCity ?? "").trim().toLowerCase();
    setCitiesServed(
      (existing.citiesServed ?? []).filter(
        (city) => city.trim().toLowerCase() !== base,
      ),
    );
    setCoverImage(existing.coverImage ?? "");
    setPortfolio(existing.portfolio ?? []);
    setInstantBookingEnabled(Boolean(existing.instantBookingEnabled));
    setBookingMode(existing.bookingMode === "SLOT" ? "SLOT" : "DATE");
    setBookingCapacity(
      Math.min(10, Math.max(1, Number(existing.bookingCapacity) || 1)),
    );
    setGuestMin(
      existing.guestMin != null && Number(existing.guestMin) > 0
        ? Number(existing.guestMin)
        : undefined,
    );
    setGuestMax(
      existing.guestMax != null && Number(existing.guestMax) > 0
        ? Number(existing.guestMax)
        : undefined,
    );
    setSlotTemplates(
      (existing.slotTemplates ?? []).map((tpl) =>
        newTemplateDraft({
          name: tpl.name ?? "",
          startTime: tpl.startTime || "09:00",
          endTime: tpl.endTime || "11:00",
        }),
      ),
    );
    setPackages(
      (existing.packages ?? []).map((p) => ({
        name: p.name,
        description: p.description ?? "",
        price: decimalToNumber(p.price),
        isActive: p.isActive !== false,
        sortOrder: p.sortOrder ?? 0,
        menuRules: (p.menuRules ?? []).map((rule) => ({
          course: rule.course,
          chooseCount: rule.chooseCount,
          menuItemIds: rule.menuItemIds ?? [],
          extraPerGuest:
            rule.extraPerGuest == null
              ? null
              : decimalToNumber(rule.extraPerGuest),
        })),
      })),
    );
    setAddOns(
      (existing.addOns ?? []).map((a) => ({
        name: a.name,
        description: a.description ?? "",
        price: decimalToNumber(a.price),
        isActive: a.isActive !== false,
        sortOrder: a.sortOrder ?? 0,
      })),
    );
    setMenuCourses(
      groupMenuItemsIntoCourses(
        (existing.menuItems ?? []).map((m) => ({
          name: m.name,
          course: m.course ?? "",
        })),
      ),
    );
    if (existing.schedules && existing.schedules.length > 0) {
      const byDay = new Map(existing.schedules.map((r) => [r.dayOfWeek, r]));
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
    }
  }, [existingQuery.data]);

  const prevCountryCodeRef = useRef<string>("");
  useEffect(() => {
    if (!countryCode || citiesFetching || cities.length === 0) return;
    const prev = prevCountryCodeRef.current;
    prevCountryCodeRef.current = countryCode;
    // On first load / edit hydrate, keep stored cities even if not in featured list
    if (!prev || prev === countryCode) return;
    const allowed = new Set(cities.map((c) => c.name));
    setCitiesServed((prevCities) =>
      prevCities.filter(
        (name) =>
          allowed.has(name) &&
          name.trim().toLowerCase() !== baseCity.trim().toLowerCase(),
      ),
    );
    setBaseCity((prevBase) =>
      prevBase && allowed.has(prevBase) ? prevBase : "",
    );
  }, [countryCode, cities, citiesFetching, baseCity]);

  const toggleCityServed = (cityName: string, checked: boolean) => {
    if (
      checked &&
      cityName.trim().toLowerCase() === baseCity.trim().toLowerCase()
    ) {
      return;
    }
    setCitiesServed((prev) => {
      if (checked) {
        return prev.includes(cityName) ? prev : [...prev, cityName];
      }
      return prev.filter((name) => name !== cityName);
    });
  };

  const onBaseCityChange = (cityName: string) => {
    setBaseCity(cityName);
    setCitiesServed((prev) =>
      prev.filter(
        (name) => name.trim().toLowerCase() !== cityName.trim().toLowerCase(),
      ),
    );
  };

  const categories = categoriesQuery.data ?? [];
  const selectedCountry = useMemo(
    () => findActiveCountry(countries, countryCode),
    [countries, countryCode],
  );
  const locationCurrency = (currency ||
    selectedCountry?.defaultCurrency?.trim() ||
    "") as Currency | "";
  const locationTimezone =
    timezone || selectedCountry?.defaultTimezone?.trim() || "";
  const citiesForServed = useMemo(
    () =>
      cities.filter(
        (city) =>
          city.name.trim().toLowerCase() !== baseCity.trim().toLowerCase(),
      ),
    [cities, baseCity],
  );

  // For new services only: sync currency/timezone from the selected country.
  // On edit, keep hydrated values unless the vendor changes country.
  const prevSelectedCountryRef = useRef<string>("");
  useEffect(() => {
    if (!selectedCountry) return;
    const code = selectedCountry.code;
    const prev = prevSelectedCountryRef.current;
    prevSelectedCountryRef.current = code;
    if (isEdit && prev && prev === code) return;
    if (isEdit && !prev) return; // initial hydrate — don't overwrite
    if (selectedCountry.defaultCurrency) {
      setCurrency(selectedCountry.defaultCurrency);
    }
    setTimezone(selectedCountry.defaultTimezone?.trim() || "");
  }, [selectedCountry, isEdit]);

  const buildPayload = (): CreateMarketplaceServicePayload => {
    const base = baseCity.trim().toLowerCase();
    const existingMode = existingQuery.data?.customizationMode;
    const payload: CreateMarketplaceServicePayload = {
      title: title.trim(),
      description: description.trim() || null,
      categoryId,
      pricingModel,
      customizationMode,
      currency: (currency ||
        selectedCountry?.defaultCurrency ||
        "AED") as Currency,
      timezone:
        timezone || selectedCountry?.defaultTimezone?.trim() || null,
      basePrice,
      countryCode: countryCode || null,
      baseCity: baseCity.trim() || null,
      citiesServed: citiesServed.filter(
        (city) => city.trim().toLowerCase() !== base,
      ),
      coverImage: coverImage || null,
      portfolio,
      instantBookingEnabled,
      bookingMode,
      bookingCapacity: bookingMode === "DATE" ? bookingCapacity : undefined,
      guestMin: guestMin ?? null,
      guestMax: guestMax ?? null,
      ...(bookingMode === "SLOT"
        ? {
            slotTemplates: slotTemplates.map((tpl) => ({
              name: tpl.name?.trim() || null,
              startTime: tpl.startTime,
              endTime: tpl.endTime,
            })),
          }
        : {}),
      addOns,
      schedules: schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        openTime: s.openTime,
        closeTime: s.closeTime,
        isOpen: s.isOpen,
      })),
    };

    if (
      customizationMode === "PACKAGE" ||
      customizationMode === "MENU_BUILDER"
    ) {
      payload.packages = packages.map((pkg) => ({
        ...pkg,
        menuRules:
          customizationMode === "MENU_BUILDER"
            ? (pkg.menuRules ?? []).map((rule) => ({
                course: rule.course.trim(),
                chooseCount: rule.chooseCount,
                // Match dishes by course name (set when courses are saved as menu items)
                menuItemIds: [],
                extraPerGuest: null,
              }))
            : undefined,
      }));
    } else if (
      existingMode === "PACKAGE" ||
      existingMode === "MENU_BUILDER"
    ) {
      // Mode switched away — clear leftover packages
      payload.packages = [];
    }

    if (customizationMode === "MENU_BUILDER") {
      let sortOrder = 0;
      payload.menuItems = menuCourses.flatMap((course) => {
        const courseName = course.name.trim();
        return course.dishes
          .map((dish) => dish.trim())
          .filter(Boolean)
          .map((name) => ({
            name,
            description: null,
            course: courseName || null,
            price: null,
            isActive: true,
            sortOrder: sortOrder++,
          }));
      });
    } else if (existingMode === "MENU_BUILDER") {
      payload.menuItems = [];
    }

    return payload;
  };

  const saveMut = useMutation({
    mutationFn: async (opts: { submit?: boolean }) => {
      const payload = buildPayload();
      if (!payload.title || payload.title.length < 2) {
        toast.error(t("titleRequired"));
        throw new ApiError(400, t("titleRequired"));
      }
      if (!payload.categoryId) {
        toast.error(t("categoryRequired"));
        throw new ApiError(400, t("categoryRequired"));
      }
      if (
        payload.guestMin != null &&
        payload.guestMax != null &&
        payload.guestMax < payload.guestMin
      ) {
        toast.error(t("guestMaxBeforeMin"));
        throw new ApiError(400, t("guestMaxBeforeMin"));
      }
      if (
        payload.customizationMode === "PACKAGE" &&
        (payload.packages?.length ?? 0) === 0
      ) {
        toast.error(t("packageRequired"));
        throw new ApiError(400, t("packageRequired"));
      }
      if (payload.customizationMode === "MENU_BUILDER") {
        if ((payload.packages?.length ?? 0) === 0) {
          toast.error(t("menuBuilderPackageRequired"));
          throw new ApiError(400, t("menuBuilderPackageRequired"));
        }
        if ((payload.menuItems?.length ?? 0) === 0) {
          toast.error(t("menuRequired"));
          throw new ApiError(400, t("menuRequired"));
        }
        const coursesWithoutName = menuCourses.some(
          (c) => c.dishes.some((d) => d.trim()) && !c.name.trim(),
        );
        if (coursesWithoutName) {
          toast.error(t("courseNameRequired"));
          throw new ApiError(400, t("courseNameRequired"));
        }
        const menuCourseNames = new Set(
          menuCourses
            .filter((c) => c.name.trim() && c.dishes.some((d) => d.trim()))
            .map((c) => c.name.trim().toLowerCase()),
        );
        for (const pkg of payload.packages ?? []) {
          const rules = pkg.menuRules ?? [];
          if (rules.length === 0) {
            toast.error(t("menuRulesRequired", { package: pkg.name || "—" }));
            throw new ApiError(
              400,
              t("menuRulesRequired", { package: pkg.name || "—" }),
            );
          }
          for (const rule of rules) {
            const course = rule.course.trim();
            if (!course || rule.chooseCount < 1) {
              toast.error(t("menuRuleInvalid", { package: pkg.name || "—" }));
              throw new ApiError(
                400,
                t("menuRuleInvalid", { package: pkg.name || "—" }),
              );
            }
            if (!menuCourseNames.has(course.toLowerCase())) {
              toast.error(
                t("menuRuleCourseMismatch", {
                  package: pkg.name || "—",
                  course,
                }),
              );
              throw new ApiError(
                400,
                t("menuRuleCourseMismatch", {
                  package: pkg.name || "—",
                  course,
                }),
              );
            }
          }
        }
      }
      if (!payload.schedules?.some((s) => s.isOpen)) {
        toast.error(t("scheduleOpenDayRequired"));
        throw new ApiError(400, t("scheduleOpenDayRequired"));
      }

      if (payload.bookingMode === "SLOT") {
        const templates = payload.slotTemplates ?? [];
        const validTemplates = templates.filter(
          (tpl) =>
            Boolean(tpl.startTime) &&
            Boolean(tpl.endTime) &&
            tpl.endTime > tpl.startTime,
        );
        if (templates.some((tpl) => !(tpl.endTime > tpl.startTime))) {
          toast.error(t("slotTimesInvalid"));
          throw new ApiError(400, t("slotTimesInvalid"));
        }
        if (opts.submit && validTemplates.length < 1) {
          toast.error(t("slotsRequiredBeforeSubmit"));
          throw new ApiError(400, t("slotsRequiredBeforeSubmit"));
        }
        const scheduleError = validateNamedSlotsAgainstSchedules(
          templates.map((tpl) => ({
            name: tpl.name ?? undefined,
            startTime: tpl.startTime,
            endTime: tpl.endTime,
          })),
          payload.schedules ?? schedules,
          t,
          dayNames,
        );
        if (scheduleError) {
          toast.error(scheduleError);
          throw new ApiError(400, scheduleError);
        }
      }

      const saved = serviceId
        ? await updateMarketplaceService(serviceId, payload)
        : await createMarketplaceService(payload);

      // ACTIVE structural edits already become PENDING on update — skip /submit
      if (
        opts.submit &&
        (saved.status === "DRAFT" || saved.status === "REJECTED")
      ) {
        return submitMarketplaceServiceForReview(saved.id);
      }
      return saved;
    },
    onSuccess: (saved, vars) => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
      const submitted = Boolean(vars.submit && saved.status === "PENDING");
      toast.success(submitted ? t("submittedForReview") : t("saved"));
      router.replace(paths.marketplace);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.statusCode === 400) return;
      toastApiError(e);
    },
  });

  const onCoverUpload = async (file: File) => {
    try {
      validateUploadFile(file);
      setCoverUploading(true);
      const blobUrl = URL.createObjectURL(file);
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
      setCoverPreview(blobUrl);
      const url = await uploadMarketplaceMedia(file);
      setCoverImage(url);
      toast.success(t("coverUploaded"));
    } catch (e) {
      toastApiError(e);
    } finally {
      setCoverUploading(false);
    }
  };

  const onPortfolioUpload = async (files: File[]) => {
    try {
      setPortfolioUploading(true);
      const urls: string[] = [];
      const nextPreviews: Record<string, string> = {};
      for (const file of files) {
        validateUploadFile(file);
        const blobUrl = URL.createObjectURL(file);
        const url = await uploadMarketplaceMedia(file);
        urls.push(url);
        nextPreviews[url] = blobUrl;
      }
      setPortfolioPreviews((prev) => ({ ...prev, ...nextPreviews }));
      setPortfolio((prev) => [...prev, ...urls]);
      toast.success(t("portfolioUploaded"));
    } catch (e) {
      toastApiError(e);
    } finally {
      setPortfolioUploading(false);
    }
  };

  const clearCover = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCoverImage("");
  };

  if (isEdit && existingQuery.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={isEdit ? t("editServiceTitle") : t("newServiceTitle")}
          description={t("serviceFormDesc")}
          action={
            isEdit && existingQuery.data ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewService(existingQuery.data ?? null)}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                {t("preview")}
              </Button>
            ) : null
          }
        />

        <div className="space-y-6">
          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle>{t("basics")}</CardTitle>
              <CardDescription>{t("basicsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("titleLabel")}</Label>
                <Input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("titlePlaceholder")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("descriptionLabel")}</Label>
                <Textarea
                  className={cn(inputClass, "min-h-28")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <SearchableSelect
                  value={categoryId}
                  onValueChange={setCategoryId}
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  placeholder={t("selectCategory")}
                  triggerClassName={cn(inputClass, "w-full")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("pricingModel")}</Label>
                <Select
                  value={pricingModel}
                  onValueChange={(v) => setPricingModel(v as ServicePricingModel)}
                >
                  <SelectTrigger className={cn(inputClass, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_PER_EVENT">{t("modelFlat")}</SelectItem>
                    <SelectItem value="HOURLY">{t("modelHourly")}</SelectItem>
                    <SelectItem value="PER_GUEST">{t("modelPerGuest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("customizationMode")}</Label>
                <Select
                  value={customizationMode}
                  onValueChange={(v) =>
                    setCustomizationMode(v as ServiceCustomizationMode)
                  }
                >
                  <SelectTrigger className={cn(inputClass, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{t("modeNone")}</SelectItem>
                    <SelectItem value="PACKAGE">{t("modePackage")}</SelectItem>
                    <SelectItem value="MENU_BUILDER">{t("modeMenu")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("basePrice")}</Label>
                <NumberInput
                  className={inputClass}
                  value={basePrice ?? undefined}
                  onValueChange={(v) => setBasePrice(v ?? null)}
                  min={0}
                  integer
                />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-3 sm:col-span-2">
                <div className="space-y-1">
                  <Label htmlFor="instant-booking">{t("instantBooking")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("instantBookingHint")}
                  </p>
                </div>
                <Switch
                  id="instant-booking"
                  checked={instantBookingEnabled}
                  onCheckedChange={setInstantBookingEnabled}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("bookingMode")}</Label>
                <Select
                  value={bookingMode}
                  onValueChange={(v) => setBookingMode(v as ServiceBookingMode)}
                >
                  <SelectTrigger className={cn(inputClass, "w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DATE">{t("bookingModeDate")}</SelectItem>
                    <SelectItem value="SLOT">{t("bookingModeSlot")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("bookingModeHint")}
                </p>
              </div>
              {bookingMode === "DATE" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="booking-capacity">{t("bookingCapacity")}</Label>
                  <NumberInput
                    id="booking-capacity"
                    className={inputClass}
                    value={bookingCapacity}
                    onValueChange={(v) =>
                      setBookingCapacity(Math.min(10, Math.max(1, v ?? 1)))
                    }
                    min={1}
                    max={10}
                    integer
                    defaultOnBlur={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("bookingCapacityHint")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  {t("bookingCapacitySlotNote")}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="guest-min">{t("guestMin")}</Label>
                <NumberInput
                  id="guest-min"
                  className={inputClass}
                  value={guestMin}
                  onValueChange={(v) =>
                    setGuestMin(
                      v == null ? undefined : Math.max(1, Math.floor(v)),
                    )
                  }
                  min={1}
                  integer
                  placeholder={t("optional")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guest-max">{t("guestMax")}</Label>
                <NumberInput
                  id="guest-max"
                  className={inputClass}
                  value={guestMax}
                  onValueChange={(v) =>
                    setGuestMax(
                      v == null ? undefined : Math.max(1, Math.floor(v)),
                    )
                  }
                  min={1}
                  integer
                  placeholder={t("optional")}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                {t("guestBoundsHint")}
              </p>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("country")}</Label>
                <Select
                  value={countryCode || undefined}
                  onValueChange={(v) => {
                    setCountryCode(v);
                    setBaseCity("");
                    setCitiesServed([]);
                    const next = findActiveCountry(countries, v);
                    setCurrency(next?.defaultCurrency ?? "");
                    setTimezone(next?.defaultTimezone?.trim() || "");
                  }}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder={t("selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedCountry && countries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("noCountries")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("currency")}</Label>
                <Input
                  className={inputClass}
                  value={locationCurrency || ""}
                  disabled
                  placeholder={
                    countryCode
                      ? t("countryCurrencyMissing")
                      : t("selectCountryForCurrency")
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("countryCurrencyHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{tForms("timezone")}</Label>
                <Input
                  className={inputClass}
                  value={
                    locationTimezone
                      ? formatTimezoneLabel(locationTimezone)
                      : ""
                  }
                  disabled
                  placeholder={
                    countryCode
                      ? t("countryTimezoneMissing")
                      : t("selectCountryForTimezone")
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t("countryTimezoneHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label>{t("baseCity")}</Label>
                <Select
                  value={baseCity || undefined}
                  onValueChange={onBaseCityChange}
                  disabled={!countryCode || cities.length === 0}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue
                      placeholder={
                        !countryCode
                          ? t("selectCountryFirst")
                          : citiesFetching
                            ? tCommon("loading")
                            : t("selectBaseCity")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("citiesServed")}</Label>
                {!countryCode ? (
                  <p className="text-sm text-muted-foreground">
                    {t("selectCountryFirst")}
                  </p>
                ) : citiesFetching ? (
                  <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
                ) : citiesForServed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {baseCity ? t("noOtherCities") : t("noCities")}
                  </p>
                ) : (
                  <div className="grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-[#303030] p-3 sm:grid-cols-2">
                    {citiesForServed.map((city) => {
                      const checked = citiesServed.includes(city.name);
                      return (
                        <label
                          key={city.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              toggleCityServed(city.name, Boolean(v))
                            }
                          />
                          <span>{city.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{t("citiesServedHint")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardHeader>
              <CardTitle>{t("portfolio")}</CardTitle>
              <CardDescription>{t("portfolioDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t("coverImage")}</Label>
                {coverImage || coverPreview ? (
                  <SecureStoredImage
                    src={coverImage || coverPreview || ""}
                    previewSrc={coverPreview ?? undefined}
                    alt=""
                    className="h-40 w-full max-w-md rounded-lg object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={coverUploading}
                    onClick={() =>
                      document.getElementById("marketplace-cover-upload")?.click()
                    }
                  >
                    {coverUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {t("uploadCover")}
                  </Button>
                  {coverImage || coverPreview ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCover}
                    >
                      {tCommon("remove")}
                    </Button>
                  ) : null}
                  <input
                    id="marketplace-cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void onCoverUpload(file);
                    }}
                  />
                </div>
              </div>
              <VenueGalleryUpload
                urls={portfolio}
                previewUrls={portfolioPreviews}
                uploading={portfolioUploading}
                onUpload={onPortfolioUpload}
                onRemove={(index) => {
                  const url = portfolio[index];
                  if (url && portfolioPreviews[url]) {
                    URL.revokeObjectURL(portfolioPreviews[url]);
                    setPortfolioPreviews((prev) => {
                      const next = { ...prev };
                      delete next[url];
                      return next;
                    });
                  }
                  setPortfolio((prev) => prev.filter((_, i) => i !== index));
                }}
                inputId="marketplace-portfolio-upload"
                hint={t("portfolioHint")}
              />
            </CardContent>
          </Card>

          {bookingMode === "SLOT" ? (
            <>
              <Card className={dashboardCardClass}>
                <CardHeader>
                  <CardTitle>{t("weeklyHours")}</CardTitle>
                  <CardDescription>{t("weeklyHoursSlotHint")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <VenueScheduleEditor
                    schedules={schedules}
                    onChange={setSchedules}
                  />
                </CardContent>
              </Card>

              <Card className={dashboardCardClass}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle>{t("manageSlots")}</CardTitle>
                    <CardDescription>{t("formSlotsDesc")}</CardDescription>
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
                              className={inputClass}
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
                                inputClass,
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
                                inputClass,
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
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle>{t("weeklyHours")}</CardTitle>
                <CardDescription>{t("weeklyHoursDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <VenueScheduleEditor
                  schedules={schedules}
                  onChange={setSchedules}
                />
              </CardContent>
            </Card>
          )}

          {customizationMode === "PACKAGE" ? (
            <Card className={dashboardCardClass}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>{t("packages")}</CardTitle>
                  <CardDescription>{t("packagesDesc")}</CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPackages((prev) => [
                      ...prev,
                      {
                        name: "",
                        description: "",
                        price: 0,
                        isActive: true,
                        sortOrder: prev.length,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("addPackage")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {packages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noPackages")}</p>
                ) : (
                  packages.map((pkg, idx) => (
                    <div
                      key={idx}
                      className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                    >
                      <div className="space-y-2">
                        <Label>{t("packageName")}</Label>
                        <Input
                          className={inputClass}
                          value={pkg.name}
                          onChange={(e) =>
                            setPackages((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, name: e.target.value } : p,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("packagePrice")}</Label>
                        <NumberInput
                          className={inputClass}
                          value={pkg.price}
                          min={0}
                          integer
                          onValueChange={(v) =>
                            setPackages((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, price: v ?? 0 } : p,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>{t("packageDescription")}</Label>
                        <Textarea
                          className={inputClass}
                          value={pkg.description ?? ""}
                          onChange={(e) =>
                            setPackages((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, description: e.target.value }
                                  : p,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            setPackages((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          {t("removePackage")}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {customizationMode === "MENU_BUILDER" ? (
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle>{t("menuBuilderTitle")}</CardTitle>
                <CardDescription>{t("menuBuilderDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{t("menuCoursesTitle")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("menuCoursesDesc")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setMenuCourses((prev) => [
                          ...prev,
                          { name: "", dishes: [""] },
                        ])
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("addCourse")}
                    </Button>
                  </div>
                  {menuCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("noCoursesYet")}
                    </p>
                  ) : (
                    menuCourses.map((course, courseIdx) => (
                      <div
                        key={courseIdx}
                        className="space-y-3 rounded-lg border border-border p-4"
                      >
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="min-w-[12rem] flex-1 space-y-2">
                            <Label>{t("courseName")}</Label>
                            <Input
                              className={inputClass}
                              placeholder={t("ruleCoursePlaceholder")}
                              value={course.name}
                              onChange={(e) => {
                                const nextName = e.target.value;
                                const prevName = course.name;
                                setMenuCourses((prev) =>
                                  prev.map((c, i) =>
                                    i === courseIdx
                                      ? { ...c, name: nextName }
                                      : c,
                                  ),
                                );
                                if (prevName.trim()) {
                                  setPackages((prev) =>
                                    prev.map((p) => ({
                                      ...p,
                                      menuRules: (p.menuRules ?? []).map(
                                        (rule) =>
                                          rule.course === prevName
                                            ? { ...rule, course: nextName }
                                            : rule,
                                      ),
                                    })),
                                  );
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              const removed = course.name.trim();
                              setMenuCourses((prev) =>
                                prev.filter((_, i) => i !== courseIdx),
                              );
                              if (removed) {
                                setPackages((prev) =>
                                  prev.map((p) => ({
                                    ...p,
                                    menuRules: (p.menuRules ?? []).filter(
                                      (rule) => rule.course !== removed,
                                    ),
                                  })),
                                );
                              }
                            }}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            {t("removeCourse")}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("dishesForCourse")}</Label>
                          {course.dishes.map((dish, dishIdx) => (
                            <div key={dishIdx} className="flex gap-2">
                              <Input
                                className={inputClass}
                                placeholder={t("dishNamePlaceholder")}
                                value={dish}
                                onChange={(e) =>
                                  setMenuCourses((prev) =>
                                    prev.map((c, i) =>
                                      i === courseIdx
                                        ? {
                                            ...c,
                                            dishes: c.dishes.map((d, di) =>
                                              di === dishIdx
                                                ? e.target.value
                                                : d,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="shrink-0 text-destructive"
                                onClick={() =>
                                  setMenuCourses((prev) =>
                                    prev.map((c, i) =>
                                      i === courseIdx
                                        ? {
                                            ...c,
                                            dishes: c.dishes.filter(
                                              (_, di) => di !== dishIdx,
                                            ),
                                          }
                                        : c,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setMenuCourses((prev) =>
                                prev.map((c, i) =>
                                  i === courseIdx
                                    ? { ...c, dishes: [...c.dishes, ""] }
                                    : c,
                                ),
                              )
                            }
                          >
                            <Plus className="mr-1.5 h-4 w-4" />
                            {t("addDish")}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{t("packages")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("packagesDescMenuBuilder")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPackages((prev) => [
                          ...prev,
                          {
                            name: "",
                            description: "",
                            price: 0,
                            isActive: true,
                            sortOrder: prev.length,
                            menuRules: [],
                          },
                        ])
                      }
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("addPackage")}
                    </Button>
                  </div>
                  {packages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("noPackages")}
                    </p>
                  ) : (
                    packages.map((pkg, idx) => {
                      const courseOptions = menuCourses
                        .map((c) => c.name.trim())
                        .filter(Boolean);
                      return (
                        <div
                          key={idx}
                          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                        >
                          <div className="space-y-2">
                            <Label>{t("packageName")}</Label>
                            <Input
                              className={inputClass}
                              value={pkg.name}
                              onChange={(e) =>
                                setPackages((prev) =>
                                  prev.map((p, i) =>
                                    i === idx
                                      ? { ...p, name: e.target.value }
                                      : p,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t("packagePrice")}</Label>
                            <NumberInput
                              className={inputClass}
                              value={pkg.price}
                              min={0}
                              integer
                              onValueChange={(v) =>
                                setPackages((prev) =>
                                  prev.map((p, i) =>
                                    i === idx ? { ...p, price: v ?? 0 } : p,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label>{t("packageDescription")}</Label>
                            <Textarea
                              className={inputClass}
                              value={pkg.description ?? ""}
                              onChange={(e) =>
                                setPackages((prev) =>
                                  prev.map((p, i) =>
                                    i === idx
                                      ? { ...p, description: e.target.value }
                                      : p,
                                  ),
                                )
                              }
                            />
                          </div>
                          <div className="space-y-3 border-t border-border pt-3 sm:col-span-2">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <Label>{t("menuRules")}</Label>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {t("menuRulesSimpleDesc")}
                                </p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={courseOptions.length === 0}
                                onClick={() =>
                                  setPackages((prev) =>
                                    prev.map((p, i) =>
                                      i === idx
                                        ? {
                                            ...p,
                                            menuRules: [
                                              ...(p.menuRules ?? []),
                                              {
                                                course: courseOptions[0] ?? "",
                                                chooseCount: 1,
                                                menuItemIds: [],
                                                extraPerGuest: null,
                                              },
                                            ],
                                          }
                                        : p,
                                    ),
                                  )
                                }
                              >
                                <Plus className="mr-1.5 h-4 w-4" />
                                {t("addMenuRule")}
                              </Button>
                            </div>
                            {courseOptions.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {t("addCoursesBeforeRules")}
                              </p>
                            ) : (pkg.menuRules ?? []).length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {t("noMenuRulesYet")}
                              </p>
                            ) : (
                              (pkg.menuRules ?? []).map((rule, ruleIdx) => (
                                <div
                                  key={ruleIdx}
                                  className="grid gap-3 rounded-md border border-dashed border-border p-3 sm:grid-cols-[1fr_8rem_auto]"
                                >
                                  <div className="space-y-2">
                                    <Label>{t("ruleCourse")}</Label>
                                    <Select
                                      value={rule.course || undefined}
                                      onValueChange={(value) =>
                                        setPackages((prev) =>
                                          prev.map((p, i) =>
                                            i === idx
                                              ? {
                                                  ...p,
                                                  menuRules: (
                                                    p.menuRules ?? []
                                                  ).map((r, ri) =>
                                                    ri === ruleIdx
                                                      ? { ...r, course: value }
                                                      : r,
                                                  ),
                                                }
                                              : p,
                                          ),
                                        )
                                      }
                                    >
                                      <SelectTrigger className={inputClass}>
                                        <SelectValue
                                          placeholder={t("selectCourse")}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {courseOptions.map((name) => (
                                          <SelectItem key={name} value={name}>
                                            {name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>{t("chooseCount")}</Label>
                                    <NumberInput
                                      className={inputClass}
                                      value={rule.chooseCount}
                                      min={1}
                                      integer
                                      onValueChange={(v) =>
                                        setPackages((prev) =>
                                          prev.map((p, i) =>
                                            i === idx
                                              ? {
                                                  ...p,
                                                  menuRules: (
                                                    p.menuRules ?? []
                                                  ).map((r, ri) =>
                                                    ri === ruleIdx
                                                      ? {
                                                          ...r,
                                                          chooseCount: v ?? 1,
                                                        }
                                                      : r,
                                                  ),
                                                }
                                              : p,
                                          ),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive"
                                      onClick={() =>
                                        setPackages((prev) =>
                                          prev.map((p, i) =>
                                            i === idx
                                              ? {
                                                  ...p,
                                                  menuRules: (
                                                    p.menuRules ?? []
                                                  ).filter(
                                                    (_, ri) => ri !== ruleIdx,
                                                  ),
                                                }
                                              : p,
                                          ),
                                        )
                                      }
                                    >
                                      <Trash2 className="mr-1.5 h-4 w-4" />
                                      {t("removeMenuRule")}
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="sm:col-span-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() =>
                                setPackages((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
                              }
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              {t("removePackage")}
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className={dashboardCardClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle>{t("addOns")}</CardTitle>
                <CardDescription>{t("addOnsDesc")}</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setAddOns((prev) => [
                    ...prev,
                    {
                      name: "",
                      description: "",
                      price: 0,
                      isActive: true,
                      sortOrder: prev.length,
                    },
                  ])
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {t("addAddOn")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {addOns.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noAddOns")}</p>
              ) : (
                addOns.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
                  >
                    <div className="space-y-2">
                      <Label>{t("addOnName")}</Label>
                      <Input
                        className={inputClass}
                        value={item.name}
                        onChange={(e) =>
                          setAddOns((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, name: e.target.value } : p,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("addOnPrice")}</Label>
                      <NumberInput
                        className={inputClass}
                        value={item.price}
                        min={0}
                        integer
                        onValueChange={(v) =>
                          setAddOns((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, price: v ?? 0 } : p,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setAddOns((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {t("removeAddOn")}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={dashboardCardClass}>
            <CardFooter className="flex flex-wrap justify-end gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(paths.marketplace)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate({ submit: false })}
              >
                {saveMut.isPending && !saveMut.variables?.submit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("saveDraft")}
              </Button>
              <Button
                type="button"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate({ submit: true })}
              >
                {saveMut.isPending && saveMut.variables?.submit ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("saveAndSubmit")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardPanel>

      <ServicePublicPreviewDialog
        service={previewService}
        onClose={() => setPreviewService(null)}
        editHref={
          previewService
            ? paths.editMarketplaceService(previewService.id)
            : undefined
        }
      />
    </DashboardPageShell>
  );
}