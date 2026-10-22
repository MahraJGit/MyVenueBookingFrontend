"use client";

import { Check, Minus, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type TicketPerkColumn = {
  id?: string;
  name: string;
  includes?: string[] | null;
};

function collectPerkRows(tickets: TicketPerkColumn[]) {
  const rows: string[] = [];
  const seen = new Set<string>();
  for (const ticket of tickets) {
    for (const raw of ticket.includes ?? []) {
      const label = raw.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(label);
    }
  }
  return rows;
}

function ticketHasPerk(ticket: TicketPerkColumn, perk: string) {
  const key = perk.toLowerCase();
  return (ticket.includes ?? []).some((item) => item.trim().toLowerCase() === key);
}

type TicketPerksComparisonProps = {
  tickets: TicketPerkColumn[];
  className?: string;
};

export function TicketPerksComparison({
  tickets,
  className,
}: TicketPerksComparisonProps) {
  const t = useTranslations("tickets");
  const columns = tickets.filter((ticket) => Boolean(ticket.name?.trim()));
  const perks = collectPerkRows(columns);

  if (columns.length === 0) return null;

  if (perks.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-[#303030] bg-[#1B1B1B]/60 px-6 py-10 text-center",
          className,
        )}
      >
        <Ticket className="mx-auto mb-3 h-8 w-8 text-zinc-600" aria-hidden />
        <p className="text-sm font-medium text-zinc-300">{t("perksCompareEmptyTitle")}</p>
        <p className="mt-1 text-xs text-zinc-500">{t("perksCompareEmptyDesc")}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-base font-semibold text-white">{t("perksCompareTitle")}</h3>
        <p className="mt-1 text-xs text-zinc-500">{t("perksCompareHint")}</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#303030] bg-[#1B1B1B]">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#303030]">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-[#1B1B1B] px-4 py-3 text-left text-xs font-medium text-zinc-400"
              >
                {t("perksComparePerkCol")}
              </th>
              {columns.map((ticket) => (
                <th
                  key={ticket.id ?? ticket.name}
                  scope="col"
                  className="min-w-[7.5rem] px-3 py-3 text-center text-xs font-semibold text-white"
                >
                  <span className="line-clamp-2 break-words">{ticket.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perks.map((perk, rowIndex) => (
              <tr
                key={perk}
                className={cn(
                  "border-b border-[#303030] last:border-b-0",
                  rowIndex % 2 === 1 ? "bg-white/[0.02]" : undefined,
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-[#1B1B1B] px-4 py-3 text-left text-xs font-medium text-zinc-300"
                >
                  {perk}
                </th>
                {columns.map((ticket) => {
                  const included = ticketHasPerk(ticket, perk);
                  return (
                    <td
                      key={`${ticket.id ?? ticket.name}-${perk}`}
                      className="px-3 py-3 text-center"
                    >
                      {included ? (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary"
                          title={t("perkIncluded")}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">{t("perkIncluded")}</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-600"
                          title={t("perkNotIncluded")}
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">{t("perkNotIncluded")}</span>
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
