"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type VenueGalleryUploadProps = {
  urls: string[];
  uploading?: boolean;
  onUpload: (files: FileList) => void | Promise<void>;
  onRemove: (index: number) => void;
  inputId?: string;
};

export function VenueGalleryUpload({
  urls,
  uploading = false,
  onUpload,
  onRemove,
  inputId = "venue-gallery-upload",
}: VenueGalleryUploadProps) {
  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <Label>Gallery</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Optional. Add multiple images — each file is uploaded and saved to your gallery.
        </p>
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Add gallery images
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
            if (e.target.files?.length) void onUpload(e.target.files);
            e.target.value = "";
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
                  aria-label="Remove image"
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No gallery images yet.</p>
      )}
    </div>
  );
}
