"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, Circle, X } from "lucide-react";
import {
  PASSWORD_RULE_IDS,
  checkPasswordRules,
  passwordRuleMessageKey,
} from "@/features/auth/password-rules";
import { cn } from "@/lib/utils";

type PasswordRequirementsProps = {
  password: string;
  className?: string;
};

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const t = useTranslations("validation");
  const checks = useMemo(() => checkPasswordRules(password), [password]);
  const hasInput = password.length > 0;

  return (
    <ul className={cn("mt-2 space-y-1", className)} aria-live="polite">
      {PASSWORD_RULE_IDS.map((ruleId) => {
        const met = checks[ruleId];
        const label = t(passwordRuleMessageKey(ruleId));

        return (
          <li
            key={ruleId}
            className={cn(
              "flex items-start gap-1.5 text-xs leading-snug",
              !hasInput && "text-gray-500",
              hasInput && met && "text-green-500",
              hasInput && !met && "text-red-400",
            )}
          >
            {!hasInput ? (
              <Circle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            ) : met ? (
              <Check className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <X className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            )}
            <span>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
