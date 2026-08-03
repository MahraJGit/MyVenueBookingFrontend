"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PARTIAL_DECIMAL = /^-?\d*\.?\d*$/;
const PARTIAL_INTEGER = /^-?\d*$/;

function formatDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "";
  }
  return String(value);
}

function clampValue(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

export function parseOptionalNumericString(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export type NumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number | null | undefined;
  onValueChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  /** When the field is cleared and loses focus, use this value instead of empty. */
  defaultOnBlur?: number;
};

export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  integer = false,
  defaultOnBlur,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = React.useState(() => formatDisplay(value));
  const focusedRef = React.useRef(false);

  React.useEffect(() => {
    if (!focusedRef.current) {
      setDraft(formatDisplay(value));
    }
  }, [value]);

  const pattern = integer ? PARTIAL_INTEGER : PARTIAL_DECIMAL;

  function parseDraft(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") {
      return undefined;
    }
    const parsed = integer ? parseInt(trimmed, 10) : parseFloat(trimmed);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return clampValue(parsed, min, max);
  }

  function commitDraft(raw: string) {
    const parsed = parseDraft(raw);
    if (parsed === undefined) {
      if (defaultOnBlur !== undefined) {
        const fallback = clampValue(defaultOnBlur, min, max);
        setDraft(String(fallback));
        onValueChange(fallback);
        return;
      }
      setDraft("");
      onValueChange(undefined);
      return;
    }
    setDraft(String(parsed));
    onValueChange(parsed);
  }

  return (
    <Input
      {...props}
      type={integer ? "number" : "text"}
      step={integer ? 1 : undefined}
      inputMode={integer ? "numeric" : "decimal"}
      className={cn(className)}
      value={draft}
      onFocus={(event) => {
        focusedRef.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focusedRef.current = false;
        commitDraft(draft);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        if (!pattern.test(raw)) {
          return;
        }
        setDraft(raw);
        const parsed = parseDraft(raw);
        onValueChange(parsed);
      }}
      onKeyDown={(event) => {
        if (integer && (event.key === "." || event.key === "," || event.key === "e" || event.key === "E" || event.key === "+")) {
          event.preventDefault();
        }
        props.onKeyDown?.(event);
      }}
    />
  );
}
