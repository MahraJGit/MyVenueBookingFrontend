export const recommendationKeys = {
  all: ["recommendations"] as const,
  events: (limit?: number, locale?: string) =>
    [...recommendationKeys.all, "events", limit ?? 8, locale ?? "en"] as const,
  venues: (limit?: number, locale?: string) =>
    [...recommendationKeys.all, "venues", limit ?? 8, locale ?? "en"] as const,
  attractions: (limit?: number, locale?: string) =>
    [...recommendationKeys.all, "attractions", limit ?? 8, locale ?? "en"] as const,
};
