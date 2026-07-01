"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createVenueReview } from "@/features/reviews/api";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

type VenueReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  venueName: string;
  bookingId: string;
  onSuccess?: () => void;
};

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const t = useTranslations("reviews");
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("ratingLabel")}>
      {Array.from({ length: 5 }, (_, index) => {
        const star = index + 1;
        const active = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            className="rounded p-0.5 transition-colors hover:scale-105"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(star)}
            aria-label={t("starAria", { count: star })}
          >
            <Star
              className={cn(
                "h-8 w-8",
                active ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function VenueReviewDialog({
  open,
  onOpenChange,
  venueId,
  venueName,
  bookingId,
  onSuccess,
}: VenueReviewDialogProps) {
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      createVenueReview({
        venueId,
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t("venueSubmitSuccess"));
      setRating(0);
      setComment("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => toastApiError(error, t("venueSubmitError")),
  });

  const handleOpenChange = (next: boolean) => {
    if (!next && !submit.isPending) {
      setRating(0);
      setComment("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("venueTitle")}</DialogTitle>
          <DialogDescription>
            {t("venueDesc", { venueName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <StarRatingInput value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={4}
            maxLength={2000}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submit.isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => submit.mutate()}
            disabled={rating < 1 || submit.isPending}
          >
            {submit.isPending ? t("submitting") : t("submitReview")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
