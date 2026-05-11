export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode?: string | null;
  role: string;
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
  message: string;
  userId: string;
};

export type VerifyOtpRequestBody = {
  userId: string;
  otp: string;
};

export type VerifyOtpSuccessResponse = {
  success: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
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
  message: string;
  userId: string;
};

export type LoginTokensResponse = {
  success: true;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginApiResponse = LoginOtpRequiredResponse | LoginTokensResponse;

export type RefreshTokensRequestBody = {
  refreshToken: string;
};

export type RefreshTokensResponse = {
  success: true;
  accessToken: string;
  refreshToken: string;
};
