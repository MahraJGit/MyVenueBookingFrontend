"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Check,
  Compass,
  Store,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import { restoreAuthSession } from "@/features/auth/restore-session";
import { getAccessToken } from "@/features/auth/session-storage";
import {
  createVendorProfile,
  getMyVendorProfile,
  getVendorCommissionRates,
  resubmitVendorProfile,
  sendVendorPhoneOtp,
  uploadSingleVendorDocumentWithProgress,
  verifyVendorPhoneOtp,
  type VendorProfile,
  type VendorServiceType,
  type VendorVerificationStatus,
} from "@/features/vendor/api";
import { softValidateVendorId } from "@/features/vendor/vendor-id-format";
import { RequestAdditionalServicesPanel } from "@/components/vendors/RequestAdditionalServicesPanel";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import {
  formatUploadFileSize,
  validateVendorDocumentFile,
} from "@/features/uploads/validation";
import { toastApiError } from "@/lib/toasts";
import { SignupPhoneField } from "@/components/signup-phone-field";
import type { Value } from "react-phone-number-input";
import { cn } from "@/lib/utils";
import "@/styles/affiliate.css";

/** Fallback ID types by country until admin-configurable types exist. */
const STATIC_ID_TYPES: Record<string, string[]> = {
  AE: ["Emirates ID", "Passport"],
  PK: ["CNIC", "Passport"],
  SA: ["National ID", "Iqama", "Passport"],
};

const STATIC_REVENUE_RANGES = [
  "Under $50,000",
  "$50,000 – $250,000",
  "$250,000 – $1,000,000",
  "$1,000,000 – $5,000,000",
  "Over $5,000,000",
] as const;

const FALLBACK_COMMISSION_RATES: Record<VendorServiceType, number> = {
  VENUES: 10,
  ATTRACTIONS: 12,
  EVENTS: 10,
  MARKETPLACE: 10,
};

const VENDOR_SERVICES = [
  {
    id: "events" as const,
    apiType: "EVENTS" as const,
    titleKey: "serviceEventsTitle" as const,
    descKey: "serviceEventsDesc" as const,
    Icon: CalendarDays,
  },
  {
    id: "attractions" as const,
    apiType: "ATTRACTIONS" as const,
    titleKey: "serviceAttractionsTitle" as const,
    descKey: "serviceAttractionsDesc" as const,
    Icon: Compass,
  },
  {
    id: "marketplace" as const,
    apiType: "MARKETPLACE" as const,
    titleKey: "serviceMarketplaceTitle" as const,
    descKey: "serviceMarketplaceDesc" as const,
    Icon: Store,
  },
  {
    id: "venues" as const,
    apiType: "VENUES" as const,
    titleKey: "serviceVenuesTitle" as const,
    descKey: "serviceVenuesDesc" as const,
    Icon: Building2,
  },
];

type VendorServiceId = (typeof VENDOR_SERVICES)[number]["id"];

const STEPS = [
  { id: "business", titleKey: "stepBusiness" as const, shortKey: "stepBusinessShort" as const },
  { id: "identity", titleKey: "stepIdentity" as const, shortKey: "stepIdentityShort" as const },
  { id: "services", titleKey: "stepServices" as const, shortKey: "stepServicesShort" as const },
  { id: "financial", titleKey: "stepFinancial" as const, shortKey: "stepFinancialShort" as const },
  { id: "agreements", titleKey: "stepAgreements" as const, shortKey: "stepAgreementsShort" as const },
] as const;

const fieldLabelClass = "text-xs text-gray-300";
const fieldControlClass =
  "h-11 bg-[#242424] border border-[#242424] text-gray-200 placeholder:text-gray-500 focus-visible:border-pink-500/50 focus-visible:ring-pink-600/30";
const selectTriggerClass = cn(
  "h-11 w-full bg-[#242424] border border-[#242424] text-gray-200",
  "focus:border-pink-500/50 focus:ring-pink-600/30 data-[placeholder]:text-gray-500",
);

function Field({
  label,
  htmlFor,
  children,
  hint,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-gray-500">{hint}</p> : null}
    </div>
  );
}

const FileUploadField = ({
  id,
  label,
  onFileChange,
  selectedFileName,
  accept = ".pdf,image/*",
  hint,
}: {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
  selectedFileName?: string;
  accept?: string;
  hint?: string;
}) => {
  const t = useTranslations("affiliateJoin");

  return (
    <Field label={label} htmlFor={id} hint={hint ?? t("pdfOrImageHint")}>
      <label
        htmlFor={id}
        className={cn(
          "flex h-11 cursor-pointer items-center gap-3 rounded-md border px-3 transition-colors",
          selectedFileName
            ? "border-pink-500/40 bg-pink-500/10"
            : "border-[#242424] bg-[#242424] hover:border-[#303030]",
        )}
      >
        {selectedFileName ? (
          <Check className="h-4 w-4 shrink-0 text-pink-500" />
        ) : (
          <Upload className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span
          className={cn(
            "truncate text-sm",
            selectedFileName ? "text-gray-200" : "text-gray-500",
          )}
        >
          {selectedFileName ?? t("clickToUpload")}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            if (!file) {
              onFileChange(null);
              return;
            }
            if (file.size > 10 * 1024 * 1024) {
              toast.error(
                t("errors.fileTooLarge", {
                  size: formatUploadFileSize(file.size),
                }),
              );
              onFileChange(null);
              return;
            }
            try {
              if (file.type === "application/pdf") {
                validateVendorDocumentFile(file);
              }
              onFileChange(file);
            } catch (error) {
              onFileChange(null);
              if (error instanceof ApiError && error.statusCode === 400) {
                toast.error(t("errors.pdfOnly"));
                return;
              }
              toastApiError(error);
            }
          }}
        />
      </label>
    </Field>
  );
};

type FormState = {
  selectedServices: VendorServiceId[];
  businessName: string;
  businessType: "INDIVIDUAL" | "COMPANY";
  countryCode: string;
  city: string;
  businessAddress: string;
  bio: string;
  websiteUrl: string;
  email: string;
  phoneE164: Value | undefined;
  ownerName: string;
  idType: string;
  idNumber: string;
  tradeLicenseNumber: string;
  annualRevenueRange: string;
  vatTaxNumber: string;
  acceptCommission: boolean;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

type FileState = {
  idDocument: File | null;
  tradeLicenseDocument: File | null;
  financialStatement: File | null;
};

const initialFormState: FormState = {
  selectedServices: [],
  businessName: "",
  businessType: "INDIVIDUAL",
  countryCode: "",
  city: "",
  businessAddress: "",
  bio: "",
  websiteUrl: "",
  email: "",
  phoneE164: undefined,
  ownerName: "",
  idType: "",
  idNumber: "",
  tradeLicenseNumber: "",
  annualRevenueRange: "",
  vatTaxNumber: "",
  acceptCommission: false,
  acceptTerms: false,
  acceptPrivacy: false,
};

const JoinAffiliateFormPage = () => {
  const router = useRouter();
  const t = useTranslations("affiliateJoin");
  const tCommon = useTranslations("common");
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [vendorProfile, setVendorProfile] = React.useState<VendorProfile | null>(
    null,
  );
  const [stepIndex, setStepIndex] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [files, setFiles] = React.useState<FileState>({
    idDocument: null,
    tradeLicenseDocument: null,
    financialStatement: null,
  });
  const [phoneOtpSent, setPhoneOtpSent] = React.useState(false);
  const [phoneVerified, setPhoneVerified] = React.useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = React.useState("");
  const [phoneOtpBusy, setPhoneOtpBusy] = React.useState(false);
  const [isResubmitting, setIsResubmitting] = React.useState(false);

  const requestStatus = vendorProfile?.verificationStatus ?? null;
  const showStatusView = Boolean(requestStatus) && !isResubmitting;
  const currentStep = STEPS[stepIndex];

  const countriesQuery = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
    enabled: isAuthenticated && !showStatusView,
  });

  const citiesQuery = useQuery({
    queryKey: locationKeys.cities(form.countryCode, { activeOnly: true }),
    queryFn: () =>
      listCitiesByCountryCode(form.countryCode, { activeOnly: true }),
    enabled: Boolean(form.countryCode) && isAuthenticated && !showStatusView,
  });

  const commissionQuery = useQuery({
    queryKey: ["vendor-commission-rates"],
    queryFn: getVendorCommissionRates,
    staleTime: 60_000,
  });

  const commissionRates = commissionQuery.data ?? FALLBACK_COMMISSION_RATES;
  const countries = countriesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const idTypes = form.countryCode
    ? (STATIC_ID_TYPES[form.countryCode.toUpperCase()] ?? ["Passport"])
    : [];

  React.useEffect(() => {
    setPhoneOtpSent(false);
    setPhoneVerified(false);
    setPhoneOtpCode("");
  }, [form.phoneE164]);

  React.useEffect(() => {
    let isMounted = true;

    const checkAuthAndStatus = async () => {
      await restoreAuthSession();
      if (!getAccessToken()) {
        router.replace("/login?redirect=/affiliate/join");
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const profile = await getMyVendorProfile();
        if (!isMounted) return;
        setVendorProfile(profile);
        setIsAuthenticated(true);
      } catch (error: unknown) {
        if (!isMounted) return;
        if (error instanceof ApiError && error.statusCode === 401) {
          router.replace("/login?redirect=/affiliate/join");
          setIsAuthenticated(false);
        } else {
          toastApiError(error);
          setIsAuthenticated(true);
        }
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    };

    checkAuthAndStatus();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const statusMeta = React.useMemo(() => {
    if (requestStatus === "APPROVED") {
      return {
        title: t("approvedTitle"),
        description: t("approvedDesc"),
        badgeVariant: "default" as const,
      };
    }
    if (requestStatus === "REJECTED") {
      return {
        title: t("rejectedTitle"),
        description: t("rejectedDesc"),
        badgeVariant: "destructive" as const,
      };
    }
    return {
      title: t("pendingTitle"),
      description: t("pendingDesc"),
      badgeVariant: "secondary" as const,
    };
  }, [requestStatus, t]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (serviceId: VendorServiceId) => {
    setForm((prev) => {
      const selected = prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId];
      return { ...prev, selectedServices: selected };
    });
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validateStep = (
    stepId: (typeof STEPS)[number]["id"],
  ): string | null => {
    if (stepId === "business") {
      if (form.businessName.trim().length < 3) {
        return t("errors.businessNameRequired");
      }
      if (!form.businessType) return t("errors.businessTypeRequired");
      if (!form.countryCode) return t("errors.countryRequired");
      if (!form.city) return t("errors.cityRequired");
      if (form.businessAddress.trim().length < 5) {
        return t("errors.addressRequired");
      }
      if (!form.email.trim()) return t("errors.emailRequired");
      if (!isValidEmail(form.email)) return t("errors.emailInvalid");
      if (!form.phoneE164) return t("errors.phoneRequired");
      if (!phoneVerified) return t("errors.phoneVerifyRequired");
      return null;
    }

    if (stepId === "identity") {
      if (form.ownerName.trim().length < 3) {
        return t("errors.ownerNameRequired");
      }
      if (!form.idType) return t("errors.idTypeRequired");
      if (form.idNumber.trim().length < 5) {
        return t("errors.idNumberRequired");
      }
      const idCheck = softValidateVendorId({
        countryCode: form.countryCode,
        idType: form.idType,
        idNumber: form.idNumber,
      });
      if (idCheck.status === "failed") {
        return idCheck.message;
      }
      if (!files.idDocument) return t("errors.idDocumentRequired");
      if (form.tradeLicenseNumber.trim().length < 5) {
        return t("errors.tradeLicenseNumberRequired");
      }
      if (!files.tradeLicenseDocument) {
        return t("errors.tradeLicenseDocumentRequired");
      }
      return null;
    }

    if (stepId === "services") {
      if (form.selectedServices.length === 0) {
        return t("errors.servicesRequired");
      }
      return null;
    }

    if (stepId === "financial") {
      if (!form.annualRevenueRange) return t("errors.revenueRequired");
      if (!files.financialStatement) {
        return t("errors.financialStatementRequired");
      }
      if (form.vatTaxNumber.trim().length < 5) return t("errors.vatRequired");
      return null;
    }

    if (stepId === "agreements") {
      if (!form.acceptCommission) return t("errors.commissionRequired");
      if (!form.acceptTerms) return t("errors.termsRequired");
      if (!form.acceptPrivacy) return t("errors.privacyRequired");
      return null;
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep.id);
    if (error) {
      toast.error(error);
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const handleBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    for (const step of STEPS) {
      const error = validateStep(step.id);
      if (error) {
        toast.error(error);
        setStepIndex(STEPS.findIndex((s) => s.id === step.id));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const [idDocumentUrl, tradeLicenseCopyUrl, financialStatementUrl] =
        await Promise.all([
          uploadSingleVendorDocumentWithProgress(files.idDocument!),
          uploadSingleVendorDocumentWithProgress(files.tradeLicenseDocument!),
          uploadSingleVendorDocumentWithProgress(files.financialStatement!),
        ]);

      const serviceTypes = form.selectedServices.map((id) => {
        const match = VENDOR_SERVICES.find((s) => s.id === id);
        return match!.apiType;
      });

      const websiteUrl = form.websiteUrl.trim();
      const bio = form.bio.trim();
      const payload = {
        vendorName: form.businessName.trim(),
        businessType: form.businessType,
        ownerName: form.ownerName.trim(),
        countryCode: form.countryCode,
        city: form.city,
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        idDocumentUrl,
        tradeLicenseNumber: form.tradeLicenseNumber.trim(),
        tradeLicenseCopyUrl,
        email: form.email.trim(),
        phone: form.phoneE164!.trim(),
        address: form.businessAddress.trim(),
        bio: bio || null,
        websiteUrl: websiteUrl || null,
        taxId: form.vatTaxNumber.trim(),
        annualRevenueRange: form.annualRevenueRange,
        financialStatementUrl,
        serviceTypes,
        acceptedCommission: true as const,
        acceptedTerms: true as const,
        acceptedPrivacy: true as const,
      };

      if (isResubmitting) {
        await resubmitVendorProfile(payload);
        toast.success(t("formResubmitted"));
      } else {
        await createVendorProfile(payload);
        toast.success(t("formSubmitted"));
      }

      const profile = await getMyVendorProfile();
      setVendorProfile(profile);
      setIsResubmitting(false);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        router.replace("/login?redirect=/affiliate/join");
        return;
      }
      toastApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResubmit = () => {
    if (!vendorProfile) return;
    const selectedServices = (vendorProfile.services ?? [])
      .map((svc) => VENDOR_SERVICES.find((s) => s.apiType === svc.serviceType)?.id)
      .filter((id): id is VendorServiceId => Boolean(id));

    setForm({
      ...initialFormState,
      selectedServices,
      businessName: vendorProfile.vendorName ?? "",
      businessType:
        vendorProfile.businessType === "COMPANY" ? "COMPANY" : "INDIVIDUAL",
      countryCode: vendorProfile.countryCode ?? "",
      city: vendorProfile.city ?? "",
      businessAddress: vendorProfile.address ?? "",
      bio: vendorProfile.bio ?? "",
      websiteUrl: vendorProfile.websiteUrl ?? "",
      email: vendorProfile.email ?? "",
      phoneE164: (vendorProfile.phone as Value | undefined) ?? undefined,
      ownerName: vendorProfile.ownerName ?? "",
      idType: vendorProfile.idType ?? "",
      idNumber: vendorProfile.idNumber ?? "",
      tradeLicenseNumber: vendorProfile.tradeLicenseNumber ?? "",
      annualRevenueRange: vendorProfile.annualRevenueRange ?? "",
      vatTaxNumber: vendorProfile.taxId ?? "",
    });
    setFiles({
      idDocument: null,
      tradeLicenseDocument: null,
      financialStatement: null,
    });
    setPhoneVerified(Boolean(vendorProfile.phone));
    setPhoneOtpSent(false);
    setPhoneOtpCode("");
    setStepIndex(0);
    setIsResubmitting(true);
  };

  if (!authChecked) {
    return (
      <section className="affiliate-hero">
        <div className="container mx-auto px-4 py-24 text-center text-gray-400">
          {t("checkingSession")}
        </div>
      </section>
    );
  }

  if (!isAuthenticated) return null;

  if (showStatusView) {
    const enrollments = vendorProfile?.services ?? [];

    return (
      <section className="affiliate-hero">
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] p-6">
            <div className="text-center">
              <Badge variant={statusMeta.badgeVariant} className="mb-4">
                {requestStatus}
              </Badge>
              <h1 className="text-xl font-semibold text-white">
                {statusMeta.title}
              </h1>
              <p className="mt-3 text-sm text-gray-400">
                {statusMeta.description}
              </p>
              {requestStatus === "REJECTED" && vendorProfile?.rejectedReason ? (
                <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left text-sm text-red-200">
                  {vendorProfile.rejectedReason}
                </p>
              ) : null}
            </div>

            {enrollments.length > 0 ? (
              <div className="space-y-2 border-t border-[#242424] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {t("yourServices")}
                </p>
                {enrollments.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-lg border border-[#303030] bg-[#242424]/60 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-200">{svc.serviceType}</span>
                    {requestStatus === "APPROVED" ? (
                      <span className="text-xs text-gray-400">{svc.status}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {requestStatus === "APPROVED" ? (
              <RequestAdditionalServicesPanel
                enrollments={enrollments}
                className="space-y-3 border-t border-[#242424] pt-4"
                onSubmitted={async () => {
                  const profile = await getMyVendorProfile();
                  setVendorProfile(profile);
                }}
              />
            ) : null}

            {requestStatus === "REJECTED" ? (
              <Button
                type="button"
                onClick={startResubmit}
                className="w-full bg-pink-600 hover:bg-pink-500"
              >
                {t("resubmitApplication")}
              </Button>
            ) : null}

            {requestStatus === "APPROVED" ? (
              <Button
                asChild
                variant="outline"
                className="w-full border-[#303030]"
              >
                <Link href="/vendorDashboard">{t("goToDashboard")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="affiliate-hero !pb-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-2 text-sm text-gray-400">{t("pageSubtitle")}</p>
          </div>

          <div className="flex min-h-[680px] flex-col rounded-2xl border border-[#1F1F1F] bg-[#1B1B1B] p-5 sm:min-h-[720px] sm:p-7">
            <nav aria-label={t("stepsAriaLabel")} className="mb-6 shrink-0">
              <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {STEPS.map((step, index) => {
                  const reached = index <= stepIndex;
                  const done = index < stepIndex;
                  return (
                    <li key={step.id} className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (index < stepIndex) setStepIndex(index);
                        }}
                        disabled={index > stepIndex}
                        className="flex w-full min-w-0 flex-col gap-2 text-left disabled:cursor-default"
                      >
                        <span
                          className={cn(
                            "h-1 rounded-full transition-colors",
                            reached ? "bg-pink-600" : "bg-[#303030]",
                          )}
                        />
                        <span
                          className={cn(
                            "truncate text-[10px] font-medium sm:text-[11px]",
                            index === stepIndex
                              ? "text-white"
                              : done
                                ? "text-gray-300"
                                : "text-gray-500",
                          )}
                        >
                          {t(step.shortKey)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-pink-500">
                  {t("stepOf", {
                    current: stepIndex + 1,
                    total: STEPS.length,
                  })}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {t(currentStep.titleKey)}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {currentStep.id === "services" && t("stepServicesHint")}
                  {currentStep.id === "business" && t("stepBusinessHint")}
                  {currentStep.id === "identity" && t("stepIdentityHint")}
                  {currentStep.id === "financial" && t("stepFinancialHint")}
                  {currentStep.id === "agreements" && t("stepAgreementsHint")}
                </p>
              </div>

              <div className="mt-5 flex min-h-0 flex-1 flex-col">
              {currentStep.id === "services" ? (
                <div className="space-y-3 pb-2">
                  <p className="text-xs text-gray-500">{t("servicesMultiHint")}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {VENDOR_SERVICES.map((service) => {
                      const selected = form.selectedServices.includes(service.id);
                      const Icon = service.Icon;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={cn(
                            "rounded-xl border p-4 text-left transition-colors",
                            selected
                              ? "border-pink-500/50 bg-pink-500/10"
                              : "border-[#303030] bg-[#242424]/50 hover:border-[#404040]",
                          )}
                          aria-pressed={selected}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                selected
                                  ? "bg-pink-600 text-white"
                                  : "bg-[#303030] text-gray-300",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {t(service.titleKey)}
                                </span>
                                <span
                                  className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                                    selected
                                      ? "border-pink-500 bg-pink-600 text-white"
                                      : "border-gray-500 bg-transparent",
                                  )}
                                  aria-hidden
                                >
                                  {selected ? (
                                    <Check className="h-3 w-3" />
                                  ) : null}
                                </span>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                                {t(service.descKey)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <span className="inline-flex items-center gap-1.5 pt-1 text-xs font-medium text-pink-500/70">
                    {t("serviceGuideLink")}
                  </span>
                </div>
              ) : null}

              {currentStep.id === "business" ? (
                <div className="space-y-4 pb-2">
                  <Field label={t("businessName")} htmlFor="businessName">
                    <Input
                      id="businessName"
                      value={form.businessName}
                      onChange={(e) => setField("businessName", e.target.value)}
                      placeholder={t("businessNamePlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <Field label={t("businessType")}>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#242424] bg-[#242424] p-1">
                      {(
                        [
                          ["INDIVIDUAL", t("individual")],
                          ["COMPANY", t("company")],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setField("businessType", value)}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            form.businessType === value
                              ? "bg-pink-600 text-white"
                              : "text-gray-400 hover:text-gray-200",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label={t("country")}
                      hint={t("serviceCountriesReminder")}
                    >
                      <Select
                        value={form.countryCode}
                        onValueChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            countryCode: value,
                            city: "",
                            idType: "",
                          }));
                        }}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder={t("countryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="border-[#303030] bg-[#1B1B1B]">
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label={t("city")}>
                      <Select
                        value={form.city}
                        onValueChange={(value) => setField("city", value)}
                        disabled={!form.countryCode}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue
                            placeholder={
                              form.countryCode
                                ? t("cityPlaceholder")
                                : t("citySelectCountryFirst")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="border-[#303030] bg-[#1B1B1B]">
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label={t("businessAddress")} htmlFor="businessAddress">
                    <Input
                      id="businessAddress"
                      value={form.businessAddress}
                      onChange={(e) => setField("businessAddress", e.target.value)}
                      placeholder={t("businessAddressPlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <Field
                    label={t("bio")}
                    htmlFor="bio"
                    hint={t("bioHint")}
                  >
                    <Textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => setField("bio", e.target.value)}
                      placeholder={t("bioPlaceholder")}
                      rows={4}
                      maxLength={2000}
                      className={cn(fieldControlClass, "min-h-[96px] resize-y")}
                    />
                  </Field>

                  <Field label={t("website")} htmlFor="websiteUrl">
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) => setField("websiteUrl", e.target.value)}
                      placeholder={t("websitePlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <Field label={t("emailAddress")} htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <div className="space-y-3">
                    <Field label={t("phoneNumber")}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <div className="min-w-0 flex-1">
                          <SignupPhoneField
                            id="affiliate-join-phone"
                            variant="auth"
                            value={form.phoneE164}
                            onChange={(next) => setField("phoneE164", next)}
                            disabled={phoneVerified}
                          />
                        </div>
                        {!phoneVerified ? (
                          <Button
                            type="button"
                            className="h-11 shrink-0 bg-pink-600 px-4 text-white hover:bg-pink-500 sm:min-w-[140px]"
                            disabled={phoneOtpBusy || !form.phoneE164}
                            onClick={async () => {
                              if (!form.phoneE164) return;
                              setPhoneOtpBusy(true);
                              try {
                                await sendVendorPhoneOtp(form.phoneE164);
                                setPhoneOtpSent(true);
                                setPhoneOtpCode("");
                                toast.success(t("otpSent"));
                              } catch (error) {
                                toastApiError(error);
                              } finally {
                                setPhoneOtpBusy(false);
                              }
                            }}
                          >
                            {phoneOtpBusy
                              ? t("sendingOtp")
                              : phoneOtpSent
                                ? t("resendOtp")
                                : t("sendOtp")}
                          </Button>
                        ) : null}
                      </div>
                    </Field>

                    {phoneVerified ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        <Check className="h-4 w-4 shrink-0" />
                        {t("phoneVerified")}
                      </div>
                    ) : phoneOtpSent ? (
                      <div className="rounded-xl border border-[#303030] bg-[#242424]/60 p-4">
                        <p className="text-sm font-medium text-white">
                          {t("otpPanelTitle")}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {t("otpPanelHint")}
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Input
                            id="affiliate-join-otp"
                            placeholder={t("otpPlaceholder")}
                            value={phoneOtpCode}
                            onChange={(e) =>
                              setPhoneOtpCode(
                                e.target.value.replace(/\D/g, "").slice(0, 8),
                              )
                            }
                            className={cn(
                              fieldControlClass,
                              "text-center tracking-[0.35em] sm:max-w-[220px]",
                            )}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={8}
                          />
                          <Button
                            type="button"
                            className="h-11 bg-pink-600 px-6 text-white hover:bg-pink-500"
                            disabled={
                              phoneOtpBusy || phoneOtpCode.trim().length < 4
                            }
                            onClick={async () => {
                              if (!form.phoneE164) return;
                              setPhoneOtpBusy(true);
                              try {
                                await verifyVendorPhoneOtp(
                                  form.phoneE164,
                                  phoneOtpCode.trim(),
                                );
                                setPhoneVerified(true);
                                toast.success(t("phoneVerified"));
                              } catch (error) {
                                toastApiError(error);
                              } finally {
                                setPhoneOtpBusy(false);
                              }
                            }}
                          >
                            {phoneOtpBusy ? t("verifyingOtp") : t("verifyOtp")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {t("phoneVerifyRequiredHint")}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              {currentStep.id === "identity" ? (
                <div className="space-y-4 pb-2">
                  <Field label={t("ownerRepresentativeName")} htmlFor="ownerName">
                    <Input
                      id="ownerName"
                      value={form.ownerName}
                      onChange={(e) => setField("ownerName", e.target.value)}
                      placeholder={t("ownerRepresentativePlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t("idType")}>
                      <Select
                        value={form.idType}
                        onValueChange={(value) => setField("idType", value)}
                        disabled={!form.countryCode}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue
                            placeholder={
                              form.countryCode
                                ? t("idTypePlaceholder")
                                : t("idTypeSelectCountryFirst")
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="border-[#303030] bg-[#1B1B1B]">
                          {idTypes.map((idType) => (
                            <SelectItem key={idType} value={idType}>
                              {idType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label={t("idNumber")} htmlFor="idNumber">
                      <Input
                        id="idNumber"
                        value={form.idNumber}
                        onChange={(e) => setField("idNumber", e.target.value)}
                        placeholder={t("idNumberPlaceholder")}
                        className={fieldControlClass}
                      />
                    </Field>
                  </div>

                  <FileUploadField
                    id="id-document"
                    label={t("idDocumentUpload")}
                    selectedFileName={files.idDocument?.name}
                    onFileChange={(file) =>
                      setFiles((prev) => ({ ...prev, idDocument: file }))
                    }
                  />

                  <Field label={t("tradeLicenseNumber")} htmlFor="tradeLicenseNumber">
                    <Input
                      id="tradeLicenseNumber"
                      value={form.tradeLicenseNumber}
                      onChange={(e) =>
                        setField("tradeLicenseNumber", e.target.value)
                      }
                      placeholder={t("tradeLicenseNumberPlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>

                  <FileUploadField
                    id="trade-license-document"
                    label={t("tradeLicenseDocumentUpload")}
                    selectedFileName={files.tradeLicenseDocument?.name}
                    onFileChange={(file) =>
                      setFiles((prev) => ({
                        ...prev,
                        tradeLicenseDocument: file,
                      }))
                    }
                  />
                </div>
              ) : null}

              {currentStep.id === "financial" ? (
                <div className="space-y-4 pb-2">
                  <Field label={t("annualRevenueRange")}>
                    <Select
                      value={form.annualRevenueRange}
                      onValueChange={(value) =>
                        setField("annualRevenueRange", value)
                      }
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue
                          placeholder={t("annualRevenueRangePlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent className="border-[#303030] bg-[#1B1B1B]">
                        {STATIC_REVENUE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <FileUploadField
                    id="financial-statement"
                    label={t("latestFinancialStatement")}
                    selectedFileName={files.financialStatement?.name}
                    onFileChange={(file) =>
                      setFiles((prev) => ({
                        ...prev,
                        financialStatement: file,
                      }))
                    }
                  />

                  <Field
                    label={t("vatTaxRegistrationNumber")}
                    htmlFor="vatTaxNumber"
                  >
                    <Input
                      id="vatTaxNumber"
                      value={form.vatTaxNumber}
                      onChange={(e) => setField("vatTaxNumber", e.target.value)}
                      placeholder={t("vatTaxRegistrationPlaceholder")}
                      className={fieldControlClass}
                    />
                  </Field>
                </div>
              ) : null}

              {currentStep.id === "agreements" ? (
                <div className="space-y-4 pb-2">
                  <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
                    <p className="text-sm font-semibold text-white">
                      {t("commissionTitle")}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                      {t("commissionDescription")}
                    </p>
                    <p className="mt-3 text-xs font-medium text-gray-300">
                      {t("commissionAppliesTo")}
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs text-gray-400">
                      <li>
                        •{" "}
                        {t("commissionVenue", {
                          percent: commissionRates.VENUES,
                        })}
                      </li>
                      <li>
                        •{" "}
                        {t("commissionAttraction", {
                          percent: commissionRates.ATTRACTIONS,
                        })}
                      </li>
                      <li>
                        •{" "}
                        {t("commissionEvent", {
                          percent: commissionRates.EVENTS,
                        })}
                      </li>
                      <li>
                        •{" "}
                        {t("commissionMarketplace", {
                          percent: commissionRates.MARKETPLACE,
                        })}
                      </li>
                    </ul>
                    <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-gray-300">
                      {t("commissionExample")}
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <Checkbox
                        id="accept-commission"
                        checked={form.acceptCommission}
                        onCheckedChange={(checked) =>
                          setField("acceptCommission", checked === true)
                        }
                        className="mt-0.5 border-gray-500 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
                      />
                      <Label
                        htmlFor="accept-commission"
                        className="cursor-pointer text-sm font-normal leading-snug text-gray-300"
                      >
                        {t("acceptCommission")}
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-[#242424] bg-[#242424]/60 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="accept-terms"
                        checked={form.acceptTerms}
                        onCheckedChange={(checked) =>
                          setField("acceptTerms", checked === true)
                        }
                        className="mt-0.5 border-gray-500 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
                      />
                      <Label
                        htmlFor="accept-terms"
                        className="cursor-pointer text-sm font-normal leading-snug text-gray-300"
                      >
                        {t.rich("acceptTerms", {
                          terms: (chunks) => (
                            <Link
                              href="/terms"
                              className="text-pink-500 hover:underline"
                              target="_blank"
                            >
                              {chunks}
                            </Link>
                          ),
                        })}
                      </Label>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="accept-privacy"
                        checked={form.acceptPrivacy}
                        onCheckedChange={(checked) =>
                          setField("acceptPrivacy", checked === true)
                        }
                        className="mt-0.5 border-gray-500 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600"
                      />
                      <Label
                        htmlFor="accept-privacy"
                        className="cursor-pointer text-sm font-normal leading-snug text-gray-300"
                      >
                        {t.rich("acceptPrivacy", {
                          privacy: (chunks) => (
                            <Link
                              href="/privacy-policy"
                              className="text-pink-500 hover:underline"
                              target="_blank"
                            >
                              {chunks}
                            </Link>
                          ),
                        })}
                      </Label>
                    </div>
                  </div>
                </div>
              ) : null}
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-[#242424] pt-5 sm:flex-row sm:items-center">
                {stepIndex > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-11 border-[#303030] bg-transparent text-gray-300 hover:bg-[#242424] hover:text-white sm:w-auto"
                  >
                    {tCommon("back")}
                  </Button>
                ) : null}

                {stepIndex < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-11 flex-1 bg-pink-600 text-white hover:bg-pink-500"
                  >
                    {tCommon("continue")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 flex-1 bg-pink-600 text-white hover:bg-pink-500"
                  >
                    {isSubmitting ? t("submitting") : t("submitApplication")}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinAffiliateFormPage;
