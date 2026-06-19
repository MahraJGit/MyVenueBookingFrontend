"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ImagePlus,
  Loader2,
  MapPin,
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
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading map...</p>
    ),
  },
);
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
import { fieldClassName, isBlank, requiredMessage } from "@/lib/form-validation";

const TIMEZONES = [
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Europe/London",
  "America/New_York",
  "UTC",
];

const CREATE_STEPS = [
  { id: "basics", label: "Basics", icon: Building2 },
  { id: "location", label: "Location", icon: MapPin },
] as const;

const inputClass = "bg-input/50 border-border";

type VenueSetupWizardProps = {
  venueId?: string;
  dashboardScope?: "vendor" | "admin";
};

export function VenueSetupWizard({
  venueId,
  dashboardScope = "vendor",
}: VenueSetupWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const paths = useDashboardPaths();
  const isAdminScope = dashboardScope === "admin";
  const isEdit = !!venueId;
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [createStep, setCreateStep] = useState(0);
  const [activeTab, setActiveTab] = useState("details");

  const { data: existing, isLoading } = useQuery({
    queryKey: venueKeys.managedDetail(venueId ?? ""),
    queryFn: () => getManagedVenue(venueId!),
    enabled: isEdit,
  });

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [vendorAttempted, setVendorAttempted] = useState(false);

  const { data: approvedVendors = [] } = useQuery({
    queryKey: ["admin-vendors-approved"],
    queryFn: () => listAdminVendorProfiles("APPROVED"),
    enabled: isAdminScope && !isEdit,
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

  const [initialized, setInitialized] = useState(false);
  const [fieldAttempted, setFieldAttempted] = useState({
    name: false,
    address: false,
    blockDate: false,
    pricing: false,
  });

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab);
  }, []);

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
                dayStartTime: String(config.dayStartTime ?? "00:00"),
                dayEndTime: String(config.dayEndTime ?? "23:59"),
                ...config,
              }
            : modelType === "HOURLY"
              ? {
                  slotDurationMinutes: 60,
                  bufferMinutes: Number(config.bufferMinutes) || 0,
                  minBookingSlots: Number(config.minBookingSlots) || 1,
                  ...config,
                }
              : config,
      });
    }
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
        ...(isAdminScope && !isEdit && selectedVendorId
          ? { vendorId: selectedVendorId }
          : {}),
      };
      if (isEdit && venueId) {
        return updateVenue(venueId, payload);
      }
      return createVenue(payload);
    },
    onSuccess: (venue) => {
      toast.success(
        isEdit
          ? "Venue updated"
          : isAdminScope
            ? "Venue created and is active — complete pricing and schedule when ready"
            : "Venue created — complete pricing and schedule, then submit for review",
      );
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      if (!isEdit) {
        router.replace(`${paths.editVenue(venue.id)}?tab=pricing`);
      }
    },
    onError: (e) => toastApiError(e),
  });

  const savePricing = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return upsertVenuePricing(venueId, normalizePricingForSave(pricing));
    },
    onSuccess: () => {
      toast.success("Pricing saved");
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const saveSchedules = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return replaceVenueSchedules(venueId, { schedules });
    },
    onSuccess: () => {
      toast.success("Schedule saved");
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const submitForReview = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return submitVenueForReview(venueId);
    },
    onSuccess: () => {
      toast.success("Venue submitted for admin review");
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const saveAmenity = useMutation({
    mutationFn: (payload: VenueAmenityPayload) => {
      if (!venueId) throw new Error("Save venue details first");
      return upsertVenueAmenity(venueId, payload);
    },
    onSuccess: () => {
      toast.success("Amenity added");
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const saveBlock = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return addVenueBlock(venueId, {
        blockDate: new Date(blockForm.blockDate).toISOString(),
        reason: blockForm.reason || undefined,
        customOpenTime: blockForm.customOpenTime,
        customCloseTime: blockForm.customCloseTime,
        isBlocked: blockForm.isBlocked,
      });
    },
    onSuccess: () => {
      toast.success("Block date added");
      setBlockForm({
        blockDate: "",
        reason: "",
        customOpenTime: "09:00",
        customCloseTime: "17:00",
        isBlocked: true,
      });
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const uploadCover = async (file: File) => {
    try {
      const url = await uploadVenueMedia(file);
      setDetails((d) => ({ ...d, coverImage: url }));
      toast.success("Cover image uploaded");
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
        list.length === 1 ? "Gallery image uploaded" : `${list.length} images uploaded`,
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
        })
      : null);

  const nameError =
    fieldAttempted.name && isBlank(details.name) ? requiredMessage("Venue name") : null;
  const addressError =
    fieldAttempted.address && isBlank(details.address) ? requiredMessage("Address") : null;
  const blockDateError =
    fieldAttempted.blockDate && isBlank(blockForm.blockDate)
      ? requiredMessage("Date")
      : null;

  function trySaveDetails() {
    setFieldAttempted((a) => ({ ...a, name: true, address: true }));
    if (isBlank(details.name) || isBlank(details.address)) return;
    if (isAdminScope && !isEdit && !selectedVendorId) {
      setVendorAttempted(true);
      toast.error("Select a vendor for this venue");
      return;
    }
    saveDetails.mutate();
  }

  function tryContinueCreateStep() {
    if (createStep === 0) {
      setFieldAttempted((a) => ({ ...a, name: true }));
      if (isBlank(details.name)) return;
      if (isAdminScope && !selectedVendorId) {
        setVendorAttempted(true);
        toast.error("Select a vendor for this venue");
        return;
      }
      setCreateStep((s) => s + 1);
      return;
    }
    setFieldAttempted((a) => ({ ...a, name: true, address: true }));
    if (isBlank(details.name) || isBlank(details.address)) return;
    if (isAdminScope && !selectedVendorId) {
      setVendorAttempted(true);
      toast.error("Select a vendor for this venue");
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
    vendorAttempted && isAdminScope && !isEdit && !selectedVendorId
      ? "Select the vendor who owns this venue"
      : null;

  const adminVendorField = isAdminScope && !isEdit && (
    <FormField
      label="Vendor"
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
          <SelectValue placeholder="Select approved vendor" />
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
        label="Venue name"
        htmlFor="venue-name"
        required
        error={nameError}
        className="sm:col-span-2"
      >
        <Input
          id="venue-name"
          placeholder="e.g. Sunset Garden Hall"
          value={details.name}
          onChange={(e) => setDetails({ ...details, name: e.target.value })}
          aria-invalid={!!nameError}
          className={fieldClassName(inputClass, !!nameError)}
        />
      </FormField>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="venue-description">Description</Label>
        <Textarea
          id="venue-description"
          placeholder="Tell guests what makes your venue special..."
          value={details.description}
          onChange={(e) => setDetails({ ...details, description: e.target.value })}
          className={cn(inputClass, "min-h-24")}
        />
      </div>
      <div className="space-y-2">
        <Label>Venue type</Label>
        <Select
          value={details.venueTypeId}
          onValueChange={(v) => setDetails({ ...details, venueTypeId: v })}
        >
          <SelectTrigger className={cn(inputClass, "w-full")}>
            <SelectValue placeholder="Select type" />
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
        <Label>Capacity</Label>
        <div className="flex items-center gap-2">
          <NumberInput
            placeholder="Min"
            integer
            min={0}
            value={parseOptionalNumericString(details.capacityMin)}
            onValueChange={(n) =>
              setDetails({ ...details, capacityMin: n === undefined ? "" : String(n) })
            }
            className={inputClass}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <NumberInput
            placeholder="Max"
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
        <Label htmlFor="venue-floor-area">Floor area (sq ft)</Label>
        <NumberInput
          id="venue-floor-area"
          min={0}
          placeholder="e.g. 2500"
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
            <Label htmlFor="venue-bedrooms">Bedrooms</Label>
            <NumberInput
              id="venue-bedrooms"
              integer
              min={0}
              placeholder="e.g. 3"
              value={parseOptionalNumericString(details.bedrooms)}
              onValueChange={(n) =>
                setDetails({ ...details, bedrooms: n === undefined ? "" : String(n) })
              }
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue-bathrooms">Bathrooms</Label>
            <NumberInput
              id="venue-bathrooms"
              min={0}
              placeholder="e.g. 2"
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
        <Label>Cover image</Label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {details.coverImage ? (
            <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={details.coverImage}
                alt="Venue cover"
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
              Upload photo
            </Button>
            {details.coverImage && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDetails({ ...details, coverImage: "" })}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
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
        inputId={isEdit ? "venue-gallery-upload-edit" : "venue-gallery-upload-create"}
      />
    </>
  );

  const locationFields = (
    <>
      <FormField
        label="Address"
        htmlFor="venue-address"
        required
        error={addressError}
      >
        <Input
          id="venue-address"
          placeholder="Street address"
          value={details.address}
          onChange={(e) => setDetails({ ...details, address: e.target.value })}
          aria-invalid={!!addressError}
          className={fieldClassName(inputClass, !!addressError)}
        />
      </FormField>
      <div className="space-y-2">
        <Label htmlFor="venue-city">City</Label>
        <Input
          id="venue-city"
          placeholder="City"
          value={details.city}
          onChange={(e) => setDetails({ ...details, city: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Timezone</Label>
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
          onAddressHint={(hint) =>
            setDetails((d) => ({
              ...d,
              address: hint.fullAddress ?? hint.addressLine ?? d.address,
              city: hint.city ?? d.city,
            }))
          }
        />
      </div>
    </>
  );

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Create mode: guided 2-step wizard ───────────────────────────────────
  if (!isEdit) {
    const progress = ((createStep + 1) / CREATE_STEPS.length) * 100;

    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Create your venue</h1>
          <p className="text-sm text-muted-foreground">
            A few quick steps to get your listing started.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {createStep + 1} of {CREATE_STEPS.length}
            </span>
            <span className="font-medium text-foreground">
              {CREATE_STEPS[createStep].label}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-2">
            {CREATE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    i === createStep
                      ? "border-primary bg-primary/10 text-foreground"
                      : i < createStep
                        ? "border-border bg-card text-muted-foreground"
                        : "border-border bg-card/50 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {step.label}
                </div>
              );
            })}
          </div>
        </div>

        {createStep === 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>
                Name, type, and a photo help guests find your venue.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {basicsFields}
            </CardContent>
          </Card>
        )}

        {createStep === 1 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Pin your venue on the map so guests know where to find you.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {locationFields}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={createStep === 0}
            onClick={() => setCreateStep((s) => s - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {createStep < CREATE_STEPS.length - 1 ? (
            <Button type="button" onClick={tryContinueCreateStep}>
              Continue
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={tryContinueCreateStep} disabled={saveDetails.isPending}>
              {saveDetails.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create venue
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Edit mode: full tabbed editor ───────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-white">
              {existing?.name ?? "Edit venue"}
            </h1>
            {existing?.status && <StatusBadge status={existing.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            Update details, pricing, schedule, and availability.
          </p>
        </div>
      </div>

      {readiness && !isAdminScope && (
        <VenueReadinessPanel
          readiness={readiness}
          status={existing?.status}
          rejectionReason={existing?.rejectionReason}
          onSubmit={() => submitForReview.mutate()}
          submitPending={submitForReview.isPending}
          onGoToCheck={(tab) => setActiveTab(tab)}
          mode="vendor"
        />
      )}

      {readiness && isAdminScope && (
        <VenueReadinessPanel
          readiness={readiness}
          status={existing?.status}
          onGoToCheck={(tab) => setActiveTab(tab)}
          mode="admin"
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/50 p-1">
          <TabsTrigger value="details" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5">
            <DollarSign className="h-4 w-4" />
            Pricing
            {!existing?.pricing && (
              <Badge variant="outline" className="ml-1 text-[10px]">
                Setup
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5">
            <Clock className="h-4 w-4" />
            Schedule
            {existing?.schedules && !existing.schedules.some((s) => s.isOpen) && (
              <Badge variant="outline" className="ml-1 text-[10px]">
                Setup
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="amenities" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Amenities
          </TabsTrigger>
          <TabsTrigger value="blocks" className="gap-1.5">
            <CalendarOff className="h-4 w-4" />
            Blocks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>Name, type, capacity, and cover photo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {basicsFields}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Address and map pin for your venue.</CardDescription>
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
                Save details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>
                Set how customers are charged for bookings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingModelFields
                value={pricing}
                onChange={setPricing}
                showErrors={fieldAttempted.pricing}
              />
            </CardContent>
            <CardFooter className="border-t justify-end">
              <Button onClick={trySavePricing} disabled={savePricing.isPending}>
                {savePricing.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save pricing
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Weekly schedule</CardTitle>
              <CardDescription>
                Set opening hours for each day of the week.
              </CardDescription>
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
                Save schedule
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Amenities &amp; services</CardTitle>
              <CardDescription>
                Pick from the admin catalog. Mark items as included with the booking or as
                optional paid add-ons with your pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VenueAmenityEditor
                catalog={catalog}
                existingAmenities={existing?.amenities}
                isSaving={saveAmenity.isPending}
                onAdd={(payload) => saveAmenity.mutate(payload)}
                onRemove={async (amenityId) => {
                  await removeVenueAmenity(venueId!, amenityId);
                  queryClient.invalidateQueries({
                    queryKey: venueKeys.managedDetail(venueId!),
                  });
                  toast.success("Amenity removed");
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Block a date</CardTitle>
              <CardDescription>
                Mark dates when your venue is closed or has custom hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" required error={blockDateError}>
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
                <Label>Reason</Label>
                <Input
                  placeholder="e.g. Private event"
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
                  Fully blocked (closed all day)
                </Label>
              </div>
              {!blockForm.isBlocked && (
                <>
                  <div className="space-y-2">
                    <Label>Custom open time</Label>
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
                    <Label>Custom close time</Label>
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
              <Button onClick={trySaveBlock} disabled={saveBlock.isPending}>
                {saveBlock.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add block
              </Button>
            </CardFooter>
          </Card>

          {existing?.blocks && existing.blocks.length > 0 ? (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Blocked dates</CardTitle>
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
                          ? "Closed"
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
                        await removeVenueBlock(venueId!, b.id);
                        queryClient.invalidateQueries({
                          queryKey: venueKeys.managedDetail(venueId!),
                        });
                        toast.success("Block removed");
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
                No blocked dates. Add dates when your venue is unavailable.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
