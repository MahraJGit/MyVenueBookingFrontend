import { z } from "zod";
import { e164ToApiParts, isE164Valid } from "@/lib/phone";
import type { LoginRequestBody } from "./types";
import type { ValidationTranslator } from "./schemas";

export function createEmailLoginFormSchema(t: ValidationTranslator) {
  return z.object({
    email: z.string().trim().email(t("validEmail")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export function createPhoneLoginFormSchema(t: ValidationTranslator) {
  return z.object({
    phoneE164: z
      .string()
      .min(1, t("phoneRequired"))
      .refine((v) => isE164Valid(v), {
        message: t("invalidPhone"),
      }),
    password: z.string().min(1, t("passwordRequired")),
  });
}

const _emailSchema = createEmailLoginFormSchema((key) => key);
const _phoneSchema = createPhoneLoginFormSchema((key) => key);

export type EmailLoginFormValues = z.infer<typeof _emailSchema>;
export type PhoneLoginFormValues = z.infer<typeof _phoneSchema>;

export function phoneLoginToRequestBody(
  values: PhoneLoginFormValues,
): Extract<LoginRequestBody, { phone: string }> {
  const parts = e164ToApiParts(values.phoneE164);
  if (!parts) {
    throw new Error("Invalid phone");
  }
  return {
    phone: parts.phone,
    phoneCountryCode: parts.phoneCountryCode,
    password: values.password,
  };
}
