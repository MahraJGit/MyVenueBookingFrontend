"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import {
  PricingModelFields,
  defaultPricingForm,
  type PricingFormState,
} from "@/components/venues/PricingModelFields";

const LocationPickerMap = dynamic(
  () =>
    import("@/components/maps/location-picker-map").then((m) => m.LocationPickerMap),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading map...</p> },
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
  updateVenue,
  uploadVenueMedia,
  upsertVenueAmenity,
  upsertVenuePricing,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { VenueAmenityPayload } from "@/features/venues/types";
import { DAY_NAMES, defaultWeeklySchedules } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";

type VenueSetupWizardProps = {
  venueId?: string;
};

export function VenueSetupWizard({ venueId }: VenueSetupWizardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!venueId;

  const { data: existing, isLoading } = useQuery({
    queryKey: venueKeys.managedDetail(venueId ?? ""),
    queryFn: () => getManagedVenue(venueId!),
    enabled: isEdit,
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
    venueTypeId: "",
    timezone: "Asia/Dubai",
    coverImage: "",
    gallery: [] as string[],
  });

  const [schedules, setSchedules] = useState(defaultWeeklySchedules());
  const [pricing, setPricing] = useState<PricingFormState>(defaultPricingForm());
  const [amenityForm, setAmenityForm] = useState<VenueAmenityPayload>({
    catalogId: "",
    pricingType: "PER_UNIT",
    isIncluded: false,
    pricingConfig: { unitPrice: 25 },
  });
  const [blockForm, setBlockForm] = useState({
    blockDate: "",
    reason: "",
    customOpenTime: "09:00",
    customCloseTime: "17:00",
    isBlocked: true,
  });

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!existing || initialized) return;
    setDetails({
      name: existing.name,
      description: existing.description ?? "",
      address: existing.address,
      city: existing.city ?? "",
      latitude: String(existing.latitude ?? "25.2048"),
      longitude: String(existing.longitude ?? "55.2708"),
      capacityMin: existing.capacityMin ? String(existing.capacityMin) : "",
      capacityMax: existing.capacityMax ? String(existing.capacityMax) : "",
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
      setPricing({
        modelType: existing.pricing.modelType,
        basePrice: Number(existing.pricing.basePrice),
        currency: existing.pricing.currency,
        taxRate: Number(existing.pricing.taxRate),
        config: (existing.pricing.config as Record<string, unknown>) ?? {},
      });
    }
    setInitialized(true);
  }, [existing, initialized]);

  const saveDetails = useMutation({
    mutationFn: async () => {
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
      };
      if (isEdit && venueId) {
        return updateVenue(venueId, payload);
      }
      return createVenue(payload);
    },
    onSuccess: (venue) => {
      toast.success(isEdit ? "Venue updated" : "Venue created");
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      if (!isEdit) {
        router.replace(`/vendorDashboard/venues/${venue.id}/edit`);
      }
    },
    onError: (e) => toastApiError(e),
  });

  const savePricing = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return upsertVenuePricing(venueId, pricing);
    },
    onSuccess: () => {
      toast.success("Pricing saved");
      queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
    },
    onError: (e) => toastApiError(e),
  });

  const saveSchedules = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return replaceVenueSchedules(venueId, { schedules });
    },
    onSuccess: () => toast.success("Schedules saved"),
    onError: (e) => toastApiError(e),
  });

  const saveAmenity = useMutation({
    mutationFn: () => {
      if (!venueId) throw new Error("Save venue details first");
      return upsertVenueAmenity(venueId, amenityForm);
    },
    onSuccess: () => {
      toast.success("Amenity saved");
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

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? "Edit venue" : "Create venue"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete each section to prepare your venue for admin approval.
        </p>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="flex flex-wrap bg-[#1B1B1B] border border-[#303030]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="pricing" disabled={!venueId}>Pricing</TabsTrigger>
          <TabsTrigger value="schedules" disabled={!venueId}>Schedule</TabsTrigger>
          <TabsTrigger value="amenities" disabled={!venueId}>Amenities</TabsTrigger>
          <TabsTrigger value="blocks" disabled={!venueId}>Blocks</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Venue name</Label>
              <Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} className="border-[#303030] bg-black min-h-24" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>Venue type</Label>
              <Select value={details.venueTypeId} onValueChange={(v) => setDetails({ ...details, venueTypeId: v })}>
                <SelectTrigger className="border-[#303030] bg-black"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {venueTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={details.timezone} onChange={(e) => setDetails({ ...details, timezone: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>Min capacity</Label>
              <Input type="number" value={details.capacityMin} onChange={(e) => setDetails({ ...details, capacityMin: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>Max capacity</Label>
              <Input type="number" value={details.capacityMax} onChange={(e) => setDetails({ ...details, capacityMax: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Cover image</Label>
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} className="border-[#303030] bg-black" />
              {details.coverImage && <p className="text-xs text-muted-foreground truncate">{details.coverImage}</p>}
            </div>
          </div>

          <LocationPickerMap
            latitude={details.latitude}
            longitude={details.longitude}
            onPositionChange={(lat, lng) => setDetails({ ...details, latitude: String(lat), longitude: String(lng) })}
            onAddressHint={(hint) =>
              setDetails((d) => ({
                ...d,
                address: hint.addressLine ?? d.address,
                city: hint.city ?? d.city,
              }))
            }
          />

          <Button onClick={() => saveDetails.mutate()} disabled={saveDetails.isPending || !details.name || !details.address}>
            {saveDetails.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save details" : "Create venue & continue"}
          </Button>
        </TabsContent>

        <TabsContent value="pricing">
          <PricingModelFields value={pricing} onChange={setPricing} />
          <Button className="mt-4" onClick={() => savePricing.mutate()} disabled={savePricing.isPending}>
            Save pricing
          </Button>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-3">
          {schedules.map((row, idx) => (
            <div key={row.dayOfWeek} className="grid gap-2 rounded-lg border border-[#303030] p-3 sm:grid-cols-4">
              <span className="text-sm text-white">{DAY_NAMES[row.dayOfWeek]}</span>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={row.isOpen} onChange={(e) => {
                  const next = [...schedules];
                  next[idx] = { ...next[idx], isOpen: e.target.checked };
                  setSchedules(next);
                }} />
                Open
              </label>
              <Input value={row.openTime} onChange={(e) => { const next = [...schedules]; next[idx] = { ...next[idx], openTime: e.target.value }; setSchedules(next); }} className="border-[#303030] bg-black" />
              <Input value={row.closeTime} onChange={(e) => { const next = [...schedules]; next[idx] = { ...next[idx], closeTime: e.target.value }; setSchedules(next); }} className="border-[#303030] bg-black" />
            </div>
          ))}
          <Button onClick={() => saveSchedules.mutate()} disabled={saveSchedules.isPending}>Save schedules</Button>
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Catalog item</Label>
              <Select value={amenityForm.catalogId} onValueChange={(v) => setAmenityForm({ ...amenityForm, catalogId: v })}>
                <SelectTrigger className="border-[#303030] bg-black"><SelectValue placeholder="Select amenity" /></SelectTrigger>
                <SelectContent>
                  {catalog.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pricing type</Label>
              <Select value={amenityForm.pricingType} onValueChange={(v) => setAmenityForm({ ...amenityForm, pricingType: v as VenueAmenityPayload["pricingType"] })}>
                <SelectTrigger className="border-[#303030] bg-black"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCLUDED">Included</SelectItem>
                  <SelectItem value="PER_UNIT">Per unit</SelectItem>
                  <SelectItem value="PER_HOUR">Per hour</SelectItem>
                  <SelectItem value="FLAT_PER_EVENT">Flat per event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit price</Label>
              <Input type="number" value={Number((amenityForm.pricingConfig as { unitPrice?: number }).unitPrice) || 0} onChange={(e) => setAmenityForm({ ...amenityForm, pricingConfig: { unitPrice: Number(e.target.value) } })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>Max per booking</Label>
              <Input type="number" value={amenityForm.maxPerBooking ?? ""} onChange={(e) => setAmenityForm({ ...amenityForm, maxPerBooking: Number(e.target.value) || undefined })} className="border-[#303030] bg-black" />
            </div>
          </div>
          <Button onClick={() => saveAmenity.mutate()} disabled={saveAmenity.isPending || !amenityForm.catalogId}>Add amenity</Button>

          {existing?.amenities && existing.amenities.length > 0 && (
            <ul className="space-y-2">
              {existing.amenities.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-[#303030] p-3 text-sm text-white">
                  <span>{a.catalog?.name ?? a.id}</span>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                    await removeVenueAmenity(venueId!, a.id);
                    queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
                    toast.success("Amenity removed");
                  }}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={blockForm.blockDate} onChange={(e) => setBlockForm({ ...blockForm, blockDate: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="border-[#303030] bg-black" />
            </div>
            <label className="flex items-center gap-2 text-sm text-white sm:col-span-2">
              <input type="checkbox" checked={blockForm.isBlocked} onChange={(e) => setBlockForm({ ...blockForm, isBlocked: e.target.checked })} />
              Fully blocked (closed all day)
            </label>
            {!blockForm.isBlocked && (
              <>
                <Input value={blockForm.customOpenTime} onChange={(e) => setBlockForm({ ...blockForm, customOpenTime: e.target.value })} className="border-[#303030] bg-black" placeholder="Open HH:mm" />
                <Input value={blockForm.customCloseTime} onChange={(e) => setBlockForm({ ...blockForm, customCloseTime: e.target.value })} className="border-[#303030] bg-black" placeholder="Close HH:mm" />
              </>
            )}
          </div>
          <Button onClick={() => saveBlock.mutate()} disabled={saveBlock.isPending || !blockForm.blockDate}>Add block</Button>

          {existing?.blocks && existing.blocks.length > 0 && (
            <ul className="space-y-2">
              {existing.blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-[#303030] p-3 text-sm text-white">
                  <span>{new Date(b.blockDate).toLocaleDateString()} — {b.isBlocked ? "Closed" : `${b.customOpenTime}-${b.customCloseTime}`}</span>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                    await removeVenueBlock(venueId!, b.id);
                    queryClient.invalidateQueries({ queryKey: venueKeys.managedDetail(venueId!) });
                    toast.success("Block removed");
                  }}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
