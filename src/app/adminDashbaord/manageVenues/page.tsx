"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { TableShell } from "@/components/ui/table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { listManagedVenues, updateVenueStatus } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { EntityStatus } from "@/features/venues/types";
import { toastApiError } from "@/lib/toasts";

const adminPaths = getDashboardPaths("admin");

export default function ManageVenuesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "ALL">("ALL");

  const listParams = {
    allPlatform: true,
    limit: 50,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: venueKeys.managedList(listParams),
    queryFn: () => listManagedVenues(listParams),
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

  const venues = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage venues</h1>
            <p className="text-sm text-muted-foreground">
              All venues on the platform. Admin-created venues are active immediately;
              vendor venues stay in draft until they submit for review.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as EntityStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild>
              <Link href={adminPaths.addVenue}>
                <Plus className="mr-2 h-4 w-4" />
                Add venue
              </Link>
            </Button>
          </div>
        </div>

        <TableShell
          title={
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              All venues
            </CardTitle>
          }
          description={
            isLoading
              ? "Loading venues…"
              : `${venues.length} venue${venues.length === 1 ? "" : "s"}`
          }
          headerAction={
            isFetching && !isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Vendor</TableHead>
                <TableHead className="text-muted-foreground">City</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={5} />
              ) : venues.length === 0 ? (
                <TableEmptyRow colSpan={5}>No venues found.</TableEmptyRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{venue.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {venue.vendor?.vendorName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{venue.city ?? "—"}</TableCell>
                    <TableCell>
                      {venue.status && <StatusBadge status={venue.status} />}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="border-border">
                          <Link href={adminPaths.editVenue(venue.id)}>
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        {venue.status !== "ACTIVE" && venue.status !== "DRAFT" && (
                          <Button
                            size="sm"
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
                            className="border-border"
                            onClick={() =>
                              statusMut.mutate({ id: venue.id, status: "INACTIVE" })
                            }
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      </div>
    </RoleGuard>
  );
}
