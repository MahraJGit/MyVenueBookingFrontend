"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Pencil } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listManagedVenues } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";

export default function VendorVenuesPage() {
  const { data, isLoading } = useQuery({
    queryKey: venueKeys.managedList({}),
    queryFn: () => listManagedVenues({ limit: 50 }),
  });

  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Venues</h1>
            <p className="text-sm text-muted-foreground">
              Manage your venue listings, pricing, and availability.
            </p>
          </div>
          <Button asChild className="bg-primary">
            <Link href="/vendorDashboard/venues/new">
              <Plus className="mr-2 h-4 w-4" /> Add venue
            </Link>
          </Button>
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
                  <TableHead className="text-muted-foreground">City</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data ?? []).map((venue) => (
                  <TableRow key={venue.id} className="border-[#303030]">
                    <TableCell className="text-white font-medium">{venue.name}</TableCell>
                    <TableCell className="text-muted-foreground">{venue.city ?? "—"}</TableCell>
                    <TableCell>
                      {venue.status && <StatusBadge status={venue.status} />}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="border-[#303030]">
                        <Link href={`/vendorDashboard/venues/${venue.id}/edit`}>
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No venues yet. Create your first venue to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
