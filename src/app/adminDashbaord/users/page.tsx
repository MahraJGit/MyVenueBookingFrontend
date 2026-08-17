"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getDateFnsLocale } from "@/lib/date-locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DashboardDataTable,
  DashboardSortableHeader,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import {
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
  dashboardDialogContentClass,
} from "@/components/dashboard/dashboard-ui";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { SecureAvatar } from "@/components/users/SecureAvatar";
import { useAuth } from "@/features/auth/auth-context";
import {
  listAdminUsers,
  updateUserByAdmin,
  type AdminUser,
  type UserAccountStatus,
  type UserRole,
} from "@/features/users/api";
import { profileInitials } from "@/features/users/profile-display";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const selectTriggerClass = cn("w-full sm:w-[180px]", dashboardSelectTriggerClass);

type RoleFilter = UserRole | "ALL";
type StatusFilter = UserAccountStatus | "ALL";

function displayName(user: AdminUser) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (name) return name;
  return user.email ?? user.phone ?? user.id;
}

function statusBadgeVariant(status: UserAccountStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "SUSPENDED") return "destructive" as const;
  return "secondary" as const;
}

export default function UsersPage() {
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const table = useTableQueryState<{
    role: RoleFilter;
    status: StatusFilter;
  }>({
    initialSortBy: "createdAt",
    initialFilters: { role: "ALL", status: "ALL" },
  });
  const [statusTarget, setStatusTarget] = useState<{
    user: AdminUser;
    nextStatus: UserAccountStatus;
  } | null>(null);

  const listParams = {
    ...table.queryParams,
    ...(table.filters.role === "ALL" ? {} : { role: table.filters.role }),
    ...(table.filters.status === "ALL" ? {} : { status: table.filters.status }),
    sortBy: table.sortBy as "createdAt" | "firstName" | "email" | undefined,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["admin-users", listParams],
    queryFn: () => listAdminUsers(listParams),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserByAdmin(id, { role }),
    onSuccess: () => {
      toast.success(t("roleUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toastApiError(e),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserAccountStatus }) =>
      updateUserByAdmin(id, { status }),
    onSuccess: () => {
      toast.success(t("statusUpdated"));
      setStatusTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toastApiError(e),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;

  const statusLabel = (status: UserAccountStatus) => {
    if (status === "ACTIVE") return t("statusActive");
    if (status === "SUSPENDED") return t("statusSuspended");
    return t("statusInactive");
  };

  const isSelf = (userId: string) => currentUser?.id === userId;

  const confirmStatusChange = () => {
    if (!statusTarget) return;
    statusMutation.mutate({
      id: statusTarget.user.id,
      status: statusTarget.nextStatus,
    });
  };

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("title")} description={t("description")} />

        {isError ? (
          <DashboardErrorAlert
            message={error instanceof Error ? error.message : tCommon("error")}
            onRetry={() => refetch()}
          />
        ) : null}

        <DashboardDataTable
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: t("searchPlaceholder"),
            },
            filters: (
              <>
              <Select
                value={table.filters.role}
                onValueChange={(v) => table.setFilter("role", v as RoleFilter)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={dashboardDropdownContentClass}>
                  <SelectItem value="ALL">{t("allRoles")}</SelectItem>
                  <SelectItem value="BUYER">{t("roleBuyer")}</SelectItem>
                  <SelectItem value="VENDOR">{t("roleVendor")}</SelectItem>
                  <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={table.filters.status}
                onValueChange={(v) => table.setFilter("status", v as StatusFilter)}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={dashboardDropdownContentClass}>
                  <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("statusSuspended")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
                </SelectContent>
              </Select>
              </>
            ),
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: isFetching && !isLoading,
          }}
          pagination={
            showPagination
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: meta?.total ?? users.length,
                    showingLabel: (args) => tTables("showing", args),
                  }),
                  page: table.page,
                  totalPages,
                  total: meta?.total ?? users.length,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading: isFetching,
                }
              : undefined
          }
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[1100px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <DashboardSortableHeader className="min-w-[200px]" label={t("columnName")} column="firstName" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                <DashboardSortableHeader className="min-w-[200px]" label={t("columnEmail")} column="email" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                <TableHead className="min-w-[150px] whitespace-nowrap text-muted-foreground">
                  {t("columnPhone")}
                </TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                  {t("columnRole")}
                </TableHead>
                <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
                  {t("columnStatus")}
                </TableHead>
                <DashboardSortableHeader className="min-w-[120px]" label={t("columnJoined")} column="createdAt" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                <TableHead className="min-w-[130px] whitespace-nowrap text-right text-muted-foreground">
                  {t("columnActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={7} rows={table.pageSize} />
              ) : users.length === 0 ? (
                <TableEmptyRow colSpan={7}>
                  {table.hasActiveFilters ? tTables("noMatch") : t("noUsers")}
                </TableEmptyRow>
              ) : (
                users.map((user) => {
                  const self = isSelf(user.id);
                  const isActive = user.status === "ACTIVE";
                  const pendingRole =
                    roleMutation.isPending &&
                    roleMutation.variables?.id === user.id;
                  const pendingStatus =
                    statusMutation.isPending &&
                    statusMutation.variables?.id === user.id;

                  return (
                    <TableRow key={user.id} className={dashboardTableRowClass}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <SecureAvatar
                            avatarUrl={user.avatarUrl}
                            className="h-9 w-9"
                            alt={displayName(user)}
                            fallback={profileInitials(user.firstName, user.lastName)}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{displayName(user)}</p>
                            {self ? (
                              <p className="text-xs text-muted-foreground">{t("you")}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="truncate text-muted-foreground">
                        {user.email ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.phone
                          ? `${user.phoneCountryCode ?? ""} ${user.phone}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={user.role}
                          disabled={self || pendingRole}
                          onValueChange={(value) =>
                            roleMutation.mutate({
                              id: user.id,
                              role: value as UserRole,
                            })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-[130px]",
                              dashboardSelectTriggerClass,
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={dashboardDropdownContentClass}>
                            <SelectItem value="BUYER">{t("roleBuyer")}</SelectItem>
                            <SelectItem value="VENDOR">{t("roleVendor")}</SelectItem>
                            <SelectItem value="ADMIN">{t("roleAdmin")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={statusBadgeVariant(user.status)}>
                          {statusLabel(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "MMM d, yyyy", {
                              locale: dateFnsLocale,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={isActive ? "outline" : "default"}
                          className={dashboardOutlineButtonClass}
                          disabled={self || pendingStatus}
                          onClick={() =>
                            setStatusTarget({
                              user,
                              nextStatus: isActive ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                        >
                          {pendingStatus ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          {isActive ? t("deactivate") : t("activate")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DashboardDataTable>
      </DashboardPanel>

      <Dialog
        open={statusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setStatusTarget(null);
        }}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.nextStatus === "ACTIVE"
                ? t("activateConfirmTitle")
                : t("deactivateConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {statusTarget?.nextStatus === "ACTIVE"
                ? t("activateConfirmDesc")
                : t("deactivateConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className={dashboardOutlineButtonClass}
              onClick={() => setStatusTarget(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant={
                statusTarget?.nextStatus === "SUSPENDED" ? "destructive" : "default"
              }
              disabled={statusMutation.isPending}
              onClick={confirmStatusChange}
            >
              {statusMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
