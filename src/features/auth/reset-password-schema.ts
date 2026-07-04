import { z } from "zod";
import type { ValidationTranslator } from "./schemas";
import { passwordRules } from "./password-rules";

export function createResetPasswordFormSchema(t: ValidationTranslator) {
  return z
    .object({
      password: passwordRules(t),
      confirmPassword: z.string().min(1, t("confirmPassword")),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("passwordMismatch"),
          path: ["confirmPassword"],
        });
      }
    });
}
