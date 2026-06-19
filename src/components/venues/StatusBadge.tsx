import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/features/bookings/types";
import type { EntityStatus } from "@/features/venues/types";
import { entityStatusLabel } from "@/features/venues/utils";

type StatusBadgeProps = {
  status: EntityStatus | BookingStatus | string;
  className?: string;
};

function variantForStatus(status: string) {
  if (status === "ACTIVE" || status === "APPROVED" || status === "CONFIRMED" || status === "COMPLETED") {
    return "default" as const;
  }
  if (status === "REJECTED" || status === "CANCELLED" || status === "INACTIVE") {
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
  return (
    <Badge variant={variantForStatus(status)} className={className}>
      {entityStatusLabel(status as EntityStatus)}
    </Badge>
  );
}
