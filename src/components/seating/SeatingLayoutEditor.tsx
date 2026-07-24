"use client";

import * as React from "react";
import { Armchair, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeatMapPreview } from "@/components/seating/SeatMap";
import type { SeatingSectionInput } from "@/features/seating/api";

const SECTION_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

export type SeatingEditorSection = SeatingSectionInput;

type TicketOption = {
  id: string;
  name: string;
};

type SeatingLayoutEditorProps = {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  sections: SeatingEditorSection[];
  onSectionsChange: (sections: SeatingEditorSection[]) => void;
  ticketOptions: TicketOption[];
  disabled?: boolean;
};

function emptySection(ticketTypeId: string, index: number): SeatingEditorSection {
  return {
    ticketTypeId,
    name: index === 0 ? "Main Floor" : `Section ${index + 1}`,
    color: SECTION_COLORS[index % SECTION_COLORS.length],
    sortOrder: index,
    rowCount: 5,
    seatsPerRow: 8,
    rowLabelStart: "A",
  };
}

export function SeatingLayoutEditor({
  enabled,
  onEnabledChange,
  sections,
  onSectionsChange,
  ticketOptions,
  disabled,
}: SeatingLayoutEditorProps) {
  const defaultTicketId = ticketOptions[0]?.id ?? "";

  React.useEffect(() => {
    if (!enabled || sections.length > 0 || !defaultTicketId) return;
    onSectionsChange([emptySection(defaultTicketId, 0)]);
  }, [enabled, sections.length, defaultTicketId, onSectionsChange]);

  const totalSeats = sections.reduce(
    (sum, s) => sum + Math.max(0, s.rowCount) * Math.max(0, s.seatsPerRow),
    0,
  );

  const updateSection = (index: number, patch: Partial<SeatingEditorSection>) => {
    onSectionsChange(
      sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card/40 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <Armchair className="h-4 w-4 text-primary" />
            Reserved seating
          </div>
          <p className="text-sm text-muted-foreground">
            Let buyers pick seats on a map. Ticket quantities are set from your
            layout.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled || ticketOptions.length === 0}
          aria-label="Enable reserved seating"
        />
      </div>

      {enabled ? (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Section {index + 1}</h4>
                {sections.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={disabled}
                    onClick={() =>
                      onSectionsChange(sections.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Section name</Label>
                  <Input
                    value={section.name}
                    disabled={disabled}
                    onChange={(e) => updateSection(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticket type</Label>
                  <Select
                    value={section.ticketTypeId}
                    disabled={disabled}
                    onValueChange={(value) =>
                      updateSection(index, { ticketTypeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ticket type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketOptions.map((ticket) => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={section.rowCount}
                    disabled={disabled}
                    onChange={(e) =>
                      updateSection(index, {
                        rowCount: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seats per row</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={section.seatsPerRow}
                    disabled={disabled}
                    onChange={(e) =>
                      updateSection(index, {
                        seatsPerRow: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>First row letter</Label>
                  <Input
                    maxLength={1}
                    value={section.rowLabelStart ?? "A"}
                    disabled={disabled}
                    onChange={(e) => {
                      const letter = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 1);
                      updateSection(index, {
                        rowLabelStart: (letter || "A").toUpperCase(),
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {SECTION_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateSection(index, { color })}
                        className="h-8 w-8 rounded-full border-2 transition"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            section.color === color ? "white" : "transparent",
                          outline:
                            section.color === color
                              ? `2px solid ${color}`
                              : undefined,
                        }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            disabled={disabled || !defaultTicketId}
            onClick={() =>
              onSectionsChange([
                ...sections,
                emptySection(defaultTicketId, sections.length),
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add section
          </Button>

          <p className="text-sm text-muted-foreground">
            Total seats: <span className="font-medium text-foreground">{totalSeats}</span>
          </p>

          <SeatMapPreview sections={sections} />
        </div>
      ) : null}
    </div>
  );
}
