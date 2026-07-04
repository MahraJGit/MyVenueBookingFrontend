import { apiPost } from "@/lib/api/client";
import type {
  LoginApiResponse,
  LoginRequestBody,
  LogoutSuccessResponse,
  OAuthLinkApiResponse,
  OAuthLinkRequestBody,
  ForgotPasswordRequestBody,
  ForgotPasswordSuccessResponse,
  ResetPasswordRequestBody,
  ResetPasswordSuccessResponse,
  RefreshTokensResponse,
  RegisterRequestBody,
  RegisterSuccessResponse,
  ResendOtpRequestBody,
  ResendOtpSuccessResponse,
  VerifyOtpRequestBody,
  VerifyOtpSuccessResponse,
} from "./types";

const AUTH_BASE = "/api/auth";

const withCookies: RequestInit = { credentials: "include" };

export function registerAccount(body: RegisterRequestBody) {
  return apiPost<RegisterSuccessResponse, RegisterRequestBody>(
    `${AUTH_BASE}/register`,
    body,
    withCookies,
  );
}

export function verifyOtp(body: VerifyOtpRequestBody) {
  return apiPost<VerifyOtpSuccessResponse, VerifyOtpRequestBody>(
    `${AUTH_BASE}/verify-otp`,
    body,
    withCookies,
  );
}

export function resendOtp(body: ResendOtpRequestBody) {
  return apiPost<ResendOtpSuccessResponse, ResendOtpRequestBody>(
    `${AUTH_BASE}/resend-otp`,
    body,
    withCookies,
  );
}

export function loginAccount(body: LoginRequestBody) {
  return apiPost<LoginApiResponse, LoginRequestBody>(
    `${AUTH_BASE}/login`,
    body,
    withCookies,
  );
}

/** Uses HttpOnly `refreshToken` cookie set at login / verify-otp. */
export function refreshAuthTokens() {
  return apiPost<RefreshTokensResponse, Record<string, never>>(
    `${AUTH_BASE}/refresh`,
    {},
    withCookies,
  );
}

export function logoutAccount() {
  return apiPost<LogoutSuccessResponse, Record<string, never>>(
    `${AUTH_BASE}/logout`,
    {},
    withCookies,
  );
}

export function linkOAuthAccount(body: OAuthLinkRequestBody) {
  return apiPost<OAuthLinkApiResponse, OAuthLinkRequestBody>(
    `${AUTH_BASE}/oauth/link`,
    body,
    withCookies,
  );
}

export function requestPasswordReset(body: ForgotPasswordRequestBody) {
  return apiPost<ForgotPasswordSuccessResponse, ForgotPasswordRequestBody>(
    `${AUTH_BASE}/forgot-password`,
    body,
  );
}

export function resetPassword(body: ResetPasswordRequestBody) {
  return apiPost<ResetPasswordSuccessResponse, ResetPasswordRequestBody>(
    `${AUTH_BASE}/reset-password`,
    body,
  );
}
