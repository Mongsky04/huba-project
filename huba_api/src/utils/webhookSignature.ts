/**
 * Webhook Signature Utility
 * Verifies HMAC signatures from KGiTON Core API webhooks
 */

import crypto from 'crypto';

// Must match Core API settings
const SIGNATURE_HEADER = 'x-kgiton-signature';
const TIMESTAMP_HEADER = 'x-kgiton-timestamp';
const EVENT_ID_HEADER = 'x-kgiton-event-id';
const SIGNATURE_ALGORITHM = 'sha256';
const TIMESTAMP_TOLERANCE = 300; // 5 minutes

export interface WebhookHeaders {
  signature: string;
  timestamp: string;
  eventId: string;
}

/**
 * Extract webhook headers from request
 */
export function extractWebhookHeaders(headers: Record<string, string | string[] | undefined>): WebhookHeaders | null {
  const signature = headers[SIGNATURE_HEADER];
  const timestamp = headers[TIMESTAMP_HEADER];
  const eventId = headers[EVENT_ID_HEADER];

  if (!signature || !timestamp || !eventId) {
    return null;
  }

  return {
    signature: Array.isArray(signature) ? signature[0] : signature,
    timestamp: Array.isArray(timestamp) ? timestamp[0] : timestamp,
    eventId: Array.isArray(eventId) ? eventId[0] : eventId,
  };
}

/**
 * Generate expected HMAC signature
 */
function generateSignature(payload: string, secret: string, timestamp: string): string {
  const signaturePayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac(SIGNATURE_ALGORITHM, secret)
    .update(signaturePayload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const expectedSignature = generateSignature(payload, secret, timestamp);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Check if timestamp is within tolerance (prevents replay attacks)
 */
export function isTimestampValid(timestamp: string): boolean {
  const webhookTime = new Date(timestamp).getTime();
  const now = Date.now();
  const diff = Math.abs(now - webhookTime);
  return diff <= TIMESTAMP_TOLERANCE * 1000;
}

/**
 * Full webhook verification
 */
export function verifyWebhook(
  payload: string,
  headers: WebhookHeaders,
  secret: string
): { valid: boolean; error?: string } {
  // Check timestamp first (cheaper operation)
  if (!isTimestampValid(headers.timestamp)) {
    return { valid: false, error: 'Webhook timestamp is too old or in the future' };
  }

  // Verify signature
  if (!verifyWebhookSignature(payload, headers.signature, secret, headers.timestamp)) {
    return { valid: false, error: 'Invalid webhook signature' };
  }

  return { valid: true };
}
