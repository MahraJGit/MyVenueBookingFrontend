import { apiPost } from "@/lib/api/client";
import type {
  LoginApiResponse,
  LoginRequestBody,
  RefreshTokensRequestBody,
  RefreshTokensResponse,
  RegisterRequestBody,
  RegisterSuccessResponse,
  ResendOtpRequestBody,
  ResendOtpSuccessResponse,
  VerifyOtpRequestBody,
  VerifyOtpSuccessResponse,
} from "./types";

const AUTH_BASE = "/api/auth";

export function registerAccount(body: RegisterRequestBody) {
  return apiPost<RegisterSuccessResponse, RegisterRequestBody>(
    `${AUTH_BASE}/register`,
    body,
  );
}

export function verifyOtp(body: VerifyOtpRequestBody) {
  return apiPost<VerifyOtpSuccessResponse, VerifyOtpRequestBody>(
    `${AUTH_BASE}/verify-otp`,
    body,
  );
}

export function resendOtp(body: ResendOtpRequestBody) {
  return apiPost<ResendOtpSuccessResponse, ResendOtpRequestBody>(
    `${AUTH_BASE}/resend-otp`,
    body,
  );
}

export function loginAccount(body: LoginRequestBody) {
  return apiPost<LoginApiResponse, LoginRequestBody>(
    `${AUTH_BASE}/login`,
    body,
  );
}

export function refreshAuthTokens(body: RefreshTokensRequestBody) {
  return apiPost<RefreshTokensResponse, RefreshTokensRequestBody>(
    `${AUTH_BASE}/refresh`,
    body,
  );
}
