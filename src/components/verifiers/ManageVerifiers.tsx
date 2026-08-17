"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, Eye, EyeOff, Loader2, Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardDropdownContentClass,
  dashboardSelectTriggerClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
} from "@/components/dashboard/dashboard-ui";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { useAuth } from "@/features/auth/auth-context";
import {
  createVerifier,
  deleteVerifier,
  listAssignableAttractions,
  listAssignableEvents,
  listVerifierVendors,
  listVerifiers,
  updateVerifier,
  type VerifierRow,
  type VerifierStatus,
} from "@/features/verifiers/api";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

type ManageVerifiersProps = {
  scope: "admin" | "vendor";
};

type FormState = {
  username: string;
  password: string;
  displayName: string;
  vendorProfileId: string;
  eventIds: string[];
  attractionIds: string[];
};

type AssignmentOption = {
  id: string;
  title: string;
  subtitle?: string;
};

const emptyForm = (): FormState => ({
  username: "",
  password: "",
  displayName: "",
  vendorProfileId: "",
  eventIds: [],
  attractionIds: [],
});

function AssignmentMultiSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  selectedIds,
  onToggle,
  loading,
  disabled,
  emptyLabel,
  noMatchLabel,
  selectedCountLabel,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: AssignmentOption[];
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
  emptyLabel: string;
  noMatchLabel: string;
  selectedCountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.title.toLowerCase().includes(term) ||
        (option.subtitle?.toLowerCase().includes(term) ?? false),
    );
  }, [options, search]);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="h-auto min-h-9 w-full justify-between border-white/10 bg-transparent px-3 py-2 text-left font-normal hover:bg-white/5"
          >
            <span className="truncate text-sm">
              {loading
                ? "…"
                : selectedIds.length > 0
                  ? selectedCountLabel
                  : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[90] w-[var(--radix-popover-trigger-width)] border-white/10 bg-[#1B1B1B] p-2"
          align="start"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="mb-2 h-8"
            disabled={disabled || loading}
          />
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {search.trim() ? noMatchLabel : emptyLabel}
              </p>
            ) : (
              filtered.map((option) => {
                const checked = selectedIds.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-1.5 hover:bg-white/5"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        onToggle(option.id, value === true)
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {option.title}
                      </span>
                      {option.subtitle ? (
                        <span className="block text-xs text-muted-foreground">
                          {option.subtitle}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {options
            .filter((option) => selectedIds.includes(option.id))
            .map((option) => (
              <button
                key={option.id}
                type="button"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground hover:text-white"
                onClick={() => onToggle(option.id, false)}
              >
                <span className="truncate">{option.title}</span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ManageVerifiers({ scope }: ManageVerifiersProps) {
  const t = useTranslations("verifiers");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = scope === "admin";
  const apiScope: "workspace" | "platform" = isAdmin ? "platform" : "workspace";

  const table = useTableQueryState<{
    vendorProfileId: string;
    status: "ALL" | VerifierStatus;
  }>({
    initialSortBy: "createdAt",
    initialFilters: { vendorProfileId: "ALL", status: "ALL" },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VerifierRow | null>(null);
  const [viewingEvents, setViewingEvents] = useState<VerifierRow | null>(null);
  const [viewingAttractions, setViewingAttractions] =
    useState<VerifierRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const listParams = useMemo(
    () => ({
      scope: apiScope,
      page: table.page,
      limit: table.pageSize,
      search: table.debouncedSearch || undefined,
      sortBy: table.sortBy as "createdAt" | "username" | "displayName" | undefined,
      sortOrder: table.sortOrder,
      status: table.filters.status === "ALL" ? undefined : table.filters.status,
      vendorProfileId:
        isAdmin && table.filters.vendorProfileId !== "ALL"
          ? table.filters.vendorProfileId
          : undefined,
    }),
    [apiScope, isAdmin, table.debouncedSearch, table.filters, table.page, table.pageSize, table.sortBy, table.sortOrder],
  );

  const verifiersQuery = useQuery({
    queryKey: ["verifiers", user?.id, listParams],
    queryFn: () => listVerifiers(listParams),
    enabled: Boolean(user?.id),
  });

  const vendorsQuery = useQuery({
    queryKey: ["verifiers-vendors", user?.id],
    queryFn: listVerifierVendors,
    enabled: Boolean(user?.id) && isAdmin,
  });

  const assignVendorId = isAdmin
    ? editing?.vendorProfileId || form.vendorProfileId || undefined
    : undefined;

  const eventsQuery = useQuery({
    queryKey: ["verifiers-assignable-events", user?.id, assignVendorId ?? "self"],
    queryFn: () => listAssignableEvents(assignVendorId, apiScope),
    enabled:
      Boolean(user?.id) &&
      dialogOpen &&
      (!isAdmin || Boolean(assignVendorId)),
  });

  const attractionsQuery = useQuery({
    queryKey: [
      "verifiers-assignable-attractions",
      user?.id,
      assignVendorId ?? "self",
    ],
    queryFn: () => listAssignableAttractions(assignVendorId, apiScope),
    enabled:
      Boolean(user?.id) &&
      dialogOpen &&
      (!isAdmin || Boolean(assignVendorId)),
  });

  const assignableEvents = useMemo(() => {
    const byId = new Map(
      (eventsQuery.data ?? []).map((event) => [event.id, event]),
    );

    if (editing) {
      for (const event of editing.events) {
        if (!byId.has(event.id)) {
          byId.set(event.id, {
            id: event.id,
            eventName: event.eventName,
            slug: event.slug,
            startDateTime: event.startDateTime,
            endDateTime: event.startDateTime,
            status: event.status,
            city: "",
          });
        }
      }
    }

    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );
  }, [eventsQuery.data, editing]);

  const assignableAttractions = useMemo(() => {
    const byId = new Map(
      (attractionsQuery.data ?? []).map((attraction) => [
        attraction.id,
        attraction,
      ]),
    );

    if (editing) {
      for (const attraction of editing.attractions ?? []) {
        if (!byId.has(attraction.id)) {
          byId.set(attraction.id, {
            id: attraction.id,
            name: attraction.name,
            slug: attraction.slug,
            scheduleStartDate: attraction.scheduleStartDate,
            scheduleEndDate: null,
            status: attraction.status,
            city: attraction.city ?? "",
          });
        }
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [attractionsQuery.data, editing]);

  const eventOptions = useMemo<AssignmentOption[]>(
    () =>
      assignableEvents.map((event) => ({
        id: event.id,
        title: event.eventName,
        subtitle: [
          new Date(event.startDateTime).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            ...("timezone" in event && event.timezone
              ? { timeZone: event.timezone as string }
              : {}),
          }),
          event.city || null,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [assignableEvents],
  );

  const attractionOptions = useMemo<AssignmentOption[]>(
    () =>
      assignableAttractions.map((attraction) => ({
        id: attraction.id,
        title: attraction.name,
        subtitle: attraction.city || undefined,
      })),
    [assignableAttractions],
  );

  useEffect(() => {
    if (verifiersQuery.isError) {
      toastApiError(verifiersQuery.error, t("loadError"));
    }
  }, [verifiersQuery.isError, verifiersQuery.error, t]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["verifiers"] });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createVerifier>[0]) =>
      createVerifier(input, apiScope),
    onSuccess: () => {
      toast.success(t("createSuccess"));
      setDialogOpen(false);
      setForm(emptyForm());
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("saveError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Parameters<typeof updateVerifier>[1]) =>
      updateVerifier(id, input, apiScope),
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("saveError")),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "DISABLED";
    }) => updateVerifier(id, { status }, apiScope),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.status === "ACTIVE" ? t("enabledSuccess") : t("disabledSuccess"),
      );
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("saveError")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVerifier(id, apiScope),
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("deleteError")),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (row: VerifierRow) => {
    setEditing(row);
    setShowPassword(false);
    setForm({
      username: row.username,
      password: "",
      displayName: row.displayName ?? "",
      vendorProfileId: row.vendorProfileId,
      eventIds: row.events.map((event) => event.id),
      attractionIds: (row.attractions ?? []).map((attraction) => attraction.id),
    });
    setDialogOpen(true);
  };

  const toggleEvent = (eventId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      eventIds: checked
        ? [...new Set([...prev.eventIds, eventId])]
        : prev.eventIds.filter((id) => id !== eventId),
    }));
  };

  const toggleAttraction = (attractionId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      attractionIds: checked
        ? [...new Set([...prev.attractionIds, attractionId])]
        : prev.attractionIds.filter((id) => id !== attractionId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      if (!form.displayName.trim()) {
        toast.error(t("displayNameRequired"));
        return;
      }
      updateMutation.mutate({
        id: editing.id,
        displayName: form.displayName.trim(),
        eventIds: form.eventIds,
        attractionIds: form.attractionIds,
        ...(form.password.trim() ? { password: form.password } : {}),
      });
      return;
    }

    if (isAdmin && !form.vendorProfileId) {
      toast.error(t("vendorRequired"));
      return;
    }
    if (!form.username.trim()) {
      toast.error(t("usernameRequired"));
      return;
    }
    if (!form.password.trim()) {
      toast.error(t("passwordRequired"));
      return;
    }
    if (!form.displayName.trim()) {
      toast.error(t("displayNameRequired"));
      return;
    }

    createMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      displayName: form.displayName.trim(),
      eventIds: form.eventIds,
      attractionIds: form.attractionIds,
      ...(isAdmin ? { vendorProfileId: form.vendorProfileId } : {}),
    });
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const rows = verifiersQuery.data?.data ?? [];
  const meta = verifiersQuery.data?.meta;

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createVerifier")}
          </Button>
        }
      />

      <DashboardPanel className="space-y-4">
        <DashboardDataTable
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: t("searchPlaceholder"),
            },
            filters: (
              <>
          {isAdmin ? (
            <Select
              value={table.filters.vendorProfileId}
              onValueChange={(value) => table.setFilter("vendorProfileId", value)}
            >
              <SelectTrigger className={cn(dashboardSelectTriggerClass, "sm:w-64")}>
                <SelectValue placeholder={t("filterVendor")} />
              </SelectTrigger>
              <SelectContent className={dashboardDropdownContentClass}>
                <SelectItem value="ALL">{t("allVendors")}</SelectItem>
                {(vendorsQuery.data ?? []).map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
                <Select
                  value={table.filters.status}
                  onValueChange={(value) =>
                    table.setFilter("status", value as "ALL" | VerifierStatus)
                  }
                >
                  <SelectTrigger className={cn(dashboardSelectTriggerClass, "sm:w-44")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={dashboardDropdownContentClass}>
                    <SelectItem value="ALL">{tCommon("all")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
                    <SelectItem value="DISABLED">{t("statusDisabled")}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ),
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: verifiersQuery.isFetching && !verifiersQuery.isLoading,
          }}
          pagination={
            meta && meta.total > 0
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: meta.total,
                    showingLabel: (args) => tTables("showing", args),
                  }),
                  page: table.page,
                  totalPages: meta.totalPages,
                  total: meta.total,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading: verifiersQuery.isFetching,
                }
              : undefined
          }
        >

        <div className={dashboardTableContainerClass}>
          <Table className={dashboardTableClass}>
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <DashboardSortableHeader label={t("colUsername")} column="username" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                <DashboardSortableHeader label={t("colName")} column="displayName" sortBy={table.sortBy} sortOrder={table.sortOrder} onSort={table.toggleSort} />
                {isAdmin ? <TableHead>{t("colVendor")}</TableHead> : null}
                <TableHead>{t("colEvents")}</TableHead>
                <TableHead>{t("colAttractions")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead className="text-right">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifiersQuery.isLoading ? (
                <TableSkeleton cols={isAdmin ? 7 : 6} rows={5} />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={isAdmin ? 7 : 6}>
                  {table.hasActiveFilters ? tTables("noMatch") : t("empty")}
                </TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className={dashboardTableRowClass}>
                    <TableCell className="font-medium">{row.username}</TableCell>
                    <TableCell>{row.displayName}</TableCell>
                    {isAdmin ? (
                      <TableCell>{row.vendorName}</TableCell>
                    ) : null}
                    <TableCell>
                      {row.events.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {t("noEvents")}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {t("eventCount", { count: row.events.length })}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => setViewingEvents(row)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            {t("viewEvents")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {(row.attractions ?? []).length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          {t("noAttractions")}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {t("attractionCount", {
                              count: row.attractions.length,
                            })}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => setViewingAttractions(row)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            {t("viewAttractions")}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.status === "ACTIVE"}
                          disabled={statusMutation.isPending}
                          onCheckedChange={(checked) =>
                            statusMutation.mutate({
                              id: row.id,
                              status: checked ? "ACTIVE" : "DISABLED",
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {row.status === "ACTIVE"
                            ? t("statusActive")
                            : t("statusDisabled")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(row)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(t("deleteConfirm"))) {
                              deleteMutation.mutate(row.id);
                            }
                          }}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </DashboardDataTable>
      </DashboardPanel>

      <Dialog
        open={Boolean(viewingEvents)}
        onOpenChange={(open) => {
          if (!open) setViewingEvents(null);
        }}
      >
        <DialogContent
          className={cn(
            dashboardSurfaceBorderClass,
            "flex max-h-[85vh] w-full flex-col gap-3 overflow-hidden p-5 sm:max-w-md",
          )}
        >
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle>{t("viewEventsTitle")}</DialogTitle>
            <DialogDescription>
              {viewingEvents
                ? t("viewEventsDescription", {
                    name: viewingEvents.displayName,
                    username: viewingEvents.username,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {(viewingEvents?.events ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noEvents")}</p>
            ) : (
              (viewingEvents?.events ?? []).map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-white/10 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-white">
                    {event.eventName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.startDateTime).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      ...(event.timezone ? { timeZone: event.timezone } : {}),
                    })}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {t("eventStatus", { status: event.status.toLowerCase() })}
                  </p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => setViewingEvents(null)}>
              {t("close")}
            </Button>
            {viewingEvents ? (
              <Button
                type="button"
                onClick={() => {
                  const row = viewingEvents;
                  setViewingEvents(null);
                  openEdit(row);
                }}
              >
                {t("editAssignments")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingAttractions)}
        onOpenChange={(open) => {
          if (!open) setViewingAttractions(null);
        }}
      >
        <DialogContent
          className={cn(
            dashboardSurfaceBorderClass,
            "flex max-h-[85vh] w-full flex-col gap-3 overflow-hidden p-5 sm:max-w-md",
          )}
        >
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle>{t("viewAttractionsTitle")}</DialogTitle>
            <DialogDescription>
              {viewingAttractions
                ? t("viewAttractionsDescription", {
                    name: viewingAttractions.displayName,
                    username: viewingAttractions.username,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {(viewingAttractions?.attractions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noAttractions")}</p>
            ) : (
              (viewingAttractions?.attractions ?? []).map((attraction) => (
                <div
                  key={attraction.id}
                  className="rounded-md border border-white/10 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-white">
                    {attraction.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[attraction.city, t("eventStatus", { status: attraction.status.toLowerCase() })]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewingAttractions(null)}
            >
              {t("close")}
            </Button>
            {viewingAttractions ? (
              <Button
                type="button"
                onClick={() => {
                  const row = viewingAttractions;
                  setViewingAttractions(null);
                  openEdit(row);
                }}
              >
                {t("editAssignments")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setForm(emptyForm());
            setShowPassword(false);
          }
        }}
      >
        <DialogContent
          className={cn(
            dashboardSurfaceBorderClass,
            "flex max-h-[85vh] w-full flex-col gap-3 overflow-hidden p-5 sm:max-w-lg",
          )}
        >
          <DialogHeader className="shrink-0 space-y-1">
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {editing ? t("editTitle") : t("createTitle")}
            </DialogTitle>
            <DialogDescription>
              {editing ? t("editDescription") : t("createDescription")}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
            onSubmit={handleSubmit}
          >
            {isAdmin && !editing ? (
              <div className="space-y-1.5">
                <Label htmlFor="verifier-vendor">{t("vendor")}</Label>
                <Select
                  value={form.vendorProfileId || undefined}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      vendorProfileId: value,
                      eventIds: [],
                      attractionIds: [],
                    }))
                  }
                >
                  <SelectTrigger id="verifier-vendor">
                    <SelectValue placeholder={t("selectVendor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(vendorsQuery.data ?? []).map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.vendorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="verifier-username">{t("username")}</Label>
              <Input
                id="verifier-username"
                value={form.username}
                disabled={Boolean(editing)}
                autoComplete="off"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                placeholder={t("usernamePlaceholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verifier-password">
                {editing ? t("passwordOptional") : t("password")}
              </Label>
              <div className="relative">
                <Input
                  id="verifier-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  autoComplete="new-password"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder={
                    editing ? t("passwordLeaveBlank") : t("passwordPlaceholder")
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? tAuth("hidePassword") : tAuth("showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="verifier-display-name">{t("displayName")}</Label>
              <Input
                id="verifier-display-name"
                value={form.displayName}
                required
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayName: e.target.value }))
                }
                placeholder={t("displayNamePlaceholder")}
              />
            </div>

            {isAdmin && !assignVendorId ? (
              <p className="text-sm text-muted-foreground">
                {t("selectVendorFirst")}
              </p>
            ) : (
              <>
                <AssignmentMultiSelect
                  label={t("assignEvents")}
                  placeholder={t("selectEventsPlaceholder")}
                  searchPlaceholder={t("searchEventsPlaceholder")}
                  options={eventOptions}
                  selectedIds={form.eventIds}
                  onToggle={toggleEvent}
                  loading={eventsQuery.isLoading}
                  emptyLabel={t("noAssignableEvents")}
                  noMatchLabel={t("noEventsMatchSearch")}
                  selectedCountLabel={t("eventCount", {
                    count: form.eventIds.length,
                  })}
                />
                <AssignmentMultiSelect
                  label={t("assignAttractions")}
                  placeholder={t("selectAttractionsPlaceholder")}
                  searchPlaceholder={t("searchAttractionsPlaceholder")}
                  options={attractionOptions}
                  selectedIds={form.attractionIds}
                  onToggle={toggleAttraction}
                  loading={attractionsQuery.isLoading}
                  emptyLabel={t("noAssignableAttractions")}
                  noMatchLabel={t("noAttractionsMatchSearch")}
                  selectedCountLabel={t("attractionCount", {
                    count: form.attractionIds.length,
                  })}
                />
              </>
            )}

            <DialogFooter className="shrink-0 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editing ? t("saveChanges") : t("createVerifier")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
