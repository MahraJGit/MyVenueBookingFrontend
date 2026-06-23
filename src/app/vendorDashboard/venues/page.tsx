"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Building2, Loader2, Plus, Pencil } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
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
import { listManagedVenues } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";

export default function VendorVenuesPage() {
  const t = useTranslations("vendorDashboard");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const { data, isLoading, isFetching } = useQuery({
    queryKey: venueKeys.managedList({}),
    queryFn: () => listManagedVenues({ limit: 50 }),
  });

  const venues = data?.data ?? [];

  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("myVenuesTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("myVenuesDesc")}
            </p>
          </div>
          <Button asChild>
            <Link href="/vendorDashboard/venues/new">
              <Plus className="mr-2 h-4 w-4" /> {t("addVenue")}
            </Link>
          </Button>
        </div>

        <TableShell
          title={
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              {t("yourVenues")}
            </CardTitle>
          }
          description={
            isLoading
              ? t("loadingVenues")
              : t("venueCount", { count: venues.length })
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
                <TableHead className="text-muted-foreground">{tCommon("name")}</TableHead>
                <TableHead className="text-muted-foreground">{tForms("city")}</TableHead>
                <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
                <TableHead className="text-right text-muted-foreground">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={4} />
              ) : venues.length === 0 ? (
                <TableEmptyRow colSpan={4}>
                  {t("noVenuesYet")}
                </TableEmptyRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id} className="border-border">
                    <TableCell className="font-medium text-foreground">{venue.name}</TableCell>
                    <TableCell className="text-muted-foreground">{venue.city ?? "—"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {venue.status && <StatusBadge status={venue.status} />}
                        {venue.status === "DRAFT" && venue.readiness && (
                          <p className="text-xs text-muted-foreground">
                            {t("setup")} {venue.readiness.requiredComplete}/{venue.readiness.requiredTotal}
                          </p>
                        )}
                        {venue.status === "REJECTED" && venue.rejectionReason && (
                          <p className="text-xs text-destructive line-clamp-2">
                            {venue.rejectionReason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="border-border">
                        <Link href={`/vendorDashboard/venues/new?id=${encodeURIComponent(venue.id)}`}>
                          <Pencil className="mr-1 h-3 w-3" /> {tCommon("edit")}
                        </Link>
                      </Button>
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
