"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DashboardPageShell,
  DashboardPanel,
  dashboardOutlineButtonClass,
  dashboardDialogContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  approveAdminCorporateOrganization,
  getAdminCorporateOrganization,
  rejectAdminCorporateOrganization,
  type OrganizationDocumentType,
  type OrganizationStatus,
} from "@/features/corporate-admin/api";
import { getPresignedViewUrl } from "@/features/uploads/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

function statusBadgeVariant(status: OrganizationStatus) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED" || status === "SUSPENDED") return "destructive";
  return "secondary";
}

function docTypeLabel(
  type: OrganizationDocumentType,
  t: ReturnType<typeof useTranslations<"adminCorporateOrganizations">>,
) {
  const map: Record<OrganizationDocumentType, string> = {
    TRADE_LICENSE: t("docTradeLicense"),
    MEMORANDUM: t("docMemorandum"),
    VAT_CERTIFICATE: t("docVatCertificate"),
    OTHER: t("docOther"),
  };
  return map[type] ?? type;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 py-2 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm text-foreground break-words">{value || "—"}</span>
    </div>
  );
}

export default function AdminCorporateOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const t = useTranslations("adminCorporateOrganizations");
  const tCommon = useTranslations("common");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["admin-corporate-org", id],
    queryFn: () => getAdminCorporateOrganization(id),
  });

  const org = detailQuery.data?.organization;
  const meta = detailQuery.data?.meta;
  const owner = org?.members.find((m) => m.role === "OWNER")?.corporateUser ?? org?.members[0]?.corporateUser;

  const statusLabel = (status: OrganizationStatus) => {
    if (status === "APPROVED") return t("statusApproved");
    if (status === "REJECTED") return t("statusRejected");
    if (status === "SUSPENDED") return t("statusSuspended");
    return t("statusPending");
  };

  const approveMutation = useMutation({
    mutationFn: () => approveAdminCorporateOrganization(id),
    onSuccess: (result) => {
      toast.success(result.message || t("approved"));
      void queryClient.invalidateQueries({ queryKey: ["admin-corporate-orgs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-corporate-org", id] });
    },
    onError: (err) => toastApiError(err, t("couldNotUpdate")),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectAdminCorporateOrganization(id, reason),
    onSuccess: (result) => {
      toast.success(result.message || t("rejected"));
      setRejectOpen(false);
      setRejectReason("");
      void queryClient.invalidateQueries({ queryKey: ["admin-corporate-orgs"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-corporate-org", id] });
    },
    onError: (err) => toastApiError(err, t("couldNotUpdate")),
  });

  const openDocument = useCallback(
    async (fileUrl: string) => {
      setOpeningDoc(fileUrl);
      try {
        const viewUrl = await getPresignedViewUrl(fileUrl);
        window.open(viewUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        toastApiError(err, t("couldNotOpenDoc"));
      } finally {
        setOpeningDoc(null);
      }
    },
    [t],
  );

  if (detailQuery.isLoading) {
    return (
      <DashboardPageShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardPageShell>
    );
  }

  if (detailQuery.isError || !org) {
    return (
      <DashboardPageShell>
        <DashboardPanel>
          <p className="text-muted-foreground">{t("notFound")}</p>
          <Button asChild variant="outline" className={cn("mt-4", dashboardOutlineButtonClass)}>
            <Link href="/adminDashbaord/corporateOrganizations">{t("backToList")}</Link>
          </Button>
        </DashboardPanel>
      </DashboardPageShell>
    );
  }

  const canReject = org.status === "PENDING";
  const canApprove = org.status !== "APPROVED";
  const pendingAction = approveMutation.isPending || rejectMutation.isPending;

  return (
    <DashboardPageShell>
      <div className="mb-4">
        <Button asChild variant="outline" size="sm" className={dashboardOutlineButtonClass}>
          <Link href="/adminDashbaord/corporateOrganizations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
      </div>

      <DashboardPanel className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <DashboardPageHeader
            title={org.name}
            description={t("detailDescription")}
          />
          <Badge variant={statusBadgeVariant(org.status)} className="text-sm">
            {statusLabel(org.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove ? (
            <Button
              type="button"
              disabled={pendingAction}
              onClick={() => approveMutation.mutate()}
            >
              {approveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("approve")}
            </Button>
          ) : null}
          {canReject ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pendingAction}
              onClick={() => setRejectOpen(true)}
            >
              {t("reject")}
            </Button>
          ) : null}
        </div>

        {org.rejectedReason ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="font-medium text-destructive">{t("rejectionReason")}</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{org.rejectedReason}</p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel className="space-y-1">
            <h2 className="mb-3 text-lg font-semibold">{t("organizationDetails")}</h2>
            <DetailRow label={t("legalEntity")} value={org.legalEntityName ?? ""} />
            <DetailRow label={t("tradeLicenseNo")} value={org.tradeLicenseNumber} />
            <DetailRow label={t("tradeLicenseExpiry")} value={formatDate(org.tradeLicenseExpiry)} />
            <DetailRow label={t("vatTrn")} value={org.vatTrnNumber ?? ""} />
            <DetailRow label={t("industry")} value={org.industry ?? ""} />
            <DetailRow label={t("companySize")} value={org.companySize ?? ""} />
            <DetailRow label={t("website")} value={org.website ?? ""} />
            <DetailRow
              label={t("location")}
              value={[org.address, org.city, org.country].filter(Boolean).join(", ")}
            />
            <DetailRow label={t("preferredCurrency")} value={org.preferredCurrency} />
            <DetailRow label={t("submittedAt")} value={formatDate(org.createdAt)} />
            <DetailRow label={t("reviewedAt")} value={formatDate(org.reviewedAt)} />
            <DetailRow
              label={t("verificationAttempts")}
              value={
                meta
                  ? `${org.submissionCount} / ${meta.maxSubmissions} (${t("remaining", { count: meta.remainingSubmissions })})`
                  : String(org.submissionCount)
              }
            />
          </DashboardPanel>

          <DashboardPanel className="space-y-1">
            <h2 className="mb-3 text-lg font-semibold">{t("ownerContact")}</h2>
            {owner ? (
              <>
                <DetailRow
                  label={tCommon("name")}
                  value={`${owner.firstName} ${owner.lastName}`.trim()}
                />
                <DetailRow label={tCommon("email")} value={owner.email} />
                <DetailRow label={tCommon("phone")} value={owner.phone ?? ""} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noOwner")}</p>
            )}
            {org.about ? (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm font-medium text-muted-foreground">{tCommon("description")}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{org.about}</p>
              </div>
            ) : null}
          </DashboardPanel>
        </div>

        <DashboardPanel>
          <h2 className="mb-4 text-lg font-semibold">{t("uploadedDocuments")}</h2>
          {org.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noDocuments")}</p>
          ) : (
            <ul className="space-y-2">
              {org.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{docTypeLabel(doc.type, t)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.fileName ?? doc.fileUrl}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={dashboardOutlineButtonClass}
                    disabled={openingDoc === doc.fileUrl}
                    onClick={() => void openDocument(doc.fileUrl)}
                  >
                    {openingDoc === doc.fileUrl ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="mr-2 h-4 w-4" />
                    )}
                    {tCommon("view")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DashboardPanel>
      </DashboardPanel>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className={dashboardDialogContentClass}>
          <DialogHeader>
            <DialogTitle>{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("rejectPlaceholder")}
            className={dashboardTextareaClass}
            rows={4}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectReason.trim().length < 3 || rejectMutation.isPending}
              onClick={() => rejectMutation.mutate(rejectReason.trim())}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
