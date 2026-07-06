"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CalendarOff,
  Clock,
  DollarSign,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput, parseOptionalNumericString } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/ui/form-field";
import dynamic from "next/dynamic";
import {
  PricingModelFields,
  defaultPricingForm,
  normalizePricingForSave,
  type PricingFormState,
} from "@/components/venues/PricingModelFields";
import { VenueScheduleEditor } from "@/components/venues/VenueScheduleEditor";
import { VenueGalleryUpload } from "@/components/venues/VenueGalleryUpload";
import { VenueAmenityEditor } from "@/components/venues/VenueAmenityEditor";
import { VenueReadinessPanel } from "@/components/venues/VenueReadinessPanel";
import { StatusBadge } from "@/components/venues/StatusBadge";

const LocationPickerMap = dynamic(
  () =>
    import("@/components/maps/location-picker-map").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => <LocationMapLoading />,
  },
);

function LocationMapLoading() {
  const t = useTranslations("venueSetup");
  return <p className="text-sm text-muted-foreground">{t("loadingMap")}</p>;
}
import {
  addVenueBlock,
  createVenue,
  getManagedVenue,
  listAmenityCatalog,
  listVenueTypes,
  removeVenueAmenity,
  removeVenueBlock,
  replaceVenueSchedules,
  submitVenueForReview,
  updateVenue,
  uploadVenueMedia,
  upsertVenueAmenity,
  upsertVenuePricing,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { VenueAmenityPayload } from "@/features/venues/types";
import { defaultWeeklySchedules, buildVenueCustomAttributes, evaluateVenueReadiness, isPropertyStyleVenueType, parseVenuePropertyAttributes } from "@/features/venues/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { listAdminVendorProfiles } from "@/features/vendor/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { fieldClassName, isBlank } from "@/lib/form-validation";

const TIMEZONES = [
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Europe/London",
  "America/New_York",
  "UTC",
];

const inputClass = "bg-input/50 border-border";

type VenueSetupWizardProps = {
  venueId?: string;
  dashboardScope?: "vendor" | "admin";
};

export function VenueSetupWizard({
  venueId,
  dashboardScope = "vendor",
}: VenueSetupWizardProps) {
  const t = useTranslations("venueSetup");
  const tForms = useTranslations("forms");
  const router = useRouter();
  const queryClient = useQueryClient();
  const paths = useDashboardPaths();
  const isAdminScope = dashboardScope === "admin";
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [createdVenueId, setCreatedVenueId] = useState<string | null>(null);
  const effectiveVenueId = venueId ?? createdVenueId ?? undefined;
  const hasPersistedVenue = !!effectiveVenueId;

  const [activeTab, setActiveTab] = useState("details");

  const { data: existing, isLoading } = useQuery({
    queryKey: venueKeys.managedDetail(effectiveVenueId ?? ""),
    queryFn: () => getManagedVenue(effectiveVenueId!),
    enabled: hasPersistedVenue,
  });

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorAttempted, setVendorAttempted] = useState(false);

  const { data: approvedVendors = [] } = useQuery({
    queryKey: ["admin-vendors-approved"],
    queryFn: () => listAdminVendorProfiles("APPROVED"),
    enabled: isAdminScope && !hasPersistedVenue,
  });

  const { data: venueTypes = [] } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: venueKeys.amenityCatalog(),
    queryFn: listAmenityCatalog,
  });

  const [details, setDetails] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    latitude: "25.2048",
    longitude: "55.2708",
    capacityMin: "",
    capacityMax: "",
    floorArea: "",
    bedrooms: "",
    bathrooms: "",
    venueTypeId: "",
    timezone: "Asia/Dubai",
    coverImage: "",
    gallery: [] as string[],
  });

  const [galleryUploading, setGalleryUploading] = useState(false);

  const [schedules, setSchedules] = useState(defaultWeeklySchedules());
  const [pricing, setPricing] = useState<PricingFormState>(defaultPricingForm());
  const [blockForm, setBlockForm] = useState({
    blockDate: "",
    reason: "",
    customOpenTime: "09:00",
    customCloseTime: "17:00",
    isBlocked: true,
  });

  const [policies, setPolicies] = useState({
    maxAdvanceDays: 365,
    freeCancelHoursBeforeStart: 48,
    lateRefundPercent: 0,
  });

  const [initialized, setInitialized] = useState(false);
  const [fieldAttempted, setFieldAttempted] = useState({
    name: false,
    address: false,
    blockDate: false,
    pricing: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  function handleTabChange(tab: string) {
    if (!hasPersistedVenue && tab !== "details") return;
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (effectiveVenueId) {
      params.set("id", effectiveVenueId);
    } else {
      params.delete("id");
    }
    router.replace(`${paths.addVenue}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (!hasPersistedVenue && activeTab !== "details") {
      setActiveTab("details");
    }
  }, [hasPersistedVenue, activeTab]);

  useEffect(() => {
    if (!existing || initialized) return;
    const propertyAttrs = parseVenuePropertyAttributes(existing.customAttributes);
    setDetails({
      name: existing.name,
      description: existing.description ?? "",
      address: existing.address,
      city: existing.city ?? "",
      latitude: String(existing.latitude ?? "25.2048"),
      longitude: String(existing.longitude ?? "55.2708"),
      capacityMin: existing.capacityMin ? String(existing.capacityMin) : "",
      capacityMax: existing.capacityMax ? String(existing.capacityMax) : "",
      floorArea: propertyAttrs.floorArea != null ? String(propertyAttrs.floorArea) : "",
      bedrooms: propertyAttrs.bedrooms != null ? String(propertyAttrs.bedrooms) : "",
      bathrooms: propertyAttrs.bathrooms != null ? String(propertyAttrs.bathrooms) : "",
      venueTypeId: existing.venueType?.id ?? "",
      timezone: existing.timezone,
      coverImage: existing.coverImage ?? "",
      gallery: existing.gallery ?? [],
    });
    if (existing.schedules?.length) {
      setSchedules(
        defaultWeeklySchedules().map((d) => {
          const found = existing.schedules!.find((s) => s.dayOfWeek === d.dayOfWeek);
          return found ?? d;
        }),
      );
    }
    if (existing.pricing) {
      const modelType = existing.pricing.modelType;
      const config = (existing.pricing.config as Record<string, unknown>) ?? {};
      setPricing({
        modelType,
        basePrice: Number(existing.pricing.basePrice),
        currency: existing.pricing.currency,
        taxRate: Number(existing.pricing.taxRate),
        config:
          modelType === "DAILY_BLOCK"
            ? {
                pricePerDay:
                  config.pricePerDay !== undefined
                    ? Number(config.pricePerDay)
                    : Number(existing.pricing.basePrice),
                minBookingDays: Number(config.minBookingDays) || 1,
              }
            : modelType === "HOURLY"
              ? {
                  slotDurationMinutes: 60,
                  bufferMinutes: Number(config.bufferMinutes) || 0,
                  ...config,
                }
              : config,
      });
    }
    const rules = (existing.rules as Record<string, unknown>) ?? {};
    const bookingPolicy = (rules.bookingPolicy as Record<string, unknown>) ?? {};
    const cancellationPolicy =
      (rules.cancellationPolicy as Record<string, unknown>) ?? {};
    setPolicies({
      maxAdvanceDays: Number(bookingPolicy.maxAdvanceDays) || 365,
      freeCancelHoursBeforeStart:
        Number(cancellationPolicy.freeCancelHoursBeforeStart) || 48,
      lateRefundPercent: Number(cancellationPolicy.lateRefundPercent) || 0,
    });
    setInitialized(true);
  }, [existing, initialized]);

  const saveDetails = useMutation({
    mutationFn: async () => {
      const propertyPayload = {
        floorArea: details.floorArea ? Number(details.floorArea) : undefined,
        bedrooms: details.bedrooms ? Number(details.bedrooms) : undefined,
        bathrooms: details.bathrooms ? Number(details.bathrooms) : undefined,
      };
      const payload = {
        name: details.name,
        description: details.description || undefined,
        address: details.address,
        city: details.city || undefined,
        latitude: Number(details.latitude),
        longitude: Number(details.longitude),
        capacityMin: details.capacityMin ? Number(details.capacityMin) : undefined,
        capacityMax: details.capacityMax ? Number(details.capacityMax) : undefined,
        venueTypeId: details.venueTypeId || undefined,
        timezone: details.timezone,
        coverImage: details.coverImage || undefined,
        gallery: details.gallery,
        customAttributes: buildVenueCustomAttributes(
          propertyPayload,
          existing?.customAttributes,
        ),
        rules: {
          ...((existing?.rules as Record<string, unknown>) ?? {}),
          bookingPolicy: { maxAdvanceDays: policies.maxAdvanceDays },
          cancellationPolicy: {
            freeCancelHoursBeforeStart: policies.freeCancelHoursBeforeStart,
            lateRefundPercent: policies.lateRefundPercent,
          },
        },
        ...(isAdminScope && !hasPersistedVenue && selectedVendorId
          ? { vendorId: selectedVendorId }
          : {}),
      };
      if (hasPersistedVenue && effectiveVenueId) {
        return updateVenue(effectiveVenueId, payload);
      }
      return createVenue(payload);
    },
    onSuccess: (venue) => {
      const wasCreate = !hasPersistedVenue;
      if (wasCreate) {
        setCreatedVenueId(venue.id);
        queryClient.invalidateQueries({ queryKey: venueKeys.all });
        const nextTab = "pricing";
        setActiveTab(nextTab);
        const params = new URLSearchParams({ id: venue.id, tab: nextTab });
        router.replace(`${paths.addVenue}?${params.toString()}`);
        toast.success(
          isAdminScope ? t("detailsSavedAdmin") : t("detailsSavedVendor"),
        );
        return;
      }
      toast.success(t("venueUpdated"));
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      queryClient.invalidateQueries({
        queryKey: venueKeys.managedDetail(effectiveVenueId!),
      });
    },
    onError: (e) => toastApiError(e),
  });

  const savePricing = useMutation({
    mutationFn: () => {
      if (!effectiveVenueId) throw new Error(t("saveVenueDetailsFirst"));
      return upsertVenuePricing(effectiveVenueId, normalizePricingForSave(pricing));
    },
    onSuccess: () => {
      toast.success(t("pricingSaved"));
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(effectiveVenueId!) });
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const saveSchedules = useMutation({
    mutationFn: () => {
      if (!effectiveVenueId) throw new Error(t("saveVenueDetailsFirst"));
      return replaceVenueSchedules(effectiveVenueId, { schedules });
    },
    onSuccess: () => {
      toast.success(t("scheduleSaved"));
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(effectiveVenueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const submitForReview = useMutation({
    mutationFn: () => {
      if (!effectiveVenueId) throw new Error(t("saveVenueDetailsFirst"));
      return submitVenueForReview(effectiveVenueId);
    },
    onSuccess: () => {
      toast.success(t("submittedForReview"));
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      queryClient.invalidateQueries({
        queryKey: venueKeys.managedDetail(effectiveVenueId!),
      });
    },
    onError: (e) => toastApiError(e),
  });

  const saveAmenity = useMutation({
    mutationFn: (payload: VenueAmenityPayload) => {
      if (!effectiveVenueId) throw new Error(t("saveVenueDetailsFirst"));
      return upsertVenueAmenity(effectiveVenueId, payload);
    },
    onSuccess: () => {
      toast.success(t("amenityAdded"));
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(effectiveVenueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const saveBlock = useMutation({
    mutationFn: () => {
      if (!effectiveVenueId) throw new Error(t("saveVenueDetailsFirst"));
      return addVenueBlock(effectiveVenueId, {
        blockDate: new Date(blockForm.blockDate).toISOString(),
        reason: blockForm.reason || undefined,
        customOpenTime: blockForm.customOpenTime,
        customCloseTime: blockForm.customCloseTime,
        isBlocked: blockForm.isBlocked,
      });
    },
    onSuccess: () => {
      toast.success(t("blockDateAdded"));
      setBlockForm({
        blockDate: "",
        reason: "",
        customOpenTime: "09:00",
        customCloseTime: "17:00",
        isBlocked: true,
      });
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(effectiveVenueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const uploadCover = async (file: File) => {
    try {
      const url = await uploadVenueMedia(file);
      setDetails((d) => ({ ...d, coverImage: url }));
      toast.success(t("coverUploaded"));
    } catch (e) {
      toastApiError(e);
    }
  };

  const onGalleryFiles = async (files: FileList) => {
    const list = Array.from(files);
    if (!list.length) return;
    try {
      setGalleryUploading(true);
      const results = await Promise.all(list.map((file) => uploadVenueMedia(file)));
      setDetails((d) => ({ ...d, gallery: [...d.gallery, ...results] }));
      toast.success(
        list.length === 1
          ? t("galleryImageUploaded")
          : t("galleryImagesUploaded", { count: list.length }),
      );
    } catch (e) {
      toastApiError(e);
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeGalleryAt = (index: number) => {
    setDetails((d) => ({
      ...d,
      gallery: d.gallery.filter((_, i) => i !== index),
    }));
  };

  const selectedVenueType = venueTypes.find((t) => t.id === details.venueTypeId);
  const showPropertyFields =
    !details.venueTypeId ||
    isPropertyStyleVenueType(selectedVenueType?.name, selectedVenueType?.slug);

  const readiness =
    existing?.readiness ??
    (existing
      ? evaluateVenueReadiness({
          name: existing.name,
          address: existing.address,
          coverImage: existing.coverImage,
          pricing: existing.pricing,
          schedules: existing.schedules,
          amenities: existing.amenities,
        })
      : null);

  const nameError =
    fieldAttempted.name && isBlank(details.name)
      ? tForms("fieldRequired", { field: t("venueName") })
      : null;
  const addressError =
    fieldAttempted.address && isBlank(details.address)
      ? tForms("fieldRequired", { field: tForms("address") })
      : null;
  const blockDateError =
    fieldAttempted.blockDate && isBlank(blockForm.blockDate)
      ? tForms("fieldRequired", { field: t("date") })
      : null;

  function trySaveDetails() {
    setFieldAttempted((a) => ({ ...a, name: true, address: true }));
    if (isBlank(details.name) || isBlank(details.address)) return;
    if (isAdminScope && !hasPersistedVenue && !selectedVendorId) {
      setVendorAttempted(true);
      toast.error(t("selectVendorError"));
      return;
    }
    saveDetails.mutate();
  }

  function trySaveBlock() {
    setFieldAttempted((a) => ({ ...a, blockDate: true }));
    if (isBlank(blockForm.blockDate)) return;
    saveBlock.mutate();
  }

  function trySavePricing() {
    setFieldAttempted((a) => ({ ...a, pricing: true }));
    if (pricing.basePrice <= 0) return;
    savePricing.mutate();
  }

  const vendorError =
    vendorAttempted && isAdminScope && !hasPersistedVenue && !selectedVendorId
      ? t("selectVendorHint")
      : null;

  const adminVendorField = isAdminScope && !hasPersistedVenue && (
    <FormField
      label={t("vendor")}
      htmlFor="venue-vendor"
      required
      error={vendorError}
      className="sm:col-span-2"
    >
      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
        <SelectTrigger
          id="venue-vendor"
          aria-invalid={!!vendorError}
          className={fieldClassName(cn(inputClass, "w-full"), !!vendorError)}
        >
          <SelectValue placeholder={t("selectVendor")} />
        </SelectTrigger>
        <SelectContent>
          {approvedVendors.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              {vendor.vendorName} · {vendor.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );

  const basicsFields = (
    <>
      {adminVendorField}
      <FormField
        label={t("venueName")}
        htmlFor="venue-name"
        required
        error={nameError}
        className="sm:col-span-2"
      >
        <Input
          id="venue-name"
          placeholder={t("venueNamePlaceholder")}
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
          aria-invalid={!!nameError}
          className={fieldClassName(inputClass, !!nameError)}
        />
      </FormField>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="venue-description">{t("description")}</Label>
        <Textarea
          id="venue-description"
          placeholder={t("descriptionPlaceholder")}
          value={details.description}
          onChange={(e) => setDetails({ ...details, description: e.target.value })}
          className={cn(inputClass, "min-h-24")}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("venueType")}</Label>
        <Select
          value={details.venueTypeId}
          onValueChange={(v) => setDetails({ ...details, venueTypeId: v })}
        >
          <SelectTrigger className={cn(inputClass, "w-full")}>
            <SelectValue placeholder={t("selectType")} />
          </SelectTrigger>
          <SelectContent>
            {venueTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
   
      </div>
      <div className="space-y-2">
        <Label>{t("capacity")}</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder={t("minPlaceholder")}
            integer
            min={0}
            value={parseOptionalNumericString(details.capacityMin)}
            onValueChange={(n) =>
              setDetails({ ...details, capacityMin: n === undefined ? "" : String(n) })
            }
            className={inputClass}
          />
          <span className="text-muted-foreground text-sm">{t("to")}</span>
          <NumberInput
            placeholder={t("maxPlaceholder")}
            integer
            min={0}
            value={parseOptionalNumericString(details.capacityMax)}
            onValueChange={(n) =>
              setDetails({ ...details, capacityMax: n === undefined ? "" : String(n) })
            }
            className={inputClass}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="venue-floor-area">{t("floorArea")}</Label>
        <NumberInput
          id="venue-floor-area"
          min={0}
          placeholder={t("floorAreaPlaceholder")}
          value={parseOptionalNumericString(details.floorArea)}
          onValueChange={(n) =>
            setDetails({ ...details, floorArea: n === undefined ? "" : String(n) })
          }
          className={inputClass}
        />
      </div>
      {showPropertyFields && (
        <>
          <div className="space-y-2">
            <Label htmlFor="venue-bedrooms">{t("bedrooms")}</Label>
            <NumberInput
              id="venue-bedrooms"
              integer
              min={0}
              placeholder={t("bedroomsPlaceholder")}
              value={parseOptionalNumericString(details.bedrooms)}
              onValueChange={(n) =>
                setDetails({ ...details, bedrooms: n === undefined ? "" : String(n) })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-bathrooms">{t("bathrooms")}</Label>
            <NumberInput
              id="venue-bathrooms"
              min={0}
              placeholder={t("bathroomsPlaceholder")}
              value={parseOptionalNumericString(details.bathrooms)}
              onValueChange={(n) =>
                setDetails({ ...details, bathrooms: n === undefined ? "" : String(n) })
              }
              className={inputClass}
            />
          </div>
        </>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label>{t("coverImage")}</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {details.coverImage ? (
            <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={details.coverImage}
                alt={t("venueCoverAlt")}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-32 w-48 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              {t("uploadPhoto")}
            </Button>
            {details.coverImage && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDetails({ ...details, coverImage: "" })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tForms("removeCover")}
              </Button>
            )}
          </div>
        </div>
      </div>
      <VenueGalleryUpload
        urls={details.gallery}
        uploading={galleryUploading}
        onUpload={onGalleryFiles}
        onRemove={removeGalleryAt}
        inputId={hasPersistedVenue ? "venue-gallery-upload-edit" : "venue-gallery-upload-create"}
      />
    </>
  );

  const locationFields = (
    <>
      <FormField
        label={tForms("address")}
        htmlFor="venue-address"
        required
        error={addressError}
      >
        <Input
          id="venue-address"
          placeholder={t("streetPlaceholder")}
          value={details.address}
          onChange={(e) => setDetails({ ...details, address: e.target.value })}
          aria-invalid={!!addressError}
          className={fieldClassName(inputClass, !!addressError)}
        />
      </FormField>
      <div className="space-y-2">
        <Label htmlFor="venue-city">{tForms("city")}</Label>
        <Input
          id="venue-city"
          placeholder={tForms("city")}
          value={details.city}
          onChange={(e) => setDetails({ ...details, city: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="venue-timezone">{tForms("timezone")}</Label>
        <Select
          value={details.timezone}
          onValueChange={(v) => setDetails({ ...details, timezone: v })}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <LocationPickerMap
          latitude={details.latitude}
          longitude={details.longitude}
          onPositionChange={(lat, lng) =>
            setDetails({ ...details, latitude: String(lat), longitude: String(lng) })
          }
        />
      </div>
    </>
  );

  if (venueId && isLoading && !existing) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("w-full min-w-0 space-y-6", isAdminScope ? "" : "mx-auto max-w-6xl")}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-white">
              {existing?.name ?? (!hasPersistedVenue ? t("createVenue") : t("setupVenue"))}
            </h1>
            {existing?.status && <StatusBadge status={existing.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            {!hasPersistedVenue ? t("createIntro") : t("editIntro")}
          </p>
        </div>
      </div>

      {readiness && !isAdminScope && hasPersistedVenue && (
        <VenueReadinessPanel
          readiness={readiness}
          status={existing?.status}
          rejectionReason={existing?.rejectionReason}
          onSubmit={() => submitForReview.mutate()}
          submitPending={submitForReview.isPending}
          onGoToCheck={(tab) => handleTabChange(tab)}
          mode="vendor"
        />
      )}

      {readiness && isAdminScope && hasPersistedVenue && (
        <VenueReadinessPanel
          readiness={readiness}
          status={existing?.status}
          onGoToCheck={(tab) => handleTabChange(tab)}
          mode="admin"
        />
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="details" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {t("details")}
          </TabsTrigger>
          {hasPersistedVenue && (
            <>
              <TabsTrigger value="pricing" className="gap-1.5">
                <DollarSign className="h-4 w-4" />
                {t("pricing")}
                {!existing?.pricing && (
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {t("setupBadge")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="schedules" className="gap-1.5">
                <Clock className="h-4 w-4" />
                {t("schedule")}
                {existing?.schedules && !existing.schedules.some((s) => s.isOpen) && (
                  <Badge variant="outline" className="ml-1 text-[10px]">
                    {t("setupBadge")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="amenities" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                {t("amenities")}
              </TabsTrigger>
              <TabsTrigger value="blocks" className="gap-1.5">
                <CalendarOff className="h-4 w-4" />
                {t("blocks")}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("basicInfo")}</CardTitle>
              <CardDescription>{t("basicInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {basicsFields}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("bookingPolicies")}</CardTitle>
              <CardDescription>{t("bookingPoliciesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-advance-days">{t("maxAdvanceDays")}</Label>
                <p className="text-xs text-muted-foreground">{t("maxAdvanceDaysHint")}</p>
                <NumberInput
                  id="max-advance-days"
                  integer
                  min={1}
                  max={730}
                  value={policies.maxAdvanceDays}
                  onValueChange={(v) =>
                    setPolicies({ ...policies, maxAdvanceDays: v ?? 365 })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free-cancel-hours">{t("freeCancelHours")}</Label>
                <p className="text-xs text-muted-foreground">{t("freeCancelHoursHint")}</p>
                <NumberInput
                  id="free-cancel-hours"
                  integer
                  min={0}
                  value={policies.freeCancelHoursBeforeStart}
                  onValueChange={(v) =>
                    setPolicies({
                      ...policies,
                      freeCancelHoursBeforeStart: v ?? 48,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="late-refund-percent">{t("lateRefundPercent")}</Label>
                <p className="text-xs text-muted-foreground">{t("lateRefundPercentHint")}</p>
                <NumberInput
                  id="late-refund-percent"
                  integer
                  min={0}
                  max={100}
                  value={policies.lateRefundPercent}
                  onValueChange={(v) =>
                    setPolicies({ ...policies, lateRefundPercent: v ?? 0 })
                  }
                  className={inputClass}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("location")}</CardTitle>
              <CardDescription>{t("locationDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {locationFields}
            </CardContent>
            <CardFooter className="border-t justify-end">
              <Button
                onClick={trySaveDetails}
                disabled={saveDetails.isPending}
              >
                {saveDetails.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {hasPersistedVenue ? t("saveDetails") : t("saveAndContinue")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {hasPersistedVenue && (
          <>
        <TabsContent value="pricing">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("pricing")}</CardTitle>
              <CardDescription>
                {t("pricingDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PricingModelFields
                value={pricing}
                onChange={setPricing}
                showErrors={fieldAttempted.pricing}
              />
            </CardContent>
            <CardFooter className="border-t justify-end">
              <Button
                onClick={trySavePricing}
                disabled={savePricing.isPending}
              >
                {savePricing.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("savePricing")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("weeklySchedule")}</CardTitle>
              <CardDescription>{t("weeklyScheduleDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <VenueScheduleEditor schedules={schedules} onChange={setSchedules} />
            </CardContent>
            <CardFooter className="border-t justify-end">
              <Button
                onClick={() => saveSchedules.mutate()}
                disabled={saveSchedules.isPending}
              >
                {saveSchedules.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("saveSchedule")}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("amenitiesServices")}</CardTitle>
              <CardDescription>{t("amenitiesServicesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <VenueAmenityEditor
                catalog={catalog}
                existingAmenities={existing?.amenities}
                isSaving={saveAmenity.isPending}
                onAdd={(payload) => saveAmenity.mutate(payload)}
                onRemove={async (amenityId) => {
                  if (!effectiveVenueId) return;
                  await removeVenueAmenity(effectiveVenueId, amenityId);
                  queryClient.invalidateQueries({
                    queryKey: venueKeys.managedDetail(effectiveVenueId),
                  });
                  toast.success(t("amenityRemoved"));
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>{t("blockDate")}</CardTitle>
              <CardDescription>{t("blockDateDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("date")} required error={blockDateError}>
                <Input
                  type="date"
                  value={blockForm.blockDate}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, blockDate: e.target.value })
                  }
                  aria-invalid={!!blockDateError}
                  className={fieldClassName(inputClass, !!blockDateError)}
                />
              </FormField>
              <div className="space-y-2">
                <Label>{t("reason")}</Label>
                <Input
                  placeholder={t("reasonPlaceholder")}
                  value={blockForm.reason}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, reason: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch
                  id="fully-blocked"
                  checked={blockForm.isBlocked}
                  onCheckedChange={(checked) =>
                    setBlockForm({ ...blockForm, isBlocked: checked })
                  }
                />
                <Label htmlFor="fully-blocked" className="cursor-pointer">
                  {t("fullyBlocked")}
                </Label>
              </div>
              {!blockForm.isBlocked && (
                <>
                  <div className="space-y-2">
                    <Label>{t("customOpenTime")}</Label>
                    <Input
                      type="time"
                      value={blockForm.customOpenTime}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, customOpenTime: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("customCloseTime")}</Label>
                    <Input
                      type="time"
                      value={blockForm.customCloseTime}
                      onChange={(e) =>
                        setBlockForm({ ...blockForm, customCloseTime: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t justify-end">
              <Button
                onClick={trySaveBlock}
                disabled={saveBlock.isPending}
              >
                {saveBlock.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("addBlock")}
              </Button>
            </CardFooter>
          </Card>

          {existing?.blocks && existing.blocks.length > 0 ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">{t("blockedDates")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {existing.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {new Date(b.blockDate).toLocaleDateString()}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant={b.isBlocked ? "destructive" : "secondary"}>
                        {b.isBlocked
                          ? t("closed")
                          : `${b.customOpenTime} – ${b.customCloseTime}`}
                      </Badge>
                      {b.reason && (
                        <span className="text-muted-foreground">{b.reason}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={async () => {
                        if (!effectiveVenueId) return;
                        await removeVenueBlock(effectiveVenueId, b.id);
                        queryClient.invalidateQueries({
                          queryKey: venueKeys.managedDetail(effectiveVenueId),
                        });
                        toast.success(t("blockRemoved"));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t("noBlockedDates")}
              </CardContent>
            </Card>
          )}
        </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
