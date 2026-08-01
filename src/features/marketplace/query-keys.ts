export const marketplaceKeys = {
  all: ["marketplace"] as const,
  categories: (params?: Record<string, unknown>) =>
    [...marketplaceKeys.all, "categories", params ?? {}] as const,
  publicList: (params: Record<string, unknown>) =>
    [...marketplaceKeys.all, "public", params] as const,
  publicDetail: (idOrSlug: string) =>
    [...marketplaceKeys.all, "public", idOrSlug] as const,
  managedList: (params: Record<string, unknown>) =>
    [...marketplaceKeys.all, "managed", params] as const,
  managedDetail: (id: string) =>
    [...marketplaceKeys.all, "managed", id] as const,
  previewDetail: (id: string) =>
    [...marketplaceKeys.all, "preview", id] as const,
  schedules: (id: string) =>
    [...marketplaceKeys.all, "schedules", id] as const,
  blocks: (id: string) =>
    [...marketplaceKeys.all, "blocks", id] as const,
  availability: (id: string, startDate: string, endDate: string) =>
    [...marketplaceKeys.all, "availability", id, startDate, endDate] as const,
  inquiries: (userId: string | undefined, params?: Record<string, unknown>) =>
    [...marketplaceKeys.all, "inquiries", userId, params ?? {}] as const,
  inquiry: (userId: string | undefined, id: string) =>
    [...marketplaceKeys.all, "inquiry", userId, id] as const,
  proposals: (userId: string | undefined, params?: Record<string, unknown>) =>
    [...marketplaceKeys.all, "proposals", userId, params ?? {}] as const,
  proposal: (userId: string | undefined, id: string) =>
    [...marketplaceKeys.all, "proposal", userId, id] as const,
  bookings: (userId: string | undefined, params?: Record<string, unknown>) =>
    [...marketplaceKeys.all, "bookings", userId, params ?? {}] as const,
  booking: (userId: string | undefined, id: string) =>
    [...marketplaceKeys.all, "booking", userId, id] as const,
  reviews: (serviceId: string, page?: number) =>
    [...marketplaceKeys.all, "reviews", serviceId, page ?? 1] as const,
  reviewSummary: (serviceId: string) =>
    [...marketplaceKeys.all, "reviewSummary", serviceId] as const,
};
