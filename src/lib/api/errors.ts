export type BackendFieldError = {
  field: string;
  message: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors?: BackendFieldError[];

  constructor(
    statusCode: number,
    message: string,
    fieldErrors?: BackendFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }

  static fromUnknown(statusCode: number, body: unknown): ApiError {
    if (typeof body === "object" && body !== null) {
      const o = body as Record<string, unknown>;
      const message =
        typeof o.message === "string" ? o.message : "Request failed";
      const errs = Array.isArray(o.errors) ? o.errors : undefined;
      const fieldErrors = errs
        ?.map((e) => {
          if (typeof e !== "object" || e === null) return null;
          const fe = e as Record<string, unknown>;
          if (typeof fe.field !== "string" || typeof fe.message !== "string") {
            return null;
          }
          return { field: fe.field, message: fe.message };
        })
        .filter(Boolean) as BackendFieldError[] | undefined;
      return new ApiError(statusCode, message, fieldErrors);
    }
    return new ApiError(statusCode, "Request failed");
  }
}

const GENERIC_API_MESSAGES = new Set([
  "Validation failed",
  "Request failed",
]);

/** Deduplicated user-facing validation messages (no field paths). */
export function extractFieldErrorMessages(
  fieldErrors?: BackendFieldError[],
): string[] {
  if (!fieldErrors?.length) return [];

  const seen = new Set<string>();
  const messages: string[] = [];

  for (const { message } of fieldErrors) {
    const trimmed = message.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    messages.push(trimmed);
  }

  return messages;
}

/** Toast description: one message per line, without technical field keys. */
export function formatFieldErrorsForToast(
  fieldErrors?: BackendFieldError[],
): string | undefined {
  const messages = extractFieldErrorMessages(fieldErrors);
  if (!messages.length) return undefined;
  return messages.join("\n");
}

export function resolveApiErrorForToast(
  error: ApiError,
  options?: { multipleValidationTitle?: string },
): { title: string; description?: string } {
  const messages = extractFieldErrorMessages(error.fieldErrors);
  const isGeneric = GENERIC_API_MESSAGES.has(error.message);

  if (!messages.length) {
    return { title: error.message };
  }

  if (messages.length === 1) {
    return { title: messages[0] };
  }

  if (isGeneric) {
    return {
      title:
        options?.multipleValidationTitle ?? "Please check the following",
      description: messages.join("\n"),
    };
  }

  return {
    title: error.message,
    description: messages.join("\n"),
  };
}
