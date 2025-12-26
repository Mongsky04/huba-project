import { KgitonApiClient } from '../core/network/kgitonApiClient';
import { ApiConstants } from '../core/constants/apiConstants';
import {
  AuthResult,
  AuthResponseData,
  parseAuthResult,
  RegisterRequest,
  toRegisterPayload,
  RegisterResponse,
  toResetPasswordPayload,
} from '../domain/entities/auth';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Authentication Service
 *
 * Provides authentication-related operations:
 * - Register new user with license key
 * - Login
 * - Forgot password
 * - Reset password
 * - Email verification
 */
export class AuthService {
  private client: KgitonApiClient;

  constructor(client: KgitonApiClient) {
    this.client = client;
  }

  /**
   * Register new user with license key and optional referral code
   *
   * This will send a verification email to the user.
   * User must verify email before they can login.
   *
   * Extended profile fields will be synced to Huba API after email verification via webhook.
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const payload = toRegisterPayload(request);

    const response = await this.client.post<ApiResponse<RegisterResponse>>(
      ApiConstants.endpoints.authRegister,
      payload
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Registration failed');
    }

    return response.data;
  }

  /**
   * Login with email and password
   *
   * Returns access token, refresh token, and user data.
   * Automatically saves tokens to the client.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const response = await this.client.post<ApiResponse<AuthResponseData>>(
      ApiConstants.endpoints.authLogin,
      { email, password }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Login failed');
    }

    const authResult = parseAuthResult(response.data);

    // Save tokens to client
    this.client.setTokens({
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
    });
    await this.client.saveConfiguration();

    return authResult;
  }

  /**
   * Verify email with token from verification email
   *
   * This is typically called by clicking the link in the verification email.
   */
  async verifyEmail(token: string): Promise<void> {
    await this.client.get<ApiResponse<unknown>>(
      ApiConstants.endpoints.authVerifyEmail,
      { token }
    );
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    await this.client.post<ApiResponse<unknown>>(
      ApiConstants.endpoints.authForgotPassword,
      { email }
    );
  }

  /**
   * Reset password with token from reset email
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = toResetPasswordPayload({ token, newPassword });

    await this.client.post<ApiResponse<unknown>>(
      ApiConstants.endpoints.authResetPassword,
      payload
    );
  }

  /**
   * Logout current user
   * Clears tokens from client and storage
   */
  async logout(): Promise<void> {
    this.client.clearTokens();
    await this.client.clearConfiguration();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.client.getAccessToken() !== null;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.client.getAccessToken();
  }
}
