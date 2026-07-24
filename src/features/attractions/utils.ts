export const ALL_ATTRACTIONS_CATEGORY = "All";

export function categoryQueryValue(label: string): string | undefined {
  if (label === ALL_ATTRACTIONS_CATEGORY) return undefined;
  return label;
}
