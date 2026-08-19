"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { SecureStoredImage } from "@/components/uploads/SecureStoredImage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  type VendorVerificationStatus,
  uploadSingleVendorDocumentWithProgress,
} from "@/features/vendor/api";
import { uploadSingleFile } from "@/features/uploads/upload-single";
import {
  formatUploadFileSize,
  validateVendorDocumentFile,
} from "@/features/uploads/validation";
import { validateVendorJoinForm } from "@/features/vendor/validate-join-form";
import { toastApiError } from "@/lib/toasts";
import { SignupPhoneField } from "@/components/signup-phone-field";
import type { Value } from "react-phone-number-input";

const DatePickerField = ({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value?: Date;
  onChange: (date?: Date) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between font-normal"
        >
          {value ? format(value, "MM/dd/yyyy") : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
};

const FileUploadField = ({
  id,
  label,
  onFileChange,
  selectedFileName,
  uploadProgress,
  isUploading,
}: {
  id: string;
  label: string;
  onFileChange: (file: File | null) => void;
  selectedFileName?: string;
  uploadProgress?: number;
  isUploading?: boolean;
}) => {
  const t = useTranslations("affiliateJoin");

  return (
    <div>
      <p className="mb-2 text-sm">{label}</p>
      <label
        htmlFor={id}
        className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/20 bg-black/30 px-4 py-6 text-center transition-colors hover:border-white/35"
      >
        <Upload className="mb-2 h-6 w-6 text-white/70" />
        <span className="text-sm font-medium text-white">
          {t("clickToUpload")}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          {t("pdfOnly")}
        </span>
        {selectedFileName ? (
          <span className="mt-1 max-w-full truncate text-xs text-primary">
            {selectedFileName}
          </span>
        ) : null}
        {isUploading ? (
          <span className="mt-1 text-xs text-muted-foreground">
            {t("uploadingPercent", { percent: uploadProgress ?? 0 })}
          </span>
        ) : null}
        <input
          id={id}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            if (!file) {
              onFileChange(null);
              return;
            }
            try {
              validateVendorDocumentFile(file);
              onFileChange(file);
            } catch (error) {
              onFileChange(null);
              if (error instanceof ApiError) {
                if (error.statusCode === 413) {
                  toast.error(
                    t("errors.fileTooLarge", {
                      size: formatUploadFileSize(file.size),
                    }),
                  );
                  return;
                }
                if (error.statusCode === 400) {
                  toast.error(t("errors.pdfOnly"));
                  return;
                }
              }
              toastApiError(error);
            }
          }}
        />
      </label>
    </div>
  );
};

type FileKey =
  | "eidCopy"
  | "passportCopy"
  | "tradeLicenseCopy"
  | "verificationDocument";

const JoinAffiliateFormPage = () => {
  const router = useRouter();
  const t = useTranslations("affiliateJoin");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [requestStatus, setRequestStatus] =
    React.useState<VendorVerificationStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [eidExpiryDate, setEidExpiryDate] = React.useState<Date>();
  const [passportExpiryDate, setPassportExpiryDate] = React.useState<Date>();
  const [incorporationDate, setIncorporationDate] = React.useState<Date>();
  const [tradeLicenseExpiryDate, setTradeLicenseExpiryDate] =
    React.useState<Date>();
  const [formValues, setFormValues] = React.useState({
    vendorName: "",
    businessType: "INDIVIDUAL",
    ownerName: "",
    eidNumber: "",
    passportNumber: "",
    legalEntityName: "",
    tradeLicenseNumber: "",
    email: "",
    phoneE164: undefined as Value | undefined,
    address: "",
    taxId: "",
    paymentTerms: "NET_30",
  });
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = React.useState<string | null>(null);
  const [logoUploading, setLogoUploading] = React.useState(false);
  const [coverUploading, setCoverUploading] = React.useState(false);
  const [files, setFiles] = React.useState<{
    eidCopy: File | null;
    passportCopy: File | null;
    tradeLicenseCopy: File | null;
    verificationDocument: File | null;
  }>({
    eidCopy: null,
    passportCopy: null,
    tradeLicenseCopy: null,
    verificationDocument: null,
  });
  const [uploadProgress, setUploadProgress] = React.useState<
    Partial<Record<FileKey, number>>
  >({});

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

        setRequestStatus(profile?.verificationStatus ?? null);
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
        if (isMounted) {
          setAuthChecked(true);
        }
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

  const handleInputChange =
    (field: keyof typeof formValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleBrandingUpload = async (
    file: File,
    setter: (url: string | null) => void,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true);
    try {
      const url = await uploadSingleFile(file, "vendor-media");
      setter(url);
    } catch (e) {
      toastApiError(e);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (
      !eidExpiryDate ||
      !passportExpiryDate ||
      !incorporationDate ||
      !tradeLicenseExpiryDate
    ) {
      toast.error(t("selectAllDates"));
      return;
    }

    const validationError = validateVendorJoinForm(formValues, t, tValidation);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!files.eidCopy || !files.passportCopy || !files.tradeLicenseCopy) {
      toast.error(t("uploadAllDocuments"));
      return;
    }

    const selectedDocuments = [
      files.eidCopy,
      files.passportCopy,
      files.tradeLicenseCopy,
      files.verificationDocument,
    ].filter((file): file is File => Boolean(file));

    for (const file of selectedDocuments) {
      try {
        validateVendorDocumentFile(file);
      } catch (error) {
        toastApiError(error);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      setUploadProgress({});

      const uploadEntries = [
        { key: "eidCopy" as const, file: files.eidCopy, required: true },
        { key: "passportCopy" as const, file: files.passportCopy, required: true },
        {
          key: "tradeLicenseCopy" as const,
          file: files.tradeLicenseCopy,
          required: true,
        },
        {
          key: "verificationDocument" as const,
          file: files.verificationDocument,
          required: false,
        },
      ].filter((entry) => entry.file);

      const uploadedUrls: Partial<Record<FileKey, string>> = {};
      const concurrency = 2;

      for (let index = 0; index < uploadEntries.length; index += concurrency) {
        const chunk = uploadEntries.slice(index, index + concurrency);
        await Promise.all(
          chunk.map(async (entry) => {
            const url = await uploadSingleVendorDocumentWithProgress(entry.file!, {
              maxRetries: 2,
              onProgress: (progress) => {
                setUploadProgress((prev) => ({ ...prev, [entry.key]: progress }));
              },
            });
            uploadedUrls[entry.key] = url;
          }),
        );
      }

      const eidCopyUrl = uploadedUrls.eidCopy;
      const passportCopyUrl = uploadedUrls.passportCopy;
      const tradeLicenseCopyUrl = uploadedUrls.tradeLicenseCopy;
      const verificationDocuments = uploadedUrls.verificationDocument
        ? [uploadedUrls.verificationDocument]
        : [];

      if (!eidCopyUrl || !passportCopyUrl || !tradeLicenseCopyUrl) {
        toast.error(t("uploadDocumentsFailed"));
        return;
      }

      await createVendorProfile({
        vendorName: formValues.vendorName.trim(),
        businessType: formValues.businessType as
          | "INDIVIDUAL"
          | "COMPANY"
          | "PARTNERSHIP",
        ownerName: formValues.ownerName.trim(),
        eidNumber: formValues.eidNumber.trim(),
        eidExpiry: eidExpiryDate.toISOString(),
        eidCopyUrl,
        passportNumber: formValues.passportNumber.trim(),
        passportExpiry: passportExpiryDate.toISOString(),
        passportCopyUrl,
        legalEntityName: formValues.legalEntityName.trim(),
        incorporationDate: incorporationDate.toISOString(),
        tradeLicenseNumber: formValues.tradeLicenseNumber.trim(),
        tradeLicenseExpiry: tradeLicenseExpiryDate.toISOString(),
        tradeLicenseCopyUrl,
        verificationDocuments,
        email: formValues.email.trim(),
        phone: formValues.phoneE164!.trim(),
        address: formValues.address.trim(),
        taxId: formValues.taxId.trim(),
        paymentTerms: formValues.paymentTerms as "NET_15" | "NET_30" | "NET_60",
        ...(logoUrl ? { logoUrl } : {}),
        ...(coverImageUrl ? { coverImageUrl } : {}),
      });

      toast.success(t("formSubmitted"));
      setRequestStatus("PENDING");
    } catch (error: unknown) {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.replace("/login?redirect=/affiliate/join");
        return;
      }
      toastApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center text-muted-foreground">
            {t("checkingSession")}
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requestStatus) {
    return (
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6 text-center">
            <Badge variant={statusMeta.badgeVariant} className="mb-4">
              {requestStatus}
            </Badge>
            <h1 className="text-2xl font-semibold">{statusMeta.title}</h1>
            <p className="mt-3 text-muted-foreground">{statusMeta.description}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="public-listing-section pb-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="page-title text-white">{t("pageTitle")}</h1>
          <p className="text-muted-foreground">{t("pageSubtitle")}</p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">{t("branding")}</h2>
              <p className="mb-4 text-sm text-muted-foreground">{t("brandingHint")}</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm">{t("coverImageLabel")}</p>
                  <label
                    className="relative block h-36 cursor-pointer overflow-hidden rounded-lg border border-dashed border-white/20 bg-black/30"
                  >
                    {coverImageUrl ? (
                      <SecureStoredImage
                        src={coverImageUrl}
                        alt="Cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        <Upload className="mr-2 h-5 w-5" />
                        {t("uploadCoverImage")}
                      </span>
                    )}
                    {coverUploading ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-sm text-white">{t("uploading")}</span>
                      </span>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleBrandingUpload(file, setCoverImageUrl, setCoverUploading);
                      }}
                    />
                  </label>
                </div>
                <div>
                  <p className="mb-2 text-sm">{t("logoLabel")}</p>
                  <label
                    className="relative block h-24 w-24 cursor-pointer overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/30"
                  >
                    {logoUrl ? (
                      <SecureStoredImage
                        src={logoUrl}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full flex-col items-center justify-center text-xs text-muted-foreground">
                        <Upload className="mb-1 h-5 w-5" />
                        {t("uploadLogo")}
                      </span>
                    )}
                    {logoUploading ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="text-xs text-white">{t("uploading")}</span>
                      </span>
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) handleBrandingUpload(file, setLogoUrl, setLogoUploading);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">{t("personalInfo")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder={t("vendorName")}
                  value={formValues.vendorName}
                  onChange={handleInputChange("vendorName")}
                  required
                />
                <Select
                  value={formValues.businessType}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, businessType: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("businessType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">{t("individual")}</SelectItem>
                    <SelectItem value="COMPANY">{t("company")}</SelectItem>
                    <SelectItem value="PARTNERSHIP">{t("partnership")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder={t("ownerName")}
                  value={formValues.ownerName}
                  onChange={handleInputChange("ownerName")}
                  required
                />
                <Input
                  placeholder={t("eidNumber")}
                  value={formValues.eidNumber}
                  onChange={handleInputChange("eidNumber")}
                  required
                />
                <DatePickerField
                  placeholder={t("eidExpiry")}
                  value={eidExpiryDate}
                  onChange={setEidExpiryDate}
                />
                <Input
                  placeholder={t("passportNumber")}
                  value={formValues.passportNumber}
                  onChange={handleInputChange("passportNumber")}
                  required
                />
                <DatePickerField
                  placeholder={t("passportExpiry")}
                  value={passportExpiryDate}
                  onChange={setPassportExpiryDate}
                />
                <div className="md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FileUploadField
                      id="eid-document"
                      label={t("uploadEid")}
                      selectedFileName={files.eidCopy?.name}
                      uploadProgress={uploadProgress.eidCopy}
                      isUploading={Boolean(
                        isSubmitting && files.eidCopy && !uploadProgress.eidCopy,
                      )}
                      onFileChange={(file) =>
                        setFiles((prev) => ({ ...prev, eidCopy: file }))
                      }
                    />
                    <FileUploadField
                      id="passport-document"
                      label={t("uploadPassport")}
                      selectedFileName={files.passportCopy?.name}
                      uploadProgress={uploadProgress.passportCopy}
                      isUploading={Boolean(
                        isSubmitting &&
                          files.passportCopy &&
                          !uploadProgress.passportCopy,
                      )}
                      onFileChange={(file) =>
                        setFiles((prev) => ({ ...prev, passportCopy: file }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">{t("businessInfo")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder={t("legalEntityName")}
                  value={formValues.legalEntityName}
                  onChange={handleInputChange("legalEntityName")}
                  required
                />
                <DatePickerField
                  placeholder={t("incorporationDate")}
                  value={incorporationDate}
                  onChange={setIncorporationDate}
                />
                <Input
                  placeholder={t("tradeLicenseNumber")}
                  value={formValues.tradeLicenseNumber}
                  onChange={handleInputChange("tradeLicenseNumber")}
                  required
                />
                <DatePickerField
                  placeholder={t("tradeLicenseExpiry")}
                  value={tradeLicenseExpiryDate}
                  onChange={setTradeLicenseExpiryDate}
                />
                <div className="md:col-span-2">
                  <FileUploadField
                    id="trade-license-document"
                    label={t("uploadTradeLicense")}
                    selectedFileName={files.tradeLicenseCopy?.name}
                    uploadProgress={uploadProgress.tradeLicenseCopy}
                    isUploading={Boolean(
                      isSubmitting &&
                        files.tradeLicenseCopy &&
                        !uploadProgress.tradeLicenseCopy,
                    )}
                    onFileChange={(file) =>
                      setFiles((prev) => ({ ...prev, tradeLicenseCopy: file }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">{t("contactInfo")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  type="email"
                  placeholder={t("emailAddress")}
                  value={formValues.email}
                  onChange={handleInputChange("email")}
                  required
                />
                <div className="space-y-2">
                  <SignupPhoneField
                    id="affiliate-join-phone"
                    variant="ui"
                    value={formValues.phoneE164}
                    onChange={(next) =>
                      setFormValues((prev) => ({ ...prev, phoneE164: next }))
                    }
                  />
                </div>
                <Input
                  placeholder={t("address")}
                  className="md:col-span-2"
                  value={formValues.address}
                  onChange={handleInputChange("address")}
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">{t("additionalDetails")}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder={t("taxId")}
                  value={formValues.taxId}
                  onChange={handleInputChange("taxId")}
                  required
                />
                <Select
                  value={formValues.paymentTerms}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, paymentTerms: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("paymentTerms")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_15">{t("net15")}</SelectItem>
                    <SelectItem value="NET_30">{t("net30")}</SelectItem>
                    <SelectItem value="NET_60">{t("net60")}</SelectItem>
                  </SelectContent>
                </Select>
                <div className="md:col-span-2">
                  <FileUploadField
                    id="verification-documents"
                    label={t("verificationDocuments")}
                    selectedFileName={files.verificationDocument?.name}
                    uploadProgress={uploadProgress.verificationDocument}
                    isUploading={Boolean(
                      isSubmitting &&
                        files.verificationDocument &&
                        !uploadProgress.verificationDocument,
                    )}
                    onFileChange={(file) =>
                      setFiles((prev) => ({ ...prev, verificationDocument: file }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t("submitting") : tCommon("submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default JoinAffiliateFormPage;
