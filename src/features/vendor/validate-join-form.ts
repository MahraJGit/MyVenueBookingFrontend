import { isE164Valid } from "@/lib/phone";
import type { Value } from "react-phone-number-input";

export type VendorJoinFormValues = {
  vendorName: string;
  businessType: string;
  ownerName: string;
  eidNumber: string;
  passportNumber: string;
  legalEntityName: string;
  tradeLicenseNumber: string;
  email: string;
  phoneE164: Value | undefined;
  address: string;
  taxId: string;
  paymentTerms: string;
};

type Translate = (key: string) => string;

export function validateVendorJoinForm(
  values: VendorJoinFormValues,
  t: Translate,
  tValidation: Translate,
): string | null {
  const vendorName = values.vendorName.trim();
  if (vendorName.length < 3) return t("errors.vendorNameMin");

  const ownerName = values.ownerName.trim();
  if (ownerName.length < 3) return t("errors.ownerNameMin");

  const eidNumber = values.eidNumber.trim();
  if (eidNumber.length < 5) return t("errors.eidNumberMin");

  const passportNumber = values.passportNumber.trim();
  if (passportNumber.length < 5) return t("errors.passportNumberMin");

  const legalEntityName = values.legalEntityName.trim();
  if (legalEntityName.length < 3) return t("errors.legalEntityNameMin");

  const tradeLicenseNumber = values.tradeLicenseNumber.trim();
  if (tradeLicenseNumber.length < 5) return t("errors.tradeLicenseNumberMin");

  const email = values.email.trim();
  if (!email) return t("errors.emailRequired");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return tValidation("validEmail");

  const phoneE164 = values.phoneE164?.trim() ?? "";
  if (!isE164Valid(phoneE164)) return tValidation("invalidPhone");

  const address = values.address.trim();
  if (address.length < 10) return t("errors.addressMin");

  const taxId = values.taxId.trim();
  if (taxId.length < 5) return t("errors.taxIdMin");

  return null;
}
