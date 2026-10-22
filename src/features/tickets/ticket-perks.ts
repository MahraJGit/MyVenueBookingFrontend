export type TicketPerkColumn = {
  key: string;
  name: string;
  price: number;
};

export type TicketPerkRow = {
  id: string;
  name: string;
  /** Ticket column keys that include this perk. */
  ticketKeys: string[];
};

const MAX_PERKS = 20;

export function normalizePerkName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

export function perkKey(name: string) {
  return normalizePerkName(name).toLowerCase();
}

/** Invert per-ticket includes into perk-first rows (stable order). */
export function perksFromTicketIncludes(
  tickets: Array<{ key: string; includes?: string[] | null }>,
): TicketPerkRow[] {
  const rows: TicketPerkRow[] = [];
  const indexByKey = new Map<string, number>();

  for (const ticket of tickets) {
    for (const raw of ticket.includes ?? []) {
      const name = normalizePerkName(raw);
      if (!name) continue;
      const key = perkKey(name);
      const existing = indexByKey.get(key);
      if (existing == null) {
        indexByKey.set(key, rows.length);
        rows.push({
          id: `perk:${key}`,
          name,
          ticketKeys: [ticket.key],
        });
      } else if (!rows[existing]!.ticketKeys.includes(ticket.key)) {
        rows[existing]!.ticketKeys.push(ticket.key);
      }
    }
  }

  return rows.slice(0, MAX_PERKS);
}

/** Project perk rows back into includes[] per ticket key. */
export function includesByTicketKey(
  perks: TicketPerkRow[],
  ticketKeys: string[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of ticketKeys) out[key] = [];

  for (const perk of perks) {
    const name = normalizePerkName(perk.name);
    if (!name) continue;
    for (const ticketKey of perk.ticketKeys) {
      if (!out[ticketKey]) continue;
      if (out[ticketKey]!.some((item) => perkKey(item) === perkKey(name))) continue;
      if (out[ticketKey]!.length >= MAX_PERKS) continue;
      out[ticketKey]!.push(name);
    }
  }

  return out;
}

/** Sort ticket columns cheapest → most expensive (stable for ties). */
export function sortTicketsByPrice<T extends { key: string; price: number }>(
  tickets: T[],
): T[] {
  return [...tickets].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    return a.key.localeCompare(b.key);
  });
}

/**
 * When assigning a perk to a cheaper tier, also assign it to all
 * equal-or-higher priced tiers (vendor default that keeps comparisons sensible).
 */
export function withHigherTiersSelected(
  ticketKeys: string[],
  selectedKey: string,
  tickets: TicketPerkColumn[],
): string[] {
  const ordered = sortTicketsByPrice(tickets);
  const selected = ordered.find((t) => t.key === selectedKey);
  if (!selected) {
    return ticketKeys.includes(selectedKey)
      ? ticketKeys
      : [...ticketKeys, selectedKey];
  }

  const next = new Set(ticketKeys);
  for (const ticket of ordered) {
    if (ticket.price >= selected.price) next.add(ticket.key);
  }
  return Array.from(next);
}

export function withoutTicketKey(
  perks: TicketPerkRow[],
  removedKey: string,
): TicketPerkRow[] {
  return perks.map((perk) => ({
    ...perk,
    ticketKeys: perk.ticketKeys.filter((key) => key !== removedKey),
  }));
}

export { MAX_PERKS };
