import type { Value } from "react-phone-number-input";

const SIGNUP_DRAFT_KEY = "mvb_signup_draft";
const SIGNUP_DRAFT_TTL_MS = 30 * 60 * 1000;

export type SignupDraft = {
  firstName: string;
  lastName: string;
  phoneE164?: Value;
  email: string;
  password: string;
  confirmPassword: string;
};

type StoredSignupDraft = SignupDraft & { savedAt: number };

function draftStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function saveSignupDraft(draft: SignupDraft): void {
  const storage = draftStorage();
  if (!storage) return;

  try {
    const payload: StoredSignupDraft = { ...draft, savedAt: Date.now() };
    storage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota — ignore.
  }
}

export function loadSignupDraft(): SignupDraft | null {
  const storage = draftStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(SIGNUP_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredSignupDraft;
    if (!parsed.savedAt || Date.now() - parsed.savedAt > SIGNUP_DRAFT_TTL_MS) {
      storage.removeItem(SIGNUP_DRAFT_KEY);
      return null;
    }

    return {
      firstName: parsed.firstName ?? "",
      lastName: parsed.lastName ?? "",
      phoneE164: parsed.phoneE164,
      email: parsed.email ?? "",
      password: parsed.password ?? "",
      confirmPassword: parsed.confirmPassword ?? "",
    };
  } catch {
    storage.removeItem(SIGNUP_DRAFT_KEY);
    return null;
  }
}

export function clearSignupDraft(): void {
  const storage = draftStorage();
  if (!storage) return;
  try {
    storage.removeItem(SIGNUP_DRAFT_KEY);
  } catch {
    // ignore
  }
}
