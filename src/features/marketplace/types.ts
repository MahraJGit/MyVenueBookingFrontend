import type { Currency, EntityStatus } from "@/features/venues/types";

export type { Currency, EntityStatus };

export type ServicePricingModel = "FLAT_PER_EVENT" | "HOURLY" | "PER_GUEST";

export type ServiceBookingMode = "DATE" | "SLOT";

export type ServiceCustomizationMode = "NONE" | "PACKAGE" | "MENU_BUILDER";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  children?: ServiceCategory[];
  createdAt?: string;
  updatedAt?: string;
};

export type ServicePackageMenuRule = {
  id?: string;
  course: string;
  chooseCount: number;
  menuItemIds?: string[];
  extraPerGuest?: number | string | null;
};

export type ServicePackage = {
  id?: string;
  name: string;
  description?: string | null;
  price: number | string;
  isActive?: boolean;
  sortOrder?: number;
  menuRules?: ServicePackageMenuRule[];
};

export type ServiceAddOn = {
  id?: string;
  name: string;
  description?: string | null;
  price: number | string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ServiceMenuItem = {
  id?: string;
  name: string;
  description?: string | null;
  course?: string | null;
  price?: number | string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type ServiceSchedule = {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

export type ServiceBlock = {
  id: string;
  blockDate: string;
  reason?: string | null;
  customOpenTime: string;
  customCloseTime: string;
  isBlocked: boolean;
};

/** Recurring time window that repeats on weekly open days (SLOT booking mode). */
export type ServiceSlotTemplate = {
  name?: string | null;
  startTime: string;
  endTime: string;
};

export type ServiceSlot = {
  id: string;
  serviceId?: string;
  /** Generated key e.g. "YYYY-MM-DD|HH:mm"; may equal `id`. */
  slotKey?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startAt: string;
  endAt: string;
  capacity?: number;
  label?: string | null;
  isActive: boolean;
  booked?: number;
  remaining?: number;
  available?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateServiceSlotPayload = {
  startAt: string;
  endAt: string;
  capacity?: number;
  label?: string | null;
};

export type UpdateServiceSlotPayload = {
  startAt?: string;
  endAt?: string;
  capacity?: number;
  label?: string | null;
  isActive?: boolean;
};

export type MarketplaceServiceVendor = {
  id: string;
  vendorName: string;
  verificationStatus?: string;
  userId?: string;
  currency?: Currency;
};

export type MarketplaceService = {
  id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  portfolio?: string[];
  pricingModel: ServicePricingModel;
  customizationMode: ServiceCustomizationMode;
  currency: Currency;
  basePrice?: number | string | null;
  countryCode?: string | null;
  timezone?: string | null;
  citiesServed?: string[];
  baseCity?: string | null;
  status: EntityStatus;
  rejectionReason?: string | null;
  instantBookingEnabled?: boolean;
  /** DATE = daily calendar capacity; SLOT = recurring templates on open days. */
  bookingMode?: ServiceBookingMode;
  /** Max concurrent jobs per calendar day (1–10). Used when bookingMode=DATE. Default 1. */
  bookingCapacity?: number;
  /** Optional guest bounds; validated when buyer enters guest count. */
  guestMin?: number | null;
  guestMax?: number | null;
  /** Recurring time windows for SLOT mode (repeat on weekly open days). */
  slotTemplates?: ServiceSlotTemplate[];
  cancellationPolicy?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  category?: ServiceCategory | null;
  vendor?: MarketplaceServiceVendor | null;
  packages?: ServicePackage[];
  addOns?: ServiceAddOn[];
  menuItems?: ServiceMenuItem[];
  schedules?: ServiceSchedule[];
  blocks?: ServiceBlock[];
};

export type PublicMarketplaceService = MarketplaceService;
export type ManagedMarketplaceService = MarketplaceService;

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListPublicMarketplaceServicesResult = {
  data: PublicMarketplaceService[];
  meta: PaginationMeta;
};

export type ListManagedMarketplaceServicesResult = {
  data: ManagedMarketplaceService[];
  meta: PaginationMeta;
};

export type ServicePackagePayload = {
  name: string;
  description?: string | null;
  price: number;
  isActive?: boolean;
  sortOrder?: number;
  menuRules?: {
    course: string;
    chooseCount: number;
    menuItemIds?: string[];
    extraPerGuest?: number | null;
  }[];
};

export type ServiceAddOnPayload = {
  name: string;
  description?: string | null;
  price: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type ServiceMenuItemPayload = {
  name: string;
  description?: string | null;
  course?: string | null;
  price?: number | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type CreateMarketplaceServicePayload = {
  categoryId: string;
  vendorId?: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  portfolio?: string[];
  pricingModel: ServicePricingModel;
  customizationMode?: ServiceCustomizationMode;
  currency?: Currency;
  basePrice?: number | null;
  countryCode?: string | null;
  timezone?: string | null;
  citiesServed?: string[];
  baseCity?: string | null;
  cancellationPolicy?: Record<string, unknown> | null;
  instantBookingEnabled?: boolean;
  bookingMode?: ServiceBookingMode;
  bookingCapacity?: number;
  guestMin?: number | null;
  guestMax?: number | null;
  slotTemplates?: ServiceSlotTemplate[];
  packages?: ServicePackagePayload[];
  addOns?: ServiceAddOnPayload[];
  menuItems?: ServiceMenuItemPayload[];
  schedules?: ServiceSchedulesPayload["schedules"];
};

export type UpdateMarketplaceServicePayload = Partial<CreateMarketplaceServicePayload>;

export type MarketplaceServiceStatusPayload = {
  status: "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE" | "CANCELLED";
  reason?: string;
};

export type ServiceSchedulesPayload = {
  schedules: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
  }>;
};

export type ServiceBlockPayload = {
  blockDate: string;
  reason?: string;
  customOpenTime: string;
  customCloseTime: string;
  isBlocked?: boolean;
};

export type ServiceAvailabilityDay = {
  date: string;
  booked: number;
  remaining: number;
  blocked: boolean;
  available: boolean;
};

export type ServiceAvailabilityResult = {
  serviceId: string;
  startDate: string;
  endDate: string;
  available: boolean;
  bookingMode?: ServiceBookingMode;
  bookingCapacity?: number;
  days?: ServiceAvailabilityDay[];
  slots?: ServiceSlot[];
  blocks: ServiceBlock[];
  busyBookings: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
};

// ─── Inquiries / proposals / bookings / reviews ────────────────

export type ServiceInquiryStatus =
  | "PENDING"
  | "PROPOSAL_SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export type ServiceProposalStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "SUPERSEDED"
  | "EXPIRED";

export type ServiceBookingStatus =
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "EXPIRED";

export type ServiceProposalLineType =
  | "PACKAGE"
  | "ADDON"
  | "MENU"
  | "CUSTOM"
  | "DISCOUNT"
  | "FEE"
  | "TRAVEL";

export type ServiceLocation = {
  country?: string;
  city?: string;
  venueName?: string | null;
  address?: string | null;
  venueId?: string | null;
  addressUnlocked?: boolean;
};

export type ServiceInquirySelection = {
  packageId?: string | null;
  addOnIds?: string[];
  menuSelections?: Array<{ course: string; menuItemIds: string[] }>;
  hours?: number | null;
  instantBooking?: boolean;
};

export type ServiceInquiry = {
  id: string;
  serviceId: string;
  buyerId: string;
  packageId?: string | null;
  slotId?: string | null;
  startDate: string;
  endDate: string;
  guestCount?: number | null;
  location?: ServiceLocation | Record<string, unknown>;
  selection?: ServiceInquirySelection | Record<string, unknown>;
  notes?: string | null;
  estimateAmount?: number | string | null;
  estimateSnapshot?: Record<string, unknown> | null;
  status: ServiceInquiryStatus | string;
  createdAt: string;
  updatedAt?: string;
  service?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    currency?: string;
    pricingModel?: ServicePricingModel | string;
    customizationMode?: ServiceCustomizationMode | string;
    bookingMode?: ServiceBookingMode | string;
    vendor?: {
      id: string;
      vendorName: string;
      userId?: string;
      email?: string | null;
    } | null;
    packages?: ServicePackage[];
    addOns?: ServiceAddOn[];
    menuItems?: ServiceMenuItem[];
  } | null;
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  package?: ServicePackage | null;
  slot?: ServiceSlot | null;
  proposals?: ServiceProposal[];
  booking?: {
    id: string;
    status: ServiceBookingStatus | string;
    expiresAt?: string | null;
    totalAmount?: number | string;
    currency?: string;
    slotId?: string | null;
  } | null;
  conversation?: { id: string } | null;
};

export type ServiceProposalLine = {
  id?: string;
  lineType: ServiceProposalLineType | string;
  label: string;
  quantity: number | string;
  unitPrice: number | string;
  amount?: number | string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
};

export type ServiceProposal = {
  id: string;
  inquiryId: string;
  serviceId: string;
  vendorId: string;
  slotId?: string | null;
  version?: number;
  status: ServiceProposalStatus | string;
  notes?: string | null;
  changeRequestMessage?: string | null;
  startDate: string;
  endDate: string;
  totalAmount: number | string;
  currency: string;
  lines?: ServiceProposalLine[];
  createdAt: string;
  updatedAt?: string;
  inquiry?: ServiceInquiry | null;
  service?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    vendor?: { id: string; vendorName: string; userId?: string } | null;
  } | null;
  slot?: ServiceSlot | null;
  booking?: {
    id: string;
    status: ServiceBookingStatus | string;
    expiresAt?: string | null;
  } | null;
};

export type ServiceBooking = {
  id: string;
  inquiryId?: string | null;
  proposalId?: string | null;
  serviceId: string;
  buyerId: string;
  vendorId: string;
  slotId?: string | null;
  slotKey?: string | null;
  startDate: string;
  endDate: string;
  locationSnapshot?: ServiceLocation | Record<string, unknown>;
  pricingSnapshot?: Record<string, unknown> | null;
  totalAmount: number | string;
  currency: string;
  status: ServiceBookingStatus | string;
  source?: "ONLINE" | "OFFLINE" | string;
  guestName?: string | null;
  guestPhone?: string | null;
  specialRequests?: string | null;
  expiresAt?: string | null;
  addressUnlocked?: boolean;
  createdAt: string;
  updatedAt?: string;
  service?: {
    id: string;
    title: string;
    slug: string;
    coverImage?: string | null;
    currency?: string;
    pricingModel?: ServicePricingModel | string;
    customizationMode?: ServiceCustomizationMode | string;
    bookingMode?: ServiceBookingMode | string;
    vendor?: { id: string; vendorName: string; userId?: string; email?: string } | null;
    addOns?: ServiceAddOn[];
    menuItems?: ServiceMenuItem[];
  } | null;
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  vendor?: { id: string; vendorName: string; userId?: string; email?: string } | null;
  proposal?: ServiceProposal | null;
  slot?: ServiceSlot | null;
  inquiry?: {
    id: string;
    guestCount?: number | null;
    notes?: string | null;
    createdAt?: string;
    location?: ServiceLocation | Record<string, unknown>;
    selection?: ServiceInquirySelection | Record<string, unknown>;
    package?: { id: string; name: string; price?: number | string } | null;
    slot?: ServiceSlot | null;
    conversation?: { id: string } | null;
  } | null;
};

export type CreateServiceInquiryPayload = {
  serviceId: string;
  packageId?: string | null;
  /** Preferred for SLOT-mode services (generated key e.g. "YYYY-MM-DD|HH:mm"). */
  slotKey?: string | null;
  /** @deprecated Prefer `slotKey` for generated public slots. */
  slotId?: string | null;
  startDate?: string;
  endDate?: string;
  guestCount?: number | null;
  location?: ServiceLocation;
  selection?: ServiceInquirySelection;
  notes?: string | null;
};

export type CreateInstantServiceBookingPayload = CreateServiceInquiryPayload;

export type InstantServiceBookingResult = {
  booking: ServiceBooking;
  expiresAt: string;
};

export type CreateServiceProposalLinePayload = {
  lineType: ServiceProposalLineType | string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
};

export type CreateServiceProposalPayload = {
  inquiryId: string;
  notes?: string | null;
  currency?: Currency;
  lines: CreateServiceProposalLinePayload[];
  send?: boolean;
};

export type ReviseServiceProposalPayload = {
  notes?: string | null;
  currency?: Currency;
  lines: CreateServiceProposalLinePayload[];
  send?: boolean;
};

export type ListServiceInquiriesResult = {
  items: ServiceInquiry[];
  meta: PaginationMeta;
};

export type ListServiceProposalsResult = {
  items: ServiceProposal[];
  meta: PaginationMeta;
};

export type ListServiceBookingsResult = {
  items: ServiceBooking[];
  meta: PaginationMeta;
};

export type ServiceBookingCheckoutResult =
  | {
      status: "succeeded";
      booking: ServiceBooking;
    }
  | {
      status: "requires_action";
      bookingId: string;
      paymentIntentId: string;
      clientSecret: string;
      total: number;
      currency: string;
    };

export type AcceptServiceProposalResult = {
  booking: ServiceBooking;
  proposal: ServiceProposal | null;
  expiresAt: string;
};

export type MarketplaceServiceReviewSummary = {
  averageRating: number | null;
  count: number;
};

export type MarketplaceServiceReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string };
};

export type CreateMarketplaceServiceReviewInput = {
  serviceId: string;
  bookingId: string;
  rating: number;
  comment?: string;
};
