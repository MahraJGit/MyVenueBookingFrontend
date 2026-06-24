"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  createEventCategory,
  deleteEventCategory,
  listEventCategories,
  updateEventCategory,
  type EventCategory,
} from "@/features/event-categories/api";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { TableShell } from "@/components/ui/table-shell";
import { toastApiError } from "@/lib/toasts";

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString();
}

type FormState = {
  name: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  isActive: true,
};

export default function EventCategoriesPage() {
  const t = useTranslations("adminEventCategories");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tAdmin = useTranslations("adminDashboard");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EventCategory | null>(null);
  const [viewTarget, setViewTarget] = useState<EventCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventCategory | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["event-categories", debouncedSearch],
    queryFn: () =>
      listEventCategories({
        search: debouncedSearch || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createEventCategory({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success(t("categoryCreated"));
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, t("couldNotCreate")),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error("No category selected");
      return updateEventCategory(editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success(t("categoryUpdated"));
      setEditTarget(null);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, t("couldNotUpdate")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success(t("categoryDeleted"));
      setDeleteTarget(null);
    },
    onError: (err) => toastApiError(err, t("couldNotDelete")),
  });

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("failedLoad");
  }, [isError, error, t]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (row: EventCategory) => {
    setForm({
      name: row.name,
      description: row.description ?? "",
      isActive: row.isActive,
    });
    setEditTarget(row);
  };

  const canSubmitForm =
    form.name.trim().length >= 2 && form.name.trim().length <= 80;

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden rounded-2xl bg-[#0e0e0e] p-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
          <p className="text-sm text-gray-300">{t("description")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isFetching && !isLoading ? (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {tCommon("refreshing")}
            </span>
          ) : null}
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addCategory")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-search" className="text-zinc-300">
          {tCommon("search")}
        </Label>
        <div className="flex flex-row items-end gap-2">
          <Input
            id="category-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="border-zinc-700 bg-[#111111] text-white"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-zinc-700"
            onClick={() => setSearch("")}
            disabled={!search}
          >
            {tCommon("clear")}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          {t("searchHint")}
        </p>
      </div>


      {errorMessage ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-red-400/50 text-red-100 hover:bg-red-500/20"
            onClick={() => void refetch()}
          >
            {tCommon("retry")}
          </Button>
        </div>
      ) : null}

      <TableShell>
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">{tCommon("name")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("description")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
              <TableHead className="text-muted-foreground">{tCommon("created")}</TableHead>
              <TableHead className="text-right text-muted-foreground">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : (
              <>
                {categories.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="max-w-[220px] whitespace-normal font-medium wrap-break-word">
                      {row.name}
                    </TableCell>
                    <TableCell className="max-w-[320px] whitespace-normal text-zinc-300">
                      {row.description?.trim()
                        ? row.description
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? "default" : "secondary"}>
                        {row.isActive ? tStatus("active") : tStatus("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="min-w-[220px] text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                          onClick={() => setViewTarget(row)}
                        >
                          <Eye className="h-4 w-4" />
                          {tCommon("view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                          {tCommon("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {tCommon("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {!isLoading && categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-12 text-center text-gray-400"
                    >
                      {t("noCategories")}
                    </TableCell>
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
            <DialogDescription>{t("addDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">{tCommon("name")}</Label>
              <Input
                id="create-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="border-zinc-700"
                disabled={createMutation.isPending}
                maxLength={80}
              />
              <p className="text-xs text-zinc-500">
                {t("nameHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc">{t("descriptionOptional")}</Label>
              <Textarea
                id="create-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="min-h-24 border-zinc-700"
                disabled={createMutation.isPending}
                maxLength={500}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 p-3">
              <div>
                <p className="text-sm font-medium">{t("activeLabel")}</p>
                <p className="text-xs text-zinc-500">{t("activeHint")}</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: Boolean(v) }))
                }
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setForm(emptyForm);
              }}
              disabled={createMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!canSubmitForm || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tAdmin("saving")}
                </>
              ) : (
                tCommon("create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{tCommon("name")}</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="border-zinc-700"
                disabled={updateMutation.isPending}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">{tCommon("description")}</Label>
              <Textarea
                id="edit-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="min-h-24 border-zinc-700"
                disabled={updateMutation.isPending}
                maxLength={500}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 p-3">
              <div>
                <p className="text-sm font-medium">{t("activeLabel")}</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, isActive: Boolean(v) }))
                }
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditTarget(null);
                setForm(emptyForm);
              }}
              disabled={updateMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={!canSubmitForm || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tAdmin("saving")}
                </>
              ) : (
                t("saveChanges")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewTarget)}
        onOpenChange={(open) => !open && setViewTarget(null)}
      >
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>{t("detailsTitle")}</DialogTitle>
            <DialogDescription>{t("detailsDesc")}</DialogDescription>
          </DialogHeader>

          {viewTarget ? (
            <div className="grid gap-3 text-sm">
              <Detail label={tCommon("name")} value={viewTarget.name} />
              <Detail
                label={tCommon("description")}
                value={viewTarget.description?.trim() ? viewTarget.description : "—"}
              />
              <Detail
                label={tCommon("status")}
                value={viewTarget.isActive ? tStatus("active") : tStatus("inactive")}
              />
              <Detail label={tCommon("created")} value={formatDate(viewTarget.createdAt)} />
              <Detail label={tCommon("updated")} value={formatDate(viewTarget.updatedAt)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="border-zinc-700 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDesc")}</DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 text-sm">
              <p>
                <span className="text-zinc-400">{tAdmin("nameLabel")}</span>
                <span className="font-semibold text-white">
                  {deleteTarget.name}
                </span>
              </p>
              <p className="mt-2 text-zinc-400">
                {t("deleteConfirm")}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={!deleteTarget || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tAdmin("deleting")}
                </>
              ) : (
                t("yesDelete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-700 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap wrap-break-word">{value}</p>
    </div>
  );
}
