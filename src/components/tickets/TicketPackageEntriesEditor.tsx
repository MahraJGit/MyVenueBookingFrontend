"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TicketKind, TicketPackageEntry } from "@/features/tickets/ticket-package";
import { cn } from "@/lib/utils";

type TicketPackageEntriesEditorProps = {
  kind: TicketKind;
  entries: TicketPackageEntry[];
  onKindChange: (kind: TicketKind) => void;
  onEntriesChange: (entries: TicketPackageEntry[]) => void;
  disabled?: boolean;
  className?: string;
  labels: {
    kindLabel: string;
    standard: string;
    package: string;
    entriesHint: string;
    entryLabel: string;
    entryCount: string;
    addEntry: string;
    /** Already localized, e.g. "Admits 4 guests per package". */
    admitsPreview: string;
  };
};

export function TicketPackageEntriesEditor({
  kind,
  entries,
  onKindChange,
  onEntriesChange,
  disabled = false,
  className,
  labels,
}: TicketPackageEntriesEditorProps) {
  return (
    <div className={cn("space-y-3 sm:col-span-2", className)}>
      <div className="space-y-2">
        <Label>{labels.kindLabel}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={kind === "STANDARD" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => {
              onKindChange("STANDARD");
              onEntriesChange([]);
            }}
          >
            {labels.standard}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "PACKAGE" ? "default" : "outline"}
            disabled={disabled}
            onClick={() => {
              onKindChange("PACKAGE");
              if (entries.length === 0) {
                onEntriesChange([
                  { label: "Adult", count: 2 },
                  { label: "Child", count: 2 },
                ]);
              }
            }}
          >
            {labels.package}
          </Button>
        </div>
      </div>

      {kind === "PACKAGE" ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{labels.entriesHint}</p>
          <ul className="space-y-2">
            {entries.map((entry, index) => (
              <li key={index} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[10rem] flex-1 space-y-1">
                  <Label className="text-xs">{labels.entryLabel}</Label>
                  <Input
                    value={entry.label}
                    disabled={disabled}
                    onChange={(e) =>
                      onEntriesChange(
                        entries.map((row, j) =>
                          j === index ? { ...row, label: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <Label className="text-xs">{labels.entryCount}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={entry.count}
                    disabled={disabled}
                    onChange={(e) =>
                      onEntriesChange(
                        entries.map((row, j) =>
                          j === index
                            ? {
                                ...row,
                                count: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                              }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={disabled || entries.length <= 1}
                  onClick={() =>
                    onEntriesChange(entries.filter((_, j) => j !== index))
                  }
                  aria-label="Remove entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || entries.length >= 10}
              onClick={() =>
                onEntriesChange([...entries, { label: "", count: 1 }])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              {labels.addEntry}
            </Button>
            <p className="text-xs text-muted-foreground">{labels.admitsPreview}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
