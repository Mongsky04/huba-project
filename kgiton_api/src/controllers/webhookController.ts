import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import { TransactionStatus } from '../types';
import {
  PaymentService,
  PaymentStatus,
} from '../services/payment';
import {
  WinpayVACallbackPayload,
  WinpayCheckoutCallbackPayload,
} from '../services/winpayService';

// Create payment service instance
const paymentService = new PaymentService();

export const paymentWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { transaction_id, order_id, status } = req.body;

    // Verify webhook secret if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const receivedSecret = req.headers['x-webhook-secret'];
      if (receivedSecret !== webhookSecret) {
        throw new AppError(401, 'Invalid webhook secret');
      }
    }

    if (!transaction_id) {
      throw new AppError(400, 'Transaction ID is required');
    }

    // Get existing transaction
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        license_keys (
          id,
          key,
          token_balance,
          price_per_token,
          assigned_to
        ),
        users (
          id,
          email
        )
      `)
      .eq('id', transaction_id)
      .single();

    if (transactionError || !transactionData) {
      throw new AppError(404, 'Transaction not found');
    }

    // Check if transaction is already processed
    if (transactionData.status !== TransactionStatus.PENDING) {
      res.status(200).json({
        success: true,
        message: `Transaction already processed with status: ${transactionData.status}`,
        data: {
          transaction_id: transactionData.id,
          status: transactionData.status,
        },
      });
      return;
    }

    const licenseData = transactionData.license_keys as any;
    
    let newStatus: TransactionStatus = TransactionStatus.PENDING;

    // Only process successful payments
    if (status === 'success') {
      // Update license key token balance
      const { error: updateLicenseError } = await supabaseAdmin
        .from('license_keys')
        .update({
          token_balance: licenseData.token_balance + transactionData.tokens_added,
        })
        .eq('id', licenseData.id);

      if (updateLicenseError) {
        throw new AppError(500, 'Failed to update token balance');
      }

      newStatus = TransactionStatus.SUCCESS;
    } else if (status === 'failed') {
      newStatus = TransactionStatus.FAILED;
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: newStatus,
        payment_reference: order_id || `${status.toUpperCase()}-${Date.now()}`,
      })
      .eq('id', transaction_id);

    if (updateTransactionError) {
      throw new AppError(500, 'Failed to update transaction status');
    }

    res.status(200).json({
      success: true,
      message: status === 'success' ? 'Payment processed and tokens added' : 'Payment status updated',
      data: {
        transaction_id: transactionData.id,
        order_id: order_id || `${status.toUpperCase()}-${Date.now()}`,
        status: newStatus,
        tokens_added: status === 'success' ? transactionData.tokens_added : 0,
        new_balance: status === 'success' ? licenseData.token_balance + transactionData.tokens_added : licenseData.token_balance,
        license_key: licenseData.key,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Universal Payment Gateway Callback Handler
 * 
 * This endpoint handles callbacks from any payment gateway (Winpay, Xendit, Midtrans).
 * It uses the PaymentService abstraction to parse and verify callbacks.
 * 
 * Path: /api/webhook/payment/callback
 */
export const paymentGatewayCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const headers = Object.fromEntries(
      Object.entries(req.headers).map(([k, v]) => [k, String(v)])
    );

    console.log(`Payment Gateway Callback received [${paymentService.getProvider()}]:`, 
      JSON.stringify(req.body, null, 2));

    // Verify callback signature
    const isValid = await paymentService.verifyCallbackSignature(headers, req.body);
    if (!isValid) {
      console.error('Invalid callback signature');
      // Still return success response to prevent retries
      res.status(200).json(paymentService.getCallbackSuccessResponse());
      return;
    }

    // Parse callback data
    const callbackData = await paymentService.parseCallback(headers, req.body);
    if (!callbackData) {
      console.error('Failed to parse callback data');
      res.status(200).json(paymentService.getCallbackSuccessResponse());
      return;
    }

    const transactionId = callbackData.transactionId;

    // Get transaction from database
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        license_keys (
          id,
          key,
          token_balance,
          price_per_token,
          assigned_to
        ),
        users (
          id,
          email
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transactionData) {
      console.error('Transaction not found for callback:', transactionId);
      res.status(200).json(paymentService.getCallbackSuccessResponse());
      return;
    }

    // Check if already processed
    if (transactionData.status !== TransactionStatus.PENDING) {
      console.log(`Transaction ${transactionId} already processed: ${transactionData.status}`);
      res.status(200).json(paymentService.getCallbackSuccessResponse());
      return;
    }

    const licenseData = transactionData.license_keys as any;

    // Process based on payment status
    if (callbackData.status === PaymentStatus.SUCCESS) {
      // Verify amount matches (with small tolerance)
      if (callbackData.amount && Math.abs(callbackData.amount - transactionData.amount) > 1) {
        console.warn(`Amount mismatch: expected ${transactionData.amount}, got ${callbackData.amount}`);
      }

      // Update license key token balance
      const { error: updateLicenseError } = await supabaseAdmin
        .from('license_keys')
        .update({
          token_balance: licenseData.token_balance + transactionData.tokens_added,
        })
        .eq('id', licenseData.id);

      if (updateLicenseError) {
        console.error('Failed to update token balance:', updateLicenseError);
      }

      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({
          status: TransactionStatus.SUCCESS,
          payment_reference: `${paymentService.getProvider().toUpperCase()}-${callbackData.gatewayTransactionId || callbackData.transactionId}`,
          gateway_channel: callbackData.channel,
        })
        .eq('id', transactionId);

      console.log(`Payment successful: ${transactionId}, provider: ${paymentService.getProvider()}, tokens added: ${transactionData.tokens_added}`);

    } else if (callbackData.status === PaymentStatus.FAILED) {
      await supabaseAdmin
        .from('transactions')
        .update({
          status: TransactionStatus.FAILED,
          payment_reference: `FAILED-${callbackData.gatewayTransactionId || Date.now()}`,
        })
        .eq('id', transactionId);

      console.log(`Payment failed: ${transactionId}`);

    } else if (callbackData.status === PaymentStatus.EXPIRED) {
      await supabaseAdmin
        .from('transactions')
        .update({
          status: TransactionStatus.EXPIRED,
          payment_reference: `EXPIRED-${callbackData.gatewayTransactionId || Date.now()}`,
        })
        .eq('id', transactionId);

      console.log(`Payment expired: ${transactionId}`);

    } else if (callbackData.status === PaymentStatus.CANCELLED) {
      await supabaseAdmin
        .from('transactions')
        .update({
          status: TransactionStatus.CANCELLED,
          payment_reference: `CANCELLED-${callbackData.gatewayTransactionId || Date.now()}`,
        })
        .eq('id', transactionId);

      console.log(`Payment cancelled: ${transactionId}`);
    }

    // Return success response in the format expected by the payment gateway
    res.status(200).json(paymentService.getCallbackSuccessResponse());

  } catch (error) {
    console.error('Payment gateway callback error:', error);
    // Always return success to prevent gateway from retrying
    res.status(200).json(paymentService.getCallbackSuccessResponse());
  }
};

/**
 * Winpay SNAP API Virtual Account Payment Callback
 * 
 * This endpoint is called by Winpay when a VA payment is completed.
 * Path: /api/webhook/winpay/va (must be registered at Winpay dashboard)
 */
export const winpayVACallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payload = req.body as WinpayVACallbackPayload;

    console.log('Winpay VA Callback received:', JSON.stringify(payload, null, 2));

    // Extract transaction ID from trxId
    const transactionId = payload.trxId;

    if (!transactionId) {
      console.error('Missing trxId in VA callback');
      res.status(200).json({
        responseCode: '2002500',
        responseMessage: 'Successful',
      });
      return;
    }

    // Get transaction from database
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        license_keys (
          id,
          key,
          token_balance,
          price_per_token,
          assigned_to
        ),
        users (
          id,
          email
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transactionData) {
      console.error('Transaction not found for VA callback:', transactionId);
      // Still return success to Winpay to prevent retries
      res.status(200).json({
        responseCode: '2002500',
        responseMessage: 'Successful',
      });
      return;
    }

    // Check if already processed
    if (transactionData.status !== TransactionStatus.PENDING) {
      console.log(`Transaction ${transactionId} already processed: ${transactionData.status}`);
      res.status(200).json({
        responseCode: '2002500',
        responseMessage: 'Successful',
      });
      return;
    }

    const licenseData = transactionData.license_keys as any;
    const paidAmount = parseFloat(payload.paidAmount.value);

    // Verify amount matches (with small tolerance for rounding)
    if (Math.abs(paidAmount - transactionData.amount) > 1) {
      console.error(`Amount mismatch: expected ${transactionData.amount}, got ${paidAmount}`);
      // Still process but log the discrepancy
    }

    // Update license key token balance
    const { error: updateLicenseError } = await supabaseAdmin
      .from('license_keys')
      .update({
        token_balance: licenseData.token_balance + transactionData.tokens_added,
      })
      .eq('id', licenseData.id);

    if (updateLicenseError) {
      console.error('Failed to update token balance:', updateLicenseError);
      throw new AppError(500, 'Failed to update token balance');
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: TransactionStatus.SUCCESS,
        payment_reference: `WINPAY-VA-${payload.referenceNo}`,
      })
      .eq('id', transactionId);

    if (updateTransactionError) {
      console.error('Failed to update transaction:', updateTransactionError);
    }

    console.log(`VA Payment successful: ${transactionId}, tokens added: ${transactionData.tokens_added}`);

    // Return expected response format for Winpay
    res.status(200).json({
      responseCode: '2002500',
      responseMessage: 'Successful',
    });
  } catch (error) {
    console.error('Winpay VA callback error:', error);
    // Always return success to prevent Winpay from retrying
    res.status(200).json({
      responseCode: '2002500',
      responseMessage: 'Successful',
    });
  }
};

/**
 * Winpay Checkout Page Payment Callback
 * 
 * This endpoint is called by Winpay when a checkout page payment is completed.
 * Path: /api/webhook/winpay/checkout (must be registered at Winpay dashboard)
 * 
 * Note: Transaction ID is in invoice.ref, NOT in the top-level ref field!
 * - payload.ref = Winpay internal reference (e.g., "170793")
 * - payload.invoice.ref = Our transaction_id (UUID)
 */
export const winpayCheckoutCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payload = req.body as WinpayCheckoutCallbackPayload;

    console.log('Winpay Checkout Callback received:', JSON.stringify(payload, null, 2));

    // Extract transaction ID from invoice.ref (NOT payload.ref!)
    // payload.ref is Winpay's internal reference number
    // payload.invoice.ref is our transaction_id that we sent during checkout creation
    const transactionId = payload.invoice?.ref;

    if (!transactionId) {
      console.error('Missing invoice.ref in checkout callback. Payload:', payload);
      res.send('ACCEPTED');
      return;
    }

    console.log('Processing transaction:', transactionId);

    // Get transaction from database
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        license_keys (
          id,
          key,
          token_balance,
          price_per_token,
          assigned_to
        ),
        users (
          id,
          email
        )
      `)
      .eq('id', transactionId)
      .single();

    if (transactionError || !transactionData) {
      console.error('Transaction not found for checkout callback:', transactionId);
      // Return ACCEPTED to prevent retries
      res.send('ACCEPTED');
      return;
    }

    // Check if already processed
    if (transactionData.status !== TransactionStatus.PENDING) {
      console.log(`Transaction ${transactionId} already processed: ${transactionData.status}`);
      res.send('ACCEPTED');
      return;
    }

    const licenseData = transactionData.license_keys as any;
    const paidAmount = payload.amount;

    // Verify amount matches (with small tolerance)
    if (Math.abs(paidAmount - transactionData.amount) > 1) {
      console.error(`Amount mismatch: expected ${transactionData.amount}, got ${paidAmount}`);
    }

    // Update license key token balance
    const { error: updateLicenseError } = await supabaseAdmin
      .from('license_keys')
      .update({
        token_balance: licenseData.token_balance + transactionData.tokens_added,
      })
      .eq('id', licenseData.id);

    if (updateLicenseError) {
      console.error('Failed to update token balance:', updateLicenseError);
      throw new AppError(500, 'Failed to update token balance');
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: TransactionStatus.SUCCESS,
        payment_reference: `WINPAY-CHECKOUT-${payload.uuid}`,
        winpay_channel: payload.channel,
      })
      .eq('id', transactionId);

    if (updateTransactionError) {
      console.error('Failed to update transaction:', updateTransactionError);
    }

    console.log(`Checkout Payment successful: ${transactionId}, channel: ${payload.channel}, tokens added: ${transactionData.tokens_added}`);

    // Return expected response for Winpay Checkout
    res.send('ACCEPTED');
  } catch (error) {
    console.error('Winpay checkout callback error:', error);
    // Always return ACCEPTED to prevent retries
    res.send('ACCEPTED');
  }
};
