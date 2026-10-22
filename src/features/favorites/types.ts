export type FavoritableType = "event" | "venue" | "attraction" | "service";

export type FavoriteIds = {
  eventIds: string[];
  venueIds: string[];
  attractionIds: string[];
  serviceIds: string[];
};

export type FavoritesList = {
  events: import("@/features/events/api").PublicEvent[];
  venues: import("@/features/venues/types").PublicVenue[];
  attractions: import("@/features/attractions/api").PublicAttraction[];
  services: import("@/features/marketplace/types").PublicMarketplaceService[];
};

export type ToggleFavoriteResult = {
  favorited: boolean;
};
