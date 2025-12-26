/**
 * Webhook Configuration
 * Centralized configuration for webhook endpoints and settings
 */

export interface WebhookConfig {
  url: string;
  secret: string;
  enabled: boolean;
}

export interface WebhookSettings {
  maxRetries: number;
  retryDelays: number[]; // Delays in seconds for each retry attempt
  signatureHeader: string;
  timestampHeader: string;
  eventIdHeader: string;
  signatureAlgorithm: string;
  timestampTolerance: number; // Max age of webhook in seconds
}

// Webhook endpoints configuration
export const webhookEndpoints: Record<string, WebhookConfig> = {
  huba: {
    url: process.env.HUBA_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/kgiton',
    secret: process.env.HUBA_WEBHOOK_SECRET || 'kgiton_huba_webhook_secret_2024',
    enabled: process.env.HUBA_WEBHOOK_ENABLED !== 'false',
  },
};

// Webhook delivery settings
export const webhookSettings: WebhookSettings = {
  maxRetries: 5,
  retryDelays: [60, 300, 900, 3600, 7200], // 1min, 5min, 15min, 1hour, 2hours
  signatureHeader: 'x-kgiton-signature',
  timestampHeader: 'x-kgiton-timestamp',
  eventIdHeader: 'x-kgiton-event-id',
  signatureAlgorithm: 'sha256',
  timestampTolerance: 300, // 5 minutes
};

// Webhook event types
export enum WebhookEventType {
  USER_VERIFIED = 'user.verified',
  USER_DELETED = 'user.deleted',
  LICENSE_ASSIGNED = 'license.assigned',
  TOKEN_BALANCE_UPDATED = 'token.balance_updated',
}

// Which endpoints receive which events
export const eventSubscriptions: Record<WebhookEventType, string[]> = {
  [WebhookEventType.USER_VERIFIED]: ['huba'],
  [WebhookEventType.USER_DELETED]: ['huba'],
  [WebhookEventType.LICENSE_ASSIGNED]: ['huba'],
  [WebhookEventType.TOKEN_BALANCE_UPDATED]: [],
};
