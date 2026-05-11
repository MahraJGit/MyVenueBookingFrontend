"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Matches `react-phone-number-input` country option objects. */
type CountryOption = {
  value?: string;
  label: string;
  divider?: boolean;
};

function isSameOptionValue(
  v1: string | undefined | null,
  v2: string | undefined | null,
) {
  if (v1 === undefined || v1 === null) {
    return v2 === undefined || v2 === null;
  }
  return v1 === v2;
}

function getSelectedOption(
  options: CountryOption[],
  value: string | undefined,
): CountryOption | undefined {
  for (const option of options) {
    if (option.divider) continue;
    if (isSameOptionValue(option.value, value)) {
      return option;
    }
  }
  return undefined;
}

/** Country flag (`react-phone-number-input` default icon). */
type FlagComponentProps = {
  country?: string;
  label: string;
  "aria-hidden"?: boolean;
  aspectRatio?: number;
};

/** Radix value for `<Select.Item>`; matches native `<option value="">` mapping. */
function optionToRadixValue(option: CountryOption) {
  if (option.divider) return "";
  return option.value ?? "ZZ";
}

function resolveRadixValue(
  options: CountryOption[],
  country: string | undefined,
) {
  for (const o of options) {
    if (o.divider) continue;
    if (isSameOptionValue(o.value, country)) {
      return optionToRadixValue(o);
    }
  }
  for (const o of options) {
    if (!o.divider) {
      return optionToRadixValue(o);
    }
  }
  return "";
}

/**
 * Replaces the default native OS `<select>` from `react-phone-number-input` so the
 * country list can respect app colors (native dropdown styling cannot otherwise).
 *
 * Mirrors the bundled `CountrySelectWithIcon` contract (`iconComponent`, `options`, etc.).
 */
export function PhoneCountrySelectRadix(props: {
  name?: string;
  "aria-label"?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: React.ComponentType<FlagComponentProps>;
  className?: string;
  /** `ui`: popover/trigger match shadcn Select on cards. `auth`: dark login/signup styling. */
  tone?: "auth" | "ui";
}) {
  const {
    name,
    "aria-label": ariaLabel,
    value,
    onChange,
    onFocus,
    onBlur,
    options,
    disabled,
    readOnly,
    iconComponent: Icon,
    className,
    tone = "auth",
  } = props;

  const selectedOption = React.useMemo(
    () => getSelectedOption(options, value),
    [options, value],
  );

  const fallbackCountryOption = React.useMemo(
    () => options.find((o) => !o.divider),
    [options],
  );

  const iconOption = selectedOption ?? fallbackCountryOption;

  const radixValue = React.useMemo(
    () => resolveRadixValue(options, value),
    [options, value],
  );

  const handleValueChange = (next: string) => {
    onChange(next === "ZZ" ? undefined : next);
  };

  const isDisabled = !!(disabled || readOnly);

  return (
    <div className="PhoneInputCountry">
      <SelectPrimitive.Root
        name={name}
        value={radixValue}
        onValueChange={handleValueChange}
        disabled={isDisabled}
      >
        <SelectPrimitive.Trigger
          aria-label={ariaLabel}
          onFocus={onFocus}
          onBlur={onBlur}
          type="button"
          className={cn(
            "PhoneInputCountrySelectTrigger flex shrink-0 items-center gap-0 rounded-md px-1 py-0.5 outline-none",
            tone === "auth"
              ? "hover:bg-white/5 data-placeholder:text-gray-400 focus-visible:ring-[3px] focus-visible:ring-pink-600/35"
              : "hover:bg-accent/50 data-placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          {iconOption ? (
            <Icon
              aria-hidden
              country={
                selectedOption !== undefined ? value : fallbackCountryOption?.value
              }
              label={iconOption.label}
            />
          ) : null}
          <span className="PhoneInputCountrySelectArrow inline-block shrink-0" />
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            align="start"
            sideOffset={6}
            className={cn(
              "z-200 overflow-hidden rounded-md shadow-md",
              tone === "auth"
                ? "border border-[#303030] bg-[#1a1a1a] text-gray-100"
                : "border border-border bg-popover text-popover-foreground",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            <SelectPrimitive.Viewport
              className={cn(
                "max-h-[min(360px,calc(100vh-120px))] overflow-y-auto p-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full",
                tone === "auth"
                  ? "[&::-webkit-scrollbar-thumb]:bg-[#4b4b4b] [&::-webkit-scrollbar-track]:bg-[#252525]"
                  : "[&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-track]:bg-muted/40",
              )}
            >
              {options.map((option, idx) => {
                if (option.divider) {
                  return (
                    <div
                      key={`divider-${idx}`}
                      role="presentation"
                      className={cn(
                        "my-1 h-px",
                        tone === "auth" ? "bg-[#383838]" : "bg-border",
                      )}
                    />
                  );
                }
                const itemValue = optionToRadixValue(option);
                return (
                  <SelectPrimitive.Item
                    key={`${itemValue}-${idx}-${option.label}`}
                    value={itemValue}
                    className={cn(
                      "relative flex cursor-pointer items-center rounded-sm py-2 pr-8 pl-2 text-sm outline-none select-none",
                      tone === "auth"
                        ? "text-gray-200 data-highlighted:bg-pink-600/35 data-[state=checked]:text-white focus:bg-pink-600/35"
                        : "text-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute right-2 flex size-4 items-center justify-center",
                        tone === "auth" ? "text-pink-500" : "text-primary",
                      )}
                    >
                      <SelectPrimitive.ItemIndicator>
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText asChild>
                      <span className="flex items-center gap-3 pr-6">
                        <span
                          aria-hidden
                          className="inline-flex size-7.5 shrink-0 items-center justify-center [&_.PhoneInputCountryIcon]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] [&_.PhoneInputCountryIcon]:rounded-[2px] [&_.PhoneInputCountryIconImg]:rounded-[2px]"
                        >
                          <Icon
                            aria-hidden
                            country={option.value}
                            label={option.label}
                          />
                        </span>
                        <span className="min-w-0 flex-1 leading-snug">
                          {option.label}
                        </span>
                      </span>
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                );
              })}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
