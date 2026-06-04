/** Backend stores `phoneCountryCode` as digits with optional leading `+`. */
export function normalizePhoneCountryCode(
  code: string | null | undefined,
): string {
  if (!code?.trim()) return "";
  const trimmed = code.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

export function profileInitials(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0);
  const b = lastName.trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  return initials || "?";
}

export function resolveAvatarSrc(avatarUrl: string | null | undefined): string | null {
  const url = avatarUrl?.trim();
  return url || null;
}
