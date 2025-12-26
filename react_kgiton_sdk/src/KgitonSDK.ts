import { KgitonApiClient } from './core/network/kgitonApiClient';
import { AuthService } from './services/authService';
import { UserService } from './services/userService';
import { LicenseService } from './services/licenseService';
import { TopupService } from './services/topupService';
import { HubaHelper } from './helpers/hubaHelper';

// Re-export entities
import {
  AuthResult,
  RegisterRequest,
  RegisterResponse,
} from './domain/entities/auth';
import { User } from './domain/entities/user';
import { LicenseKey } from './domain/entities/licenseKey';
import { Transaction } from './domain/entities/transaction';
import { TopupResult, TopupRequest } from './domain/entities/topup';

/**
 * SDK Configuration Options
 */
export interface KgitonSDKConfig {
  /** Core API URL (default: http://localhost:3000) */
  coreApiUrl: string;
  /** Huba API URL (optional, default: http://localhost:3001) */
  hubaApiUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable logging (default: __DEV__) */
  enableLogging?: boolean;
}

/**
 * Main SDK Facade - Clean Architecture Implementation
 *
 * This class provides a simplified API for using the KGiTON SDK.
 * It follows Clean Architecture principles by using services to interact
 * with the domain layer.
 *
 * The SDK integrates with two backends:
 * - KGiTON Core API: Authentication, license management, token operations
 * - Huba API: Items, cart, transactions, extended user profiles
 *
 * @example
 * ```typescript
 * // Initialize SDK
 * const sdk = new KgitonSDK({
 *   coreApiUrl: 'http://localhost:3000',
 *   hubaApiUrl: 'http://localhost:3001',
 * });
 *
 * // Register user
 * await sdk.register({
 *   email: 'user@example.com',
 *   password: 'password',
 *   name: 'John Doe',
 *   licenseKey: 'LICENSE-KEY',
 * });
 *
 * // Login
 * const authResult = await sdk.login('user@example.com', 'password');
 *
 * // Get token balance (Core API)
 * const balance = await sdk.getTotalTokenBalance();
 *
 * // Browse items (Huba API)
 * const items = await sdk.huba.getItems({ licenseKey: 'LICENSE-KEY' });
 *
 * // Add to cart (Huba API)
 * await sdk.huba.addToCart({
 *   licenseKey: 'LICENSE-KEY',
 *   itemId: items[0].id,
 *   quantity: 2.5,
 * });
 * ```
 */
export class KgitonSDK {
  private apiClient: KgitonApiClient;
  private authService: AuthService;
  private userService: UserService;
  private licenseService: LicenseService;
  private topupService: TopupService;
  private hubaHelper: HubaHelper;

  /**
   * Access to Huba API features (items, cart, transactions, extended profile)
   */
  public readonly huba: HubaHelper;

  constructor(config: KgitonSDKConfig) {
    // Initialize API Client
    this.apiClient = new KgitonApiClient({
      baseUrl: config.coreApiUrl,
      timeout: config.timeout,
      enableLogging: config.enableLogging,
    });

    // Initialize Services
    this.authService = new AuthService(this.apiClient);
    this.userService = new UserService(this.apiClient);
    this.licenseService = new LicenseService(this.apiClient);
    this.topupService = new TopupService(this.apiClient);

    // Initialize Huba Helper
    this.hubaHelper = new HubaHelper({ baseUrl: config.hubaApiUrl });
    this.huba = this.hubaHelper;
  }

  // ==================== Authentication APIs ====================

  /**
   * Register a new user
   *
   * Extended profile fields (phoneNumber, address, city, state, postalCode, country)
   * will be synced to Huba API after email verification.
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(request);
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResult> {
    const result = await this.authService.login(email, password);

    // Set token for Huba API
    this.hubaHelper.setToken(result.accessToken);

    return result;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    return this.authService.verifyEmail(token);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    return this.authService.forgotPassword(email);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.authService.resetPassword(token, newPassword);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await this.authService.logout();
    this.hubaHelper.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.authService.getAccessToken();
  }

  /**
   * Set access token (for restoring session)
   */
  setAccessToken(token: string): void {
    this.apiClient.setAccessToken(token);
    this.hubaHelper.setToken(token);
  }

  // ==================== User APIs ====================

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<User> {
    return this.userService.getUserProfile();
  }

  /**
   * Get all user's license keys
   */
  async getUserLicenseKeys(): Promise<LicenseKey[]> {
    return this.userService.getUserLicenseKeys();
  }

  /**
   * Get total token balance across all licenses
   */
  async getTotalTokenBalance(): Promise<number> {
    return this.userService.getTotalTokenBalance();
  }

  /**
   * Get balance for specific license key
   */
  async getLicenseKeyBalance(licenseKey: string): Promise<LicenseKey | null> {
    return this.userService.getLicenseKeyBalance(licenseKey);
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(): Promise<Transaction[]> {
    return this.userService.getTransactionHistory();
  }

  /**
   * Verify license ownership
   */
  async verifyLicenseOwnership(licenseKey: string): Promise<boolean> {
    return this.userService.verifyLicenseOwnership(licenseKey);
  }

  /**
   * Check if license has sufficient balance
   */
  async hasSufficientBalance(
    licenseKey: string,
    requiredTokens: number
  ): Promise<boolean> {
    return this.userService.hasSufficientBalance(licenseKey, requiredTokens);
  }

  /**
   * Use tokens from a license key
   */
  async useToken(licenseKey: string, tokensToUse: number): Promise<LicenseKey> {
    return this.userService.useToken(licenseKey, tokensToUse);
  }

  /**
   * Assign a new license key to user
   */
  async assignLicense(licenseKey: string): Promise<LicenseKey> {
    return this.userService.assignLicense(licenseKey);
  }

  // ==================== License Management APIs (Admin) ====================

  /**
   * Create a new license key (Admin only)
   */
  async createLicenseKey(options: {
    key: string;
    pricePerToken: number;
    tokenBalance?: number;
  }): Promise<LicenseKey> {
    return this.licenseService.createLicenseKey({
      key: options.key,
      pricePerToken: options.pricePerToken,
      tokenBalance: options.tokenBalance,
    });
  }

  /**
   * Create multiple license keys (Admin only)
   */
  async bulkCreateLicenseKeys(options: {
    count: number;
    pricePerToken: number;
    tokenBalance?: number;
  }): Promise<LicenseKey[]> {
    return this.licenseService.bulkCreateLicenseKeys({
      count: options.count,
      pricePerToken: options.pricePerToken,
      tokenBalance: options.tokenBalance,
    });
  }

  /**
   * List all license keys (Admin only)
   */
  async listLicenseKeys(): Promise<LicenseKey[]> {
    return this.licenseService.listLicenseKeys();
  }

  /**
   * Get license key by ID (Admin only)
   */
  async getLicenseKeyById(id: string): Promise<LicenseKey> {
    return this.licenseService.getLicenseKeyById(id);
  }

  /**
   * Update license key (Admin only)
   */
  async updateLicenseKey(options: {
    id: string;
    pricePerToken?: number;
    tokenBalance?: number;
    status?: 'active' | 'inactive' | 'trial';
  }): Promise<LicenseKey> {
    return this.licenseService.updateLicenseKey({
      id: options.id,
      pricePerToken: options.pricePerToken,
      tokenBalance: options.tokenBalance,
      status: options.status,
    });
  }

  /**
   * Delete license key (Admin only)
   */
  async deleteLicenseKey(id: string): Promise<void> {
    return this.licenseService.deleteLicenseKey(id);
  }

  /**
   * Set trial mode for license (Admin only)
   */
  async setTrialMode(id: string, trialDays: number): Promise<LicenseKey> {
    return this.licenseService.setTrialMode({ id, trialDays });
  }

  /**
   * Add token balance to license (Admin only)
   */
  async addTokenBalance(id: string, tokens: number): Promise<LicenseKey> {
    return this.licenseService.addTokenBalance({ id, tokens });
  }

  // ==================== Top-up APIs ====================

  /**
   * Request a token top-up
   */
  async requestTopup(tokenCount: number, licenseKey: string): Promise<TopupResult> {
    return this.topupService.requestTopup({ tokenCount, licenseKey });
  }

  /**
   * Get top-up history
   */
  async getTopupHistory(): Promise<Transaction[]> {
    return this.topupService.getTopupHistory();
  }

  // ==================== Utility Methods ====================

  /**
   * Get API client instance for advanced usage
   */
  getApiClient(): KgitonApiClient {
    return this.apiClient;
  }

  /**
   * Load saved configuration (tokens, etc.) from storage
   */
  async loadConfiguration(): Promise<void> {
    await this.apiClient.loadConfiguration();
    const token = this.apiClient.getAccessToken();
    if (token) {
      this.hubaHelper.setToken(token);
    }
  }

  /**
   * Save current configuration to storage
   */
  async saveConfiguration(): Promise<void> {
    await this.apiClient.saveConfiguration();
  }

  /**
   * Clear all saved configuration
   */
  async clearConfiguration(): Promise<void> {
    await this.apiClient.clearConfiguration();
    this.hubaHelper.clearToken();
  }
}
