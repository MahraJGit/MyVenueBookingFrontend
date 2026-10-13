"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
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
  dashboardOutlineButtonClass,
  dashboardDialogContentClass,
  dashboardTextareaClass,
} from "@/components/dashboard/dashboard-ui";
import {
  approveAdminCorporateOrganization,
  getAdminCorporateOrganization,
  listAdminCorporateEvents,
  rejectAdminCorporateOrganization,
  type CorporateEventStatus,
  type OrganizationDocumentType,
  type OrganizationStatus,
} from "@/features/corporate-admin/api";
import {
  CorporateAlert,
  CorporateDetailHero,
  CorporateEmptyState,
  CorporateInfoGrid,
  CorporateInfoTile,
  CorporateListCard,
  CorporateMetaChip,
  CorporateProseBlock,
  CorporateSection,
  CorporateStatGrid,
  CorporateStatusBadge,
} from "@/features/corporate-admin/detail-ui";
import { getPresignedViewUrl } from "@/features/uploads/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

function orgStatusTone(
  status: OrganizationStatus,
): "success" | "danger" | "warning" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "SUSPENDED") return "danger";
  if (status === "PENDING") return "warning";
  return "neutral";
}

function eventStatusTone(
  status: CorporateEventStatus,
): "success" | "danger" | "warning" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  if (status === "PENDING_APPROVAL") return "warning";
  return "neutral";
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

  const eventsQuery = useQuery({
    queryKey: ["admin-corporate-events", { organizationId: id }],
    queryFn: () =>
      listAdminCorporateEvents({
        page: 1,
        limit: 50,
        organizationId: id,
      }),
  });

  const org = detailQuery.data?.organization;
  const meta = detailQuery.data?.meta;
  const owner =
    org?.members.find((m) => m.role === "OWNER")?.corporateUser ??
    org?.members[0]?.corporateUser;
  const orgEvents = eventsQuery.data?.data ?? [];

  const eventStatusLabel = (status: CorporateEventStatus) => {
    if (status === "APPROVED") return t("eventStatusApproved");
    if (status === "REJECTED") return t("eventStatusRejected");
    if (status === "CANCELLED") return t("eventStatusCancelled");
    if (status === "PENDING_APPROVAL") return t("eventStatusPendingApproval");
    return t("eventStatusDraft");
  };

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
        <CorporateSection title={t("notFound")}>
          <Button asChild variant="outline" className={dashboardOutlineButtonClass}>
            <Link href="/adminDashbaord/corporateOrganizations">{t("backToList")}</Link>
          </Button>
        </CorporateSection>
      </DashboardPageShell>
    );
  }

  const canReject = org.status === "PENDING" || org.status === "APPROVED";
  const canApprove = org.status !== "APPROVED";
  const pendingAction = approveMutation.isPending || rejectMutation.isPending;
  const location = [org.address, org.city, org.country].filter(Boolean).join(", ");
  const ownerName = owner
    ? `${owner.firstName} ${owner.lastName}`.trim() || owner.email
    : "";

  return (
    <DashboardPageShell>
      <CorporateDetailHero
        backHref="/adminDashbaord/corporateOrganizations"
        backLabel={t("backToList")}
        title={org.name}
        description={t("detailDescription")}
        avatarName={org.name}
        avatarUrl={org.logoUrl}
        badges={
          <CorporateStatusBadge tone={orgStatusTone(org.status)}>
            {statusLabel(org.status)}
          </CorporateStatusBadge>
        }
        meta={
          <>
            {location ? (
              <CorporateMetaChip icon={<MapPin className="h-3.5 w-3.5" />}>
                {location}
              </CorporateMetaChip>
            ) : null}
            {org.industry ? (
              <CorporateMetaChip icon={<Building2 className="h-3.5 w-3.5" />}>
                {org.industry}
              </CorporateMetaChip>
            ) : null}
            {org.website ? (
              <CorporateMetaChip icon={<Globe2 className="h-3.5 w-3.5" />}>
                {org.website.replace(/^https?:\/\//, "")}
              </CorporateMetaChip>
            ) : null}
          </>
        }
        actions={
          <>
            {canApprove ? (
              <Button
                type="button"
                disabled={pendingAction}
                onClick={() => approveMutation.mutate()}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
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
                <XCircle className="mr-2 h-4 w-4" />
                {t("reject")}
              </Button>
            ) : null}
          </>
        }
      />

      <CorporateStatGrid
        items={[
          {
            icon: <FileText className="h-5 w-5 text-primary" />,
            label: t("uploadedDocuments"),
            value: String(org.documents.length),
          },
          {
            icon: <CalendarDays className="h-5 w-5 text-primary" />,
            label: t("organizationEvents"),
            value: String(eventsQuery.data?.meta.total ?? orgEvents.length),
          },
          {
            icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
            label: t("verificationAttempts"),
            value: meta
              ? `${org.submissionCount} / ${meta.maxSubmissions}`
              : String(org.submissionCount),
          },
          {
            icon: <Building2 className="h-5 w-5 text-primary" />,
            label: t("preferredCurrency"),
            value: org.preferredCurrency || "—",
          },
        ]}
      />

      {org.rejectedReason ? (
        <CorporateAlert tone="danger" title={t("rejectionReason")}>
          {org.rejectedReason}
        </CorporateAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-5">
        <CorporateSection
          className="xl:col-span-3"
          icon={<Building2 className="h-5 w-5" />}
          title={t("organizationDetails")}
        >
          <CorporateInfoGrid>
            <CorporateInfoTile label={t("legalEntity")} value={org.legalEntityName} />
            <CorporateInfoTile
              label={t("tradeLicenseNo")}
              value={org.tradeLicenseNumber}
            />
            <CorporateInfoTile
              label={t("tradeLicenseExpiry")}
              value={formatDate(org.tradeLicenseExpiry)}
            />
            <CorporateInfoTile label={t("vatTrn")} value={org.vatTrnNumber} />
            <CorporateInfoTile label={t("industry")} value={org.industry} />
            <CorporateInfoTile label={t("companySize")} value={org.companySize} />
            <CorporateInfoTile
              label={t("website")}
              value={
                org.website ? (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {org.website}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <CorporateInfoTile label={t("location")} value={location} />
            <CorporateInfoTile
              label={t("submittedAt")}
              value={formatDate(org.createdAt)}
            />
            <CorporateInfoTile
              label={t("reviewedAt")}
              value={formatDate(org.reviewedAt)}
            />
            <CorporateInfoTile
              label={t("verificationAttempts")}
              value={
                meta
                  ? `${org.submissionCount} / ${meta.maxSubmissions} (${t("remaining", {
                      count: meta.remainingSubmissions,
                    })})`
                  : String(org.submissionCount)
              }
              className="sm:col-span-2"
            />
          </CorporateInfoGrid>
          {org.about ? (
            <CorporateProseBlock title={tCommon("description")} body={org.about} />
          ) : null}
        </CorporateSection>

        <CorporateSection
          className="xl:col-span-2"
          icon={<UserRound className="h-5 w-5" />}
          title={t("ownerContact")}
        >
          {owner ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#303030] bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-4">
                <p className="text-lg font-semibold text-white">{ownerName}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  OWNER
                </p>
              </div>
              <CorporateInfoTile
                label={tCommon("email")}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {owner.email}
                  </span>
                }
              />
              <CorporateInfoTile
                label={tCommon("phone")}
                value={
                  owner.phone ? (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      {owner.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          ) : (
            <CorporateEmptyState>{t("noOwner")}</CorporateEmptyState>
          )}
        </CorporateSection>
      </div>

      <CorporateSection
        icon={<FileText className="h-5 w-5" />}
        title={t("uploadedDocuments")}
        description={
          org.documents.length
            ? `${org.documents.length} document${org.documents.length === 1 ? "" : "s"}`
            : undefined
        }
      >
        {org.documents.length === 0 ? (
          <CorporateEmptyState>{t("noDocuments")}</CorporateEmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {org.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#303030] bg-[#151515]/70 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {docTypeLabel(doc.type, t)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.fileName ?? doc.fileUrl}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn("shrink-0", dashboardOutlineButtonClass)}
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
              </div>
            ))}
          </div>
        )}
      </CorporateSection>

      <CorporateSection
        icon={<CalendarDays className="h-5 w-5" />}
        title={t("organizationEvents")}
        action={
          <Button asChild size="sm" variant="outline" className={dashboardOutlineButtonClass}>
            <Link href="/adminDashbaord/corporateEvents">{t("viewAllEvents")}</Link>
          </Button>
        }
      >
        {eventsQuery.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : orgEvents.length === 0 ? (
          <CorporateEmptyState>{t("noEvents")}</CorporateEmptyState>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {orgEvents.map((event) => (
              <CorporateListCard
                key={event.id}
                href={`/adminDashbaord/corporateEvents/${event.id}`}
                title={event.title}
                subtitle={[
                  formatDate(event.proposedStartAt),
                  event.locationPreference,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                trailing={
                  <CorporateStatusBadge tone={eventStatusTone(event.status)}>
                    {eventStatusLabel(event.status)}
                  </CorporateStatusBadge>
                }
              >
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span>
                    {event.allocatedAmount} {event.currency}
                  </span>
                  {event.estimatedAttendees != null ? (
                    <span>· {event.estimatedAttendees} attendees</span>
                  ) : null}
                </div>
              </CorporateListCard>
            ))}
          </div>
        )}
      </CorporateSection>

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
