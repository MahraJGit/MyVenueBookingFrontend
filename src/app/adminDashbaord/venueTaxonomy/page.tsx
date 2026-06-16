"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createAmenityCatalogItem,
  createVenueType,
  listAmenityCatalog,
  listVenueTypes,
} from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import { toastApiError } from "@/lib/toasts";

export default function VenueTaxonomyPage() {
  const queryClient = useQueryClient();
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [amenityCategory, setAmenityCategory] = useState("add_on");

  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: venueKeys.types(),
    queryFn: listVenueTypes,
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: venueKeys.amenityCatalog(),
    queryFn: listAmenityCatalog,
  });

  const createTypeMut = useMutation({
    mutationFn: () => createVenueType({ name: typeName, description: typeDesc || undefined }),
    onSuccess: () => {
      toast.success("Venue type created");
      setTypeName("");
      setTypeDesc("");
      queryClient.invalidateQueries({ queryKey: venueKeys.types() });
    },
    onError: (e) => toastApiError(e),
  });

  const createAmenityMut = useMutation({
    mutationFn: () =>
      createAmenityCatalogItem({
        name: amenityName,
        category: amenityCategory,
      }),
    onSuccess: () => {
      toast.success("Amenity catalog item created");
      setAmenityName("");
      queryClient.invalidateQueries({ queryKey: venueKeys.amenityCatalog() });
    },
    onError: (e) => toastApiError(e),
  });

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Venue taxonomy</h1>
          <p className="text-sm text-muted-foreground">
            Manage venue types and amenity catalog entries.
          </p>
        </div>

        <Tabs defaultValue="types">
          <TabsList className="bg-[#1B1B1B] border border-[#303030]">
            <TabsTrigger value="types">Venue types</TabsTrigger>
            <TabsTrigger value="amenities">Amenity catalog</TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} className="border-[#303030] bg-black" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} className="border-[#303030] bg-black" />
              </div>
              <Button onClick={() => createTypeMut.mutate()} disabled={!typeName.trim() || createTypeMut.isPending}>
                Add venue type
              </Button>
            </div>
            {typesLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ul className="space-y-2">
                {types.map((t) => (
                  <li key={t.id} className="rounded-lg border border-[#303030] p-3 text-white">
                    {t.name}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4">
            <div className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={amenityName} onChange={(e) => setAmenityName(e.target.value)} className="border-[#303030] bg-black" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={amenityCategory} onChange={(e) => setAmenityCategory(e.target.value)} className="border-[#303030] bg-black" />
              </div>
              <Button onClick={() => createAmenityMut.mutate()} disabled={!amenityName.trim() || createAmenityMut.isPending}>
                Add catalog item
              </Button>
            </div>
            {catalogLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <ul className="space-y-2">
                {catalog.map((c) => (
                  <li key={c.id} className="rounded-lg border border-[#303030] p-3 text-white">
                    {c.name}
                    {c.category && (
                      <span className="ml-2 text-xs text-muted-foreground">({c.category})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
