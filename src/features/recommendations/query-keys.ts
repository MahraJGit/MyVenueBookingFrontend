export const recommendationKeys = {
  all: ["recommendations"] as const,
  events: (limit?: number) =>
    [...recommendationKeys.all, "events", limit ?? 8] as const,
  venues: (limit?: number) =>
    [...recommendationKeys.all, "venues", limit ?? 8] as const,
};
