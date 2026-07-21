export const locationKeys = {
  all: ["locations"] as const,
  countries: (activeOnly?: boolean) => [...locationKeys.all, "countries", activeOnly ?? false] as const,
  cities: (countryCode: string, options?: { activeOnly?: boolean; featuredOnly?: boolean }) =>
    [
      ...locationKeys.all,
      "cities",
      countryCode.toUpperCase(),
      options?.activeOnly ?? false,
      options?.featuredOnly ?? false,
    ] as const,
};
