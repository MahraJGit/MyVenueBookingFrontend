import type { AuthUser } from "@/features/auth/types";

export function buildDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const fullName = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return fullName || user.email?.trim() || "";
}

export function buildInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const first = user.firstName?.trim().charAt(0) ?? "";
  const last = user.lastName?.trim().charAt(0) ?? "";
  const fromName = `${first}${last}`.toUpperCase();
  if (fromName) return fromName;
  const emailInitial = user.email?.trim().charAt(0).toUpperCase();
  return emailInitial || "?";
}

export function toAuthUserSnapshot(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    phoneCountryCode: user.phoneCountryCode,
    avatarUrl: user.avatarUrl,
  };
}
