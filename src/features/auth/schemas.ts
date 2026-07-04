import { z } from "zod";
import { e164ToApiParts, isE164Valid } from "@/lib/phone";
import type { RegisterRequestBody } from "./types";
import { passwordRules, type ValidationTranslator } from "./password-rules";

export type { ValidationTranslator };

/** Client-side signup form validation (aligned with backend `registerDto`). */
export function createSignupFormSchema(t: ValidationTranslator) {
  return z
    .object({
      firstName: z.string().trim().min(2, t("firstNameMin")),
      lastName: z.string().trim().min(2, t("lastNameMin")),
      email: z.string().trim().email(t("invalidEmail")),
      phoneE164: z.string().optional(),
      password: passwordRules(t),
      confirmPassword: z.string().min(1, t("confirmPassword")),
    })
    .superRefine((data, ctx) => {
      if (!data.phoneE164?.trim() || !isE164Valid(data.phoneE164)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("invalidPhone"),
          path: ["phoneE164"],
        });
      }
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("passwordMismatch"),
          path: ["confirmPassword"],
        });
      }
    });
}

const _signupSchema = createSignupFormSchema((key) => key);
export type SignupFormValues = z.infer<typeof _signupSchema>;

export function signupValuesToRegisterBody(
  data: SignupFormValues,
): RegisterRequestBody {
  const parts = e164ToApiParts(data.phoneE164);
  if (!parts) {
    throw new Error("Invalid phone for registration");
  }
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email: data.email.trim(),
    phone: parts.phone,
    phoneCountryCode: parts.phoneCountryCode,
    password: data.password,
  };
}
