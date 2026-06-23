/** Must match EventCategory.name / Event.category in the database. */
export const ATTRACTIONS_ENTERTAINMENT_CATEGORY = "Attractions and Entertainment";

export const CORPORATE_EVENTS_CATEGORY = "Corporate Events";

/** Venue types shown on the Corporate Events hub (seed slugs; matched at runtime by slug). */
export const CORPORATE_VENUE_TYPE_SLUGS = [
  "seed-conference-center",
  "seed-wedding-hall",
  "seed-rooftop-lounge",
] as const;
