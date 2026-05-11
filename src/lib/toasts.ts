import { toast } from "sonner";
import { ApiError, formatFieldErrorsForToast } from "@/lib/api/errors";

/** Centralized toast for API failures (handles validation arrays from Express). */
export function toastApiError(error: unknown, fallbackMessage?: string): void {
  if (error instanceof ApiError && error.statusCode === 0) {
    toast.error(error.message);
    return;
  }
  if (error instanceof ApiError) {
    const extra = formatFieldErrorsForToast(error.fieldErrors);
    toast.error(error.message, extra ? { description: extra } : undefined);
    return;
  }
  toast.error(fallbackMessage ?? "Something went wrong");
}
