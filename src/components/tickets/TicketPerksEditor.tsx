"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  includesByTicketKey,
  normalizePerkName,
  perkKey,
  perksFromTicketIncludes,
  sortTicketsByPrice,
  withHigherTiersSelected,
  type TicketPerkColumn,
  type TicketPerkRow,
  MAX_PERKS,
} from "@/features/tickets/ticket-perks";
import { cn } from "@/lib/utils";

export type TicketPerksEditorTicket = {
  key: string;
  name: string;
  price: number;
  includes: string[];
};

type TicketPerksEditorProps = {
  tickets: TicketPerksEditorTicket[];
  onChange: (includesByKey: Record<string, string[]>) => void;
  disabled?: boolean;
  className?: string;
};

function emitIncludes(
  perks: TicketPerkRow[],
  tickets: TicketPerksEditorTicket[],
  onChange: TicketPerksEditorProps["onChange"],
) {
  onChange(
    includesByTicketKey(
      perks,
      tickets.map((ticket) => ticket.key),
    ),
  );
}

export function TicketPerksEditor({
  tickets,
  onChange,
  disabled = false,
  className,
}: TicketPerksEditorProps) {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const [draft, setDraft] = React.useState("");
  const [perks, setPerks] = React.useState<TicketPerkRow[]>(() =>
    perksFromTicketIncludes(tickets),
  );
  const skipHydrateRef = React.useRef(false);

  const ticketSignature = tickets
    .map((ticket) => `${ticket.key}:${(ticket.includes ?? []).join("|")}`)
    .join(";;");
  const columnSignature = tickets.map((ticket) => ticket.key).join(",");

  // Re-hydrate when parent loads existing includes (e.g. edit mode),
  // but skip the echo from our own onChange.
  React.useEffect(() => {
    if (skipHydrateRef.current) {
      skipHydrateRef.current = false;
      return;
    }
    setPerks(perksFromTicketIncludes(tickets));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: sync from ticket includes signature
  }, [ticketSignature]);

  // Drop assignments for removed ticket columns.
  React.useEffect(() => {
    const keys = new Set(tickets.map((ticket) => ticket.key));
    setPerks((prev) => {
      const next = prev.map((perk) => ({
        ...perk,
        ticketKeys: perk.ticketKeys.filter((key) => keys.has(key)),
      }));
      const changed = next.some(
        (perk, i) => perk.ticketKeys.join() !== prev[i]?.ticketKeys.join(),
      );
      if (!changed) return prev;
      skipHydrateRef.current = true;
      emitIncludes(next, tickets, onChange);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnSignature]);

  const columns = React.useMemo(
    () =>
      sortTicketsByPrice(
        tickets.map(
          (ticket): TicketPerkColumn => ({
            key: ticket.key,
            name: ticket.name.trim() || t("ticketUntitled"),
            price: Number.isFinite(ticket.price) ? ticket.price : 0,
          }),
        ),
      ),
    [tickets, t],
  );

  function commit(next: TicketPerkRow[]) {
    skipHydrateRef.current = true;
    setPerks(next);
    emitIncludes(next, tickets, onChange);
  }

  function addPerk() {
    const name = normalizePerkName(draft);
    if (!name || disabled) return;
    if (perks.length >= MAX_PERKS) return;
    if (perks.some((perk) => perkKey(perk.name) === perkKey(name))) {
      setDraft("");
      return;
    }
    // Default: assign to every ticket type (vendor can uncheck).
    const ticketKeys = columns.map((column) => column.key);
    commit([
      ...perks,
      { id: `perk:${perkKey(name)}:${Date.now()}`, name, ticketKeys },
    ]);
    setDraft("");
  }

  function removePerk(id: string) {
    if (disabled) return;
    commit(perks.filter((perk) => perk.id !== id));
  }

  function toggleTicket(perkId: string, ticketKey: string, checked: boolean) {
    if (disabled) return;
    commit(
      perks.map((perk) => {
        if (perk.id !== perkId) return perk;
        if (!checked) {
          return {
            ...perk,
            ticketKeys: perk.ticketKeys.filter((key) => key !== ticketKey),
          };
        }
        return {
          ...perk,
          ticketKeys: withHigherTiersSelected(
            perk.ticketKeys,
            ticketKey,
            columns,
          ),
        };
      }),
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            addPerk();
          }}
          placeholder={t("typeInclude")}
          disabled={disabled || perks.length >= MAX_PERKS}
          className="bg-input/50 border-border sm:flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !draft.trim() || perks.length >= MAX_PERKS}
          className="sm:w-auto"
          onClick={addPerk}
        >
          <Plus className="mr-1 h-4 w-4" />
          {tCommon("add")}
        </Button>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("ticketPerksNeedTickets")}</p>
      ) : perks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("ticketPerksEmptyTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("ticketPerksEmptyDesc")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[360px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  {t("ticketPerksPerkCol")}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="min-w-[6.5rem] px-2 py-2.5 text-center text-xs font-semibold text-foreground"
                  >
                    <span className="line-clamp-2 break-words">{column.name}</span>
                  </th>
                ))}
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {perks.map((perk) => (
                <tr key={perk.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 text-sm font-medium text-foreground">
                    {perk.name}
                  </td>
                  {columns.map((column) => {
                    const checked = perk.ticketKeys.includes(column.key);
                    return (
                      <td key={column.key} className="px-2 py-2.5 text-center">
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(value) =>
                            toggleTicket(perk.id, column.key, value === true)
                          }
                          aria-label={t("ticketPerksAssignAria", {
                            perk: perk.name,
                            ticket: column.name,
                          })}
                          className="mx-auto"
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-2.5 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={disabled}
                      onClick={() => removePerk(perk.id)}
                      aria-label={t("ticketPerksRemoveAria", { perk: perk.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("ticketPerksHigherHint")}</p>
    </div>
  );
}
