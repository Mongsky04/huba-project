/**
 * Winpay Payment Gateway Implementation
 *
 * Implements the IPaymentGateway interface for Winpay.
 * Supports both SNAP API (Virtual Account) and Checkout Page.
 */

import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import {
  BasePaymentGateway,
  PaymentGatewayProvider,
  PaymentMethodInfo,
  PaymentMethodType,
  VirtualAccountBank,
  EWalletType,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
  PaymentCallbackData,
  PaymentStatus,
} from '../paymentGatewayInterface';

// ============================================
// WINPAY CONFIGURATION
// ============================================

interface WinpayConfig {
  // SNAP API Configuration
  snapBaseUrl: string;
  partnerId: string;
  privateKey: string;

  // Checkout Page Configuration
  checkoutBaseUrl: string;
  checkoutKey: string;
  checkoutSecret: string;

  // Common
  isProduction: boolean;
}

const getWinpayConfig = (): WinpayConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  let privateKey = '';
  if (process.env.WINPAY_PRIVATE_KEY) {
    privateKey = process.env.WINPAY_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else if (process.env.WINPAY_PRIVATE_KEY_PATH) {
    const fs = require('fs');
    privateKey = fs.readFileSync(process.env.WINPAY_PRIVATE_KEY_PATH, 'utf8');
  }

  return {
    snapBaseUrl: isProduction
      ? 'https://snap.winpay.id'
      : 'https://sandbox-api.bmstaging.id/snap',
    partnerId: process.env.WINPAY_PARTNER_ID || '',
    privateKey,

    checkoutBaseUrl: isProduction
      ? 'https://checkout.winpay.id'
      : 'https://checkout.bmstaging.id',
    checkoutKey: process.env.WINPAY_CHECKOUT_KEY || '',
    checkoutSecret: process.env.WINPAY_CHECKOUT_SECRET || '',

    isProduction,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getTimestamp = (): string => {
  const now = new Date();
  const jakartaOffset = 7 * 60;
  const jakartaTime = new Date(now.getTime() + jakartaOffset * 60000);
  return jakartaTime.toISOString().slice(0, 19) + '+07:00';
};

const generateExternalId = (): string => `${Date.now()}`;

/**
 * Generate SNAP API Signature using RSA-SHA256
 */
const generateSnapSignature = (
  httpMethod: string,
  endpointUrl: string,
  requestBody: object,
  timestamp: string,
  privateKey: string
): string => {
  const minifiedBody = JSON.stringify(requestBody);
  const hashedBody = crypto
    .createHash('sha256')
    .update(minifiedBody)
    .digest('hex')
    .toLowerCase();

  const stringToSign = `${httpMethod}:${endpointUrl}:${hashedBody}:${timestamp}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringToSign);
  return sign.sign(privateKey, 'base64');
};

/**
 * Generate Checkout Page Signature using HMAC-SHA256
 */
const generateCheckoutSignature = (
  timestamp: string,
  secretKey: string
): string => {
  return crypto.createHmac('sha256', secretKey).update(timestamp).digest('hex');
};

// ============================================
// WINPAY GATEWAY IMPLEMENTATION
// ============================================

export class WinpayGateway extends BasePaymentGateway {
  readonly provider = PaymentGatewayProvider.WINPAY;
  private config: WinpayConfig;

  constructor() {
    super();
    this.config = getWinpayConfig();
  }

  protected mapBankCode(bank: VirtualAccountBank): string {
    const mapping: Record<VirtualAccountBank, string> = {
      [VirtualAccountBank.BRI]: 'BRI',
      [VirtualAccountBank.BNI]: 'BNI',
      [VirtualAccountBank.BCA]: 'BCA',
      [VirtualAccountBank.MANDIRI]: 'MANDIRI',
      [VirtualAccountBank.PERMATA]: 'PERMATA',
      [VirtualAccountBank.BSI]: 'BSI',
      [VirtualAccountBank.CIMB]: 'CIMB',
      [VirtualAccountBank.SINARMAS]: 'SINARMAS',
      [VirtualAccountBank.MUAMALAT]: 'MUAMALAT',
      [VirtualAccountBank.INDOMARET]: 'INDOMARET',
      [VirtualAccountBank.ALFAMART]: 'ALFAMART',
    };
    return mapping[bank] || bank.toUpperCase();
  }

  protected mapEWalletCode(ewallet: EWalletType): string {
    const mapping: Record<EWalletType, string> = {
      [EWalletType.OVO]: 'OVO',
      [EWalletType.DANA]: 'DANA',
      [EWalletType.GOPAY]: 'GOPAY',
      [EWalletType.SHOPEEPAY]: 'SPAY',
      [EWalletType.LINKAJA]: 'LINKAJA',
    };
    return mapping[ewallet] || ewallet.toUpperCase();
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]> {
    return [
      {
        id: 'checkout_page',
        name: 'Winpay Checkout Page',
        description: 'All payment methods in one page (VA, QRIS, eWallet)',
        type: PaymentMethodType.CHECKOUT_PAGE,
        enabled: true,
      },
      {
        id: 'va_bri',
        name: 'Virtual Account BRI',
        description: 'Bank Rakyat Indonesia',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.BRI,
        enabled: true,
      },
      {
        id: 'va_bni',
        name: 'Virtual Account BNI',
        description: 'Bank Negara Indonesia',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.BNI,
        enabled: true,
      },
      {
        id: 'va_bca',
        name: 'Virtual Account BCA',
        description: 'Bank Central Asia',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.BCA,
        enabled: true,
      },
      {
        id: 'va_mandiri',
        name: 'Virtual Account Mandiri',
        description: 'Bank Mandiri',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.MANDIRI,
        enabled: true,
      },
      {
        id: 'va_permata',
        name: 'Virtual Account Permata',
        description: 'Bank Permata',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.PERMATA,
        enabled: true,
      },
      {
        id: 'va_bsi',
        name: 'Virtual Account BSI',
        description: 'Bank Syariah Indonesia',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.BSI,
        enabled: true,
      },
      {
        id: 'va_cimb',
        name: 'Virtual Account CIMB',
        description: 'Bank CIMB Niaga',
        type: PaymentMethodType.VIRTUAL_ACCOUNT,
        bank: VirtualAccountBank.CIMB,
        enabled: true,
      },
    ];
  }

  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (request.methodType === PaymentMethodType.CHECKOUT_PAGE) {
      return this.createCheckoutPayment(request);
    } else if (request.methodType === PaymentMethodType.VIRTUAL_ACCOUNT) {
      return this.createVAPayment(request);
    }

    return {
      success: false,
      error: `Unsupported payment method type: ${request.methodType}`,
    };
  }

  private async createCheckoutPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const timestamp = getTimestamp();
    const signature = generateCheckoutSignature(
      timestamp,
      this.config.checkoutSecret
    );

    // Build back_url with transaction_id for redirect after payment
    const baseBackUrl = request.redirectUrl || process.env.WINPAY_BACK_URL || 'http://localhost:3000/payment/complete';
    const backUrlWithParams = `${baseBackUrl}?transaction_id=${request.transactionId}`;

    const body = {
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
      },
      invoice: {
        ref: request.transactionId,
        products: request.items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
        })),
      },
      back_url: backUrlWithParams,
      interval: request.expiryMinutes || 120,
    };

    try {
      const response = await axios.post(
        `${this.config.checkoutBaseUrl}/api/create`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Winpay-Timestamp': timestamp,
            'X-Winpay-Signature': signature,
            'X-Winpay-Key': this.config.checkoutKey,
          },
        }
      );

      const data = response.data;

      if (data.responseCode === '2010300' && data.responseData) {
        return {
          success: true,
          gatewayTransactionId: data.responseData.id,
          paymentUrl: data.responseData.redirect_url,
          expiresAt: new Date(
            Date.now() + (request.expiryMinutes || 120) * 60 * 1000
          ).toISOString(),
          rawResponse: data,
        };
      }

      return {
        success: false,
        error: data.responseMessage || 'Failed to create checkout',
        rawResponse: data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        rawResponse: axiosError.response?.data,
      };
    }
  }

  private async createVAPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!request.bank) {
      return {
        success: false,
        error: 'Bank is required for VA payment',
      };
    }

    const endpoint = '/v1.0/transfer-va/create-va';
    const timestamp = getTimestamp();
    const externalId = generateExternalId();
    const expiryMinutes = request.expiryMinutes || 1440;
    const expiredDate = this.generateExpiryDate(expiryMinutes);

    const body = {
      virtualAccountName: request.customer.name.substring(0, 24),
      trxId: request.transactionId,
      totalAmount: {
        value: this.formatAmount(request.amount),
        currency: 'IDR',
      },
      virtualAccountTrxType: 'c', // ONE_OFF
      expiredDate: expiredDate.toISOString().slice(0, 19) + '+07:00',
      additionalInfo: {
        channel: this.mapBankCode(request.bank),
      },
    };

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      body,
      timestamp,
      this.config.privateKey
    );

    try {
      const response = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-TIMESTAMP': timestamp,
            'X-SIGNATURE': signature,
            'X-PARTNER-ID': this.config.partnerId,
            'X-EXTERNAL-ID': externalId,
            'CHANNEL-ID': 'WEB',
          },
        }
      );

      const data = response.data;

      if (data.responseCode === '2002700' && data.virtualAccountData) {
        return {
          success: true,
          gatewayTransactionId: data.virtualAccountData.additionalInfo.contractId,
          virtualAccount: {
            number: data.virtualAccountData.virtualAccountNo.trim(),
            name: data.virtualAccountData.virtualAccountName,
            bank: this.mapBankCode(request.bank),
          },
          expiresAt: data.virtualAccountData.expiredDate,
          rawResponse: data,
        };
      }

      return {
        success: false,
        error: data.responseMessage || 'Failed to create VA',
        rawResponse: data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        rawResponse: axiosError.response?.data,
      };
    }
  }

  async checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    const additionalData = request.additionalData || {};
    const { virtualAccountNo, contractId, channel } = additionalData;

    if (!virtualAccountNo || !contractId || !channel) {
      return {
        success: false,
        error: 'Missing required data for status check',
        status: PaymentStatus.PENDING,
      };
    }

    const endpoint = '/v1.0/transfer-va/status';
    const timestamp = getTimestamp();
    const externalId = generateExternalId();

    const body = {
      virtualAccountNo,
      additionalInfo: {
        contractId,
        channel,
        trxId: request.transactionId,
      },
    };

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      body,
      timestamp,
      this.config.privateKey
    );

    try {
      const response = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-TIMESTAMP': timestamp,
            'X-SIGNATURE': signature,
            'X-PARTNER-ID': this.config.partnerId,
            'X-EXTERNAL-ID': externalId,
            'CHANNEL-ID': 'WEB',
          },
        }
      );

      const data = response.data;

      if (data.responseCode === '2002600' && data.virtualAccountData) {
        const isPaid = data.virtualAccountData.paymentFlagStatus === '00';
        return {
          success: true,
          status: isPaid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
          paidAmount: isPaid
            ? parseFloat(data.virtualAccountData.totalAmount.value)
            : undefined,
          paidAt: data.virtualAccountData.transactionDate,
          referenceNumber: data.virtualAccountData.referenceNo,
          rawResponse: data,
        };
      }

      return {
        success: false,
        error: data.responseMessage,
        status: PaymentStatus.PENDING,
        rawResponse: data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        status: PaymentStatus.PENDING,
        rawResponse: axiosError.response?.data,
      };
    }
  }

  async cancelPayment(
    request: CancelPaymentRequest
  ): Promise<CancelPaymentResponse> {
    const additionalData = request.additionalData || {};
    
    // Handle checkout page cancellation
    if (additionalData.isCheckout) {
      return this.cancelCheckoutInvoice(request.transactionId);
    }

    // Handle VA cancellation
    const { virtualAccountNo, contractId, channel } = additionalData;
    if (!virtualAccountNo || !contractId || !channel) {
      return {
        success: false,
        error: 'Missing required data for cancellation',
      };
    }

    const endpoint = '/v1.0/transfer-va/delete-va';
    const timestamp = getTimestamp();
    const externalId = generateExternalId();

    const body = {
      virtualAccountNo,
      trxId: request.transactionId,
      additionalInfo: {
        contractId,
        channel,
      },
    };

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      body,
      timestamp,
      this.config.privateKey
    );

    try {
      const response = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-TIMESTAMP': timestamp,
            'X-SIGNATURE': signature,
            'X-PARTNER-ID': this.config.partnerId,
            'X-EXTERNAL-ID': externalId,
            'CHANNEL-ID': 'WEB',
          },
        }
      );

      return {
        success: response.data.responseCode === '2003100',
        error:
          response.data.responseCode !== '2003100'
            ? response.data.responseMessage
            : undefined,
        rawResponse: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        rawResponse: axiosError.response?.data,
      };
    }
  }

  private async cancelCheckoutInvoice(
    ref: string
  ): Promise<CancelPaymentResponse> {
    const timestamp = getTimestamp();
    const signature = generateCheckoutSignature(
      timestamp,
      this.config.checkoutSecret
    );

    try {
      const response = await axios.delete(
        `${this.config.checkoutBaseUrl}/api/invoice/ref/${ref}`,
        {
          headers: {
            'X-Winpay-Timestamp': timestamp,
            'X-Winpay-Signature': signature,
            'X-Winpay-Key': this.config.checkoutKey,
          },
        }
      );

      return {
        success: response.data?.responseCode?.startsWith('200'),
        rawResponse: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        success: false,
        error: axiosError.message,
        rawResponse: axiosError.response?.data,
      };
    }
  }

  async parseCallback(
    _headers: Record<string, string>,
    body: any
  ): Promise<PaymentCallbackData | null> {
    // Detect callback type based on body structure
    if (body.trxId && body.paidAmount) {
      // SNAP VA Callback
      return {
        transactionId: body.trxId,
        gatewayTransactionId: body.additionalInfo?.contractId || body.paymentRequestId,
        status: PaymentStatus.SUCCESS,
        amount: parseFloat(body.paidAmount.value),
        paymentMethod: 'virtual_account',
        channel: body.additionalInfo?.channel,
        referenceNumber: String(body.referenceNo),
        paidAt: body.trxDateTime,
        rawData: body,
      };
    } else if (body.ref && body.amount !== undefined) {
      // Checkout Page Callback
      return {
        transactionId: body.ref || body.invoice?.ref,
        gatewayTransactionId: body.uuid,
        status: PaymentStatus.SUCCESS,
        amount: body.amount,
        paymentMethod: 'checkout_page',
        channel: body.channel,
        fee: body.fee,
        netAmount: body.nett_amount,
        rawData: body,
      };
    }

    return null;
  }

  async verifyCallbackSignature(
    _headers: Record<string, string>,
    _body: any
  ): Promise<boolean> {
    // For SNAP VA callback, signature verification would require public key
    // For Checkout callback, no signature verification is documented
    // In production, you should implement proper verification
    
    // For now, we trust the callback if it comes from expected structure
    return true;
  }

  getCallbackSuccessResponse(): any {
    // Different responses for different callback types
    // VA expects JSON, Checkout expects string "ACCEPTED"
    // The controller should handle this based on the endpoint
    return {
      responseCode: '2002500',
      responseMessage: 'Successful',
    };
  }
}
