"use client";

import * as React from "react";
import PhoneInput, { type Value } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import "@/styles/intl-phone-input.css";

import { cn } from "@/lib/utils";
import { PhoneCountrySelectRadix } from "@/components/phone-country-select-radix";

type SignupPhoneFieldProps = {
  id?: string;
  value: Value | undefined;
  onChange: (value: Value | undefined) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  /** `auth`: login/signup dark bar. `ui`: theme tokens — matches card forms (affiliate, dashboard). */
  variant?: "auth" | "ui";
};

/**
 * International phone field: all countries, SVG flags, E.164 value (best for SMS/OTP APIs).
 */
export function SignupPhoneField({
  id,
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  className,
  variant = "auth",
}: SignupPhoneFieldProps) {
  const tone = variant === "ui" ? "ui" : "auth";
  const CountrySelect = React.useMemo(() => {
    return function CountrySelectWithTone(
      props: Omit<React.ComponentProps<typeof PhoneCountrySelectRadix>, "tone">,
    ) {
      return <PhoneCountrySelectRadix {...props} tone={tone} />;
    };
  }, [tone]);

  return (
    <div
      className={cn(
        variant === "ui" ? "phone-field-ui" : "signup-phone-field",
        className,
      )}
    >
      <PhoneInput
        international
        defaultCountry="US"
        flags={flags}
        countrySelectComponent={CountrySelect}
        value={value}
        onChange={onChange}
        limitMaxLength
        smartCaret
        countryCallingCodeEditable={false}
        focusInputOnCountrySelection
        disabled={disabled}
        numberInputProps={{
          id,
          name: "phone",
          autoComplete: "tel",
          inputMode: "tel",
          "aria-invalid": ariaInvalid,
        }}
      />
    </div>
  );
}
