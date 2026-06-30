export type FavoritableType = "event" | "venue";

export type FavoriteIds = {
  eventIds: string[];
  venueIds: string[];
};

export type FavoritesList = {
  events: import("@/features/events/api").PublicEvent[];
  venues: import("@/features/venues/types").PublicVenue[];
};

export type ToggleFavoriteResult = {
  favorited: boolean;
};
