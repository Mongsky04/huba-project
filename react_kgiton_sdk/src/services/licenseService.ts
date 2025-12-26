import { KgitonApiClient } from '../core/network/kgitonApiClient';
import { ApiConstants } from '../core/constants/apiConstants';
import {
  LicenseKey,
  LicenseKeyData,
  parseLicenseKey,
  CreateLicenseKeyRequest,
  BulkCreateLicenseKeysRequest,
  UpdateLicenseKeyRequest,
  SetTrialModeRequest,
  AddTokenBalanceRequest,
} from '../domain/entities/licenseKey';

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
 * License Service (Admin Only)
 *
 * Provides license management operations for super admins:
 * - Create license keys
 * - Bulk create license keys
 * - Update license keys
 * - Delete license keys
 * - Set trial mode
 * - Add token balance
 */
export class LicenseService {
  private client: KgitonApiClient;

  constructor(client: KgitonApiClient) {
    this.client = client;
  }

  /**
   * Create a new license key (Admin only)
   */
  async createLicenseKey(request: CreateLicenseKeyRequest): Promise<LicenseKey> {
    const response = await this.client.post<ApiResponse<LicenseKeyData>>(
      ApiConstants.endpoints.adminLicenseKeys,
      {
        key: request.key,
        price_per_token: request.pricePerToken,
        token_balance: request.tokenBalance || 0,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to create license key');
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Create multiple license keys (Admin only)
   */
  async bulkCreateLicenseKeys(
    request: BulkCreateLicenseKeysRequest
  ): Promise<LicenseKey[]> {
    const response = await this.client.post<ApiResponse<LicenseKeyData[]>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/bulk`,
      {
        count: request.count,
        price_per_token: request.pricePerToken,
        token_balance: request.tokenBalance || 0,
      },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to bulk create license keys');
    }

    return response.data.map(parseLicenseKey);
  }

  /**
   * List all license keys (Admin only)
   */
  async listLicenseKeys(): Promise<LicenseKey[]> {
    const response = await this.client.get<ApiResponse<LicenseKeyData[]>>(
      ApiConstants.endpoints.adminLicenseKeys,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to list license keys');
    }

    return response.data.map(parseLicenseKey);
  }

  /**
   * Get license key by ID (Admin only)
   */
  async getLicenseKeyById(id: string): Promise<LicenseKey> {
    const response = await this.client.get<ApiResponse<LicenseKeyData>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/${id}`,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to get license key');
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Update license key (Admin only)
   */
  async updateLicenseKey(request: UpdateLicenseKeyRequest): Promise<LicenseKey> {
    const body: Record<string, unknown> = {};
    if (request.pricePerToken !== undefined) {
      body.price_per_token = request.pricePerToken;
    }
    if (request.tokenBalance !== undefined) {
      body.token_balance = request.tokenBalance;
    }
    if (request.status !== undefined) {
      body.status = request.status;
    }

    const response = await this.client.put<ApiResponse<LicenseKeyData>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/${request.id}`,
      body,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to update license key');
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Delete license key (Admin only)
   */
  async deleteLicenseKey(id: string): Promise<void> {
    await this.client.delete<ApiResponse<unknown>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/${id}`,
      undefined,
      { requiresAuth: true }
    );
  }

  /**
   * Set trial mode for license (Admin only)
   */
  async setTrialMode(request: SetTrialModeRequest): Promise<LicenseKey> {
    const response = await this.client.post<ApiResponse<LicenseKeyData>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/${request.id}/trial`,
      { trial_days: request.trialDays },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to set trial mode');
    }

    return parseLicenseKey(response.data);
  }

  /**
   * Add token balance to license (Admin only)
   */
  async addTokenBalance(request: AddTokenBalanceRequest): Promise<LicenseKey> {
    const response = await this.client.post<ApiResponse<LicenseKeyData>>(
      `${ApiConstants.endpoints.adminLicenseKeys}/${request.id}/add-tokens`,
      { tokens: request.tokens },
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to add token balance');
    }

    return parseLicenseKey(response.data);
  }
}
