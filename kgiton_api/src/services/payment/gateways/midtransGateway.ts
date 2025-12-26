/**
 * Midtrans Payment Gateway Implementation
 *
 * Implements the IPaymentGateway interface for Midtrans.
 * This is a stub implementation - fill in the actual API calls when needed.
 *
 * Documentation: https://docs.midtrans.com/
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
// MIDTRANS CONFIGURATION
// ============================================

interface MidtransConfig {
  baseUrl: string;
  snapUrl: string;
  serverKey: string;
  clientKey: string;
  merchantId: string;
  isProduction: boolean;
}

const getMidtransConfig = (): MidtransConfig => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    baseUrl: isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2',
    snapUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    merchantId: process.env.MIDTRANS_MERCHANT_ID || '',
    isProduction,
  };
};

// ============================================
// MIDTRANS GATEWAY IMPLEMENTATION
// ============================================

export class MidtransGateway extends BasePaymentGateway {
  readonly provider = PaymentGatewayProvider.MIDTRANS;
  private config: MidtransConfig;

  constructor() {
    super();
    this.config = getMidtransConfig();
  }

  protected mapBankCode(bank: VirtualAccountBank): string {
    const mapping: Record<VirtualAccountBank, string> = {
      [VirtualAccountBank.BRI]: 'bri',
      [VirtualAccountBank.BNI]: 'bni',
      [VirtualAccountBank.BCA]: 'bca',
      [VirtualAccountBank.MANDIRI]: 'echannel', // Mandiri Bill Payment
      [VirtualAccountBank.PERMATA]: 'permata',
      [VirtualAccountBank.BSI]: 'bsi',
      [VirtualAccountBank.CIMB]: 'cimb',
      [VirtualAccountBank.SINARMAS]: 'sinarmas',
      [VirtualAccountBank.MUAMALAT]: 'muamalat',
      [VirtualAccountBank.INDOMARET]: 'indomaret',
      [VirtualAccountBank.ALFAMART]: 'alfamart',
    };
    return mapping[bank] || bank.toLowerCase();
  }

  protected mapEWalletCode(ewallet: EWalletType): string {
    const mapping: Record<EWalletType, string> = {
      [EWalletType.OVO]: 'ovo',
      [EWalletType.DANA]: 'dana',
      [EWalletType.GOPAY]: 'gopay',
      [EWalletType.SHOPEEPAY]: 'shopeepay',
      [EWalletType.LINKAJA]: 'linkaja',
    };
    return mapping[ewallet] || ewallet.toLowerCase();
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.config.serverKey + ':').toString('base64')}`;
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]> {
    return [
      {
        id: 'midtrans_snap',
        name: 'Midtrans Snap',
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
        name: 'Mandiri Bill Payment',
        description: 'Bank Mandiri e-Channel',
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
        id: 'ewallet_gopay',
        name: 'GoPay',
        description: 'GoPay e-Wallet',
        type: PaymentMethodType.EWALLET,
        ewallet: EWalletType.GOPAY,
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
        return this.createSnapTransaction(request);
      case PaymentMethodType.VIRTUAL_ACCOUNT:
        return this.createVAPayment(request);
      case PaymentMethodType.EWALLET:
        return this.createEWalletPayment(request);
      case PaymentMethodType.QRIS:
        return this.createQRISPayment(request);
      default:
        return {
          success: false,
          error: `Unsupported payment method type: ${request.methodType}`,
        };
    }
  }

  /**
   * Create Snap Transaction (all-in-one payment page)
   * API: POST /snap/v1/transactions
   */
  private async createSnapTransaction(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const body = {
      transaction_details: {
        order_id: request.transactionId,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
      },
      item_details: request.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      callbacks: {
        finish: request.redirectUrl,
      },
      expiry: {
        unit: 'minutes',
        duration: request.expiryMinutes || 120,
      },
    };

    try {
      const response = await axios.post(
        `${this.config.snapUrl}/transactions`,
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
        gatewayTransactionId: request.transactionId,
        paymentUrl: response.data.redirect_url,
        snapToken: response.data.token,
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
   * Create Virtual Account Payment
   * API: POST /v2/charge
   */
  private async createVAPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!request.bank) {
      return { success: false, error: 'Bank is required for VA payment' };
    }

    const bankCode = this.mapBankCode(request.bank);
    let paymentType: string;
    let bankDetails: any;

    if (bankCode === 'echannel') {
      // Mandiri Bill Payment
      paymentType = 'echannel';
      bankDetails = {
        echannel: {
          bill_info1: 'Token Top-up',
          bill_info2: request.items[0]?.name || 'Payment',
        },
      };
    } else {
      paymentType = 'bank_transfer';
      bankDetails = {
        bank_transfer: {
          bank: bankCode,
        },
      };
    }

    const body = {
      payment_type: paymentType,
      transaction_details: {
        order_id: request.transactionId,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
      },
      custom_expiry: {
        expiry_duration: request.expiryMinutes || 1440,
        unit: 'minute',
      },
      ...bankDetails,
    };

    try {
      const response = await axios.post(`${this.config.baseUrl}/charge`, body, {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      let vaNumber = '';
      let vaBank = bankCode;
      let vaName = request.customer.name;

      if (data.va_numbers && data.va_numbers.length > 0) {
        vaNumber = data.va_numbers[0].va_number;
        vaBank = data.va_numbers[0].bank;
      } else if (data.permata_va_number) {
        vaNumber = data.permata_va_number;
      } else if (data.bill_key) {
        vaNumber = `${data.biller_code}-${data.bill_key}`;
      }

      return {
        success: true,
        gatewayTransactionId: data.transaction_id,
        virtualAccount: {
          number: vaNumber,
          name: vaName,
          bank: vaBank,
        },
        expiresAt: data.expiry_time,
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

  /**
   * Create E-Wallet Payment (GoPay, ShopeePay)
   * API: POST /v2/charge
   */
  private async createEWalletPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    if (!request.ewallet) {
      return { success: false, error: 'eWallet type is required' };
    }

    const ewalletCode = this.mapEWalletCode(request.ewallet);

    const body = {
      payment_type: ewalletCode,
      transaction_details: {
        order_id: request.transactionId,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
      },
      [ewalletCode]: {
        enable_callback: true,
        callback_url: request.redirectUrl,
      },
    };

    try {
      const response = await axios.post(`${this.config.baseUrl}/charge`, body, {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      let deepLinkUrl = '';
      let qrString = '';

      if (data.actions) {
        const generateQR = data.actions.find(
          (a: any) => a.name === 'generate-qr-code'
        );
        const deeplink = data.actions.find((a: any) => a.name === 'deeplink');
        if (generateQR) qrString = generateQR.url;
        if (deeplink) deepLinkUrl = deeplink.url;
      }

      return {
        success: true,
        gatewayTransactionId: data.transaction_id,
        ewallet: {
          type: request.ewallet,
          deepLinkUrl,
          qrString,
        },
        expiresAt: data.expiry_time,
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

  /**
   * Create QRIS Payment
   * API: POST /v2/charge with gopay/qris
   */
  private async createQRISPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const body = {
      payment_type: 'qris',
      transaction_details: {
        order_id: request.transactionId,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone,
      },
    };

    try {
      const response = await axios.post(`${this.config.baseUrl}/charge`, body, {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      const qrAction = data.actions?.find(
        (a: any) => a.name === 'generate-qr-code'
      );

      return {
        success: true,
        gatewayTransactionId: data.transaction_id,
        qris: {
          qrString: qrAction?.url || data.qr_string,
        },
        expiresAt: data.expiry_time,
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
    try {
      const orderId = request.transactionId;
      const response = await axios.get(
        `${this.config.baseUrl}/${orderId}/status`,
        {
          headers: {
            Authorization: this.getAuthHeader(),
          },
        }
      );

      const data = response.data;
      let status: PaymentStatus;

      switch (data.transaction_status) {
        case 'capture':
        case 'settlement':
          status = PaymentStatus.SUCCESS;
          break;
        case 'expire':
          status = PaymentStatus.EXPIRED;
          break;
        case 'cancel':
        case 'deny':
          status = PaymentStatus.CANCELLED;
          break;
        case 'failure':
          status = PaymentStatus.FAILED;
          break;
        case 'pending':
        default:
          status = PaymentStatus.PENDING;
      }

      return {
        success: true,
        status,
        paidAmount: data.gross_amount ? parseInt(data.gross_amount) : undefined,
        paidAt: data.settlement_time,
        paymentMethod: data.payment_type,
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
    try {
      const orderId = request.transactionId;
      const response = await axios.post(
        `${this.config.baseUrl}/${orderId}/cancel`,
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
    const orderId = body.order_id;
    if (!orderId) return null;

    let status: PaymentStatus;
    switch (body.transaction_status) {
      case 'capture':
      case 'settlement':
        status = PaymentStatus.SUCCESS;
        break;
      case 'expire':
        status = PaymentStatus.EXPIRED;
        break;
      case 'cancel':
      case 'deny':
        status = PaymentStatus.CANCELLED;
        break;
      case 'failure':
        status = PaymentStatus.FAILED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    return {
      transactionId: orderId,
      gatewayTransactionId: body.transaction_id,
      status,
      amount: body.gross_amount ? parseInt(body.gross_amount) : 0,
      paymentMethod: body.payment_type,
      channel: body.bank || body.acquirer,
      paidAt: body.settlement_time,
      rawData: body,
    };
  }

  async verifyCallbackSignature(
    _headers: Record<string, string>,
    body: any
  ): Promise<boolean> {
    // Midtrans signature verification
    // signature = SHA512(order_id + status_code + gross_amount + server_key)
    const receivedSignature = body.signature_key;
    if (!receivedSignature) return false;

    const orderId = body.order_id;
    const statusCode = body.status_code;
    const grossAmount = body.gross_amount;

    const signatureString = `${orderId}${statusCode}${grossAmount}${this.config.serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(signatureString)
      .digest('hex');

    return receivedSignature === calculatedSignature;
  }

  getCallbackSuccessResponse(): any {
    return { status: 'OK' };
  }
}
