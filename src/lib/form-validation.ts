import { cn } from "@/lib/utils";

/** True when value is empty or whitespace only. */
export function isBlank(value: string | undefined | null): boolean {
  return !String(value ?? "").trim();
}

export function requiredMessage(label: string): string {
  return `${label} is required`;
}

/** Merge base input classes with invalid (red border) state. */
export function fieldClassName(base: string, invalid: boolean): string {
  return cn(
    base,
    invalid && "border-destructive aria-invalid:border-destructive focus-visible:ring-destructive/30",
  );
}
