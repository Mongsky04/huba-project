/**
 * Xendit Payment Gateway Implementation
 *
 * Implements the IPaymentGateway interface for Xendit.
 * This is a stub implementation - fill in the actual API calls when needed.
 *
 * Documentation: https://developers.xendit.co/
 */

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
// XENDIT CONFIGURATION
// ============================================

interface XenditConfig {
  baseUrl: string;
  secretKey: string;
  publicKey: string;
  webhookToken: string;
  isProduction: boolean;
}

const getXenditConfig = (): XenditConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    baseUrl: isProduction
      ? 'https://api.xendit.co'
      : 'https://api.xendit.co', // Xendit uses same URL, different keys
    secretKey: process.env.XENDIT_SECRET_KEY || '',
    publicKey: process.env.XENDIT_PUBLIC_KEY || '',
    webhookToken: process.env.XENDIT_WEBHOOK_TOKEN || '',
    isProduction,
  };
};

// ============================================
// XENDIT GATEWAY IMPLEMENTATION
// ============================================

export class XenditGateway extends BasePaymentGateway {
  readonly provider = PaymentGatewayProvider.XENDIT;
  private config: XenditConfig;

  constructor() {
    super();
    this.config = getXenditConfig();
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
      [EWalletType.OVO]: 'ID_OVO',
      [EWalletType.DANA]: 'ID_DANA',
      [EWalletType.GOPAY]: 'ID_GOPAY',
      [EWalletType.SHOPEEPAY]: 'ID_SHOPEEPAY',
      [EWalletType.LINKAJA]: 'ID_LINKAJA',
    };
    return mapping[ewallet] || ewallet.toUpperCase();
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.config.secretKey + ':').toString('base64')}`;
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]> {
    return [
      {
        id: 'xendit_invoice',
        name: 'Xendit Invoice',
        description: 'All payment methods in one page',
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
        id: 'ewallet_ovo',
        name: 'OVO',
        description: 'OVO e-Wallet',
        type: PaymentMethodType.EWALLET,
        ewallet: EWalletType.OVO,
        enabled: true,
      },
      {
        id: 'ewallet_dana',
        name: 'DANA',
        description: 'DANA e-Wallet',
        type: PaymentMethodType.EWALLET,
        ewallet: EWalletType.DANA,
        enabled: true,
      },
      {
        id: 'ewallet_shopeepay',
        name: 'ShopeePay',
        description: 'ShopeePay e-Wallet',
        type: PaymentMethodType.EWALLET,
        ewallet: EWalletType.SHOPEEPAY,
        enabled: true,
      },
      {
        id: 'qris',
        name: 'QRIS',
        description: 'Scan QR Code',
        type: PaymentMethodType.QRIS,
        enabled: true,
      },
    ];
  }

  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    switch (request.methodType) {
      case PaymentMethodType.CHECKOUT_PAGE:
        return this.createInvoice(request);
      case PaymentMethodType.VIRTUAL_ACCOUNT:
        return this.createVirtualAccount(request);
      case PaymentMethodType.EWALLET:
        return this.createEWalletCharge(request);
      case PaymentMethodType.QRIS:
        return this.createQRIS(request);
      default:
        return {
          success: false,
          error: `Unsupported payment method type: ${request.methodType}`,
        };
    }
  }

  /**
   * Create Xendit Invoice (all-in-one payment page)
   * API: POST /v2/invoices
   */
  private async createInvoice(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const body = {
      external_id: request.transactionId,
      amount: request.amount,
      payer_email: request.customer.email,
      description: request.items.map((i) => i.name).join(', '),
      invoice_duration: (request.expiryMinutes || 120) * 60, // in seconds
      customer: {
        given_names: request.customer.name,
        email: request.customer.email,
        mobile_number: request.customer.phone,
      },
      success_redirect_url: request.redirectUrl,
      failure_redirect_url: request.metadata?.failureRedirectUrl,
      items: request.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/v2/invoices`,
        body,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        gatewayTransactionId: response.data.id,
        paymentUrl: response.data.invoice_url,
        expiresAt: response.data.expiry_date,
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

  /**
   * Create Virtual Account
   * API: POST /callback_virtual_accounts
   */
  private async createVirtualAccount(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!request.bank) {
      return { success: false, error: 'Bank is required for VA payment' };
    }

    const expiryDate = this.generateExpiryDate(request.expiryMinutes || 1440);

    const body = {
      external_id: request.transactionId,
      bank_code: this.mapBankCode(request.bank),
      name: request.customer.name,
      expected_amount: request.amount,
      is_closed: true,
      is_single_use: true,
      expiration_date: expiryDate.toISOString(),
    };

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/callback_virtual_accounts`,
        body,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        gatewayTransactionId: response.data.id,
        virtualAccount: {
          number: response.data.account_number,
          name: response.data.name,
          bank: response.data.bank_code,
        },
        expiresAt: response.data.expiration_date,
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

  /**
   * Create eWallet Charge
   * API: POST /ewallets/charges
   */
  private async createEWalletCharge(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!request.ewallet) {
      return { success: false, error: 'eWallet type is required' };
    }

    const body = {
      reference_id: request.transactionId,
      currency: 'IDR',
      amount: request.amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: this.mapEWalletCode(request.ewallet),
      channel_properties: {
        mobile_number: request.customer.phone,
        success_redirect_url: request.redirectUrl,
      },
    };

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/ewallets/charges`,
        body,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        gatewayTransactionId: response.data.id,
        ewallet: {
          type: request.ewallet,
          deepLinkUrl: response.data.actions?.mobile_deeplink_checkout_url,
          qrString: response.data.actions?.qr_checkout_string,
        },
        expiresAt: response.data.expiration_date,
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

  /**
   * Create QRIS Payment
   * API: POST /qr_codes
   */
  private async createQRIS(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const body = {
      reference_id: request.transactionId,
      type: 'DYNAMIC',
      currency: 'IDR',
      amount: request.amount,
    };

    try {
      const response = await axios.post(
        `${this.config.baseUrl}/qr_codes`,
        body,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
            'api-version': '2022-07-31',
          },
        }
      );

      return {
        success: true,
        gatewayTransactionId: response.data.id,
        qris: {
          qrString: response.data.qr_string,
        },
        expiresAt: response.data.expires_at,
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

  async checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    // Xendit Invoice status check
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/v2/invoices/${request.gatewayTransactionId}`,
        {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }
      );

      const data = response.data;
      let status: PaymentStatus;

      switch (data.status) {
        case 'PAID':
        case 'SETTLED':
          status = PaymentStatus.SUCCESS;
          break;
        case 'EXPIRED':
          status = PaymentStatus.EXPIRED;
          break;
        case 'PENDING':
        default:
          status = PaymentStatus.PENDING;
      }

      return {
        success: true,
        status,
        paidAmount: data.paid_amount,
        paidAt: data.paid_at,
        paymentMethod: data.payment_method,
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
    // Xendit Invoice expiration
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/invoices/${request.gatewayTransactionId}/expire!`,
        {},
        {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }
      );

      return {
        success: true,
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
    // Xendit sends different callback structures for different payment types
    // Common fields: external_id, status, amount

    const transactionId = body.external_id || body.reference_id;
    if (!transactionId) return null;

    let status: PaymentStatus;
    switch (body.status) {
      case 'PAID':
      case 'SETTLED':
      case 'SUCCEEDED':
        status = PaymentStatus.SUCCESS;
        break;
      case 'EXPIRED':
        status = PaymentStatus.EXPIRED;
        break;
      case 'FAILED':
        status = PaymentStatus.FAILED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    return {
      transactionId,
      gatewayTransactionId: body.id,
      status,
      amount: body.amount || body.paid_amount,
      paymentMethod: body.payment_method || body.channel_code || 'xendit',
      channel: body.bank_code || body.channel_code,
      paidAt: body.paid_at || body.updated,
      rawData: body,
    };
  }

  async verifyCallbackSignature(
    headers: Record<string, string>,
    _body: any
  ): Promise<boolean> {
    const token = headers['x-callback-token'];
    return token === this.config.webhookToken;
  }

  getCallbackSuccessResponse(): any {
    return { status: 'OK' };
  }
}
