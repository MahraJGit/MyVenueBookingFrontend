"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardInputClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import {
  getMyVendorProfile,
  updateMyVendorPublicProfile,
} from "@/features/vendor/api";
import { uploadSingleFile } from "@/features/uploads/upload-single";
import { toastApiError } from "@/lib/toasts";

export default function VendorProfilePage() {
  const t = useTranslations("vendorProfile");
  const tCommon = useTranslations("common");
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    vendorName: "",
    slug: "",
    bio: "",
    websiteUrl: "",
    publicPhone: "",
    publicEmail: "",
    logoUrl: "" as string | null,
    coverImageUrl: "" as string | null,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const formInitializedRef = useRef(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["vendor-profile-me"],
    queryFn: getMyVendorProfile,
  });

  useEffect(() => {
    if (!profile || formInitializedRef.current) return;
    setForm({
      vendorName: profile.vendorName ?? "",
      slug: profile.slug ?? "",
      bio: profile.bio ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      publicPhone: profile.publicPhone ?? profile.phone ?? "",
      publicEmail: profile.publicEmail ?? profile.email ?? "",
      logoUrl: profile.logoUrl ?? "",
      coverImageUrl: profile.coverImageUrl ?? "",
    });
    formInitializedRef.current = true;
  }, [profile]);

  const imageUpload = useMutation({
    mutationFn: async ({
      file,
      field,
    }: {
      file: File;
      field: "logoUrl" | "coverImageUrl";
    }) => {
      const url = await uploadSingleFile(file, "vendor-media");
      return updateMyVendorPublicProfile({ [field]: url });
    },
    onSuccess: (updated, { field }) => {
      setForm((prev) => ({
        ...prev,
        logoUrl: updated.logoUrl ?? prev.logoUrl,
        coverImageUrl: updated.coverImageUrl ?? prev.coverImageUrl,
      }));
      void queryClient.invalidateQueries({ queryKey: ["vendor-profile-me"] });
      toast.success(t(field === "logoUrl" ? "logoUploaded" : "coverUploaded"));
    },
    onError: (error) => toastApiError(error),
  });

  const handleImageUpload = (file: File, field: "logoUrl" | "coverImageUrl") => {
    imageUpload.mutate({ file, field });
  };

  const isUploadingLogo =
    imageUpload.isPending && imageUpload.variables?.field === "logoUrl";
  const isUploadingCover =
    imageUpload.isPending && imageUpload.variables?.field === "coverImageUrl";

  const save = useMutation({
    mutationFn: () =>
      updateMyVendorPublicProfile({
        vendorName: form.vendorName.trim(),
        slug: form.slug.trim(),
        bio: form.bio.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        publicPhone: form.publicPhone.trim() || null,
        publicEmail: form.publicEmail.trim() || null,
        logoUrl: form.logoUrl || null,
        coverImageUrl: form.coverImageUrl || null,
      }),
    onSuccess: () => {
      toast.success(t("saved"));
      void queryClient.invalidateQueries({ queryKey: ["vendor-profile-me"] });
    },
    onError: (error) => toastApiError(error, t("saveFailed")),
  });

  if (isLoading) {
    return (
      <DashboardPageShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardPageShell>
    );
  }

  if (!profile) {
    return (
      <DashboardPageShell>
        <DashboardPanel>
          <p className="text-muted-foreground">{t("noProfile")}</p>
        </DashboardPanel>
      </DashboardPageShell>
    );
  }

  const isApproved = profile.verificationStatus === "APPROVED";

  return (
    <DashboardPageShell>
      <DashboardPageHeader title={t("title")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel className="space-y-4">
          <h2 className="text-lg font-semibold">{t("publicSection")}</h2>
          {!isApproved ? (
            <p className="text-sm text-muted-foreground">{t("pendingNotice")}</p>
          ) : null}

          <div className="space-y-2">
            <Label>{t("coverImage")}</Label>
            <div
              className="relative h-36 cursor-pointer overflow-hidden rounded-lg border border-dashed border-white/20 bg-black/30"
              onClick={() => isApproved && coverInputRef.current?.click()}
            >
              {form.coverImageUrl ? (
                <SecureStoredImage
                  src={form.coverImageUrl}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Camera className="mr-2 h-5 w-5" />
                  {t("uploadCover")}
                </div>
              )}
              {isUploadingCover ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : null}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!isApproved}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImageUpload(file, "coverImageUrl");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("logo")}</Label>
            <div
              className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/30"
              onClick={() => isApproved && logoInputRef.current?.click()}
            >
              {form.logoUrl ? (
                <SecureStoredImage
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground">
                  <Camera className="mb-1 h-5 w-5" />
                  {t("uploadLogo")}
                </div>
              )}
              {isUploadingLogo ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : null}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!isApproved}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImageUpload(file, "logoUrl");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendorName">{t("vendorName")}</Label>
            <Input
              id="vendorName"
              className={dashboardInputClass}
              value={form.vendorName}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, vendorName: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t("profileUrl")}</Label>
            <Input
              id="slug"
              className={dashboardInputClass}
              value={form.slug}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{t("bio")}</Label>
            <Textarea
              id="bio"
              className={dashboardTextareaClass}
              rows={4}
              value={form.bio}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">{t("website")}</Label>
            <Input
              id="websiteUrl"
              className={dashboardInputClass}
              value={form.websiteUrl}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publicPhone">{t("publicPhone")}</Label>
            <Input
              id="publicPhone"
              className={dashboardInputClass}
              value={form.publicPhone}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, publicPhone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publicEmail">{t("publicEmail")}</Label>
            <Input
              id="publicEmail"
              className={dashboardInputClass}
              value={form.publicEmail}
              disabled={!isApproved}
              onChange={(e) => setForm((prev) => ({ ...prev, publicEmail: e.target.value }))}
            />
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={!isApproved || save.isPending}
          >
            {save.isPending ? tCommon("saving") : tCommon("saveChanges")}
          </Button>
        </DashboardPanel>

        <DashboardPanel className="space-y-4">
          <h2 className="text-lg font-semibold">{t("verificationSection")}</h2>
          <p className="text-sm text-muted-foreground">{t("verificationLocked")}</p>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">{t("status")}:</span> {profile.verificationStatus}</p>
            <p><span className="text-muted-foreground">{t("ownerName")}:</span> {profile.ownerName}</p>
            <p><span className="text-muted-foreground">{t("legalEntity")}:</span> {profile.legalEntityName ?? "—"}</p>
            <p><span className="text-muted-foreground">{t("taxId")}:</span> {profile.taxId ?? "—"}</p>
          </div>
        </DashboardPanel>
      </div>
    </DashboardPageShell>
  );
}
