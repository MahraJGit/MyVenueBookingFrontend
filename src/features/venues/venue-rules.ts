export type VenueFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type VenueHouseRuleItem = {
  id: string;
  text: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseVenueFaqs(rules: unknown): VenueFaqItem[] {
  const root = asRecord(rules);
  const raw = root?.faqs;
  if (!Array.isArray(raw)) return [];
  const items: VenueFaqItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = asRecord(raw[i]);
    if (!row) continue;
    const question = typeof row.question === "string" ? row.question.trim() : "";
    const answer = typeof row.answer === "string" ? row.answer.trim() : "";
    if (!question || !answer) continue;
    items.push({
      id:
        typeof row.id === "string" && row.id.trim()
          ? row.id.trim()
          : `faq-${i + 1}`,
      question,
      answer,
    });
  }
  return items;
}

export function parseVenueHouseRules(rules: unknown): VenueHouseRuleItem[] {
  const root = asRecord(rules);
  const raw = root?.houseRules;
  if (!Array.isArray(raw)) return [];
  const items: VenueHouseRuleItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = asRecord(raw[i]);
    if (!row) continue;
    const text = typeof row.text === "string" ? row.text.trim() : "";
    if (!text) continue;
    items.push({
      id:
        typeof row.id === "string" && row.id.trim()
          ? row.id.trim()
          : `rule-${i + 1}`,
      text,
    });
  }
  return items;
}

export function newVenueFaqId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `faq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newVenueHouseRuleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
