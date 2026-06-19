"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAY_NAMES } from "@/features/venues/utils";
import { cn } from "@/lib/utils";

export type ScheduleRow = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
};

type VenueScheduleEditorProps = {
  schedules: ScheduleRow[];
  onChange: (schedules: ScheduleRow[]) => void;
};

export function VenueScheduleEditor({ schedules, onChange }: VenueScheduleEditorProps) {
  const updateRow = (idx: number, patch: Partial<ScheduleRow>) => {
    const next = [...schedules];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const copyMondayToWeekdays = () => {
    const monday = schedules.find((s) => s.dayOfWeek === 1);
    if (!monday) return;
    onChange(
      schedules.map((s) =>
        s.dayOfWeek >= 1 && s.dayOfWeek <= 5
          ? {
              ...s,
              isOpen: monday.isOpen,
              openTime: monday.openTime,
              closeTime: monday.closeTime,
            }
          : s,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={copyMondayToWeekdays}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Monday to weekdays
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">Day</TableHead>
              <TableHead className="text-muted-foreground">Open</TableHead>
              <TableHead className="text-muted-foreground">Opens</TableHead>
              <TableHead className="text-muted-foreground">Closes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((row, idx) => (
              <TableRow
                key={row.dayOfWeek}
                className={cn(
                  row.dayOfWeek === 0 || row.dayOfWeek === 6 ? "bg-muted/20" : undefined,
                )}
              >
                <TableCell className="font-medium text-foreground">
                  {DAY_NAMES[row.dayOfWeek]}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.isOpen}
                    onCheckedChange={(checked) => updateRow(idx, { isOpen: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={row.openTime}
                    disabled={!row.isOpen}
                    onChange={(e) => updateRow(idx, { openTime: e.target.value })}
                    className="bg-input/50 w-32"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="time"
                    value={row.closeTime}
                    disabled={!row.isOpen}
                    onChange={(e) => updateRow(idx, { closeTime: e.target.value })}
                    className="bg-input/50 w-32"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
