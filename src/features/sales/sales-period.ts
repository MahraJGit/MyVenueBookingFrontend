export type SalesPeriodPreset =
  | "ALL"
  | "WEEK"
  | "MONTH"
  | "LAST_30"
  | "CUSTOM";

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function parseLocalDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Resolve API dateFrom/dateTo ISO bounds for a sales period preset. */
export function resolveSalesPeriodRange(
  period: SalesPeriodPreset | string,
  customFrom = "",
  customTo = "",
): { dateFrom?: string; dateTo?: string } {
  const now = new Date();

  if (period === "WEEK") {
    const start = startOfLocalDay(now);
    const weekday = start.getDay(); // 0 = Sunday
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    start.setDate(start.getDate() + mondayOffset);
    return {
      dateFrom: start.toISOString(),
      dateTo: endOfLocalDay(now).toISOString(),
    };
  }

  if (period === "MONTH") {
    const start = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return {
      dateFrom: start.toISOString(),
      dateTo: endOfLocalDay(now).toISOString(),
    };
  }

  if (period === "LAST_30") {
    const start = startOfLocalDay(now);
    start.setDate(start.getDate() - 29);
    return {
      dateFrom: start.toISOString(),
      dateTo: endOfLocalDay(now).toISOString(),
    };
  }

  if (period === "CUSTOM") {
    const result: { dateFrom?: string; dateTo?: string } = {};
    const from = parseLocalDateKey(customFrom);
    const to = parseLocalDateKey(customTo);
    if (from) result.dateFrom = startOfLocalDay(from).toISOString();
    if (to) result.dateTo = endOfLocalDay(to).toISOString();
    return result;
  }

  return {};
}

export function isSalesPeriodPreset(value: string): value is SalesPeriodPreset {
  return (
    value === "ALL" ||
    value === "WEEK" ||
    value === "MONTH" ||
    value === "LAST_30" ||
    value === "CUSTOM"
  );
}
