/**
 * Topup Request
 */
export interface TopupRequest {
  tokenCount: number;
  licenseKey: string;
}

/**
 * Convert TopupRequest to API payload
 */
export function toTopupPayload(
  request: TopupRequest
): Record<string, string | number> {
  return {
    token_count: request.tokenCount,
    license_key: request.licenseKey,
  };
}

/**
 * Topup Result Entity
 */
export interface TopupResult {
  transactionId: string;
  tokenCount: number;
  totalAmount: number;
  paymentUrl: string;
  status: 'pending' | 'success' | 'failed';
}

/**
 * Topup Response Data from API
 */
export interface TopupResponseData {
  transaction_id: string;
  token_count: number;
  total_amount: number;
  payment_url: string;
  status: string;
}

/**
 * Parse TopupResponseData from API response to TopupResult entity
 */
export function parseTopupResult(data: TopupResponseData): TopupResult {
  return {
    transactionId: data.transaction_id || '',
    tokenCount: data.token_count || 0,
    totalAmount: data.total_amount || 0,
    paymentUrl: data.payment_url || '',
    status: (data.status || 'pending') as 'pending' | 'success' | 'failed',
  };
}

/**
 * Check if topup is pending
 */
export function isTopupPending(result: TopupResult): boolean {
  return result.status === 'pending';
}

/**
 * Check if topup is successful
 */
export function isTopupSuccess(result: TopupResult): boolean {
  return result.status === 'success';
}

/**
 * Check if topup failed
 */
export function isTopupFailed(result: TopupResult): boolean {
  return result.status === 'failed';
}
