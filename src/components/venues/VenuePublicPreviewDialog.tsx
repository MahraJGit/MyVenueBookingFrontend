"use client";

import Link from "next/link";
import { ExternalLink, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/venues/StatusBadge";
import { cn } from "@/lib/utils";
import type { ManagedVenue } from "@/features/venues/types";

type VenuePublicPreviewDialogProps = {
  venue: ManagedVenue | null;
  onClose: () => void;
  editHref?: string;
};

function canPreviewOnSite(status: ManagedVenue["status"]) {
  return status === "ACTIVE";
}

export function VenuePublicPreviewDialog({
  venue,
  onClose,
  editHref,
}: VenuePublicPreviewDialogProps) {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");

  const open = Boolean(venue);
  const previewUrl = venue ? `/venues/${encodeURIComponent(venue.id)}?embed=1` : "";
  const publicUrl = venue ? `/venues/${encodeURIComponent(venue.id)}` : "";
  const showPreview = venue ? canPreviewOnSite(venue.status) : false;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[94vh] w-[min(98vw,1400px)] !max-w-[min(98vw,1400px)] flex-col gap-0 overflow-hidden rounded-xl border-[#242424] bg-[#121212] p-0 text-white",
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#242424] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 flex-1 space-y-1">
            <DialogTitle className="truncate text-left text-lg">
              {venue?.name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 text-left text-zinc-400">
              <span>{t("publicPreviewDesc")}</span>
              {venue?.status ? <StatusBadge status={venue.status} /> : null}
            </DialogDescription>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {showPreview ? (
              <Button asChild variant="outline" size="sm" className="border-[#242424]">
                <Link href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {t("openInNewTab")}
                </Link>
              </Button>
            ) : null}
            {editHref ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={editHref} onClick={onClose}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  {t("editVenue")}
                </Link>
              </Button>
            ) : null}
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-zinc-400 hover:text-white"
                aria-label={tCommon("close")}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {venue && showPreview ? (
          <iframe
            key={previewUrl}
            title={t("previewVenue", { name: venue.name })}
            src={previewUrl}
            className="min-h-[min(78vh,820px)] w-full flex-1 border-0 bg-[#0e0e0e]"
          />
        ) : venue ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="text-base font-medium text-white">{t("previewNotAvailable")}</p>
            <p className="max-w-md text-sm text-zinc-400">
              {t("previewNotAvailableVenueDesc")}
            </p>
            {editHref ? (
              <Button asChild variant="outline" className="mt-2 border-[#242424]">
                <Link href={editHref} onClick={onClose}>
                  {t("editVenue")}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
