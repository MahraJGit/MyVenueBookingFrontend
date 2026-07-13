import { ApiError } from "@/lib/api/errors";
import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_LABEL,
} from "./constants";

export function formatUploadFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getUploadFileTooLargeMessage(fileSizeBytes: number): string {
  return `File is too large (${formatUploadFileSize(fileSizeBytes)}). Maximum allowed size is ${MAX_UPLOAD_FILE_SIZE_LABEL}.`;
}

export function getUploadFileTooLargeMessageForFile(file: File): string {
  return getUploadFileTooLargeMessage(file.size);
}

export function isUploadFileTooLarge(file: File): boolean {
  return file.size > MAX_UPLOAD_FILE_SIZE_BYTES;
}

export function isPdfUploadFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export function validateUploadFile(file: File): void {
  if (isUploadFileTooLarge(file)) {
    throw new ApiError(413, getUploadFileTooLargeMessageForFile(file));
  }

  const isAllowedType =
    file.type === "application/pdf" || file.type.startsWith("image/");

  if (!isAllowedType) {
    throw new ApiError(400, "Only images and PDF files are allowed.");
  }
}

export function validateVendorDocumentFile(file: File): void {
  if (!isPdfUploadFile(file)) {
    throw new ApiError(400, "Only PDF files are allowed.");
  }

  if (isUploadFileTooLarge(file)) {
    throw new ApiError(413, getUploadFileTooLargeMessageForFile(file));
  }
}
