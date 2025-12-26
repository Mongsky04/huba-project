import { KgitonApiClient } from '../core/network/kgitonApiClient';
import { ApiConstants } from '../core/constants/apiConstants';
import {
  TopupRequest,
  toTopupPayload,
  TopupResult,
  TopupResponseData,
  parseTopupResult,
} from '../domain/entities/topup';
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
 * Topup Service
 *
 * Provides token top-up operations:
 * - Request top-up
 * - Get top-up history
 */
export class TopupService {
  private client: KgitonApiClient;

  constructor(client: KgitonApiClient) {
    this.client = client;
  }

  /**
   * Request a token top-up
   * Returns payment URL for user to complete payment
   */
  async requestTopup(request: TopupRequest): Promise<TopupResult> {
    const payload = toTopupPayload(request);

    const response = await this.client.post<ApiResponse<TopupResponseData>>(
      ApiConstants.endpoints.topupRequest,
      payload,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to request topup');
    }

    return parseTopupResult(response.data);
  }

  /**
   * Get top-up history
   */
  async getTopupHistory(): Promise<Transaction[]> {
    const response = await this.client.get<ApiResponse<TransactionData[]>>(
      ApiConstants.endpoints.topupHistory,
      undefined,
      { requiresAuth: true }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || response.message || 'Failed to get topup history');
    }

    return response.data.map(parseTransaction);
  }
}
