import type { BackendFieldError } from "@/lib/api/errors";

export type LoginFieldKey = "email" | "phoneE164" | "password";

/**
 * Maps backend login validation `errors[]` onto login form fields.
 */
export function mapLoginApiFieldErrors(
  fieldErrors: BackendFieldError[],
): Partial<Record<LoginFieldKey, string>> {
  const out: Partial<Record<LoginFieldKey, string>> = {};
  for (const { field, message } of fieldErrors) {
    if (field === "email" || field === "password") {
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
