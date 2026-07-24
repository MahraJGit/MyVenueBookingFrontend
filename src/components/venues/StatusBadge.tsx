"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/features/bookings/types";
import type { EntityStatus } from "@/features/venues/types";

type StatusBadgeProps = {
  status: EntityStatus | BookingStatus | string;
  className?: string;
};

const STATUS_KEY_MAP: Record<string, string> = {
  DRAFT: "draft",
  PENDING: "pendingReview",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVE: "active",
  INACTIVE: "inactive",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  DELETED: "deleted",
  HOLD: "hold",
  CONFIRMED: "confirmed",
};

function variantForStatus(status: string) {
  if (status === "ACTIVE" || status === "APPROVED" || status === "CONFIRMED" || status === "COMPLETED") {
    return "default" as const;
  }
  if (
    status === "REJECTED" ||
    status === "CANCELLED" ||
    status === "INACTIVE" ||
    status === "DELETED"
  ) {
    return "destructive" as const;
  }
  if (status === "HOLD" || status === "PENDING") {
    return "secondary" as const;
  }
  if (status === "DRAFT") {
    return "outline" as const;
  }
  return "outline" as const;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("entityStatus");
  const key = STATUS_KEY_MAP[status] ?? "unknown";

  return (
    <Badge variant={variantForStatus(status)} className={className}>
      {STATUS_KEY_MAP[status] ? t(key as "draft") : status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
