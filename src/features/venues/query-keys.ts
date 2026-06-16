export const venueKeys = {
  all: ["venues"] as const,
  publicList: (params: Record<string, unknown>) => [...venueKeys.all, "public", params] as const,
  publicDetail: (id: string) => [...venueKeys.all, "public", id] as const,
  managedList: (params: Record<string, unknown>) => [...venueKeys.all, "managed", params] as const,
  managedDetail: (id: string) => [...venueKeys.all, "managed", id] as const,
  types: () => [...venueKeys.all, "types"] as const,
  amenityCatalog: () => [...venueKeys.all, "amenity-catalog"] as const,
  monthAvailability: (venueId: string, year: number, month: number) =>
    [...venueKeys.all, "availability", venueId, year, month] as const,
  dayAvailability: (venueId: string, date: string) =>
    [...venueKeys.all, "availability", venueId, "day", date] as const,
};

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params: Record<string, unknown>) => [...bookingKeys.all, "list", params] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
};
