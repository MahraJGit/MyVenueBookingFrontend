"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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
import { getAccessToken } from "@/features/auth/session-storage";
import {
  createVendorProfile,
  getMyVendorProfile,
  type VendorVerificationStatus,
  uploadSingleVendorDocumentWithProgress,
} from "@/features/vendor/api";
import { toastApiError } from "@/lib/toasts";
import { SignupPhoneField } from "@/components/signup-phone-field";
import type { Value } from "react-phone-number-input";
import { isE164Valid } from "@/lib/phone";

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
  return (
    <div>
      <p className="mb-2 text-sm">{label}</p>
      <label
        htmlFor={id}
        className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/20 bg-black/30 px-4 py-6 text-center transition-colors hover:border-white/35"
      >
        <Upload className="mb-2 h-6 w-6 text-white/70" />
        <span className="text-sm font-medium text-white">
          Click to upload or drag and drop
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          PDF files only (max. 10MB per file)
        </span>
        {selectedFileName ? (
          <span className="mt-1 max-w-full truncate text-xs text-primary">
            {selectedFileName}
          </span>
        ) : null}
        {isUploading ? (
          <span className="mt-1 text-xs text-muted-foreground">
            Uploading... {uploadProgress ?? 0}%
          </span>
        ) : null}
        <input
          id={id}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(event) => {
            onFileChange(event.target.files?.[0] ?? null);
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
      const token = getAccessToken();
      if (!token) {
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
        title: "Your vendor request is approved",
        description:
          "Your profile has been approved. You can now start listing and managing venues from your dashboard.",
        badgeVariant: "default" as const,
      };
    }

    if (requestStatus === "REJECTED") {
      return {
        title: "Your vendor request was rejected",
        description:
          "Your application has been reviewed and rejected. Please contact support for details before submitting a new request.",
        badgeVariant: "destructive" as const,
      };
    }

    return {
      title: "Your vendor request is pending",
      description:
        "Your application is under review. We will notify you once the verification process is completed.",
      badgeVariant: "secondary" as const,
    };
  }, [requestStatus]);

  const handleInputChange =
    (field: keyof typeof formValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
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
      toast.error("Please select all required dates.");
      return;
    }

    if (!files.eidCopy || !files.passportCopy || !files.tradeLicenseCopy) {
      toast.error("Please upload all required documents.");
      return;
    }

    const phoneE164 = formValues.phoneE164?.trim() ?? "";
    if (!isE164Valid(phoneE164)) {
      toast.error("Enter a valid international phone number.");
      return;
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
        toast.error("Failed to upload required documents. Please try again.");
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
        phone: phoneE164,
        address: formValues.address.trim(),
        taxId: formValues.taxId.trim(),
        paymentTerms: formValues.paymentTerms as "NET_15" | "NET_30" | "NET_60",
      });

      toast.success("Form submitted successfully.");
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
            Checking your session...
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
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <h1 className="text-3xl font-semibold">List Your Venue</h1>
          <p className="text-muted-foreground">
            Fill in your details to join the MyVenueBooking partner network.
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">Personal Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder="Vendor Name"
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
                    <SelectValue placeholder="Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="COMPANY">Company</SelectItem>
                    <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Owner Name"
                  value={formValues.ownerName}
                  onChange={handleInputChange("ownerName")}
                  required
                />
                <Input
                  placeholder="EID Number"
                  value={formValues.eidNumber}
                  onChange={handleInputChange("eidNumber")}
                  required
                />
                <DatePickerField
                  placeholder="EID Number Expiry Date"
                  value={eidExpiryDate}
                  onChange={setEidExpiryDate}
                />
                <Input
                  placeholder="Passport Number"
                  value={formValues.passportNumber}
                  onChange={handleInputChange("passportNumber")}
                  required
                />
                <DatePickerField
                  placeholder="Passport Number Expiry Date"
                  value={passportExpiryDate}
                  onChange={setPassportExpiryDate}
                />
                <div className="md:col-span-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FileUploadField
                      id="eid-document"
                      label="Upload PDF EID"
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
                      label="Upload PDF Passport"
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
              <h2 className="mb-4 text-lg font-medium">Business Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder="Legal Entity Name"
                  value={formValues.legalEntityName}
                  onChange={handleInputChange("legalEntityName")}
                  required
                />
                <DatePickerField
                  placeholder="Incorporation Date"
                  value={incorporationDate}
                  onChange={setIncorporationDate}
                />
                <Input
                  placeholder="Trade License Number"
                  value={formValues.tradeLicenseNumber}
                  onChange={handleInputChange("tradeLicenseNumber")}
                  required
                />
                <DatePickerField
                  placeholder="Trade License Expiry Date"
                  value={tradeLicenseExpiryDate}
                  onChange={setTradeLicenseExpiryDate}
                />
                <div className="md:col-span-2">
                  <FileUploadField
                    id="trade-license-document"
                    label="Upload PDF Trade License"
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
              <h2 className="mb-4 text-lg font-medium">Contact Information</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  type="email"
                  placeholder="Email Address"
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
                  placeholder="Address"
                  className="md:col-span-2"
                  value={formValues.address}
                  onChange={handleInputChange("address")}
                  required
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-lg font-medium">Additional Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  placeholder="Tax ID"
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
                    <SelectValue placeholder="Payment Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_15">Net 15</SelectItem>
                    <SelectItem value="NET_30">Net 30</SelectItem>
                    <SelectItem value="NET_60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
                <div className="md:col-span-2">
                  <FileUploadField
                    id="verification-documents"
                    label="Verification Documents"
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
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default JoinAffiliateFormPage;
