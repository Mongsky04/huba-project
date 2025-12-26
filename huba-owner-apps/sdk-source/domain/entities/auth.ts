import { User, UserData, parseUser } from './user';

/**
 * Auth Result Entity
 * Result of authentication operation
 */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Auth Response from API
 */
export interface AuthResponseData {
  access_token: string;
  refresh_token: string;
  user: UserData;
}

/**
 * Parse AuthResponseData from API response to AuthResult entity
 */
export function parseAuthResult(data: AuthResponseData): AuthResult {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: parseUser(data.user),
  };
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  licenseKey: string;
  referralCode?: string;
  // Entity Type Fields
  entityType?: 'individual' | 'company';
  companyName?: string;
  // Extended Profile Fields
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Convert RegisterRequest to API payload
 */
export function toRegisterPayload(
  request: RegisterRequest
): Record<string, string> {
  const payload: Record<string, string> = {
    email: request.email,
    password: request.password,
    name: request.name,
    license_key: request.licenseKey,
  };

  if (request.referralCode) payload.referral_code = request.referralCode;
  if (request.entityType) payload.entity_type = request.entityType;
  if (request.companyName) payload.company_name = request.companyName;
  if (request.phoneNumber) payload.phone_number = request.phoneNumber;
  if (request.address) payload.address = request.address;
  if (request.city) payload.city = request.city;
  if (request.state) payload.state = request.state;
  if (request.postalCode) payload.postal_code = request.postalCode;
  if (request.country) payload.country = request.country;

  return payload;
}

/**
 * Register Response (Email Verification Pending)
 */
export interface RegisterResponse {
  email: string;
  name: string;
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Convert ResetPasswordRequest to API payload
 */
export function toResetPasswordPayload(
  request: ResetPasswordRequest
): Record<string, string> {
  return {
    token: request.token,
    new_password: request.newPassword,
  };
}
