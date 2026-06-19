"use client";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EntityStatus, VenueReadiness } from "@/features/venues/types";
import { cn } from "@/lib/utils";

type VenueReadinessPanelProps = {
  readiness: VenueReadiness;
  status?: EntityStatus;
  rejectionReason?: string | null;
  onSubmit?: () => void;
  submitPending?: boolean;
  onGoToCheck?: (checkId: string) => void;
  className?: string;
  /** Vendor flow shows submit-for-review; admin flow is setup-only. */
  mode?: "vendor" | "admin";
};

const CHECK_TAB_MAP: Record<string, string> = {
  details: "details",
  pricing: "pricing",
  schedule: "schedules",
  cover: "details",
};

export function VenueReadinessPanel({
  readiness,
  status,
  rejectionReason,
  onSubmit,
  submitPending,
  onGoToCheck,
  className,
  mode = "vendor",
}: VenueReadinessPanelProps) {
  const isAdminMode = mode === "admin";
  const canSubmit =
    !isAdminMode && (status === "DRAFT" || status === "REJECTED");
  const isPending = !isAdminMode && status === "PENDING";

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {isAdminMode ? "Setup progress" : "Setup checklist"}
            </CardTitle>
            <CardDescription>
              {isAdminMode
                ? "Admin venues are active immediately. Complete details below for a better listing."
                : "Complete required steps, then submit for admin review."}
            </CardDescription>
          </div>
          <Badge variant={readiness.ready ? "default" : "secondary"}>
            {readiness.requiredComplete}/{readiness.requiredTotal} required
          </Badge>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall progress</span>
            <span>{readiness.percentComplete}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${readiness.percentComplete}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {status === "REJECTED" && rejectionReason && (
          <div className="mb-3 flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Rejected by admin</p>
              <p className="text-destructive/90">{rejectionReason}</p>
            </div>
          </div>
        )}

        {isAdminMode && status && ["ACTIVE", "APPROVED"].includes(status) && (
          <div className="mb-3 flex gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>This venue is live. Finish pricing and schedule so guests can book.</p>
          </div>
        )}

        {isPending && (
          <div className="mb-3 flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
            <p>Your venue is waiting for admin review. You will be notified once it is approved.</p>
          </div>
        )}

        <ul className="space-y-2">
          {readiness.checks.map((check) => {
            const Icon = check.met ? CheckCircle2 : Circle;
            return (
              <li
                key={check.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                  check.met
                    ? "border-primary/30 bg-primary/5"
                    : check.required
                      ? "border-border bg-muted/20"
                      : "border-dashed border-border bg-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    check.met ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{check.label}</span>
                    {!check.required && (
                      <Badge variant="outline" className="text-[10px]">
                        Optional
                      </Badge>
                    )}
                  </div>
                  {!check.met && check.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{check.message}</p>
                  )}
                </div>
                {!check.met && onGoToCheck && CHECK_TAB_MAP[check.id] && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-xs"
                    onClick={() => onGoToCheck(CHECK_TAB_MAP[check.id])}
                  >
                    Set up
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>

      {canSubmit && onSubmit && (
        <CardFooter className="border-t justify-end gap-2">
          <Button
            onClick={onSubmit}
            disabled={!readiness.ready || submitPending}
            className="bg-primary"
          >
            {submitPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit for review
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
