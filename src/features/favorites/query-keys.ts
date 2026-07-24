export const favoriteKeys = {
  all: ["favorites"] as const,
  ids: (userId?: string | null) =>
    [...favoriteKeys.all, userId ?? "anonymous", "ids"] as const,
  list: (
    userId: string | null | undefined,
    type: "all" | "event" | "venue" | "attraction" = "all",
  ) => [...favoriteKeys.all, userId ?? "anonymous", "list", type] as const,
};
