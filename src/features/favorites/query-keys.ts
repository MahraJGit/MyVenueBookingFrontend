export const favoriteKeys = {
  all: ["favorites"] as const,
  ids: () => [...favoriteKeys.all, "ids"] as const,
  list: (type: "all" | "event" | "venue" = "all") =>
    [...favoriteKeys.all, "list", type] as const,
};
