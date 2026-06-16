"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { EntityStatus } from "@/features/venues/types";
import { toastApiError } from "@/lib/toasts";

export default function ManageVenuesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "ALL">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: venueKeys.managedList({ status: statusFilter }),
    queryFn: () =>
      listManagedVenues({
        limit: 50,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EntityStatus }) =>
      updateVenueStatus(id, {
        status: status as "APPROVED" | "ACTIVE" | "INACTIVE" | "CANCELLED",
      }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Manage venues</h1>
            <p className="text-sm text-muted-foreground">All venues on the platform.</p>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as EntityStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px] border-[#303030] bg-[#1B1B1B] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#303030] hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Vendor</TableHead>
                  <TableHead className="text-muted-foreground">City</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data ?? []).map((venue) => (
                  <TableRow key={venue.id} className="border-[#303030]">
                    <TableCell className="text-white font-medium">{venue.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {venue.vendor?.vendorName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{venue.city ?? "—"}</TableCell>
                    <TableCell>
                      {venue.status && <StatusBadge status={venue.status} />}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {venue.status !== "ACTIVE" && (
                        <Button
                          size="sm"
                          className="bg-primary"
                          onClick={() =>
                            statusMut.mutate({ id: venue.id, status: "ACTIVE" })
                          }
                        >
                          Activate
                        </Button>
                      )}
                      {venue.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#303030]"
                          onClick={() =>
                            statusMut.mutate({ id: venue.id, status: "INACTIVE" })
                          }
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
