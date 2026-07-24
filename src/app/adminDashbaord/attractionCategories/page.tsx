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
  createAttractionCategory,
  deleteAttractionCategory,
  listAttractionCategories,
  updateAttractionCategory,
  type AttractionCategory,
} from "@/features/attraction-categories/api";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { toastApiError } from "@/lib/toasts";
import { useClientPagination } from "@/hooks/use-client-pagination";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardSearchInput,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardInputClass,
  dashboardTextareaClass,
  dashboardDialogContentClass,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

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

export default function AttractionCategoriesPage() {
  const t = useTranslations("adminAttractionCategories");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tAdmin = useTranslations("adminDashboard");
  const tListing = useTranslations("listing");
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
  const [editTarget, setEditTarget] = useState<AttractionCategory | null>(null);
  const [viewTarget, setViewTarget] = useState<AttractionCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttractionCategory | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["attraction-categories", debouncedSearch],
    queryFn: () =>
      listAttractionCategories({
        search: debouncedSearch || undefined,
      }),
  });

  const {
    page,
    setPage,
    resetPage,
    total,
    totalPages,
    paginatedItems: paginatedCategories,
  } = useClientPagination(categories);

  useEffect(() => {
    resetPage();
  }, [debouncedSearch, resetPage]);

  const createMutation = useMutation({
    mutationFn: () =>
      createAttractionCategory({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attraction-categories"] });
      toast.success(t("categoryCreated"));
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, t("couldNotCreate")),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editTarget) throw new Error("No category selected");
      return updateAttractionCategory(editTarget.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        isActive: form.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attraction-categories"] });
      toast.success(t("categoryUpdated"));
      setEditTarget(null);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, t("couldNotUpdate")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttractionCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attraction-categories"] });
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

  const openEdit = (row: AttractionCategory) => {
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
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("title")}
          description={t("description")}
          action={
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
          }
        />

      <div className="space-y-2">
        <Label htmlFor="category-search" className="text-muted-foreground">
          {tCommon("search")}
        </Label>
        <div className="flex flex-row items-end gap-2">
          <DashboardSearchInput
            id="category-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            autoComplete="off"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            className={cn("shrink-0", dashboardOutlineButtonClass)}
            onClick={() => setSearch("")}
            disabled={!search}
          >
            {tCommon("clear")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("searchHint")}
        </p>
      </div>


      {errorMessage ? (
        <DashboardErrorAlert
          message={errorMessage}
          onRetry={() => void refetch()}
          retryLabel={tCommon("retry")}
        />
      ) : null}

      <DashboardDataTable
        pagination={{
          label: tListing("pageOfWithCount", {
            page,
            totalPages,
            total,
            type: t("title").toLowerCase(),
          }),
          page,
          totalPages,
          total,
          onPageChange: setPage,
          previousLabel: tCommon("previous"),
          nextLabel: tCommon("next"),
          isLoading,
        }}
      >
        <Table
          className={cn(dashboardTableClass, "min-w-[1000px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                {tCommon("name")}
              </TableHead>
              <TableHead className="min-w-[240px] whitespace-nowrap text-muted-foreground">
                {tCommon("description")}
              </TableHead>
              <TableHead className="min-w-[100px] whitespace-nowrap text-muted-foreground">
                {tCommon("status")}
              </TableHead>
              <TableHead className="min-w-[170px] whitespace-nowrap text-muted-foreground">
                {tCommon("created")}
              </TableHead>
              <TableHead className="min-w-[300px] whitespace-nowrap text-right text-muted-foreground">
                {tCommon("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : (
              <>
                {paginatedCategories.map((row) => (
                  <TableRow
                    key={row.id}
                    className={dashboardTableRowClass}
                  >
                    <TableCell className="max-w-[200px] whitespace-normal break-words font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="max-w-[320px] whitespace-normal break-words text-muted-foreground">
                      {row.description?.trim()
                        ? row.description
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={row.isActive ? "default" : "secondary"}>
                        {row.isActive ? tStatus("active") : tStatus("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className={dashboardTableActionsClass}>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn("shrink-0", dashboardOutlineButtonClass)}
                          onClick={() => setViewTarget(row)}
                        >
                          <Eye className="h-4 w-4" />
                          {tCommon("view")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn("shrink-0", dashboardOutlineButtonClass)}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                          {tCommon("edit")}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="shrink-0"
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
                  <TableEmptyRow colSpan={5}>{t("noCategories")}</TableEmptyRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className={cn(dashboardDialogContentClass)}>
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
                className={dashboardInputClass}
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
                className={cn("min-h-24", dashboardTextareaClass)}
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
        <DialogContent className={cn(dashboardDialogContentClass)}>
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
                className={dashboardInputClass}
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
                className={cn("min-h-24", dashboardTextareaClass)}
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
        <DialogContent className={cn(dashboardDialogContentClass)}>
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
        <DialogContent className={cn(dashboardDialogContentClass)}>
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
      </DashboardPanel>
    </DashboardPageShell>
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
