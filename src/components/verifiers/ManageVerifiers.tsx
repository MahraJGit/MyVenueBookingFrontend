"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
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
  DashboardPageHeader,
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardSearchInput,
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
} from "@/features/verifiers/api";
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

const emptyForm = (): FormState => ({
  username: "",
  password: "",
  displayName: "",
  vendorProfileId: "",
  eventIds: [],
  attractionIds: [],
});

export default function ManageVerifiers({ scope }: ManageVerifiersProps) {
  const t = useTranslations("verifiers");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = scope === "admin";
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "attractions" ? "attractions" : "events";

  const [search, setSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [attractionSearch, setAttractionSearch] = useState("");
  const [assignmentTab, setAssignmentTab] = useState<"events" | "attractions">(
    initialTab,
  );

  useEffect(() => {
    setAssignmentTab(initialTab);
  }, [initialTab]);

  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VerifierRow | null>(null);
  const [viewingEvents, setViewingEvents] = useState<VerifierRow | null>(null);
  const [viewingAttractions, setViewingAttractions] =
    useState<VerifierRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const listParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      vendorProfileId:
        isAdmin && vendorFilter !== "all" ? vendorFilter : undefined,
    }),
    [isAdmin, search, vendorFilter],
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
    queryFn: () => listAssignableEvents(assignVendorId),
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
    queryFn: () => listAssignableAttractions(assignVendorId),
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

    const term = eventSearch.trim().toLowerCase();
    return Array.from(byId.values())
      .filter((event) =>
        term
          ? event.eventName.toLowerCase().includes(term) ||
            event.city.toLowerCase().includes(term)
          : true,
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      );
  }, [eventsQuery.data, editing, eventSearch]);

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

    const term = attractionSearch.trim().toLowerCase();
    return Array.from(byId.values())
      .filter((attraction) =>
        term
          ? attraction.name.toLowerCase().includes(term) ||
            attraction.city.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [attractionsQuery.data, editing, attractionSearch]);

  useEffect(() => {
    if (verifiersQuery.isError) {
      toastApiError(verifiersQuery.error, t("loadError"));
    }
  }, [verifiersQuery.isError, verifiersQuery.error, t]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["verifiers"] });

  const createMutation = useMutation({
    mutationFn: createVerifier,
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
      updateVerifier(id, input),
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
    }) => updateVerifier(id, { status }),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.status === "ACTIVE" ? t("enabledSuccess") : t("disabledSuccess"),
      );
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("saveError")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVerifier,
    onSuccess: () => {
      toast.success(t("deleteSuccess"));
      void invalidate();
    },
    onError: (error) => toastApiError(error, t("deleteError")),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEventSearch("");
    setAttractionSearch("");
    setAssignmentTab(initialTab);
    setDialogOpen(true);
  };

  const openEdit = (row: VerifierRow) => {
    setEditing(row);
    setEventSearch("");
    setAttractionSearch("");
    setAssignmentTab(initialTab);
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
    if (!form.username.trim() || !form.password.trim()) {
      toast.error(t("credentialsRequired"));
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
  const rows = verifiersQuery.data ?? [];

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DashboardSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="sm:max-w-sm"
          />
          {isAdmin ? (
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className={cn(dashboardSelectTriggerClass, "sm:w-64")}>
                <SelectValue placeholder={t("filterVendor")} />
              </SelectTrigger>
              <SelectContent className={dashboardDropdownContentClass}>
                <SelectItem value="all">{t("allVendors")}</SelectItem>
                {(vendorsQuery.data ?? []).map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className={dashboardTableContainerClass}>
          <Table className={dashboardTableClass}>
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead>{t("colUsername")}</TableHead>
                <TableHead>{t("colName")}</TableHead>
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
                  {t("empty")}
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
            setEventSearch("");
            setAttractionSearch("");
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
              <Input
                id="verifier-password"
                type="password"
                value={form.password}
                autoComplete="new-password"
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={
                  editing ? t("passwordLeaveBlank") : t("passwordPlaceholder")
                }
              />
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

            <div className="space-y-1.5">
              <Label>
                {assignmentTab === "attractions"
                  ? t("assignAttractions")
                  : t("assignEvents")}
              </Label>
              {assignmentTab === "events" ? (
                <>
                  <Input
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder={t("searchEventsPlaceholder")}
                    disabled={
                      eventsQuery.isLoading ||
                      (isAdmin && !assignVendorId)
                    }
                  />
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
                    {eventsQuery.isLoading ? (
                      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("loadingEvents")}
                      </div>
                    ) : isAdmin && !assignVendorId ? (
                      <p className="py-1 text-sm text-muted-foreground">
                        {t("selectVendorFirst")}
                      </p>
                    ) : assignableEvents.length === 0 ? (
                      <p className="py-1 text-sm text-muted-foreground">
                        {eventSearch.trim()
                          ? t("noEventsMatchSearch")
                          : t("noAssignableEvents")}
                      </p>
                    ) : (
                      assignableEvents.map((event) => {
                        const checked = form.eventIds.includes(event.id);
                        return (
                          <label
                            key={event.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md p-1.5 hover:bg-white/5"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleEvent(event.id, value === true)
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">
                                {event.eventName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {new Date(event.startDateTime).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  ...(event.timezone ? { timeZone: event.timezone } : {}),
                                })}
                                {event.city ? ` · ${event.city}` : ""}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Input
                    value={attractionSearch}
                    onChange={(e) => setAttractionSearch(e.target.value)}
                    placeholder={t("searchAttractionsPlaceholder")}
                    disabled={
                      attractionsQuery.isLoading ||
                      (isAdmin && !assignVendorId)
                    }
                  />
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white/10 p-2">
                    {attractionsQuery.isLoading ? (
                      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("loadingAttractions")}
                      </div>
                    ) : isAdmin && !assignVendorId ? (
                      <p className="py-1 text-sm text-muted-foreground">
                        {t("selectVendorFirst")}
                      </p>
                    ) : assignableAttractions.length === 0 ? (
                      <p className="py-1 text-sm text-muted-foreground">
                        {attractionSearch.trim()
                          ? t("noAttractionsMatchSearch")
                          : t("noAssignableAttractions")}
                      </p>
                    ) : (
                      assignableAttractions.map((attraction) => {
                        const checked = form.attractionIds.includes(attraction.id);
                        return (
                          <label
                            key={attraction.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md p-1.5 hover:bg-white/5"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleAttraction(attraction.id, value === true)
                              }
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">
                                {attraction.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {attraction.city || "—"}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

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
