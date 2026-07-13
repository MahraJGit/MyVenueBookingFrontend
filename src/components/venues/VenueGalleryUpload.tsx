"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateUploadFile } from "@/features/uploads/validation";
import { toastApiError } from "@/lib/toasts";

type VenueGalleryUploadProps = {
  urls: string[];
  uploading?: boolean;
  onUpload: (files: FileList) => void | Promise<void>;
  onRemove: (index: number) => void;
  inputId?: string;
  /** Override default optional gallery hint (e.g. required event gallery). */
  hint?: string;
};

export function VenueGalleryUpload({
  urls,
  uploading = false,
  onUpload,
  onRemove,
  inputId = "venue-gallery-upload",
  hint,
}: VenueGalleryUploadProps) {
  const t = useTranslations("venueGallery");
  const tA11y = useTranslations("a11y");

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <Label>{t("title")}</Label>
        <p className="text-xs text-muted-foreground mt-1">{hint ?? t("hint")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("uploading")}
            </>
          ) : (
            <>
              <Upload className="me-2 h-4 w-4" />
              {t("addImages")}
            </>
          )}
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            e.target.value = "";
            if (!files?.length) return;
            try {
              for (const file of Array.from(files)) {
                validateUploadFile(file);
              }
              void onUpload(files);
            } catch (error) {
              toastApiError(error);
            }
          }}
        />
      </div>
      {urls.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {urls.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="relative overflow-hidden rounded-lg border border-border bg-muted/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-video w-full object-cover" />
              <div className="flex items-center justify-between gap-2 border-t border-border p-2">
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {url.slice(-36)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive"
                  aria-label={tA11y("removeImage")}
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noImages")}</p>
      )}
    </div>
  );
}
