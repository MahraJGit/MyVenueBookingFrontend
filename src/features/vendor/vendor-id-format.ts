export type IdFormatCheckResult =
  | { status: "passed"; normalized: string }
  | { status: "skipped"; normalized: string; reason: string }
  | { status: "failed"; message: string; normalized: string };

function compact(value: string) {
  return value.trim().toUpperCase().replace(/[\s\-_/]/g, "");
}

/**
 * Soft format checks for known country + ID type pairs.
 * Keep in sync with backend/src/common/utils/vendor-id-format.ts
 */
export function softValidateVendorId(input: {
  countryCode: string;
  idType: string;
  idNumber: string;
}): IdFormatCheckResult {
  const country = input.countryCode.trim().toUpperCase();
  const idType = input.idType.trim().toLowerCase();
  const raw = input.idNumber.trim();
  const normalized = compact(raw);

  if (normalized.length < 5) {
    return {
      status: "failed",
      message: "ID number must be at least 5 characters.",
      normalized,
    };
  }

  if (country === "PK" && (idType.includes("cnic") || idType.includes("national"))) {
    if (!/^\d{13}$/.test(normalized)) {
      return {
        status: "failed",
        message: "Enter a valid 13-digit Pakistan CNIC number.",
        normalized,
      };
    }
    return { status: "passed", normalized };
  }

  if (
    country === "AE" &&
    (idType.includes("emirates") || idType.includes("eid") || idType === "emirates id")
  ) {
    if (!/^784\d{12}$/.test(normalized)) {
      return {
        status: "failed",
        message: "Enter a valid Emirates ID (15 digits starting with 784).",
        normalized,
      };
    }
    return { status: "passed", normalized };
  }

  if (
    country === "SA" &&
    (idType.includes("national") || idType.includes("iqama"))
  ) {
    if (!/^[12]\d{9}$/.test(normalized)) {
      return {
        status: "failed",
        message: "Enter a valid Saudi National ID / Iqama (10 digits starting with 1 or 2).",
        normalized,
      };
    }
    return { status: "passed", normalized };
  }

  if (idType.includes("passport")) {
    if (!/^[A-Z0-9]{6,9}$/.test(normalized)) {
      return {
        status: "failed",
        message: "Enter a valid passport number (6–9 letters or digits).",
        normalized,
      };
    }
    return { status: "passed", normalized };
  }

  return {
    status: "skipped",
    normalized,
    reason: `No soft format rules for ${country}/${input.idType}; awaiting manual or API verification.`,
  };
}
