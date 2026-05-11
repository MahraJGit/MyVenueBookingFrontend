import type { BackendFieldError } from "@/lib/api/errors";

/** Keys aligned with signup form state (phone is split as E.164 in UI). */
export type SignupFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "phoneE164";

/**
 * Maps Express/Zod `errors: { field, message }[]` onto signup form fields.
 * When mapping succeeds, prefer inline messages over a toast.
 */
export function mapRegisterApiFieldErrors(
  fieldErrors: BackendFieldError[],
): Partial<Record<SignupFieldKey, string>> {
  const out: Partial<Record<SignupFieldKey, string>> = {};
  for (const { field, message } of fieldErrors) {
    if (
      field === "firstName" ||
      field === "lastName" ||
      field === "email" ||
      field === "password"
    ) {
      out[field] = message;
      continue;
    }
    if (field === "phone" || field === "phoneCountryCode") {
      out.phoneE164 =
        out.phoneE164 != null ? `${out.phoneE164} · ${message}` : message;
    }
  }
  return out;
}
