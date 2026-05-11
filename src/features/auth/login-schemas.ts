import { z } from "zod";
import { e164ToApiParts, isE164Valid } from "@/lib/phone";
import type { LoginRequestBody } from "./types";

export const emailLoginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const phoneLoginFormSchema = z.object({
  phoneE164: z
    .string()
    .min(1, "Phone is required")
    .refine((v) => isE164Valid(v), {
      message: "Enter a valid international phone number",
    }),
  password: z.string().min(1, "Password is required"),
});

export type EmailLoginFormValues = z.infer<typeof emailLoginFormSchema>;
export type PhoneLoginFormValues = z.infer<typeof phoneLoginFormSchema>;

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
