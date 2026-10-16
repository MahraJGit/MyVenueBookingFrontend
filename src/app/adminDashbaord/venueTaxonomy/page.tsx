"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createAmenityCatalogItem,
  createVenueType,
  deleteAmenityCatalogItem,
  deleteVenueType,
  listAmenityCatalog,
  listVenueTypes,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { AmenityCatalogItem, VenueType } from "@/features/venues/types";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import {
  DashboardDataTable,
  DashboardSortableHeader,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { fieldClassName, isBlank } from "@/lib/form-validation";
import { toastApiError } from "@/lib/toasts";
import {
  DashboardPanel,
  DashboardPageShell,
  dashboardCardClass,
  dashboardInputClass,
  dashboardTabsListClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardDialogContentClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { cn } from "@/lib/utils";

const inputClass = dashboardInputClass;
type CreateKind = "category" | "subcategory";

export default function VenueTaxonomyPage() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const queryClient = useQueryClient();
  const [createKind, setCreateKind] = useState<CreateKind>("category");
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [typeParentId, setTypeParentId] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [amenityDesc, setAmenityDesc] = useState("");
  const [typeAttempted, setTypeAttempted] = useState(false);
  const [amenityAttempted, setAmenityAttempted] = useState(false);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<VenueType | null>(null);
  const [deleteAmenityTarget, setDeleteAmenityTarget] = useState<AmenityCatalogItem | null>(null);

  const typeNameError = typeAttempted && isBlank(typeName) ? tValidation("required") : null;
  const typeParentError =
    typeAttempted && createKind === "subcategory" && isBlank(typeParentId)
      ? tValidation("required")
      : null;
  const amenityNameError =
    amenityAttempted && isBlank(amenityName) ? tValidation("required") : null;

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: () => listVenueTypes(),
  });

  // Any root (no parent) can receive subcategories — including empty new categories.
  const categories = useMemo(
    () => types.filter((type) => !type.parentId),
    [types],
  );

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: venueKeys.amenityCatalog(),
    queryFn: listAmenityCatalog,
  });

  const createTypeMut = useMutation({
    mutationFn: () =>
      createVenueType({
        name: typeName.trim(),
        description: typeDesc || undefined,
        parentId: createKind === "category" ? null : typeParentId,
      }),
    onSuccess: () => {
      toast.success(
        createKind === "category" ? t("venueCategoryCreated") : t("venueTypeCreated"),
      );
      setTypeName("");
      setTypeDesc("");
      setTypeParentId("");
      setTypeAttempted(false);
      queryClient.invalidateQueries({ queryKey: venueKeys.types() });
    },
    onError: (e) => toastApiError(e),
  });

  const createAmenityMut = useMutation({
    mutationFn: () =>
      createAmenityCatalogItem({
        name: amenityName.trim(),
        description: amenityDesc.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t("amenityCreated"));
      setAmenityName("");
      setAmenityDesc("");
      setAmenityAttempted(false);
      queryClient.invalidateQueries({ queryKey: venueKeys.amenityCatalog() });
    },
    onError: (e) => toastApiError(e),
  });

  const deleteTypeMut = useMutation({
    mutationFn: (id: string) => deleteVenueType(id),
    onSuccess: () => {
      toast.success(t("venueTypeDeleted"));
      setDeleteTypeTarget(null);
      queryClient.invalidateQueries({ queryKey: venueKeys.types() });
    },
    onError: (e) => toastApiError(e, t("couldNotDeleteVenueType")),
  });

  const deleteAmenityMut = useMutation({
    mutationFn: (id: string) => deleteAmenityCatalogItem(id),
    onSuccess: () => {
      toast.success(t("amenityDeleted"));
      setDeleteAmenityTarget(null);
      queryClient.invalidateQueries({ queryKey: venueKeys.amenityCatalog() });
    },
    onError: (e) => toastApiError(e, t("couldNotDeleteAmenity")),
  });

  function switchCreateKind(kind: CreateKind) {
    setCreateKind(kind);
    setTypeAttempted(false);
    if (kind === "category") setTypeParentId("");
  }

  function submitType() {
    setTypeAttempted(true);
    if (isBlank(typeName)) return;
    if (createKind === "subcategory" && isBlank(typeParentId)) return;
    createTypeMut.mutate();
  }

  function submitAmenity() {
    setAmenityAttempted(true);
    if (isBlank(amenityName)) return;
    createAmenityMut.mutate();
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <DashboardPageShell>
        <DashboardPanel>
          <DashboardPageHeader
            title={t("venueTaxonomy")}
            description={t("venueTaxonomyDesc")}
          />

        <Tabs defaultValue="types" className="space-y-4">
          <TabsList className={dashboardTabsListClass}>
            <TabsTrigger value="types" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              {t("venueTypes")}
            </TabsTrigger>
            <TabsTrigger value="amenities" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              {t("amenityCatalog")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle>{t("addVenueTaxonomyTitle")}</CardTitle>
                <CardDescription>{t("venueTypeHint")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1"
                  role="tablist"
                  aria-label={t("addVenueTaxonomyTitle")}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={createKind === "category"}
                    onClick={() => switchCreateKind("category")}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      createKind === "category"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("addVenueCategory")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={createKind === "subcategory"}
                    onClick={() => switchCreateKind("subcategory")}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      createKind === "subcategory"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t("addVenueType")}
                  </button>
                </div>

                {createKind === "subcategory" ? (
                  categories.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                      {t("venueSubcategoryNeedsCategory")}
                    </p>
                  ) : (
                    <FormField
                      label={t("venueCategoryParent")}
                      htmlFor="type-parent"
                      required
                      error={typeParentError}
                    >
                      <Select
                        value={typeParentId || undefined}
                        onValueChange={setTypeParentId}
                      >
                        <SelectTrigger
                          id="type-parent"
                          aria-invalid={!!typeParentError}
                          className={fieldClassName(
                            cn(inputClass, "w-full"),
                            !!typeParentError,
                          )}
                        >
                          <SelectValue placeholder={t("selectVenueCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )
                ) : null}

                <FormField
                  label={tCommon("name")}
                  htmlFor="type-name"
                  required
                  error={typeNameError}
                  className="sm:col-span-2"
                >
                  <Input
                    id="type-name"
                    placeholder={
                      createKind === "category"
                        ? t("venueCategoryNamePlaceholder")
                        : t("venueTypeNamePlaceholder")
                    }
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    aria-invalid={!!typeNameError}
                    className={fieldClassName(inputClass, !!typeNameError)}
                  />
                </FormField>
                <FormField label={tCommon("description")} htmlFor="type-desc">
                  <Textarea
                    id="type-desc"
                    placeholder={t("descriptionOptional")}
                    value={typeDesc}
                    onChange={(e) => setTypeDesc(e.target.value)}
                    className={`${inputClass} min-h-20`}
                  />
                </FormField>
              </CardContent>
              <CardFooter className="border-t justify-end">
                <Button
                  type="button"
                  onClick={submitType}
                  disabled={
                    createTypeMut.isPending ||
                    (createKind === "subcategory" && categories.length === 0)
                  }
                >
                  {createTypeMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {createKind === "category"
                    ? t("addVenueCategory")
                    : t("addVenueType")}
                </Button>
              </CardFooter>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle className="text-base">{t("allVenueTypes")}</CardTitle>
                <CardDescription>{t("typeCount", { count: types.length })}</CardDescription>
              </CardHeader>
              <CardContent>
                <TaxonomyTable
                  items={types}
                  isLoading={typesLoading}
                  emptyLabel={t("noVenueTypesYet")}
                  onDelete={setDeleteTypeTarget}
                  showCategory
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4">
            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle>{t("addAmenity")}</CardTitle>
                <CardDescription>
                  {t("amenityHint")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label={tCommon("name")}
                  htmlFor="amenity-name"
                  required
                  error={amenityNameError}
                >
                  <Input
                    id="amenity-name"
                    placeholder={t("amenityNamePlaceholder")}
                    value={amenityName}
                    onChange={(e) => setAmenityName(e.target.value)}
                    aria-invalid={!!amenityNameError}
                    className={fieldClassName(inputClass, !!amenityNameError)}
                  />
                </FormField>
                <FormField label={tCommon("description")} htmlFor="amenity-desc">
                  <Textarea
                    id="amenity-desc"
                    placeholder={t("amenityDescPlaceholder")}
                    value={amenityDesc}
                    onChange={(e) => setAmenityDesc(e.target.value)}
                    className={`${inputClass} min-h-20`}
                  />
                </FormField>
              </CardContent>
              <CardFooter className="border-t justify-end">
                <Button
                  type="button"
                  onClick={submitAmenity}
                  disabled={createAmenityMut.isPending}
                >
                  {createAmenityMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t("addCatalogItem")}
                </Button>
              </CardFooter>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader>
                <CardTitle className="text-base">{t("amenityCatalog")}</CardTitle>
                <CardDescription>
                  {t("itemCount", { count: catalog.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaxonomyTable
                  items={catalog}
                  isLoading={catalogLoading}
                  emptyLabel={t("noAmenitiesYet")}
                  onDelete={setDeleteAmenityTarget}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </DashboardPanel>
      </DashboardPageShell>

      <Dialog
        open={Boolean(deleteTypeTarget)}
        onOpenChange={(open) => !open && setDeleteTypeTarget(null)}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("deleteVenueType")}</DialogTitle>
            <DialogDescription>
              {t("deleteVenueTypeWarning")}
            </DialogDescription>
          </DialogHeader>

          {deleteTypeTarget ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">{t("nameLabel")}</span>
                <span className="font-semibold text-foreground">{deleteTypeTarget.name}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                {t("deleteVenueTypeConfirm")}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTypeTarget(null)}
              disabled={deleteTypeMut.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteTypeTarget) return;
                deleteTypeMut.mutate(deleteTypeTarget.id);
              }}
              disabled={!deleteTypeTarget || deleteTypeMut.isPending}
            >
              {deleteTypeMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("yesDelete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteAmenityTarget)}
        onOpenChange={(open) => !open && setDeleteAmenityTarget(null)}
      >
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("deleteAmenity")}</DialogTitle>
            <DialogDescription>
              {t("deleteAmenityWarning")}
            </DialogDescription>
          </DialogHeader>

          {deleteAmenityTarget ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">{t("nameLabel")}</span>
                <span className="font-semibold text-foreground">{deleteAmenityTarget.name}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                {t("deleteAmenityConfirm")}
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteAmenityTarget(null)}
              disabled={deleteAmenityMut.isPending}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteAmenityTarget) return;
                deleteAmenityMut.mutate(deleteAmenityTarget.id);
              }}
              disabled={!deleteAmenityTarget || deleteAmenityMut.isPending}
            >
              {deleteAmenityMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                t("yesDelete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}

type TaxonomyItem = VenueType | AmenityCatalogItem;

function TaxonomyTable<T extends TaxonomyItem>({
  items,
  isLoading,
  emptyLabel,
  onDelete,
  showCategory = false,
}: {
  items: T[];
  isLoading: boolean;
  emptyLabel: string;
  onDelete: (item: T) => void;
  showCategory?: boolean;
}) {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const table = useTableQueryState({
    initialSortBy: "name",
    initialSortOrder: "asc",
  });
  const filteredItems = useMemo(() => {
    const search = table.debouncedSearch.toLocaleLowerCase();
    return items
      .filter((item) => {
        if (!search) return true;
        const parentName =
          "parent" in item && item.parent && typeof item.parent === "object"
            ? (item.parent as { name?: string }).name ?? ""
            : "";
        return (
          item.name.toLocaleLowerCase().includes(search) ||
          item.description?.toLocaleLowerCase().includes(search) ||
          parentName.toLocaleLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const direction = table.sortOrder === "asc" ? 1 : -1;
        return direction * a.name.localeCompare(b.name);
      });
  }, [items, table.debouncedSearch, table.sortOrder]);
  const { total, totalPages, paginatedItems } = useClientPagination(
    filteredItems,
    table.pageSize,
    { page: table.page, setPage: table.setPage },
  );
  const colCount = showCategory ? 4 : 3;

  return (
    <DashboardDataTable
      toolbar={{
        search: {
          value: table.search,
          onChange: table.setSearch,
          placeholder: `${tCommon("search")}...`,
        },
        pageSize: { value: table.pageSize, onChange: table.setPageSize },
        onReset: table.reset,
        showReset: table.hasActiveFilters,
      }}
      pagination={{
        label: formatTableRangeLabel({
          page: table.page,
          pageSize: table.pageSize,
          total,
          showingLabel: (values) => tTables("showing", values),
        }),
        page: table.page,
        totalPages,
        total,
        onPageChange: table.setPage,
        previousLabel: tCommon("previous"),
        nextLabel: tCommon("next"),
        isLoading,
      }}
    >
      <Table
        className={cn(dashboardTableClass, "min-w-[700px]")}
        containerClassName={dashboardTableContainerClass}
      >
        <TableHeader>
          <TableRow className={dashboardTableHeaderRowClass}>
            <DashboardSortableHeader
              className="min-w-[180px]"
              label={tCommon("name")}
              column="name"
              sortBy={table.sortBy}
              sortOrder={table.sortOrder}
              onSort={table.toggleSort}
            />
            {showCategory ? (
              <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
                {t("venueCategoryCol")}
              </TableHead>
            ) : null}
            <TableHead className="min-w-[280px] whitespace-nowrap text-muted-foreground">
              {tCommon("description")}
            </TableHead>
            <TableHead className="min-w-[80px] whitespace-nowrap text-right text-muted-foreground">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton cols={colCount} />
          ) : (
            <>
              {paginatedItems.map((item) => {
                const parentName =
                  showCategory &&
                  "parent" in item &&
                  item.parent &&
                  typeof item.parent === "object"
                    ? (item.parent as { name?: string }).name
                    : undefined;
                const isCategory =
                  showCategory &&
                  "parentId" in item &&
                  !(item as VenueType).parentId;

                return (
                  <TableRow key={item.id} className={dashboardTableRowClass}>
                    <TableCell className="whitespace-normal break-words font-medium text-foreground align-top">
                      {item.name}
                    </TableCell>
                    {showCategory ? (
                      <TableCell className="whitespace-normal break-words text-muted-foreground align-top">
                        {parentName ??
                          (isCategory
                            ? t("venueCategoryTopLevel")
                            : tCommon("notAvailable"))}
                      </TableCell>
                    ) : null}
                    <TableCell className="whitespace-normal break-words text-muted-foreground align-top">
                      {item.description ?? tCommon("notAvailable")}
                    </TableCell>
                    <TableCell className="w-14 shrink-0 whitespace-nowrap text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label={`${tCommon("delete")} ${item.name}`}
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!paginatedItems.length ? (
                <TableEmptyRow colSpan={colCount}>
                  {table.debouncedSearch ? tTables("noMatch") : emptyLabel}
                </TableEmptyRow>
              ) : null}
            </>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
