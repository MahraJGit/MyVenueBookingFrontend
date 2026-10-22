"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import { uploadMarketplaceMedia } from "@/features/marketplace/api";
import { validateUploadFile } from "@/features/uploads/validation";
import { toastApiError } from "@/lib/toasts";
import { dashboardInputClass } from "@/components/dashboard/dashboard-ui";
import { cn } from "@/lib/utils";

type Props = {
  image?: string | null;
  highlights?: string[];
  onImageChange: (image: string | null) => void;
  onHighlightsChange: (highlights: string[]) => void;
  inputId: string;
};

export function PackageImageHighlightsFields({
  image,
  highlights = [],
  onImageChange,
  onHighlightsChange,
  inputId,
}: Props) {
  const t = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const [uploading, setUploading] = useState(false);
  const [draftHighlight, setDraftHighlight] = useState("");

  const uploadImage = async (file: File) => {
    try {
      validateUploadFile(file);
      if (!file.type.startsWith("image/")) {
        toast.error(t("packageImageImagesOnly"));
        return;
      }
      setUploading(true);
      const url = await uploadMarketplaceMedia(file);
      onImageChange(url);
      toast.success(t("packageImageUploaded"));
    } catch (e) {
      toastApiError(e, t("packageImageUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const addHighlight = () => {
    const next = draftHighlight.trim();
    if (!next) return;
    if (highlights.length >= 12) {
      toast.error(t("packageHighlightsMax"));
      return;
    }
    onHighlightsChange([...highlights, next]);
    setDraftHighlight("");
  };

  return (
    <div className="space-y-4 border-t border-border/60 pt-4 sm:col-span-2">
      <div className="space-y-2">
        <Label>{t("packageImage")}</Label>
        <p className="text-xs text-muted-foreground">{t("packageImageHint")}</p>
        {image ? (
          <SecureStoredImage
            src={image}
            alt=""
            className="h-28 w-full max-w-xs rounded-lg object-cover"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById(inputId)?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {image ? t("packageImageReplace") : t("packageImageUpload")}
          </Button>
          {image ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => onImageChange(null)}
            >
              {tCommon("remove")}
            </Button>
          ) : null}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadImage(file);
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("packageHighlights")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("packageHighlightsHint")}
        </p>
        {highlights.length > 0 ? (
          <ul className="space-y-2">
            {highlights.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5"
              >
                <span className="min-w-0 flex-1 text-sm">{item}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  aria-label={tCommon("remove")}
                  onClick={() =>
                    onHighlightsChange(highlights.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Input
            className={cn(dashboardInputClass, "min-w-[12rem] flex-1")}
            value={draftHighlight}
            placeholder={t("packageHighlightPlaceholder")}
            onChange={(e) => setDraftHighlight(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHighlight();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addHighlight}
            disabled={!draftHighlight.trim()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {t("addHighlight")}
          </Button>
        </div>
      </div>
    </div>
  );
}
