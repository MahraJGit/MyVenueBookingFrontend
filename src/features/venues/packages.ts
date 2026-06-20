export type PackageItemForm = {
  id: string;
  name: string;
  description?: string;
};

export type PackageOptionForm = {
  id: string;
  name: string;
  description: string;
  pricePerHead: number;
  minHeads?: number;
  items: PackageItemForm[];
};

type RawPackage = {
  id?: string;
  name?: string;
  description?: string;
  pricePerHead?: number;
  minHeads?: number;
  items?: PackageItemForm[];
};

export function newPackageItem(name = ""): PackageItemForm {
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
  };
}

export function newPackageOption(name = ""): PackageOptionForm {
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
    pricePerHead: 0,
    minHeads: undefined,
    items: [newPackageItem()],
  };
}

/** Read packages from pricingConfig; supports legacy `menus` key. */
export function getPackagesFromConfig(
  config: Record<string, unknown> | null | undefined,
): PackageOptionForm[] {
  if (!config) return [];

  const packages = config.packages as RawPackage[] | undefined;
  if (Array.isArray(packages) && packages.length > 0) {
    return packages.map(normalizePackage);
  }

  const menus = config.menus as RawPackage[] | undefined;
  if (Array.isArray(menus)) {
    return menus.map(normalizePackage);
  }

  return [];
}

function normalizePackage(raw: RawPackage): PackageOptionForm {
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        name: item.name ?? "",
        description: item.description ?? "",
      }))
    : [];

  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "",
    description: raw.description ?? "",
    pricePerHead: Number(raw.pricePerHead ?? 0),
    minHeads: raw.minHeads,
    items: items.length > 0 ? items : [newPackageItem()],
  };
}

export function sanitizePackagesForSave(
  packages: PackageOptionForm[],
): PackageOptionForm[] {
  return packages
    .filter((pkg) => pkg.name.trim())
    .map((pkg) => ({
      ...pkg,
      name: pkg.name.trim(),
      description: pkg.description.trim(),
      items: pkg.items.filter((item) => item.name.trim()).map((item) => ({
        id: item.id,
        name: item.name.trim(),
        ...(item.description?.trim() ? { description: item.description.trim() } : {}),
      })),
    }))
    .filter((pkg) => pkg.items.length > 0 && pkg.pricePerHead > 0);
}
