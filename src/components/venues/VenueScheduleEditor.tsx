"use client";

import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/ui/date-time-picker";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDayNames } from "@/features/i18n/use-day-names";
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
  const t = useTranslations("venueSchedule");
  const dayNames = useDayNames();

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
          <Copy className="me-2 h-4 w-4" />
          {t("copyMondayToWeekdays")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground">{t("day")}</TableHead>
              <TableHead className="text-muted-foreground">{t("open")}</TableHead>
              <TableHead className="text-muted-foreground">{t("opens")}</TableHead>
              <TableHead className="text-muted-foreground">{t("closes")}</TableHead>
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
                  {dayNames[row.dayOfWeek]}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.isOpen}
                    onCheckedChange={(checked) => updateRow(idx, { isOpen: checked })}
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={row.openTime}
                    disabled={!row.isOpen}
                    onChange={(openTime) => updateRow(idx, { openTime })}
                    triggerClassName="bg-input/50 h-9 w-full min-w-[8rem]"
                  />
                </TableCell>
                <TableCell>
                  <TimePicker
                    value={row.closeTime}
                    disabled={!row.isOpen}
                    onChange={(closeTime) => updateRow(idx, { closeTime })}
                    triggerClassName="bg-input/50 h-9 w-full min-w-[8rem]"
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
