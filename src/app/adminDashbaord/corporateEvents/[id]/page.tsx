"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MapPin,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DashboardPageShell,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import {
  getAdminCorporateEvent,
  type AdminCorporateEventServiceLine,
  type AdminCorporateEventVenueLine,
  type CorporateEventBookingStatus,
  type CorporateEventPaymentStatus,
  type CorporateEventStatus,
  type CorporateLineBookingStatus,
  type CorporateOrgOwner,
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

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString();
}

function formatMoney(amount: string | number | null | undefined, currency?: string) {
  if (amount == null || amount === "") return "—";
  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) return String(amount);
  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

function personLabel(user: CorporateOrgOwner | null | undefined) {
  if (!user) return "—";
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name || user.email;
}

function eventStatusTone(
  status: CorporateEventStatus,
): "success" | "danger" | "warning" | "neutral" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED" || status === "CANCELLED") return "danger";
  if (status === "PENDING_APPROVAL") return "warning";
  return "neutral";
}

function ApprovalStep({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        done
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-[#303030] bg-[#151515]/70"
      }`}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2
          className={`h-4 w-4 ${done ? "text-emerald-300" : "text-zinc-500"}`}
        />
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ResourceLineCard({
  title,
  subtitle,
  estimatedCost,
  currency,
  preferredStartAt,
  preferredEndAt,
  availabilityStatus,
  availabilityMessage,
  bookingStatus,
  bookingError,
  bookingConfirmedAt,
  notes,
  bookingRefLabel,
  bookingRef,
  t,
}: {
  title: string;
  subtitle: string;
  estimatedCost: string | number | null;
  currency: string;
  preferredStartAt?: string | null;
  preferredEndAt?: string | null;
  availabilityStatus?: string | null;
  availabilityMessage?: string | null;
  bookingStatus?: CorporateLineBookingStatus;
  bookingError?: string | null;
  bookingConfirmedAt?: string | null;
  notes?: string | null;
  bookingRefLabel: string;
  bookingRef?: string | null;
  t: ReturnType<typeof useTranslations<"adminCorporateEvents">>;
}) {
  return (
    <CorporateListCard
      title={title}
      subtitle={subtitle}
      trailing={
        <div className="flex flex-wrap gap-2">
          {availabilityStatus ? (
            <CorporateStatusBadge tone="neutral">{availabilityStatus}</CorporateStatusBadge>
          ) : null}
          {bookingStatus ? (
            <CorporateStatusBadge
              tone={
                bookingStatus === "CONFIRMED" || bookingStatus === "HELD"
                  ? "success"
                  : bookingStatus === "FAILED" || bookingStatus === "CANCELLED"
                    ? "danger"
                    : "neutral"
              }
            >
              {bookingStatus}
            </CorporateStatusBadge>
          ) : null}
        </div>
      }
    >
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <CorporateInfoTile
          label={t("estimatedCost")}
          value={formatMoney(estimatedCost, currency)}
        />
        <CorporateInfoTile
          label={t("preferredWindow")}
          value={`${formatDate(preferredStartAt)}${
            preferredEndAt ? ` – ${formatDate(preferredEndAt)}` : ""
          }`}
        />
        {bookingConfirmedAt ? (
          <CorporateInfoTile
            label={t("lineConfirmedAt")}
            value={formatDate(bookingConfirmedAt)}
          />
        ) : null}
        {bookingRef ? (
          <CorporateInfoTile label={bookingRefLabel} value={bookingRef} />
        ) : null}
      </div>
      {availabilityMessage ? (
        <p className="mt-3 text-xs text-muted-foreground">{availabilityMessage}</p>
      ) : null}
      {bookingError ? (
        <p className="mt-2 text-xs text-red-300">{bookingError}</p>
      ) : null}
      {notes ? (
        <p className="mt-2 text-xs whitespace-pre-wrap text-zinc-400">
          {t("notes")}: {notes}
        </p>
      ) : null}
    </CorporateListCard>
  );
}

export default function AdminCorporateEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("adminCorporateEvents");
  const tCommon = useTranslations("common");

  const detailQuery = useQuery({
    queryKey: ["admin-corporate-event", id],
    queryFn: () => getAdminCorporateEvent(id),
  });

  const event = detailQuery.data;

  const statusLabel = (status: CorporateEventStatus) => {
    if (status === "APPROVED") return t("statusApproved");
    if (status === "REJECTED") return t("statusRejected");
    if (status === "CANCELLED") return t("statusCancelled");
    if (status === "PENDING_APPROVAL") return t("statusPendingApproval");
    return t("statusDraft");
  };

  const bookingStatusLabel = (status?: CorporateEventBookingStatus) => {
    if (!status) return "—";
    if (status === "NOT_STARTED") return t("bookingNotStarted");
    if (status === "PARTIAL") return t("bookingPartial");
    if (status === "CONFIRMED") return t("bookingConfirmed");
    return t("bookingFailed");
  };

  const paymentStatusLabel = (status?: CorporateEventPaymentStatus) => {
    if (!status) return "—";
    if (status === "NOT_DUE") return t("paymentNotDue");
    if (status === "AWAITING_PAYMENT") return t("paymentAwaiting");
    return t("paymentPaid");
  };

  if (detailQuery.isLoading) {
    return (
      <DashboardPageShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardPageShell>
    );
  }

  if (detailQuery.isError || !event) {
    return (
      <DashboardPageShell>
        <CorporateSection title={t("notFound")}>
          <Button asChild variant="outline" className={dashboardOutlineButtonClass}>
            <Link href="/adminDashbaord/corporateEvents">{t("backToList")}</Link>
          </Button>
        </CorporateSection>
      </DashboardPageShell>
    );
  }

  const venueLines: AdminCorporateEventVenueLine[] = event.eventVenues ?? [];
  const serviceLines: AdminCorporateEventServiceLine[] = event.eventServices ?? [];
  const resourceEstimateTotal = [...venueLines, ...serviceLines].reduce((sum, line) => {
    const n = line.estimatedCost == null ? 0 : Number(line.estimatedCost);
    return sum + (Number.isNaN(n) ? 0 : n);
  }, 0);

  return (
    <DashboardPageShell>
      <CorporateDetailHero
        backHref="/adminDashbaord/corporateEvents"
        backLabel={t("backToList")}
        title={event.title}
        description={t("detailDescription")}
        avatarName={event.title}
        badges={
          <>
            <CorporateStatusBadge tone={eventStatusTone(event.status)}>
              {statusLabel(event.status)}
            </CorporateStatusBadge>
            {event.bookingStatus ? (
              <CorporateStatusBadge
                tone={
                  event.bookingStatus === "CONFIRMED"
                    ? "success"
                    : event.bookingStatus === "FAILED"
                      ? "danger"
                      : "neutral"
                }
              >
                {bookingStatusLabel(event.bookingStatus)}
              </CorporateStatusBadge>
            ) : null}
            {event.paymentStatus ? (
              <CorporateStatusBadge
                tone={event.paymentStatus === "PAID" ? "success" : "neutral"}
              >
                {paymentStatusLabel(event.paymentStatus)}
              </CorporateStatusBadge>
            ) : null}
          </>
        }
        meta={
          <>
            {event.organization?.name ? (
              <CorporateMetaChip icon={<Building2 className="h-3.5 w-3.5" />}>
                {event.organization.name}
              </CorporateMetaChip>
            ) : null}
            {event.locationPreference ? (
              <CorporateMetaChip icon={<MapPin className="h-3.5 w-3.5" />}>
                {event.locationPreference}
              </CorporateMetaChip>
            ) : null}
            {event.proposedStartAt ? (
              <CorporateMetaChip icon={<CalendarDays className="h-3.5 w-3.5" />}>
                {formatDate(event.proposedStartAt)}
              </CorporateMetaChip>
            ) : null}
          </>
        }
        actions={
          event.organization ? (
            <Button asChild variant="outline" className={dashboardOutlineButtonClass}>
              <Link href={`/adminDashbaord/corporateOrganizations/${event.organization.id}`}>
                {t("viewOrganization")}
              </Link>
            </Button>
          ) : null
        }
      />

      <CorporateStatGrid
        items={[
          {
            icon: <Wallet className="h-5 w-5 text-primary" />,
            label: t("allocatedBudget"),
            value: formatMoney(event.allocatedAmount, event.currency),
          },
          {
            icon: <CircleDollarSign className="h-5 w-5 text-primary" />,
            label: t("resourceEstimates"),
            value: formatMoney(resourceEstimateTotal, event.currency),
          },
          {
            icon: <Users className="h-5 w-5 text-primary" />,
            label: t("attendees"),
            value:
              event.estimatedAttendees != null
                ? String(event.estimatedAttendees)
                : "—",
          },
          {
            icon: <Package className="h-5 w-5 text-primary" />,
            label: `${t("venues")} / ${t("services")}`,
            value: `${venueLines.length} / ${serviceLines.length}`,
          },
        ]}
      />

      {event.rejectedReason ? (
        <CorporateAlert tone="danger" title={t("rejectionReason")}>
          <p>{event.rejectedReason}</p>
          <p className="mt-2 text-xs text-zinc-400">
            {t("rejectedBy")}: {personLabel(event.rejectedBy)} ·{" "}
            {formatDate(event.rejectedAt)}
          </p>
        </CorporateAlert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <CorporateSection
          icon={<CalendarDays className="h-5 w-5" />}
          title={t("eventDetails")}
        >
          <CorporateInfoGrid>
            <CorporateInfoTile
              label={t("organization")}
              value={event.organization?.name}
            />
            <CorporateInfoTile
              label={t("orgLocation")}
              value={
                [event.organization?.city, event.organization?.country]
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <CorporateInfoTile label={t("location")} value={event.locationPreference} />
            <CorporateInfoTile
              label={t("proposedStart")}
              value={formatDate(event.proposedStartAt)}
            />
            <CorporateInfoTile
              label={t("proposedEnd")}
              value={formatDate(event.proposedEndAt)}
            />
            <CorporateInfoTile
              label={t("createdBy")}
              value={personLabel(event.createdBy)}
            />
            <CorporateInfoTile
              label={tCommon("email")}
              value={event.createdBy?.email}
            />
            <CorporateInfoTile
              label={tCommon("created")}
              value={formatDate(event.createdAt)}
            />
            <CorporateInfoTile
              label={t("updatedAt")}
              value={formatDate(event.updatedAt)}
            />
            <CorporateInfoTile
              label={t("submittedAt")}
              value={formatDate(event.submittedAt)}
            />
          </CorporateInfoGrid>
        </CorporateSection>

        <CorporateSection
          icon={<Wallet className="h-5 w-5" />}
          title={t("budgetApprovals")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ApprovalStep
              label={t("financeApproval")}
              done={Boolean(event.financeApprovedAt)}
              detail={
                event.financeApprovedAt
                  ? `${personLabel(event.financeApprovedBy)} · ${formatDate(event.financeApprovedAt)}`
                  : t("notApprovedYet")
              }
            />
            <ApprovalStep
              label={t("managementApproval")}
              done={Boolean(event.managementApprovedAt)}
              detail={
                event.managementApprovedAt
                  ? `${personLabel(event.managementApprovedBy)} · ${formatDate(event.managementApprovedAt)}`
                  : t("notApprovedYet")
              }
            />
          </div>
          <CorporateInfoGrid className="mt-1">
            <CorporateInfoTile
              label={t("allocatedBudget")}
              value={formatMoney(event.allocatedAmount, event.currency)}
            />
            <CorporateInfoTile
              label={t("resourceEstimates")}
              value={formatMoney(resourceEstimateTotal, event.currency)}
            />
            <CorporateInfoTile
              label={t("fiscalYear")}
              value={
                event.fiscalBudget
                  ? `${event.fiscalBudget.fiscalYear} (${formatMoney(
                      event.fiscalBudget.totalAmount,
                      event.fiscalBudget.currency,
                    )})`
                  : "—"
              }
            />
            <CorporateInfoTile
              label={t("budgetCategory")}
              value={
                event.budgetCategory
                  ? `${event.budgetCategory.name} (${formatMoney(
                      event.budgetCategory.allocatedAmount,
                      event.currency,
                    )})`
                  : "—"
              }
            />
            <CorporateInfoTile
              label={t("bookingStatus")}
              value={bookingStatusLabel(event.bookingStatus)}
            />
            <CorporateInfoTile
              label={t("bookingsConfirmedAt")}
              value={formatDate(event.bookingsConfirmedAt)}
            />
            <CorporateInfoTile
              label={t("paymentStatus")}
              value={paymentStatusLabel(event.paymentStatus)}
            />
            <CorporateInfoTile
              label={t("paidAt")}
              value={
                event.paidAt
                  ? `${formatDate(event.paidAt)}${
                      event.paidBy ? ` · ${personLabel(event.paidBy)}` : ""
                    }`
                  : "—"
              }
            />
          </CorporateInfoGrid>
        </CorporateSection>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CorporateProseBlock title={t("objectives")} body={event.objectives} />
        <CorporateProseBlock title={t("requirements")} body={event.requirements} />
      </div>

      <CorporateSection
        icon={<Building2 className="h-5 w-5" />}
        title={`${t("venues")} (${venueLines.length})`}
      >
        {!venueLines.length ? (
          <CorporateEmptyState>{t("noVenues")}</CorporateEmptyState>
        ) : (
          <div className="grid gap-3">
            {venueLines.map((line) => (
              <ResourceLineCard
                key={line.id}
                title={line.venue.name}
                subtitle={
                  [line.venue.city, line.venue.countryCode].filter(Boolean).join(", ") ||
                  "—"
                }
                estimatedCost={line.estimatedCost}
                currency={event.currency}
                preferredStartAt={line.preferredStartAt}
                preferredEndAt={line.preferredEndAt}
                availabilityStatus={line.availabilityStatus}
                availabilityMessage={line.availabilityMessage}
                bookingStatus={line.bookingStatus}
                bookingError={line.bookingError}
                bookingConfirmedAt={line.bookingConfirmedAt}
                notes={line.notes}
                bookingRefLabel={t("bookingId")}
                bookingRef={line.bookingId}
                t={t}
              />
            ))}
          </div>
        )}
      </CorporateSection>

      <CorporateSection
        icon={<Package className="h-5 w-5" />}
        title={`${t("services")} (${serviceLines.length})`}
      >
        {!serviceLines.length ? (
          <CorporateEmptyState>{t("noServices")}</CorporateEmptyState>
        ) : (
          <div className="grid gap-3">
            {serviceLines.map((line) => (
              <ResourceLineCard
                key={line.id}
                title={line.service.title}
                subtitle={
                  [
                    line.service.baseCity,
                    line.service.countryCode,
                    line.service.basePrice != null
                      ? formatMoney(line.service.basePrice, line.service.currency)
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
                estimatedCost={line.estimatedCost}
                currency={event.currency}
                preferredStartAt={line.preferredStartAt}
                preferredEndAt={line.preferredEndAt}
                availabilityStatus={line.availabilityStatus}
                availabilityMessage={line.availabilityMessage}
                bookingStatus={line.bookingStatus}
                bookingError={line.bookingError}
                bookingConfirmedAt={line.bookingConfirmedAt}
                notes={line.notes}
                bookingRefLabel={t("serviceBookingId")}
                bookingRef={line.serviceBookingId ?? line.serviceInquiryId}
                t={t}
              />
            ))}
          </div>
        )}
      </CorporateSection>

      <CorporateSection
        icon={<Users className="h-5 w-5" />}
        title={`${t("team")} (${event.teamMembers?.length ?? 0})`}
      >
        {!event.teamMembers?.length ? (
          <CorporateEmptyState>{t("noTeam")}</CorporateEmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {event.teamMembers.map((member) => (
              <CorporateListCard
                key={member.id}
                title={personLabel(member.corporateUser)}
                subtitle={[member.corporateUser.email, member.corporateUser.phone]
                  .filter(Boolean)
                  .join(" · ")}
                trailing={
                  <CorporateStatusBadge tone="neutral">{member.role}</CorporateStatusBadge>
                }
              >
                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {member.role}
                </div>
              </CorporateListCard>
            ))}
          </div>
        )}
      </CorporateSection>
    </DashboardPageShell>
  );
}
