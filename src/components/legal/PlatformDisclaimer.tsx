"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PlatformDisclaimerProps = {
  className?: string;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function PlatformDisclaimer({
  className,
  accepted,
  onAcceptedChange,
}: PlatformDisclaimerProps) {
  const t = useTranslations("common");
  const checkboxId = useId();

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-4",
        className,
      )}
      role="note"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-100">
            {t("platformDisclaimerTitle")}
          </p>
          <p className="text-sm leading-relaxed text-amber-100/90">
            {t("platformDisclaimer")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 border-t border-amber-500/30 pt-4">
        <Checkbox
          id={checkboxId}
          checked={accepted}
          onCheckedChange={(checked) => onAcceptedChange(checked === true)}
          className="mt-0.5 border-amber-400/60 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
          aria-required
        />
        <Label
          htmlFor={checkboxId}
          className="cursor-pointer text-sm font-medium leading-snug text-amber-50"
        >
          {t("platformDisclaimerAccept")}
        </Label>
      </div>
    </div>
  );
}
