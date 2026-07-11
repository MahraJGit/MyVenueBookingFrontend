const GENERIC_MESSAGE_PATTERNS: Array<{ pattern: RegExp; replace: (match: RegExpMatchArray) => string }> = [
  {
    pattern: /^String must contain at least (\d+) character/i,
    replace: (m) => `Must be at least ${m[1]} characters`,
  },
  {
    pattern: /^String must contain at most (\d+) character/i,
    replace: (m) => `Must be at most ${m[1]} characters`,
  },
  {
    pattern: /^Number must be greater than or equal to ([\d.-]+)$/i,
    replace: (m) => `Must be at least ${m[1]}`,
  },
  {
    pattern: /^Number must be less than or equal to ([\d.-]+)$/i,
    replace: (m) => `Must be at most ${m[1]}`,
  },
  {
    pattern: /^Expected .+, received .+$/i,
    replace: () => "This field has an invalid value",
  },
  {
    pattern: /^Invalid enum value/i,
    replace: () => "Please select a valid option",
  },
  {
    pattern: /^Invalid uuid$/i,
    replace: () => "This value is invalid",
  },
  {
    pattern: /^Invalid email$/i,
    replace: () => "Enter a valid email address",
  },
  {
    pattern: /^Invalid url$/i,
    replace: () => "Enter a valid URL",
  },
  {
    pattern: /^Required$/,
    replace: () => "This field is required",
  },
  {
    pattern: /^Validation failed$/,
    replace: () => "Please fix the highlighted fields and try again",
  },
];

/** Normalize legacy/generic Zod API messages for display in toasts and forms. */
export function normalizeValidationMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  for (const { pattern, replace } of GENERIC_MESSAGE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return replace(match);
  }

  return trimmed;
}
