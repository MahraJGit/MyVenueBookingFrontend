import { z } from "zod";

export type ValidationTranslator = (key: string) => string;

export const PASSWORD_SPECIAL_CHARS = "@$!%*?&";

export const PASSWORD_RULE_IDS = [
  "minLength",
  "lowercase",
  "uppercase",
  "number",
  "special",
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULE_IDS)[number];

export function checkPasswordRules(password: string): Record<PasswordRuleId, boolean> {
  return {
    minLength: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(checkPasswordRules(password)).every(Boolean);
}

export function passwordRuleMessageKey(ruleId: PasswordRuleId): string {
  switch (ruleId) {
    case "minLength":
      return "passwordMin";
    case "lowercase":
      return "passwordLowercase";
    case "uppercase":
      return "passwordUppercase";
    case "number":
      return "passwordNumber";
    case "special":
      return "passwordSpecial";
  }
}

export function passwordRules(t: ValidationTranslator) {
  return z
    .string()
    .min(8, t("passwordMin"))
    .regex(/[a-z]/, t("passwordLowercase"))
    .regex(/[A-Z]/, t("passwordUppercase"))
    .regex(/\d/, t("passwordNumber"))
    .regex(/[@$!%*?&]/, t("passwordSpecial"));
}
