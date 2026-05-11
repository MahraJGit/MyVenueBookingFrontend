"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { toastApiError } from "@/lib/toasts";

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString();
}

function TableSkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={`sk-${i}`} className="border-zinc-800">
      {Array.from({ length: 5 }).map((__, j) => (
        <TableCell key={j} className="py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-800" />
        </TableCell>
      ))}
    </TableRow>
  ));
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
      toast.success("Category created");
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, "Could not create category."),
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
      toast.success("Category updated");
      setEditTarget(null);
      setForm(emptyForm);
    },
    onError: (err) => toastApiError(err, "Could not update category."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEventCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success("Category deleted");
      setDeleteTarget(null);
    },
    onError: (err) => toastApiError(err, "Could not delete category."),
  });

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : "Failed to load categories.";
  }, [isError, error]);

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
          <h2 className="text-xl font-bold text-primary">Event categories</h2>
          <p className="text-sm text-gray-300">
            Create and manage categories used when listing and filtering events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isFetching && !isLoading ? (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Refreshing
            </span>
          ) : null}
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category-search" className="text-zinc-300">
          Search
        </Label>
        <div className="flex flex-row items-end gap-2">
          <Input
            id="category-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description"
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
            Clear
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          Results update as you type (short delay to limit requests).
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
            Retry
          </Button>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-800">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows />
            ) : (
              <>
                {categories.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-zinc-800 transition-colors hover:bg-zinc-900/50"
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
                        {row.isActive ? "Active" : "Inactive"}
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
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
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
                      No categories found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : null}
              </>
            )}
          </TableBody>
        </Table>
      </div>

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
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>
              Categories appear in event filters and can be assigned when creating
              events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
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
                2–80 characters. A URL-friendly slug is generated automatically.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-desc">Description (optional)</Label>
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
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-zinc-500">
                  Inactive categories stay in the database but can be hidden in
                  UIs.
                </p>
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!canSubmitForm || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Create"
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
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              If you change the name, the system updates the internal identifier
              used for URLs when needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
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
              <Label htmlFor="edit-desc">Description</Label>
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
                <p className="text-sm font-medium">Active</p>
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={!canSubmitForm || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save changes"
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
            <DialogTitle>Category details</DialogTitle>
            <DialogDescription>Read-only view of this category.</DialogDescription>
          </DialogHeader>

          {viewTarget ? (
            <div className="grid gap-3 text-sm">
              <Detail label="Name" value={viewTarget.name} />
              <Detail
                label="Description"
                value={viewTarget.description?.trim() ? viewTarget.description : "—"}
              />
              <Detail
                label="Status"
                value={viewTarget.isActive ? "Active" : "Inactive"}
              />
              <Detail label="Created" value={formatDate(viewTarget.createdAt)} />
              <Detail label="Updated" value={formatDate(viewTarget.updatedAt)} />
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
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. You can only delete a category if no
              active events are still using it.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-3 text-sm">
              <p>
                <span className="text-zinc-400">Name: </span>
                <span className="font-semibold text-white">
                  {deleteTarget.name}
                </span>
              </p>
              <p className="mt-2 text-zinc-400">
                Are you sure you want to permanently delete this category?
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
              Cancel
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
                  Deleting
                </>
              ) : (
                "Yes, delete"
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
