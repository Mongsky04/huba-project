/**
 * Webhook Controller
 * Handles incoming webhooks from KGiTON Core API
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ApiResponse } from '../types';
import { 
  extractWebhookHeaders, 
  verifyWebhook 
} from '../utils/webhookSignature';

// Webhook event types (must match Core API)
enum WebhookEventType {
  USER_VERIFIED = 'user.verified',
  USER_DELETED = 'user.deleted',
  LICENSE_ASSIGNED = 'license.assigned',
}

// Store processed event IDs for idempotency (in production, use Redis or DB)
const processedEvents = new Set<string>();

/**
 * Main webhook handler
 * Receives webhooks from KGiTON Core API
 */
export const handleKgitonWebhook = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const webhookSecret = process.env.KGITON_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] KGITON_WEBHOOK_SECRET not configured');
      res.status(500).json({
        success: false,
        message: 'Webhook secret not configured'
      });
      return;
    }

    // Extract and verify headers
    const headers = extractWebhookHeaders(req.headers as Record<string, string | string[] | undefined>);
    
    if (!headers) {
      res.status(400).json({
        success: false,
        message: 'Missing required webhook headers'
      });
      return;
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Verify webhook signature
    const verification = verifyWebhook(rawBody, headers, webhookSecret);
    
    if (!verification.valid) {
      console.warn(`[Webhook] Verification failed: ${verification.error}`);
      res.status(401).json({
        success: false,
        message: verification.error || 'Webhook verification failed'
      });
      return;
    }

    // Check idempotency (prevent duplicate processing)
    if (processedEvents.has(headers.eventId)) {
      console.log(`[Webhook] Event ${headers.eventId} already processed, skipping`);
      res.json({
        success: true,
        message: 'Event already processed'
      });
      return;
    }

    // Parse webhook payload
    const { event, event_id, data } = req.body;

    console.log(`[Webhook] Received event: ${event} (${event_id})`);

    // Route to appropriate handler
    let result: { success: boolean; message: string };

    switch (event) {
      case WebhookEventType.USER_VERIFIED:
        result = await handleUserVerified(data);
        break;
      
      case WebhookEventType.USER_DELETED:
        result = await handleUserDeleted(data);
        break;
      
      case WebhookEventType.LICENSE_ASSIGNED:
        result = await handleLicenseAssigned(data);
        break;
      
      default:
        console.warn(`[Webhook] Unknown event type: ${event}`);
        result = { success: true, message: 'Unknown event type, ignored' };
    }

    // Mark event as processed
    processedEvents.add(headers.eventId);

    // Cleanup old event IDs (keep last 10000)
    if (processedEvents.size > 10000) {
      const keysToDelete = Array.from(processedEvents).slice(0, 1000);
      keysToDelete.forEach(key => processedEvents.delete(key));
    }

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      // Return 200 even for processing errors to prevent retries for permanent failures
      // Use 500 only for transient errors that should be retried
      res.json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    // Return 500 for transient errors to trigger retry
    res.status(500).json({
      success: false,
      message: 'Internal error processing webhook'
    });
  }
};

/**
 * Handle user.verified event
 * Creates extended profile from registration data
 * ALWAYS creates a profile entry for the user, even if no extended data is provided
 */
async function handleUserVerified(data: {
  user_id: string;
  email: string;
  name: string;
  extended_profile?: {
    entity_type?: string;
    company_name?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[Webhook] Processing user.verified for user: ${data.user_id}`);

    // Build profile data from extended_profile if provided
    const profileData: Record<string, string> = {};
    
    if (data.extended_profile) {
      const { entity_type, company_name, phone_number, address, city, state, postal_code, country } = data.extended_profile;
      
      // Filter out empty values
      if (entity_type?.trim()) profileData.entity_type = entity_type.trim();
      if (company_name?.trim()) profileData.company_name = company_name.trim();
      if (phone_number?.trim()) profileData.phone_number = phone_number.trim();
      if (address?.trim()) profileData.address = address.trim();
      if (city?.trim()) profileData.city = city.trim();
      if (state?.trim()) profileData.state = state.trim();
      if (postal_code?.trim()) profileData.postal_code = postal_code.trim();
      if (country?.trim()) profileData.country = country.trim();
    }

    // Check if profile already exists (use admin client to bypass RLS)
    const { data: existingProfile } = await supabaseAdmin
      .from('extended_user_profiles')
      .select('id')
      .eq('user_id', data.user_id)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile if we have data (use admin client to bypass RLS)
      if (Object.keys(profileData).length > 0) {
        result = await supabaseAdmin
          .from('extended_user_profiles')
          .update({ ...profileData, updated_at: new Date().toISOString() })
          .eq('user_id', data.user_id)
          .select()
          .single();
      } else {
        console.log(`[Webhook] Profile already exists for user ${data.user_id}, no new data to update`);
        return { success: true, message: 'Profile already exists' };
      }
    } else {
      // ALWAYS create new profile entry for the user (use admin client to bypass RLS)
      // Even if no extended data, we create the profile with just user_id
      result = await supabaseAdmin
        .from('extended_user_profiles')
        .insert({ ...profileData, user_id: data.user_id })
        .select()
        .single();
    }

    if (result.error) {
      console.error('[Webhook] Failed to save profile:', result.error);
      throw result.error;
    }

    const hasExtendedData = Object.keys(profileData).length > 0;
    console.log(`[Webhook] Extended profile created for user ${data.user_id}${hasExtendedData ? ':' : ' (empty profile)'}`, 
      hasExtendedData ? profileData : '');

    return { 
      success: true, 
      message: existingProfile ? 'Profile updated' : 'Profile created' 
    };
  } catch (error) {
    console.error('[Webhook] Error handling user.verified:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to process user verified event'
    };
  }
}

/**
 * Handle user.deleted event
 * Cleans up user data from Huba database
 */
async function handleUserDeleted(data: {
  user_id: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[Webhook] Processing user.deleted for user: ${data.user_id}`);

    // Delete extended profile (use admin client to bypass RLS)
    const { error: profileError } = await supabaseAdmin
      .from('extended_user_profiles')
      .delete()
      .eq('user_id', data.user_id);

    if (profileError) {
      console.warn('[Webhook] Error deleting profile:', profileError);
    }

    // Delete cart items (use admin client to bypass RLS)
    const { error: cartError } = await supabaseAdmin
      .from('cart')
      .delete()
      .eq('user_id', data.user_id);

    if (cartError) {
      console.warn('[Webhook] Error deleting cart:', cartError);
    }

    // Note: We keep transactions for audit purposes, just remove user reference
    // Or you could anonymize them instead of deleting

    console.log(`[Webhook] User data cleaned up for: ${data.user_id}`);

    return { success: true, message: 'User data cleaned up' };
  } catch (error) {
    console.error('[Webhook] Error handling user.deleted:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to process user deleted event'
    };
  }
}

/**
 * Handle license.assigned event
 * Could be used to initialize license-specific data
 */
async function handleLicenseAssigned(data: {
  user_id: string;
  license_key: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`[Webhook] Processing license.assigned: ${data.license_key} to user ${data.user_id}`);

    // You could initialize license-specific data here
    // For now, just acknowledge the event

    return { success: true, message: 'License assignment acknowledged' };
  } catch (error) {
    console.error('[Webhook] Error handling license.assigned:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to process license assigned event'
    };
  }
}
