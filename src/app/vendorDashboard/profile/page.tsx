"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
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
import {
  getMyVendorProfile,
  updateMyVendorPublicProfile,
} from "@/features/vendor/api";
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
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["vendor-profile-me"],
    queryFn: getMyVendorProfile,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      vendorName: profile.vendorName ?? "",
      slug: profile.slug ?? "",
      bio: profile.bio ?? "",
      websiteUrl: profile.websiteUrl ?? "",
      publicPhone: profile.publicPhone ?? profile.phone ?? "",
      publicEmail: profile.publicEmail ?? profile.email ?? "",
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateMyVendorPublicProfile({
        vendorName: form.vendorName.trim(),
        slug: form.slug.trim(),
        bio: form.bio.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        publicPhone: form.publicPhone.trim() || null,
        publicEmail: form.publicEmail.trim() || null,
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
