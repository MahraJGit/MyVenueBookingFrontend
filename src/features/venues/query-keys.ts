export const venueKeys = {
  all: ["venues"] as const,
  publicList: (params: Record<string, unknown>) => [...venueKeys.all, "public", params] as const,
  publicDetail: (id: string) => [...venueKeys.all, "public", id] as const,
  managedList: (params: Record<string, unknown>) => [...venueKeys.all, "managed", params] as const,
  managedDetail: (id: string) => [...venueKeys.all, "managed", id] as const,
  previewDetail: (id: string) => [...venueKeys.all, "preview", id] as const,
  types: () => [...venueKeys.all, "types"] as const,
  amenityCatalog: () => [...venueKeys.all, "amenity-catalog"] as const,
  monthAvailability: (venueId: string, year: number, month: number) =>
    [...venueKeys.all, "availability", venueId, year, month] as const,
  dayAvailability: (venueId: string, date: string) =>
    [...venueKeys.all, "availability", venueId, "day", date] as const,
};

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (userId: string | null | undefined, params: Record<string, unknown>) =>
    [...bookingKeys.all, userId ?? "anonymous", "list", params] as const,
  detail: (userId: string | null | undefined, id: string) =>
    [...bookingKeys.all, userId ?? "anonymous", "detail", id] as const,
};
