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
import type { ManagedEvent } from "@/features/events/api";

type EventPublicPreviewDialogProps = {
  event: ManagedEvent | null;
  onClose: () => void;
  editHref?: string;
};

function buildPreviewUrl(slug: string) {
  return `/events/${encodeURIComponent(slug)}?embed=1&preview=1`;
}

function buildPublicUrl(slug: string, preview: boolean) {
  const base = `/events/${encodeURIComponent(slug)}`;
  return preview ? `${base}?preview=1` : base;
}

export function EventPublicPreviewDialog({
  event,
  onClose,
  editHref,
}: EventPublicPreviewDialogProps) {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");

  const open = Boolean(event);
  const previewUrl = event ? buildPreviewUrl(event.slug) : "";
  const usePreviewMode =
    event?.status !== "APPROVED" && event?.status !== "ACTIVE";
  const publicUrl = event ? buildPublicUrl(event.slug, usePreviewMode) : "";

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
              {event?.eventName}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2 text-left text-zinc-400">
              <span>{t("publicPreviewDesc")}</span>
              {event?.status ? <StatusBadge status={event.status} /> : null}
            </DialogDescription>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {event ? (
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
                  {t("editEvent")}
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

        {event ? (
          <iframe
            key={previewUrl}
            title={t("previewEvent", { name: event.eventName })}
            src={previewUrl}
            className="min-h-[min(78vh,820px)] w-full flex-1 border-0 bg-[#0e0e0e]"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
