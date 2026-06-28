export const APP_ROLES = ["BUYER", "VENDOR", "ADMIN"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: string | null | undefined): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function hasAnyRole(
  role: string | null | undefined,
  allowedRoles: readonly AppRole[],
): boolean {
  return isAppRole(role) && allowedRoles.includes(role);
}

export function getDefaultDashboardForRole(role: AppRole): string {
  switch (role) {
    case "VENDOR":
      return "/vendorDashboard";
    case "ADMIN":
      return "/adminDashbaord/manageEvents";
    case "BUYER":
    default:
      return "/userDashboard/tickets";
  }
}
