"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardContentPanel } from "@/components/dashboard/dashboard-shared";
import { ServiceBookingDetails } from "@/components/marketplace/ServiceBookingDetails";
import {
  cancelServiceBooking,
  createMarketplaceServiceReview,
  getServiceBooking,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { isInstantServiceBooking } from "@/features/marketplace/booking-display";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";

export default function UserServiceBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("userDashboard");
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isReady } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: marketplaceKeys.booking(user?.id, id),
    queryFn: () => getServiceBooking(id),
    enabled: isAuthenticated && isReady && !!user?.id,
    refetchOnMount: "always",
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelServiceBooking(id),
    onSuccess: async () => {
      toast.success(t("serviceBookingCancelled"));
      await queryClient.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
    onError: (e) => toastApiError(e),
  });

  const reviewMut = useMutation({
    mutationFn: () =>
      createMarketplaceServiceReview({
        serviceId: booking!.serviceId,
        bookingId: booking!.id,
        rating,
        comment: comment || undefined,
      }),
    onSuccess: () => {
      toast.success(t("reviewSubmitted"));
      setReviewed(true);
    },
    onError: (e) => toastApiError(e),
  });

  const addressUnlocked = Boolean(booking?.addressUnlocked);
  const canReview = booking?.status === "COMPLETED" && !reviewed;
  const canPay = booking?.status === "PAYMENT_PENDING";
  const canCancel =
    booking?.status === "PAYMENT_PENDING" || booking?.status === "CONFIRMED";

  return (
    <DashboardContentPanel>
      <Button
        asChild
        variant="ghost"
        className="mb-6 px-0 text-muted-foreground hover:text-foreground"
      >
        <Link
          href="/userDashboard/service-bookings"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToServiceBookings")}
        </Link>
      </Button>

      {isLoading || !booking ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          {booking.status === "CONFIRMED" ? (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                <div>
                  <p className="font-semibold text-green-300">
                    {t("serviceBookingConfirmed")}
                  </p>
                  <p className="mt-1 text-sm text-green-200/80">
                    {t("serviceBookingConfirmedDesc")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {canPay ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
              <p className="font-semibold text-amber-200">{t("paymentPending")}</p>
              <p className="mt-1 text-sm text-amber-200/80">
                {t("servicePaymentPendingDesc")}
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href={`/marketplace/booking/${booking.id}/checkout`}>
                  {t("completePayment")}
                </Link>
              </Button>
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-wide text-primary">
              {t(`serviceBookingStatus.${booking.status}` as "serviceBookingStatus.CONFIRMED")}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              {booking.service?.title ?? t("serviceFallback")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {String(booking.startDate).slice(0, 10)} →{" "}
              {String(booking.endDate).slice(0, 10)}
            </p>
          </div>

          <ServiceBookingDetails booking={booking} showVendor />

          <div className="flex flex-wrap gap-3">
            {addressUnlocked && booking.inquiry?.conversation?.id ? (
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/userDashboard/messages?c=${booking.inquiry.conversation.id}`}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t("openConversation")}
                </Link>
              </Button>
            ) : null}
            {!isInstantServiceBooking(booking) && booking.inquiryId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/userDashboard/service-inquiries/${booking.inquiryId}`}>
                  {t("viewInquiry")}
                </Link>
              </Button>
            ) : null}
            {!isInstantServiceBooking(booking) && booking.proposalId ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/userDashboard/service-proposals/${booking.proposalId}`}>
                  {t("viewProposal")}
                </Link>
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={cancelMut.isPending}
                onClick={() => cancelMut.mutate()}
              >
                {cancelMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("cancelServiceBooking")}
              </Button>
            ) : null}
          </div>

          {canReview ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Star className="h-4 w-4" />
                {t("leaveServiceReview")}
              </h2>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1"
                    aria-label={`${value} stars`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={t("reviewCommentPlaceholder")}
                maxLength={2000}
              />
              <Button
                className="mt-3"
                size="sm"
                disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate()}
              >
                {reviewMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("submitReview")}
              </Button>
            </section>
          ) : null}
        </div>
      )}
    </DashboardContentPanel>
  );
}
