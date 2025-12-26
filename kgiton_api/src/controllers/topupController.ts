import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import { topupRequestSchema, topupWithPaymentMethodSchema } from '../validators';
import { AuthRequest } from '../middlewares/auth';
import { TransactionStatus, PaymentMethod } from '../types';
import {
  PaymentService,
  PaymentMethodType,
  VirtualAccountBank,
} from '../services/payment';

// Create payment service instance (uses factory internally)
const paymentService = new PaymentService();

export const requestTopup = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Support both old and new schema
    const schema = req.body.payment_method ? topupWithPaymentMethodSchema : topupRequestSchema;
    const { error: validationError } = schema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { 
      token_count, 
      license_key, 
      payment_method = PaymentMethod.CHECKOUT_PAGE,
      customer_phone 
    } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    // Get user details for payment
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User not found');
    }

    // Get license key details
    const { data: licenseData, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key', license_key)
      .single();

    if (licenseError || !licenseData) {
      throw new AppError(404, 'Invalid license key');
    }

    // Check if license is assigned to this user
    if (licenseData.assigned_to !== userId) {
      throw new AppError(403, 'This license key is not assigned to your account');
    }

    if (token_count <= 0) {
      throw new AppError(400, 'Token count must be greater than 0');
    }

    // Calculate total amount to pay
    const totalAmount = token_count * licenseData.price_per_token;

    // Set expiry time (24 hours for VA, 2 hours for checkout page)
    const isVA = payment_method.startsWith('va_');
    const expiryMinutes = isVA ? 1440 : 120;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Create transaction record with PENDING status
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        license_key_id: licenseData.id,
        amount: totalAmount,
        tokens_added: token_count,
        status: TransactionStatus.PENDING,
        payment_method: payment_method,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
      throw new AppError(500, 'Failed to create transaction');
    }

    // Check if payment gateway is enabled
    const paymentGatewayEnabled = process.env.PAYMENT_GATEWAY_ENABLED !== 'false';

    if (!paymentGatewayEnabled || payment_method === PaymentMethod.MANUAL) {
      // Return manual payment response (legacy mode)
      const paymentUrl = `https://payment-gateway.example.com/pay/${transactionData.id}`;

      res.status(200).json({
        success: true,
        message: 'Top-up request created. Please complete the payment manually.',
        data: {
          transaction_id: transactionData.id,
          license_key: licenseData.key,
          tokens_requested: token_count,
          amount_to_pay: totalAmount,
          price_per_token: licenseData.price_per_token,
          status: 'PENDING',
          payment_method: 'manual',
          payment_url: paymentUrl,
          expires_at: expiresAt.toISOString(),
        },
      });
      return;
    }

    // Create payment with Payment Gateway
    // Phone number is optional - use from request body or default placeholder
    const customerPhone = customer_phone || '08123456789';
    
    // Map payment method to type and bank
    let methodType = PaymentMethodType.CHECKOUT_PAGE;
    let bank: VirtualAccountBank | undefined;
    
    if (payment_method.startsWith('va_')) {
      methodType = PaymentMethodType.VIRTUAL_ACCOUNT;
      const bankMap: Record<string, VirtualAccountBank> = {
        'va_bri': VirtualAccountBank.BRI,
        'va_bni': VirtualAccountBank.BNI,
        'va_bca': VirtualAccountBank.BCA,
        'va_mandiri': VirtualAccountBank.MANDIRI,
        'va_permata': VirtualAccountBank.PERMATA,
        'va_bsi': VirtualAccountBank.BSI,
        'va_cimb': VirtualAccountBank.CIMB,
      };
      bank = bankMap[payment_method];
    }
    
    const paymentResult = await paymentService.createPayment({
      transactionId: transactionData.id,
      amount: totalAmount,
      methodType: methodType,
      bank: bank,
      customer: {
        name: userData.name,
        email: userData.email,
        phone: customerPhone,
      },
      items: [
        {
          id: licenseData.key,
          name: `Token Top-up (${token_count} tokens)`,
          price: totalAmount,
          quantity: 1,
        },
      ],
      expiryMinutes: expiryMinutes,
      redirectUrl: process.env.PAYMENT_REDIRECT_URL,
      metadata: {
        licenseKey: licenseData.key,
        tokenCount: token_count,
      },
    });

    if (!paymentResult.success) {
      // Update transaction as failed
      await supabaseAdmin
        .from('transactions')
        .update({
          status: TransactionStatus.FAILED,
          payment_reference: `PAYMENT_ERROR: ${paymentResult.error}`,
        })
        .eq('id', transactionData.id);

      throw new AppError(500, `Payment gateway error: ${paymentResult.error}`);
    }

    // Update transaction with payment gateway details
    const updateData: Record<string, any> = {
      expires_at: paymentResult.expiresAt,
      gateway_provider: paymentService.getProvider(),
    };

    if (paymentResult.gatewayTransactionId) {
      updateData.gateway_transaction_id = paymentResult.gatewayTransactionId;
    }
    if (paymentResult.virtualAccount?.number) {
      updateData.gateway_va_number = paymentResult.virtualAccount.number;
      updateData.gateway_channel = paymentResult.virtualAccount.bank;
    }
    if (paymentResult.paymentUrl) {
      updateData.gateway_payment_url = paymentResult.paymentUrl;
    }

    await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', transactionData.id);

    // Prepare response based on payment method
    const responseData: Record<string, any> = {
      transaction_id: transactionData.id,
      license_key: licenseData.key,
      tokens_requested: token_count,
      amount_to_pay: totalAmount,
      price_per_token: licenseData.price_per_token,
      status: 'PENDING',
      payment_method: payment_method,
      gateway_provider: paymentService.getProvider(),
      expires_at: paymentResult.expiresAt,
    };

    if (paymentResult.paymentUrl) {
      // Checkout Page method
      responseData.payment_url = paymentResult.paymentUrl;
      responseData.gateway_transaction_id = paymentResult.gatewayTransactionId;
    } else if (paymentResult.virtualAccount?.number) {
      // Virtual Account method
      responseData.virtual_account = {
        number: paymentResult.virtualAccount.number,
        name: paymentResult.virtualAccount.name,
        bank: paymentResult.virtualAccount.bank,
      };
      responseData.gateway_transaction_id = paymentResult.gatewayTransactionId;
    } else if (paymentResult.qris?.qrString) {
      // QRIS method
      responseData.qris = {
        qr_string: paymentResult.qris.qrString,
        qr_image_url: paymentResult.qris.qrImageUrl,
      };
      responseData.gateway_transaction_id = paymentResult.gatewayTransactionId;
    } else if (paymentResult.ewallet?.deepLinkUrl) {
      // eWallet method
      responseData.ewallet = {
        type: paymentResult.ewallet.type,
        deeplink_url: paymentResult.ewallet.deepLinkUrl,
        qr_string: paymentResult.ewallet.qrString,
      };
      responseData.gateway_transaction_id = paymentResult.gatewayTransactionId;
    } else if (paymentResult.manualPayment) {
      // Manual payment method
      responseData.manual_payment = {
        bank_name: paymentResult.manualPayment.bankName,
        account_number: paymentResult.manualPayment.accountNumber,
        account_name: paymentResult.manualPayment.accountName,
        reference_code: paymentResult.manualPayment.referenceCode,
        instructions: paymentResult.manualPayment.instructions,
      };
    }

    res.status(200).json({
      success: true,
      message: 'Top-up request created. Please complete the payment.',
      data: responseData,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Top-up error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const getTransactionHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        tokens_added,
        status,
        payment_reference,
        payment_method,
        winpay_channel,
        winpay_va_number,
        expires_at,
        created_at,
        license_keys (
          key,
          price_per_token
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Transaction fetch error:', error);
      throw new AppError(500, 'Failed to fetch transaction history');
    }

    res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// Check transaction status
export const checkTransactionStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transaction_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!transaction_id) {
      throw new AppError(400, 'Transaction ID is required');
    }

    // Get transaction details
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        license_keys (
          key,
          price_per_token
        )
      `)
      .eq('id', transaction_id)
      .eq('user_id', userId)
      .single();

    if (transactionError || !transactionData) {
      throw new AppError(404, 'Transaction not found');
    }

    res.status(200).json({
      success: true,
      data: {
        transaction_id: transactionData.id,
        license_key: (transactionData.license_keys as any)?.key,
        amount: transactionData.amount,
        tokens_added: transactionData.tokens_added,
        status: transactionData.status,
        payment_reference: transactionData.payment_reference,
        created_at: transactionData.created_at,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Check transaction status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const getAllTransactions = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        tokens_added,
        status,
        payment_reference,
        payment_method,
        winpay_channel,
        winpay_va_number,
        expires_at,
        created_at,
        users (
          id,
          name,
          email
        ),
        license_keys (
          key,
          price_per_token
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch all transactions error:', error);
      throw new AppError(500, 'Failed to fetch transactions');
    }

    res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get all transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// Cancel pending transaction
export const cancelTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { transaction_id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!transaction_id) {
      throw new AppError(400, 'Transaction ID is required');
    }

    // Get transaction details
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('user_id', userId)
      .single();

    if (transactionError || !transactionData) {
      throw new AppError(404, 'Transaction not found');
    }

    // Only pending transactions can be cancelled
    if (transactionData.status !== TransactionStatus.PENDING) {
      throw new AppError(400, `Cannot cancel transaction with status: ${transactionData.status}`);
    }

    // Cancel payment on payment gateway if applicable
    const paymentGatewayEnabled = process.env.PAYMENT_GATEWAY_ENABLED !== 'false';
    
    if (paymentGatewayEnabled && transactionData.gateway_transaction_id) {
      // Cancel on payment gateway
      await paymentService.cancelPayment({
        transactionId: transactionData.id,
        gatewayTransactionId: transactionData.gateway_transaction_id,
        reason: 'User cancelled',
      });
    }

    // Update transaction status
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        status: TransactionStatus.CANCELLED,
        payment_reference: `CANCELLED-${Date.now()}`,
      })
      .eq('id', transaction_id);

    if (updateError) {
      throw new AppError(500, 'Failed to cancel transaction');
    }

    res.status(200).json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: {
        transaction_id: transactionData.id,
        status: 'CANCELLED',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Cancel transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// Get available payment methods
export const getPaymentMethods = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get payment methods from the current payment gateway
    const methods = await paymentService.getAvailablePaymentMethods();

    res.status(200).json({
      success: true,
      gateway_provider: paymentService.getProvider(),
      data: methods,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods',
    });
  }
};

/**
 * Public endpoint to check transaction status (no auth required)
 * Used by payment-complete page after redirect from payment gateway
 */
export const checkTransactionStatusPublic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { transaction_id } = req.params;

    if (!transaction_id) {
      res.status(400).json({
        success: false,
        error: 'Transaction ID is required',
      });
      return;
    }

    // Get transaction details (public - only returns minimal info)
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        tokens_added,
        status,
        created_at
      `)
      .eq('id', transaction_id)
      .single();

    if (transactionError || !transactionData) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        transaction_id: transactionData.id,
        amount: transactionData.amount,
        tokens_added: transactionData.tokens_added,
        tokens_requested: transactionData.tokens_added,
        status: transactionData.status,
        created_at: transactionData.created_at,
      },
    });
  } catch (error) {
    console.error('Check transaction status public error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
