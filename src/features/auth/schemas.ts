import { z } from "zod";
import { e164ToApiParts, isE164Valid } from "@/lib/phone";
import type { RegisterRequestBody } from "./types";

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number")
  .regex(
    /[@$!%*?&]/,
    "Password must contain a special character (@$!%*?&)",
  );

/** Client-side signup form validation (aligned with backend `registerDto`). */
export const signupFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    phoneE164: z.string().optional(),
    password: passwordRules,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (!data.phoneE164?.trim() || !isE164Valid(data.phoneE164)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid international phone number",
        path: ["phoneE164"],
      });
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

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
