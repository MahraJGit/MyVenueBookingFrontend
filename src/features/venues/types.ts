import type { PublicVendorProfile } from "@/features/events/api";

export type EntityStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "INACTIVE"
  | "CANCELLED"
  | "COMPLETED";

export type VenueReadinessCheck = {
  id: string;
  label: string;
  required: boolean;
  met: boolean;
  message?: string;
};

export type VenueReadiness = {
  ready: boolean;
  requiredComplete: number;
  requiredTotal: number;
  percentComplete: number;
  checks: VenueReadinessCheck[];
};

export type PricingModel = "HOURLY" | "NAMED_SLOTS" | "DAILY_BLOCK" | "FLAT_RATE";

export type AmenityPricingType =
  | "INCLUDED"
  | "PER_UNIT"
  | "PER_HOUR"
  | "FLAT_PER_EVENT"
  | "PACKAGE_BASED";

export type Currency = "AED" | "PKR" | "USD" | "EUR" | "GBP" | "SAR" | "QAR";

export type UnavailabilityReason =
  | "BLOCKED"
  | "CLOSED"
  | "FULLY_BOOKED"
  | "OUT_OF_WINDOW";

export type VenueType = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type AmenityCatalogItem = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  isActive?: boolean;
};

export type VenuePricing = {
  id?: string;
  modelType: PricingModel;
  basePrice: number | string;
  currency: Currency;
  taxRate: number | string;
  config: Record<string, unknown>;
};

export type VenueSchedule = {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

export type VenueBlock = {
  id: string;
  blockDate: string;
  reason?: string | null;
  customOpenTime: string;
  customCloseTime: string;
  isBlocked: boolean;
};

export type VenueAmenity = {
  id: string;
  catalogId: string;
  pricingType: AmenityPricingType;
  isIncluded: boolean;
  pricingConfig: Record<string, unknown>;
  capacity?: number | null;
  maxPerBooking?: number | null;
  catalog?: AmenityCatalogItem;
};

export type VenueVendor = PublicVendorProfile & {
  userId?: string;
};

export type PublicVenue = {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  countryCode?: string | null;
  city?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
  timezone: string;
  customAttributes?: Record<string, unknown>;
  rules?: Record<string, unknown> | null;
  coverImage?: string | null;
  thumbnail?: string | null;
  gallery?: string[];
  status?: EntityStatus;
  venueType?: VenueType | null;
  pricing?: VenuePricing | null;
  schedules?: VenueSchedule[];
  amenities?: VenueAmenity[];
  vendor?: VenueVendor | null;
  createdAt?: string;
};

export type ManagedVenue = PublicVenue & {
  rejectionReason?: string | null;
  blocks?: VenueBlock[];
  vendorId?: string | null;
  createdByUserId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  readiness?: VenueReadiness;
  /** True when active bookings lock structural edits. */
  contentOnlyEdit?: boolean;
};

export type PaginatedMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListPublicVenuesResult = {
  data: PublicVenue[];
  meta: PaginatedMeta;
};

export type ListManagedVenuesResult = {
  data: ManagedVenue[];
  meta: PaginatedMeta;
};

export type MonthAvailabilityDay = {
  date: string;
  available: boolean;
  reason?: UnavailabilityReason;
};

export type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  name?: string;
};

export type DayAvailability = {
  modelType: PricingModel;
  available: boolean;
  price: number;
  reason?: UnavailabilityReason;
  slots: AvailabilitySlot[];
};

export type VenueOpsDayBooking = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  source: "ONLINE" | "OFFLINE";
  guestName?: string | null;
  guestPhone?: string | null;
  specialRequests?: string | null;
  numGuests?: number | null;
  buyerLabel: string;
};

export type VenueOpsDay = {
  venueId: string;
  date: string;
  timezone: string;
  modelType: PricingModel;
  available: boolean;
  reason?: UnavailabilityReason;
  dayHours: {
    isAvailable: boolean;
    openTime: string | null;
    closeTime: string | null;
    reason: string | null;
  };
  block: {
    id: string;
    blockDate: string;
    reason?: string | null;
    isBlocked: boolean;
    customOpenTime: string;
    customCloseTime: string;
  } | null;
  slots: AvailabilitySlot[];
  bookings: VenueOpsDayBooking[];
};

export type VenueOfflineBookingPayload = {
  startTime: string;
  endTime: string;
  guestName?: string | null;
  guestPhone?: string | null;
  specialRequests?: string | null;
  numGuests?: number | null;
};

export type CreateVenuePayload = {
  name: string;
  description?: string;
  address: string;
  countryCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  capacityMin?: number;
  capacityMax?: number;
  venueTypeId: string;
  timezone?: string;
  coverImage: string;
  thumbnail?: string | null;
  gallery: string[];
  customAttributes?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  vendorId?: string;
};

export type UpdateVenuePayload = Partial<CreateVenuePayload> & {
  coverImage?: string;
  thumbnail?: string | null;
  gallery?: string[];
};

export type VenuePricingPayload = {
  modelType: PricingModel;
  basePrice: number;
  currency: Currency;
  taxRate?: number;
  config: Record<string, unknown>;
};

export type VenueSchedulesPayload = {
  schedules: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
};

export type VenueBlockPayload = {
  blockDate: string;
  reason?: string;
  customOpenTime: string;
  customCloseTime: string;
  isBlocked: boolean;
};

export type VenueAmenityPayload = {
  catalogId: string;
  pricingType: AmenityPricingType;
  isIncluded?: boolean;
  pricingConfig?: Record<string, unknown>;
  capacity?: number;
  maxPerBooking?: number;
};

export type VenueStatusPayload = {
  status: "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE" | "CANCELLED";
  reason?: string;
};
