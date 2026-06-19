"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
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
  listAmenityCatalog,
  listVenueTypes,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import { fieldClassName, isBlank, requiredMessage } from "@/lib/form-validation";
import { toastApiError } from "@/lib/toasts";

const inputClass = "bg-input/50 border-border w-full";

export default function VenueTaxonomyPage() {
  const queryClient = useQueryClient();
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [typeAttempted, setTypeAttempted] = useState(false);
  const [amenityAttempted, setAmenityAttempted] = useState(false);

  const typeNameError = typeAttempted && isBlank(typeName) ? requiredMessage("Name") : null;
  const amenityNameError =
    amenityAttempted && isBlank(amenityName) ? requiredMessage("Name") : null;

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
      toast.success("Venue type created");
      setTypeName("");
      setTypeDesc("");
      setTypeAttempted(false);
      queryClient.invalidateQueries({ queryKey: venueKeys.types() });
    },
    onError: (e) => toastApiError(e),
  });

  const createAmenityMut = useMutation({
    mutationFn: () => createAmenityCatalogItem({ name: amenityName.trim() }),
    onSuccess: () => {
      toast.success("Amenity catalog item created");
      setAmenityName("");
      setAmenityAttempted(false);
      queryClient.invalidateQueries({ queryKey: venueKeys.amenityCatalog() });
    },
    onError: (e) => toastApiError(e),
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
          <h1 className="text-2xl font-bold text-white">Venue taxonomy</h1>
          <p className="text-sm text-muted-foreground">
            Define venue types and the amenity catalog vendors choose from when setting up
            listings.
          </p>
        </div>

        <Tabs defaultValue="types" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-muted/50 p-1">
            <TabsTrigger value="types" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              Venue types
            </TabsTrigger>
            <TabsTrigger value="amenities" className="gap-1.5">
              <Sparkles className="h-4 w-4" />
              Amenity catalog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Add venue type</CardTitle>
                <CardDescription>
                  e.g. Wedding hall, Villa, Conference room — used when vendors create venues.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  label="Name"
                  htmlFor="type-name"
                  required
                  error={typeNameError}
                  className="sm:col-span-2"
                >
                  <Input
                    id="type-name"
                    placeholder="e.g. Wedding hall"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    aria-invalid={!!typeNameError}
                    className={fieldClassName(inputClass, !!typeNameError)}
                  />
                </FormField>
                <FormField label="Description" htmlFor="type-desc">
                  <Textarea
                    id="type-desc"
                    placeholder="Optional short description…"
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
                  Add venue type
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">All venue types</CardTitle>
                <CardDescription>{types.length} type{types.length !== 1 ? "s" : ""}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {typesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : types.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No venue types yet. Add one above.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-b-xl border-t border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Name</TableHead>
                          <TableHead className="text-muted-foreground">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {types.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-medium text-foreground">{t.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {t.description ?? "—"}
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
                <CardTitle>Add amenity</CardTitle>
                <CardDescription>
                  e.g. Wi‑Fi, Chairs, Catering — vendors mark these as included or paid add-ons.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  label="Name"
                  htmlFor="amenity-name"
                  required
                  error={amenityNameError}
                >
                  <Input
                    id="amenity-name"
                    placeholder="e.g. Wi‑Fi"
                    value={amenityName}
                    onChange={(e) => setAmenityName(e.target.value)}
                    aria-invalid={!!amenityNameError}
                    className={fieldClassName(inputClass, !!amenityNameError)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submitAmenity();
                      }
                    }}
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
                  Add catalog item
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Amenity catalog</CardTitle>
                <CardDescription>
                  {catalog.length} item{catalog.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {catalogLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : catalog.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No amenities in the catalog yet. Add one above.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-b-xl border-t border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catalog.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium text-foreground">{c.name}</TableCell>
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
    </RoleGuard>
  );
}
