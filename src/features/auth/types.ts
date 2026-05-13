/** Snapshot returned by auth endpoints (backend may only send id, email, role). */
export type AuthUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  phoneCountryCode?: string | null;
};

export type RegisterRequestBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  password: string;
};

export type RegisterSuccessResponse = {
  success: true;
  requireOtp: boolean;
  userId: string;
  message?: string;
};

export type VerifyOtpRequestBody = {
  userId: string;
  otp: string;
};

export type VerifyOtpSuccessResponse = {
  success: true;
  accessToken: string;
  user: AuthUser;
  message?: string;
};

export type ResendOtpRequestBody = {
  userId: string;
};

export type ResendOtpSuccessResponse = {
  success: true;
  message: string;
};

/** POST /api/auth/login — XOR email or phone+countryCode (matches backend `loginDto`). */
export type LoginRequestBody =
  | { email: string; password: string }
  | { phone: string; phoneCountryCode: string; password: string };

/** Backend sends this when the account still needs phone OTP before tokens are issued. */
export type LoginOtpRequiredResponse = {
  success: false;
  requireOtp: true;
  userId: string;
  message?: string;
};

export type LoginTokensResponse = {
  success: true;
  accessToken: string;
  user: AuthUser;
  message?: string;
};

export type LoginApiResponse = LoginOtpRequiredResponse | LoginTokensResponse;

/** POST /api/auth/refresh — refresh token is HttpOnly cookie; response is JSON only. */
export type RefreshTokensResponse = {
  status: "success";
  accessToken: string;
};

export type LogoutSuccessResponse = {
  success: true;
  message?: string;
};
