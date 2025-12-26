/**
 * Payment Gateway Factory
 *
 * Factory pattern to instantiate the correct payment gateway
 * based on configuration. This allows easy switching between
 * different payment providers.
 */

import {
  IPaymentGateway,
  PaymentGatewayProvider,
  PaymentMethodInfo,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CheckPaymentStatusRequest,
  CheckPaymentStatusResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
  PaymentCallbackData,
  PaymentMethodType,
} from './paymentGatewayInterface';

import { WinpayGateway } from './gateways/winpayGateway';
import { XenditGateway } from './gateways/xenditGateway';
import { MidtransGateway } from './gateways/midtransGateway';
import { ManualGateway } from './gateways/manualGateway';

// ============================================
// CONFIGURATION
// ============================================

export interface PaymentGatewayConfig {
  /** Primary payment gateway provider */
  provider: PaymentGatewayProvider;
  /** Enable/disable payment gateway (use manual mode if disabled) */
  enabled: boolean;
  /** Default expiry time in minutes for checkout page */
  checkoutExpiryMinutes: number;
  /** Default expiry time in minutes for VA */
  vaExpiryMinutes: number;
  /** Callback/redirect URL after payment */
  callbackUrl: string;
  /** Success redirect URL */
  successRedirectUrl: string;
  /** Failure redirect URL */
  failureRedirectUrl: string;
}

/**
 * Get payment gateway configuration from environment
 */
export const getPaymentGatewayConfig = (): PaymentGatewayConfig => {
  const providerStr = process.env.PAYMENT_GATEWAY_PROVIDER || 'winpay';
  let provider: PaymentGatewayProvider;

  switch (providerStr.toLowerCase()) {
    case 'xendit':
      provider = PaymentGatewayProvider.XENDIT;
      break;
    case 'midtrans':
      provider = PaymentGatewayProvider.MIDTRANS;
      break;
    case 'manual':
      provider = PaymentGatewayProvider.MANUAL;
      break;
    case 'winpay':
    default:
      provider = PaymentGatewayProvider.WINPAY;
      break;
  }

  return {
    provider,
    enabled: process.env.PAYMENT_GATEWAY_ENABLED !== 'false',
    checkoutExpiryMinutes: parseInt(
      process.env.PAYMENT_CHECKOUT_EXPIRY_MINUTES || '120',
      10
    ),
    vaExpiryMinutes: parseInt(
      process.env.PAYMENT_VA_EXPIRY_MINUTES || '1440',
      10
    ),
    callbackUrl:
      process.env.PAYMENT_CALLBACK_URL ||
      `${process.env.APP_URL}/api/webhook/payment`,
    successRedirectUrl:
      process.env.PAYMENT_SUCCESS_REDIRECT_URL ||
      `${process.env.APP_URL}/payment/success`,
    failureRedirectUrl:
      process.env.PAYMENT_FAILURE_REDIRECT_URL ||
      `${process.env.APP_URL}/payment/failed`,
  };
};

// ============================================
// FACTORY CLASS
// ============================================

/**
 * Payment Gateway Factory
 *
 * Usage:
 * ```typescript
 * const gateway = PaymentGatewayFactory.getGateway();
 * const result = await gateway.createPayment(request);
 * ```
 */
export class PaymentGatewayFactory {
  private static instances: Map<PaymentGatewayProvider, IPaymentGateway> =
    new Map();

  /**
   * Get the configured payment gateway instance
   */
  static getGateway(
    provider?: PaymentGatewayProvider
  ): IPaymentGateway {
    const config = getPaymentGatewayConfig();

    // If gateway is disabled, use manual mode
    if (!config.enabled) {
      return this.getGatewayByProvider(PaymentGatewayProvider.MANUAL);
    }

    const selectedProvider = provider || config.provider;
    return this.getGatewayByProvider(selectedProvider);
  }

  /**
   * Get a specific payment gateway by provider
   */
  static getGatewayByProvider(
    provider: PaymentGatewayProvider
  ): IPaymentGateway {
    // Check cache
    if (this.instances.has(provider)) {
      return this.instances.get(provider)!;
    }

    // Create new instance
    let gateway: IPaymentGateway;

    switch (provider) {
      case PaymentGatewayProvider.WINPAY:
        gateway = new WinpayGateway();
        break;
      case PaymentGatewayProvider.XENDIT:
        gateway = new XenditGateway();
        break;
      case PaymentGatewayProvider.MIDTRANS:
        gateway = new MidtransGateway();
        break;
      case PaymentGatewayProvider.MANUAL:
      default:
        gateway = new ManualGateway();
        break;
    }

    // Cache and return
    this.instances.set(provider, gateway);
    return gateway;
  }

  /**
   * Get all supported providers
   */
  static getSupportedProviders(): PaymentGatewayProvider[] {
    return [
      PaymentGatewayProvider.WINPAY,
      PaymentGatewayProvider.XENDIT,
      PaymentGatewayProvider.MIDTRANS,
    ];
  }

  /**
   * Clear cached instances (useful for testing)
   */
  static clearCache(): void {
    this.instances.clear();
  }
}

// ============================================
// UNIFIED PAYMENT SERVICE
// ============================================

/**
 * Unified Payment Service
 *
 * High-level service that wraps the payment gateway factory
 * and provides a clean interface for the rest of the application.
 */
export class PaymentService {
  private gateway: IPaymentGateway;
  private config: PaymentGatewayConfig;

  constructor(provider?: PaymentGatewayProvider) {
    this.config = getPaymentGatewayConfig();
    this.gateway = PaymentGatewayFactory.getGateway(provider);
  }

  /**
   * Get current provider
   */
  getProvider(): PaymentGatewayProvider {
    return this.gateway.provider;
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethodInfo[]> {
    return this.gateway.getAvailablePaymentMethods();
  }

  /**
   * Get available payment methods (alias for consistency)
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]> {
    return this.gateway.getAvailablePaymentMethods();
  }

  /**
   * Create a payment
   */
  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    // Apply default expiry if not specified
    if (!request.expiryMinutes) {
      request.expiryMinutes =
        request.methodType === PaymentMethodType.CHECKOUT_PAGE
          ? this.config.checkoutExpiryMinutes
          : this.config.vaExpiryMinutes;
    }

    // Apply default redirect URL
    if (!request.redirectUrl) {
      request.redirectUrl = this.config.successRedirectUrl;
    }

    return this.gateway.createPayment(request);
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    return this.gateway.checkPaymentStatus(request);
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(
    request: CancelPaymentRequest
  ): Promise<CancelPaymentResponse> {
    return this.gateway.cancelPayment(request);
  }

  /**
   * Parse callback data
   */
  async parseCallback(
    headers: Record<string, string>,
    body: any
  ): Promise<PaymentCallbackData | null> {
    return this.gateway.parseCallback(headers, body);
  }

  /**
   * Verify callback signature
   */
  async verifyCallbackSignature(
    headers: Record<string, string>,
    body: any
  ): Promise<boolean> {
    return this.gateway.verifyCallbackSignature(headers, body);
  }

  /**
   * Get callback success response
   */
  getCallbackSuccessResponse(): any {
    return this.gateway.getCallbackSuccessResponse();
  }
}

// Export singleton instance
let paymentServiceInstance: PaymentService | null = null;

export const getPaymentService = (
  provider?: PaymentGatewayProvider
): PaymentService => {
  if (!paymentServiceInstance || provider) {
    paymentServiceInstance = new PaymentService(provider);
  }
  return paymentServiceInstance;
};

// Re-export interfaces
export * from './paymentGatewayInterface';
