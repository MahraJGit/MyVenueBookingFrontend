"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ManagedVenue } from "@/features/venues/types";
import { toastApiError } from "@/lib/toasts";

export default function VenueReviewsPage() {
  const queryClient = useQueryClient();
  const [rejectVenue, setRejectVenue] = useState<ManagedVenue | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: venueKeys.managedList({ status: "PENDING", vendorOnly: true }),
    queryFn: () =>
      listManagedVenues({ status: "PENDING", vendorOnly: true, limit: 50 }),
  });

  const statusMut = useMutation({
    mutationFn: ({
      id,
      status,
      reason: r,
    }: {
      id: string;
      status: "APPROVED" | "ACTIVE" | "REJECTED";
      reason?: string;
    }) => updateVenueStatus(id, { status, reason: r }),
    onSuccess: () => {
      toast.success("Venue status updated");
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
      setRejectVenue(null);
      setReason("");
    },
    onError: (e) => toastApiError(e),
  });

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Venue reviews</h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject vendor venue submissions.
          </p>
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
                  <TableHead className="text-muted-foreground">Venue</TableHead>
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
                      <Button asChild size="sm" variant="outline" className="border-[#303030]">
                        <Link href={`/adminDashbaord/manageVenues?highlight=${venue.id}`}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary"
                        disabled={statusMut.isPending}
                        onClick={() =>
                          statusMut.mutate({ id: venue.id, status: "ACTIVE" })
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setRejectVenue(venue)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No venues pending review.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!rejectVenue} onOpenChange={() => setRejectVenue(null)}>
        <DialogContent className="border-[#303030] bg-[#1B1B1B] text-white">
          <DialogHeader>
            <DialogTitle>Reject venue</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border-[#303030] bg-black min-h-24"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectVenue(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || statusMut.isPending}
              onClick={() =>
                rejectVenue &&
                statusMut.mutate({
                  id: rejectVenue.id,
                  status: "REJECTED",
                  reason: reason.trim(),
                })
              }
            >
              Reject venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}
