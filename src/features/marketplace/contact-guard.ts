/**
 * Client-side contact/PII checks aligned with backend contact-sanitizer.
 */

const EMAIL_RE =
  /[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+/i;

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|ae|pk|uk|us|app|dev|info|biz)(?:\/[^\s<>"')\]]*)?/i;

const WHATSAPP_RE =
  /\b(?:whats\s*app|whatsapp|wa\.me|chat\.whatsapp\.com)\b/i;

const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{1,4})?/g;

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

export function textContainsContactInfo(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  if (EMAIL_RE.test(text)) return true;
  if (URL_RE.test(text)) return true;
  if (WHATSAPP_RE.test(text)) return true;
  for (const match of text.matchAll(PHONE_RE)) {
    const raw = match[0];
    const digits = digitCount(raw);
    if (digits < 8 || digits > 15) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) continue;
    return true;
  }
  return false;
}

export function contactInfoBlockedMessage(fieldLabel = "This field"): string {
  return `${fieldLabel} cannot include phone numbers, emails, links, or messaging apps. Use the proposal and booking flow instead — chat opens after booking is confirmed.`;
}
