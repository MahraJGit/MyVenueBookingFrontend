/** Must match EventCategory.name / Event.category in the database. */
export const ATTRACTIONS_ENTERTAINMENT_CATEGORY = "Attractions and Entertainment";

export const CORPORATE_EVENTS_CATEGORY = "Corporate Events";

/** Venue types shown on the Corporate hub (seed slugs; matched at runtime by slug). */
export const CORPORATE_VENUE_TYPE_SLUGS = [
  "seed-conference-center",
  "seed-corporate-venue",
] as const;

export function isAttractionsHubCategory(
  category: string | null | undefined,
): category is typeof ATTRACTIONS_ENTERTAINMENT_CATEGORY {
  return category === ATTRACTIONS_ENTERTAINMENT_CATEGORY;
}

export function isCorporateHubVenueType(type: {
  name: string;
  slug: string;
}): boolean {
  if (
    (CORPORATE_VENUE_TYPE_SLUGS as readonly string[]).includes(type.slug)
  ) {
    return true;
  }

  const haystack = `${type.name} ${type.slug}`.toLowerCase();
  return haystack.includes("conference") || haystack.includes("corporate");
}
