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

function buildPreviewUrl(id: string) {
  return `/venues/${encodeURIComponent(id)}?embed=1&preview=1`;
}

function buildPublicUrl(id: string, preview: boolean) {
  const base = `/venues/${encodeURIComponent(id)}`;
  return preview ? `${base}?preview=1` : base;
}

export function VenuePublicPreviewDialog({
  venue,
  onClose,
  editHref,
}: VenuePublicPreviewDialogProps) {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");

  const open = Boolean(venue);
  const previewUrl = venue ? buildPreviewUrl(venue.id) : "";
  const usePreviewMode = venue?.status !== "ACTIVE";
  const publicUrl = venue ? buildPublicUrl(venue.id, usePreviewMode) : "";

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
            {venue ? (
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

        {venue ? (
          <iframe
            key={previewUrl}
            title={t("previewVenue", { name: venue.name })}
            src={previewUrl}
            className="min-h-[min(78vh,820px)] w-full flex-1 border-0 bg-[#0e0e0e]"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
