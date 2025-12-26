import crypto from 'crypto';
import axios, { AxiosError, AxiosResponse } from 'axios';

// ============================================
// WINPAY CONFIGURATION
// ============================================

export interface WinpayConfig {
  // SNAP API Configuration (for VA & eWallet)
  snapBaseUrl: string;
  partnerId: string; // X-PARTNER-ID
  privateKeyPath?: string;
  privateKeyContent?: string;

  // Checkout Page Configuration
  checkoutBaseUrl: string;
  checkoutKey: string; // X-Winpay-Key
  checkoutSecretKey: string;

  // Common
  isProduction: boolean;
}

export const getWinpayConfig = (): WinpayConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // SNAP API
    snapBaseUrl: isProduction
      ? 'https://snap.winpay.id'
      : 'https://sandbox-api.bmstaging.id/snap',
    partnerId: process.env.WINPAY_PARTNER_ID || '',
    privateKeyPath: process.env.WINPAY_PRIVATE_KEY_PATH,
    privateKeyContent: process.env.WINPAY_PRIVATE_KEY,

    // Checkout Page
    checkoutBaseUrl: isProduction
      ? 'https://checkout.winpay.id'
      : 'https://checkout.bmstaging.id',
    checkoutKey: process.env.WINPAY_CHECKOUT_KEY || '',
    checkoutSecretKey: process.env.WINPAY_CHECKOUT_SECRET || '',

    isProduction,
  };
};

// ============================================
// TYPES - SNAP API (Virtual Account)
// ============================================

export enum WinpayVAChannel {
  BRI = 'BRI',
  BNI = 'BNI',
  BCA = 'BCA',
  MANDIRI = 'MANDIRI',
  PERMATA = 'PERMATA',
  BSI = 'BSI',
  CIMB = 'CIMB',
  SINARMAS = 'SINARMAS',
  BNC = 'BNC',
  MAYBANK = 'MAYBANK',
  MUAMALAT = 'MUAMALAT',
  INDOMARET = 'INDOMARET',
  ALFAMART = 'ALFAMART',
}

export enum WinpayVAType {
  ONE_OFF = 'c', // Single use VA
  OPEN_RECURRING = 'o', // Open amount recurring
  CLOSE_RECURRING = 'r', // Fixed amount recurring
}

export interface WinpayCreateVARequest {
  customerNo?: string;
  virtualAccountName: string;
  trxId: string;
  totalAmount: {
    value: string; // Format: "10000.00"
    currency: 'IDR';
  };
  virtualAccountTrxType: WinpayVAType;
  expiredDate: string; // ISO8601 format
  additionalInfo: {
    channel: WinpayVAChannel;
  };
}

export interface WinpayCreateVAResponse {
  responseCode: string;
  responseMessage: string;
  virtualAccountData?: {
    partnerServiceId: string;
    customerNo: string;
    virtualAccountNo: string;
    virtualAccountName: string;
    trxId: string;
    totalAmount: {
      value: string;
      currency: string;
    };
    virtualAccountTrxType: string;
    expiredDate: string;
    additionalInfo: {
      channel: string;
      contractId: string;
    };
  };
}

export interface WinpayVACallbackPayload {
  partnerServiceId: string;
  customerNo: string;
  virtualAccountNo: string;
  virtualAccountName: string;
  trxId: string;
  paymentRequestId: string;
  paidAmount: {
    value: string;
    currency: string;
  };
  trxDateTime: string;
  referenceNo: string | number;
  additionalInfo: {
    channel: string;
    contractId: string;
  };
}

// ============================================
// TYPES - CHECKOUT PAGE
// ============================================

export interface WinpayCheckoutCustomer {
  name: string;
  email?: string;
  phone: string;
}

export interface WinpayCheckoutProduct {
  name: string;
  qty: number;
  price: number;
}

export interface WinpayCreateInvoiceRequest {
  customer: WinpayCheckoutCustomer;
  invoice: {
    ref: string;
    products: WinpayCheckoutProduct[];
  };
  back_url: string;
  interval: number; // in minutes
}

export interface WinpayCreateInvoiceResponse {
  responseCode: string;
  responseMessage: string;
  responseDate: string;
  responseData?: {
    id: string;
    ref: string;
    created_at: string;
    redirect_url: string;
    back_url: string;
    customer: WinpayCheckoutCustomer;
    products: Array<WinpayCheckoutProduct & { uuid: string }>;
  };
}

export interface WinpayCheckoutCallbackPayload {
  uuid: string;
  created_at: string;
  ref: string;
  channel: string;
  amount: number;
  fee: number;
  nett_amount: number;
  products: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  invoice: {
    uuid: string;
    ref: string;
    url: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

// ============================================
// SIGNATURE GENERATION - SNAP API
// ============================================

/**
 * Generate SNAP API Signature using RSA-SHA256
 *
 * Formula:
 * stringToSign = HTTPMethod + ":" + EndpointUrl + ":" + Lowercase(HexEncode(SHA-256(minify(RequestBody)))) + ":" + TimeStamp
 * signature = base64_encode(SHA256withRSA(private_key, stringToSign))
 */
export const generateSnapSignature = (
  httpMethod: string,
  endpointUrl: string,
  requestBody: object,
  timestamp: string,
  privateKey: string
): string => {
  // 1. Minify and hash the request body
  const minifiedBody = JSON.stringify(requestBody);
  const hashedBody = crypto
    .createHash('sha256')
    .update(minifiedBody)
    .digest('hex')
    .toLowerCase();

  // 2. Create string to sign
  const stringToSign = `${httpMethod}:${endpointUrl}:${hashedBody}:${timestamp}`;

  // 3. Sign with RSA-SHA256
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(stringToSign);
  const signature = sign.sign(privateKey, 'base64');

  return signature;
};

/**
 * Verify SNAP API Signature from callback
 */
export const verifySnapSignature = (
  httpMethod: string,
  endpointUrl: string,
  requestBody: object,
  timestamp: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    const minifiedBody = JSON.stringify(requestBody);
    const hashedBody = crypto
      .createHash('sha256')
      .update(minifiedBody)
      .digest('hex')
      .toLowerCase();

    const stringToSign = `${httpMethod}:${endpointUrl}:${hashedBody}:${timestamp}`;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(stringToSign);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

// ============================================
// SIGNATURE GENERATION - CHECKOUT PAGE
// ============================================

/**
 * Generate Checkout Page Signature using HMAC-SHA256
 *
 * Formula: hash_hmac('sha256', timestamp, secretKey)
 */
export const generateCheckoutSignature = (
  timestamp: string,
  secretKey: string
): string => {
  return crypto.createHmac('sha256', secretKey).update(timestamp).digest('hex');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get current timestamp in ISO8601 format with Jakarta timezone
 */
export const getWinpayTimestamp = (): string => {
  const now = new Date();
  const jakartaOffset = 7 * 60; // GMT+7
  const jakartaTime = new Date(now.getTime() + jakartaOffset * 60000);
  return jakartaTime.toISOString().slice(0, 19) + '+07:00';
};

/**
 * Generate unique external ID
 */
export const generateExternalId = (): string => {
  return `${Date.now()}`;
};

/**
 * Format amount for Winpay (add .00 suffix)
 */
export const formatAmount = (amount: number): string => {
  return `${amount.toFixed(2)}`;
};

/**
 * Get private key from environment or file
 */
export const getPrivateKey = (): string => {
  const config = getWinpayConfig();

  if (config.privateKeyContent) {
    // If key is provided directly (for Docker/cloud environments)
    return config.privateKeyContent.replace(/\\n/g, '\n');
  }

  if (config.privateKeyPath) {
    // If key path is provided
    const fs = require('fs');
    return fs.readFileSync(config.privateKeyPath, 'utf8');
  }

  throw new Error('Winpay private key not configured');
};

// ============================================
// SNAP API CLIENT
// ============================================

export class WinpaySnapClient {
  private config: WinpayConfig;
  private privateKey: string;

  constructor() {
    this.config = getWinpayConfig();
    this.privateKey = getPrivateKey();
  }

  /**
   * Create Virtual Account
   */
  async createVA(
    request: WinpayCreateVARequest
  ): Promise<WinpayCreateVAResponse> {
    const endpoint = '/v1.0/transfer-va/create-va';
    const timestamp = getWinpayTimestamp();
    const externalId = generateExternalId();

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      request,
      timestamp,
      this.privateKey
    );

    try {
      const response: AxiosResponse<WinpayCreateVAResponse> = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        request,
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

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<WinpayCreateVAResponse>;
      if (axiosError.response) {
        console.error('Winpay VA creation error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }

  /**
   * Inquiry VA Status
   */
  async inquiryVAStatus(
    virtualAccountNo: string,
    trxId: string,
    contractId: string,
    channel: WinpayVAChannel
  ): Promise<any> {
    const endpoint = '/v1.0/transfer-va/status';
    const timestamp = getWinpayTimestamp();
    const externalId = generateExternalId();

    const request = {
      virtualAccountNo,
      additionalInfo: {
        contractId,
        channel,
        trxId,
      },
    };

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      request,
      timestamp,
      this.privateKey
    );

    try {
      const response = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        request,
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

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Winpay VA inquiry error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }

  /**
   * Delete/Cancel VA
   */
  async deleteVA(
    virtualAccountNo: string,
    trxId: string,
    contractId: string,
    channel: WinpayVAChannel
  ): Promise<any> {
    const endpoint = '/v1.0/transfer-va/delete-va';
    const timestamp = getWinpayTimestamp();
    const externalId = generateExternalId();

    const request = {
      virtualAccountNo,
      trxId,
      additionalInfo: {
        contractId,
        channel,
      },
    };

    const signature = generateSnapSignature(
      'POST',
      endpoint,
      request,
      timestamp,
      this.privateKey
    );

    try {
      const response = await axios.post(
        `${this.config.snapBaseUrl}${endpoint}`,
        request,
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

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Winpay VA delete error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }
}

// ============================================
// CHECKOUT PAGE CLIENT
// ============================================

export class WinpayCheckoutClient {
  private config: WinpayConfig;

  constructor() {
    this.config = getWinpayConfig();
  }

  /**
   * Create Invoice for Checkout Page
   */
  async createInvoice(
    request: WinpayCreateInvoiceRequest
  ): Promise<WinpayCreateInvoiceResponse> {
    const timestamp = getWinpayTimestamp();
    const signature = generateCheckoutSignature(
      timestamp,
      this.config.checkoutSecretKey
    );

    try {
      const response: AxiosResponse<WinpayCreateInvoiceResponse> =
        await axios.post(`${this.config.checkoutBaseUrl}/api/create`, request, {
          headers: {
            'Content-Type': 'application/json',
            'X-Winpay-Timestamp': timestamp,
            'X-Winpay-Signature': signature,
            'X-Winpay-Key': this.config.checkoutKey,
          },
        });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<WinpayCreateInvoiceResponse>;
      if (axiosError.response) {
        console.error('Winpay invoice creation error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }

  /**
   * Find Invoice by reference
   */
  async findInvoice(ref: string): Promise<any> {
    const timestamp = getWinpayTimestamp();
    const signature = generateCheckoutSignature(
      timestamp,
      this.config.checkoutSecretKey
    );

    try {
      const response = await axios.get(
        `${this.config.checkoutBaseUrl}/api/invoice/ref/${ref}`,
        {
          headers: {
            'X-Winpay-Timestamp': timestamp,
            'X-Winpay-Signature': signature,
            'X-Winpay-Key': this.config.checkoutKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Winpay find invoice error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }

  /**
   * Delete Invoice by reference
   */
  async deleteInvoice(ref: string): Promise<any> {
    const timestamp = getWinpayTimestamp();
    const signature = generateCheckoutSignature(
      timestamp,
      this.config.checkoutSecretKey
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

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('Winpay delete invoice error:', axiosError.response.data);
        return axiosError.response.data;
      }
      throw error;
    }
  }
}

// ============================================
// PAYMENT SERVICE - UNIFIED INTERFACE
// ============================================

export enum WinpayPaymentMethod {
  CHECKOUT_PAGE = 'checkout_page',
  VA_BRI = 'va_bri',
  VA_BNI = 'va_bni',
  VA_BCA = 'va_bca',
  VA_MANDIRI = 'va_mandiri',
  VA_PERMATA = 'va_permata',
  VA_BSI = 'va_bsi',
  VA_CIMB = 'va_cimb',
}

export interface CreatePaymentRequest {
  transactionId: string;
  amount: number;
  tokenCount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  licenseKey: string;
  paymentMethod: WinpayPaymentMethod;
  expiryMinutes?: number;
  backUrl?: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentUrl?: string;
  virtualAccountNo?: string;
  virtualAccountName?: string;
  expiredAt?: string;
  contractId?: string;
  invoiceId?: string;
  channel?: string;
  error?: string;
}

/**
 * Unified Winpay Payment Service
 */
export class WinpayPaymentService {
  private snapClient: WinpaySnapClient;
  private checkoutClient: WinpayCheckoutClient;

  constructor() {
    this.snapClient = new WinpaySnapClient();
    this.checkoutClient = new WinpayCheckoutClient();
  }

  /**
   * Create payment based on payment method
   */
  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (request.paymentMethod === WinpayPaymentMethod.CHECKOUT_PAGE) {
      return this.createCheckoutPayment(request);
    } else {
      return this.createVAPayment(request);
    }
  }

  /**
   * Create Checkout Page payment (all methods in one page)
   */
  private async createCheckoutPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const backUrl =
      request.backUrl ||
      process.env.WINPAY_BACK_URL ||
      `${process.env.APP_URL}/payment/complete`;

    const invoiceRequest: WinpayCreateInvoiceRequest = {
      customer: {
        name: request.customerName,
        email: request.customerEmail,
        phone: request.customerPhone,
      },
      invoice: {
        ref: request.transactionId,
        products: [
          {
            name: `Token Top-up ${request.tokenCount} tokens (${request.licenseKey})`,
            qty: 1,
            price: request.amount,
          },
        ],
      },
      back_url: backUrl,
      interval: request.expiryMinutes || 120, // Default 2 hours
    };

    const response = await this.checkoutClient.createInvoice(invoiceRequest);

    if (response.responseCode === '2010300' && response.responseData) {
      return {
        success: true,
        paymentUrl: response.responseData.redirect_url,
        invoiceId: response.responseData.id,
        expiredAt: new Date(
          Date.now() + (request.expiryMinutes || 120) * 60 * 1000
        ).toISOString(),
        channel: 'CHECKOUT_PAGE',
      };
    }

    return {
      success: false,
      error: response.responseMessage || 'Failed to create checkout page',
    };
  }

  /**
   * Create VA payment (specific bank)
   */
  private async createVAPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    // Map payment method to VA channel
    const channelMap: Record<string, WinpayVAChannel> = {
      [WinpayPaymentMethod.VA_BRI]: WinpayVAChannel.BRI,
      [WinpayPaymentMethod.VA_BNI]: WinpayVAChannel.BNI,
      [WinpayPaymentMethod.VA_BCA]: WinpayVAChannel.BCA,
      [WinpayPaymentMethod.VA_MANDIRI]: WinpayVAChannel.MANDIRI,
      [WinpayPaymentMethod.VA_PERMATA]: WinpayVAChannel.PERMATA,
      [WinpayPaymentMethod.VA_BSI]: WinpayVAChannel.BSI,
      [WinpayPaymentMethod.VA_CIMB]: WinpayVAChannel.CIMB,
    };

    const channel = channelMap[request.paymentMethod];
    if (!channel) {
      return {
        success: false,
        error: `Unsupported payment method: ${request.paymentMethod}`,
      };
    }

    const expiryMinutes = request.expiryMinutes || 1440; // Default 24 hours
    const expiredDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const expiredDateStr = expiredDate.toISOString().slice(0, 19) + '+07:00';

    const vaRequest: WinpayCreateVARequest = {
      virtualAccountName: request.customerName.substring(0, 24), // Max 24 chars
      trxId: request.transactionId,
      totalAmount: {
        value: formatAmount(request.amount),
        currency: 'IDR',
      },
      virtualAccountTrxType: WinpayVAType.ONE_OFF,
      expiredDate: expiredDateStr,
      additionalInfo: {
        channel,
      },
    };

    const response = await this.snapClient.createVA(vaRequest);

    if (response.responseCode === '2002700' && response.virtualAccountData) {
      return {
        success: true,
        virtualAccountNo: response.virtualAccountData.virtualAccountNo.trim(),
        virtualAccountName: response.virtualAccountData.virtualAccountName,
        expiredAt: response.virtualAccountData.expiredDate,
        contractId: response.virtualAccountData.additionalInfo.contractId,
        channel: channel,
      };
    }

    return {
      success: false,
      error: response.responseMessage || 'Failed to create virtual account',
    };
  }

  /**
   * Check VA payment status
   */
  async checkVAStatus(
    virtualAccountNo: string,
    trxId: string,
    contractId: string,
    channel: WinpayVAChannel
  ): Promise<{
    paid: boolean;
    amount?: number;
    referenceNo?: string;
    transactionDate?: string;
  }> {
    const response = await this.snapClient.inquiryVAStatus(
      virtualAccountNo,
      trxId,
      contractId,
      channel
    );

    if (response.responseCode === '2002600' && response.virtualAccountData) {
      const isPaid = response.virtualAccountData.paymentFlagStatus === '00';
      return {
        paid: isPaid,
        amount: isPaid
          ? parseFloat(response.virtualAccountData.totalAmount.value)
          : undefined,
        referenceNo: response.virtualAccountData.referenceNo,
        transactionDate: response.virtualAccountData.transactionDate,
      };
    }

    return { paid: false };
  }

  /**
   * Cancel/Delete VA
   */
  async cancelVA(
    virtualAccountNo: string,
    trxId: string,
    contractId: string,
    channel: WinpayVAChannel
  ): Promise<boolean> {
    const response = await this.snapClient.deleteVA(
      virtualAccountNo,
      trxId,
      contractId,
      channel
    );

    return response.responseCode === '2003100';
  }

  /**
   * Find checkout invoice status
   */
  async findInvoice(ref: string): Promise<any> {
    return this.checkoutClient.findInvoice(ref);
  }

  /**
   * Cancel checkout invoice
   */
  async cancelInvoice(ref: string): Promise<boolean> {
    const response = await this.checkoutClient.deleteInvoice(ref);
    return response.responseCode?.startsWith('200');
  }
}

// Export singleton instance
export const winpayService = new WinpayPaymentService();
