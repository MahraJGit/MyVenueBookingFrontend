export type FavoritableType = "event" | "venue" | "attraction";

export type FavoriteIds = {
  eventIds: string[];
  venueIds: string[];
  attractionIds: string[];
};

export type FavoritesList = {
  events: import("@/features/events/api").PublicEvent[];
  venues: import("@/features/venues/types").PublicVenue[];
  attractions: import("@/features/attractions/api").PublicAttraction[];
};

export type ToggleFavoriteResult = {
  favorited: boolean;
};
