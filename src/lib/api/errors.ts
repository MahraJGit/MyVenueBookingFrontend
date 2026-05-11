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

export function formatFieldErrorsForToast(fieldErrors?: BackendFieldError[]) {
  if (!fieldErrors?.length) return undefined;
  return fieldErrors.map((e) => `${e.field}: ${e.message}`).join("\n");
}
