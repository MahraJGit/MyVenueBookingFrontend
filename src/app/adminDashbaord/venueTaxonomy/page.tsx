"use client";

import { useState } from "react";
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
import { fieldClassName, isBlank } from "@/lib/form-validation";
import { toastApiError } from "@/lib/toasts";

const inputClass = "bg-input/50 border-border w-full";

export default function VenueTaxonomyPage() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const queryClient = useQueryClient();
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [amenityDesc, setAmenityDesc] = useState("");
  const [typeAttempted, setTypeAttempted] = useState(false);
  const [amenityAttempted, setAmenityAttempted] = useState(false);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<VenueType | null>(null);
  const [deleteAmenityTarget, setDeleteAmenityTarget] = useState<AmenityCatalogItem | null>(null);

  const typeNameError = typeAttempted && isBlank(typeName) ? tValidation("required") : null;
  const amenityNameError =
    amenityAttempted && isBlank(amenityName) ? tValidation("required") : null;

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: venueKeys.amenityCatalog(),
    queryFn: listAmenityCatalog,
  });

  const createTypeMut = useMutation({
    mutationFn: () => createVenueType({ name: typeName.trim(), description: typeDesc || undefined }),
    onSuccess: () => {
      toast.success(t("venueTypeCreated"));
      setTypeName("");
      setTypeDesc("");
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

  function submitType() {
    setTypeAttempted(true);
    if (isBlank(typeName)) return;
    createTypeMut.mutate();
  }

  function submitAmenity() {
    setAmenityAttempted(true);
    if (isBlank(amenityName)) return;
    createAmenityMut.mutate();
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t("venueTaxonomy")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("venueTaxonomyDesc")}
          </p>
        </div>

        <Tabs defaultValue="types" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/50 p-1">
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
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>{t("addVenueType")}</CardTitle>
                <CardDescription>
                  {t("venueTypeHint")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label={tCommon("name")}
                  htmlFor="type-name"
                  required
                  error={typeNameError}
                  className="sm:col-span-2"
                >
                  <Input
                    id="type-name"
                    placeholder={t("venueTypeNamePlaceholder")}
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
                  disabled={createTypeMut.isPending}
                >
                  {createTypeMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t("addVenueType")}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">{t("allVenueTypes")}</CardTitle>
                <CardDescription>{t("typeCount", { count: types.length })}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {typesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : types.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t("noVenueTypesYet")}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-b-xl border-t border-border px-4 sm:px-6 [&_[data-slot=table-container]]:overflow-x-visible">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[30%] whitespace-normal text-muted-foreground">
                            {tCommon("name")}
                          </TableHead>
                          <TableHead className="whitespace-normal text-muted-foreground">
                            {tCommon("description")}
                          </TableHead>
                          <TableHead className="w-14 shrink-0 whitespace-normal text-right text-muted-foreground">
                            {tCommon("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {types.map((venueType) => (
                          <TableRow key={venueType.id}>
                            <TableCell className="whitespace-normal break-words font-medium text-foreground align-top">
                              {venueType.name}
                            </TableCell>
                            <TableCell className="whitespace-normal break-words text-muted-foreground align-top">
                              {venueType.description ?? tCommon("notAvailable")}
                            </TableCell>
                            <TableCell className="w-14 shrink-0 whitespace-nowrap text-right align-top">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label={`${tCommon("delete")} ${venueType.name}`}
                                onClick={() => setDeleteTypeTarget(venueType)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4">
            <Card className="border-border bg-card">
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

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">{t("amenityCatalog")}</CardTitle>
                <CardDescription>
                  {t("itemCount", { count: catalog.length })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {catalogLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : catalog.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t("noAmenitiesYet")}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-b-xl border-t border-border px-4 sm:px-6 [&_[data-slot=table-container]]:overflow-x-visible">
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[35%] whitespace-normal text-muted-foreground">
                            {tCommon("name")}
                          </TableHead>
                          <TableHead className="whitespace-normal text-muted-foreground">
                            {tCommon("description")}
                          </TableHead>
                          <TableHead className="w-14 shrink-0 whitespace-normal text-right text-muted-foreground">
                            {tCommon("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalog.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-normal break-words font-medium text-foreground align-top">
                              {item.name}
                            </TableCell>
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
                                onClick={() => setDeleteAmenityTarget(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={Boolean(deleteTypeTarget)}
        onOpenChange={(open) => !open && setDeleteTypeTarget(null)}
      >
        <DialogContent className="border-border bg-card text-foreground">
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
        <DialogContent className="border-border bg-card text-foreground">
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
