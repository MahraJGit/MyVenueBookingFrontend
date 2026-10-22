export type TicketPackageEntry = {
  label: string;
  count: number;
};

export type TicketKind = "STANDARD" | "PACKAGE";

export function normalizeTicketEntries(
  raw: unknown,
): TicketPackageEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: TicketPackageEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const label =
      typeof (row as { label?: unknown }).label === "string"
        ? (row as { label: string }).label.trim().replace(/\s+/g, " ")
        : "";
    const count = Number((row as { count?: unknown }).count);
    if (!label || !Number.isFinite(count)) continue;
    const n = Math.floor(count);
    if (n < 1 || n > 50) continue;
    out.push({ label: label.slice(0, 80), count: n });
    if (out.length >= 10) break;
  }
  return out;
}

export function admitsCountForTicket(input: {
  kind?: TicketKind | string | null;
  entries?: unknown;
}): number {
  if (input.kind !== "PACKAGE") return 1;
  const entries = normalizeTicketEntries(input.entries);
  const total = entries.reduce((sum, row) => sum + row.count, 0);
  return Math.max(1, total);
}

/** Expand package entries into labeled person slots (one per admitted guest). */
export function expandTicketEntrySlots(input: {
  kind?: TicketKind | string | null;
  entries?: unknown;
  ticketName: string;
}): Array<{ entryLabel: string; slotLabel: string }> {
  if (input.kind !== "PACKAGE") {
    return [{ entryLabel: input.ticketName, slotLabel: input.ticketName }];
  }
  const entries = normalizeTicketEntries(input.entries);
  if (entries.length === 0) {
    return [{ entryLabel: input.ticketName, slotLabel: input.ticketName }];
  }
  const slots: Array<{ entryLabel: string; slotLabel: string }> = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.count; i += 1) {
      const entryLabel = entry.label;
      const slotLabel =
        entry.count > 1 ? `${entry.label} ${i + 1}` : entry.label;
      slots.push({ entryLabel, slotLabel });
    }
  }
  return slots;
}

export function formatPackageEntriesSummary(
  kind: TicketKind | string | null | undefined,
  entries: unknown,
): string | null {
  if (kind !== "PACKAGE") return null;
  const rows = normalizeTicketEntries(entries);
  if (rows.length === 0) return null;
  return rows.map((row) => `${row.label} × ${row.count}`).join(", ");
}
