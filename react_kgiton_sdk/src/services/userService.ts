import { KgitonApiClient } from '../core/network/kgitonApiClient';
import { ApiConstants } from '../core/constants/apiConstants';
import { User, UserData, parseUser } from '../domain/entities/user';
import {
  LicenseKey,
  LicenseKeyData,
  parseLicenseKey,
} from '../domain/entities/licenseKey';
import {
  Transaction,
  TransactionData,
  parseTransaction,
} from '../domain/entities/transaction';

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
 * Token Balance Response
 */
interface TokenBalanceData {
  total_balance: number;
  license_keys: LicenseKeyData[];
}

/**
 * User Service
 *
 * Provides user-related operations:
 * - Get user profile
 * - Get token balance
 * - Get license keys
 * - Get transaction history
 * - Verify license ownership
 */
export class UserService {
  private client: KgitonApiClient;

  constructor(client: KgitonApiClient) {
    this.client = client;
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<UserData>>(
      ApiConstants.endpoints.userProfile,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to get user profile');
    }

    return parseUser(response.data);
  }

  /**
   * Get token balance across all license keys
   */
  async getTokenBalance(): Promise<{
    totalBalance: number;
    licenseKeys: LicenseKey[];
  }> {
    const response = await this.client.get<ApiResponse<TokenBalanceData>>(
      ApiConstants.endpoints.userTokenBalance,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to get token balance');
    }

    return {
      totalBalance: response.data.total_balance,
      licenseKeys: response.data.license_keys.map(parseLicenseKey),
    };
  }

  /**
   * Get total token balance (sum of all license keys)
   */
  async getTotalTokenBalance(): Promise<number> {
    const { totalBalance } = await this.getTokenBalance();
    return totalBalance;
  }

  /**
   * Get all user's license keys
   */
  async getUserLicenseKeys(): Promise<LicenseKey[]> {
    const { licenseKeys } = await this.getTokenBalance();
    return licenseKeys;
  }

  /**
   * Get balance for specific license key
   */
  async getLicenseKeyBalance(licenseKey: string): Promise<LicenseKey | null> {
    const { licenseKeys } = await this.getTokenBalance();
    return licenseKeys.find((lk) => lk.key === licenseKey) || null;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(): Promise<Transaction[]> {
    const response = await this.client.get<ApiResponse<TransactionData[]>>(
      ApiConstants.endpoints.userTransactions,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to get transaction history');
    }

    return response.data.map(parseTransaction);
  }

  /**
   * Verify license ownership
   */
  async verifyLicenseOwnership(licenseKey: string): Promise<boolean> {
    try {
      const balance = await this.getLicenseKeyBalance(licenseKey);
      return balance !== null;
    } catch {
      return false;
    }
  }

  /**
   * Check if license has sufficient balance
   */
  async hasSufficientBalance(
    licenseKey: string,
    requiredTokens: number
  ): Promise<boolean> {
    try {
      const balance = await this.getLicenseKeyBalance(licenseKey);
      return balance !== null && balance.tokenBalance >= requiredTokens;
    } catch {
      return false;
    }
  }

  /**
   * Use tokens from a license key
   */
  async useToken(licenseKey: string, tokensToUse: number): Promise<LicenseKey> {
    const response = await this.client.post<ApiResponse<LicenseKeyData>>(
      ApiConstants.endpoints.userLicenseKeyUseToken(licenseKey),
      { tokens: tokensToUse },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to use tokens');
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Assign a new license key to user
   */
  async assignLicense(licenseKey: string): Promise<LicenseKey> {
    const response = await this.client.post<ApiResponse<LicenseKeyData>>(
      ApiConstants.endpoints.userAssignLicense,
      { license_key: licenseKey },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to assign license');
    }

    return parseLicenseKey(response.data);
  }
}
