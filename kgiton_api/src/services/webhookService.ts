/**
 * Webhook Service
 * Handles webhook emission, HMAC signing, delivery tracking, and retries
 */

import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import {
  webhookEndpoints,
  webhookSettings,
  eventSubscriptions,
  WebhookEventType,
  WebhookConfig,
} from '../config/webhook';

// Re-export WebhookEventType for convenience
export { WebhookEventType } from '../config/webhook';

export interface WebhookPayload {
  event: WebhookEventType;
  event_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  eventId: string;
  endpoint: string;
  statusCode?: number;
  error?: string;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(
  payload: string,
  secret: string,
  timestamp: string
): string {
  const signaturePayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac(webhookSettings.signatureAlgorithm, secret)
    .update(signaturePayload)
    .digest('hex');
}

/**
 * Verify HMAC signature (for incoming webhooks)
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const expectedSignature = generateSignature(payload, secret, timestamp);
  
  // Use timing-safe comparison to prevent timing attacks
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
 * Check if timestamp is within tolerance
 */
export function isTimestampValid(timestamp: string): boolean {
  const webhookTime = new Date(timestamp).getTime();
  const now = Date.now();
  const diff = Math.abs(now - webhookTime);
  return diff <= webhookSettings.timestampTolerance * 1000;
}

/**
 * Generate unique event ID
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Create webhook delivery record in database
 */
async function createDeliveryRecord(
  eventType: WebhookEventType,
  eventId: string,
  payload: WebhookPayload,
  targetUrl: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .insert({
      event_type: eventType,
      event_id: eventId,
      payload: payload,
      target_url: targetUrl,
      status: 'pending',
      attempt_count: 0,
      max_attempts: webhookSettings.maxRetries,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create webhook delivery record:', error);
    return null;
  }

  return data.id;
}

/**
 * Update delivery record after attempt
 */
async function updateDeliveryRecord(
  deliveryId: string,
  success: boolean,
  attemptCount: number,
  statusCode?: number,
  responseBody?: string,
  error?: string
): Promise<void> {
  const now = new Date();
  
  let updateData: Record<string, unknown> = {
    attempt_count: attemptCount,
    response_status_code: statusCode,
    response_body: responseBody?.substring(0, 5000), // Limit response size
    last_error: error,
  };

  if (success) {
    updateData = {
      ...updateData,
      status: 'delivered',
      delivered_at: now.toISOString(),
      next_retry_at: null,
    };
  } else if (attemptCount >= webhookSettings.maxRetries) {
    updateData = {
      ...updateData,
      status: 'failed',
      next_retry_at: null,
    };
  } else {
    // Schedule next retry
    const retryDelay = webhookSettings.retryDelays[attemptCount - 1] || 7200;
    const nextRetry = new Date(now.getTime() + retryDelay * 1000);
    updateData = {
      ...updateData,
      status: 'pending',
      next_retry_at: nextRetry.toISOString(),
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from('webhook_deliveries')
    .update(updateData)
    .eq('id', deliveryId);

  if (updateError) {
    console.error('Failed to update webhook delivery record:', updateError);
  }
}

/**
 * Send webhook to a specific endpoint
 */
async function sendWebhook(
  endpoint: WebhookConfig,
  payload: WebhookPayload,
  deliveryId: string,
  attemptCount: number
): Promise<WebhookDeliveryResult> {
  const timestamp = new Date().toISOString();
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, endpoint.secret, timestamp);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [webhookSettings.signatureHeader]: signature,
        [webhookSettings.timestampHeader]: timestamp,
        [webhookSettings.eventIdHeader]: payload.event_id,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    const success = response.ok;

    await updateDeliveryRecord(
      deliveryId,
      success,
      attemptCount,
      response.status,
      responseBody,
      success ? undefined : `HTTP ${response.status}: ${response.statusText}`
    );

    if (success) {
      console.log(`[Webhook] Delivered ${payload.event} to ${endpoint.url}`);
    } else {
      console.warn(`[Webhook] Failed to deliver ${payload.event} to ${endpoint.url}: ${response.status}`);
    }

    return {
      success,
      eventId: payload.event_id,
      endpoint: endpoint.url,
      statusCode: response.status,
      error: success ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await updateDeliveryRecord(
      deliveryId,
      false,
      attemptCount,
      undefined,
      undefined,
      errorMessage
    );

    console.error(`[Webhook] Error delivering ${payload.event} to ${endpoint.url}:`, errorMessage);

    return {
      success: false,
      eventId: payload.event_id,
      endpoint: endpoint.url,
      error: errorMessage,
    };
  }
}

/**
 * Emit webhook event to all subscribed endpoints
 */
export async function emitWebhookEvent(
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult[]> {
  const subscribers = eventSubscriptions[eventType] || [];
  const results: WebhookDeliveryResult[] = [];

  if (subscribers.length === 0) {
    console.log(`[Webhook] No subscribers for event ${eventType}`);
    return results;
  }

  const eventId = generateEventId();
  const timestamp = new Date().toISOString();

  const payload: WebhookPayload = {
    event: eventType,
    event_id: eventId,
    timestamp,
    data,
  };

  console.log(`[Webhook] Emitting ${eventType} (${eventId}) to ${subscribers.length} subscriber(s)`);

  for (const subscriberKey of subscribers) {
    const endpoint = webhookEndpoints[subscriberKey];
    
    if (!endpoint || !endpoint.enabled) {
      console.log(`[Webhook] Skipping disabled endpoint: ${subscriberKey}`);
      continue;
    }

    // Create delivery record
    const deliveryId = await createDeliveryRecord(
      eventType,
      eventId,
      payload,
      endpoint.url
    );

    if (!deliveryId) {
      results.push({
        success: false,
        eventId,
        endpoint: endpoint.url,
        error: 'Failed to create delivery record',
      });
      continue;
    }

    // Send webhook (first attempt)
    const result = await sendWebhook(endpoint, payload, deliveryId, 1);
    results.push(result);
  }

  return results;
}

/**
 * Retry pending webhook deliveries
 * This should be called by a cron job or background worker
 */
export async function retryPendingWebhooks(): Promise<void> {
  const now = new Date().toISOString();

  // Get pending deliveries that are due for retry
  const { data: pendingDeliveries, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*')
    .eq('status', 'pending')
    .lt('next_retry_at', now)
    .lt('attempt_count', webhookSettings.maxRetries)
    .limit(100);

  if (error) {
    console.error('[Webhook] Failed to fetch pending deliveries:', error);
    return;
  }

  if (!pendingDeliveries || pendingDeliveries.length === 0) {
    return;
  }

  console.log(`[Webhook] Retrying ${pendingDeliveries.length} pending deliveries`);

  for (const delivery of pendingDeliveries) {
    // Find the endpoint config
    const endpointKey = Object.keys(webhookEndpoints).find(
      key => webhookEndpoints[key].url === delivery.target_url
    );

    if (!endpointKey) {
      // Mark as failed if endpoint no longer exists
      await updateDeliveryRecord(
        delivery.id,
        false,
        delivery.attempt_count + 1,
        undefined,
        undefined,
        'Endpoint configuration not found'
      );
      continue;
    }

    const endpoint = webhookEndpoints[endpointKey];
    
    if (!endpoint.enabled) {
      continue;
    }

    await sendWebhook(
      endpoint,
      delivery.payload as WebhookPayload,
      delivery.id,
      delivery.attempt_count + 1
    );
  }
}

/**
 * Get webhook delivery status
 */
export async function getWebhookDeliveryStatus(eventId: string): Promise<unknown> {
  const { data, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    throw error;
  }

  return data;
}
