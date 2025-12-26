/**
 * Payment Gateway Interface
 *
 * Abstract interface that all payment gateways must implement.
 * This allows easy switching between different payment providers
 * (Winpay, Xendit, Midtrans, etc.)
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

/**
 * Supported payment gateway providers
 */
export enum PaymentGatewayProvider {
  WINPAY = 'winpay',
  XENDIT = 'xendit',
  MIDTRANS = 'midtrans',
  MANUAL = 'manual', // For testing/development
}

/**
 * Payment method categories
 */
export enum PaymentMethodType {
  CHECKOUT_PAGE = 'checkout_page', // All-in-one hosted page
  VIRTUAL_ACCOUNT = 'virtual_account',
  EWALLET = 'ewallet',
  QRIS = 'qris',
  CREDIT_CARD = 'credit_card',
  RETAIL = 'retail', // Indomaret, Alfamart
  MANUAL = 'manual',
}

/**
 * Payment status from gateway
 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Supported banks for Virtual Account
 */
export enum VirtualAccountBank {
  BRI = 'bri',
  BNI = 'bni',
  BCA = 'bca',
  MANDIRI = 'mandiri',
  PERMATA = 'permata',
  BSI = 'bsi',
  CIMB = 'cimb',
  SINARMAS = 'sinarmas',
  MUAMALAT = 'muamalat',
  // Retail
  INDOMARET = 'indomaret',
  ALFAMART = 'alfamart',
}

/**
 * Supported eWallets
 */
export enum EWalletType {
  OVO = 'ovo',
  DANA = 'dana',
  GOPAY = 'gopay',
  SHOPEEPAY = 'shopeepay',
  LINKAJA = 'linkaja',
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

/**
 * Customer information for payment
 */
export interface PaymentCustomer {
  name: string;
  email?: string;
  phone: string;
}

/**
 * Product/item information for payment
 */
export interface PaymentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

/**
 * Request to create a payment
 */
export interface CreatePaymentRequest {
  /** Unique transaction ID from our system */
  transactionId: string;
  /** Total amount in IDR */
  amount: number;
  /** Customer information */
  customer: PaymentCustomer;
  /** Items being purchased */
  items: PaymentItem[];
  /** Payment method type */
  methodType: PaymentMethodType;
  /** Specific bank for VA (optional) */
  bank?: VirtualAccountBank;
  /** Specific eWallet (optional) */
  ewallet?: EWalletType;
  /** Expiry time in minutes */
  expiryMinutes?: number;
  /** URL to redirect after payment */
  redirectUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Response from creating a payment
 */
export interface CreatePaymentResponse {
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Gateway-specific transaction/order ID */
  gatewayTransactionId?: string;
  /** Payment URL for checkout page or redirect */
  paymentUrl?: string;
  /** Snap token (for Midtrans Snap) */
  snapToken?: string;
  /** Virtual Account details */
  virtualAccount?: {
    number: string;
    name?: string;
    bank: string;
  };
  /** QRIS details */
  qris?: {
    qrString: string;
    qrImageUrl?: string;
  };
  /** eWallet details */
  ewallet?: {
    type: string;
    deepLinkUrl?: string;
    qrString?: string;
  };
  /** Manual payment details */
  manualPayment?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    referenceCode: string;
    instructions: string;
  };
  /** Payment code for retail */
  retailPaymentCode?: string;
  /** When the payment expires */
  expiresAt?: string;
  /** Raw response from gateway (for debugging) */
  rawResponse?: any;
}

/**
 * Request to check payment status
 */
export interface CheckPaymentStatusRequest {
  /** Our transaction ID */
  transactionId: string;
  /** Gateway-specific transaction ID */
  gatewayTransactionId?: string;
  /** Additional identifiers needed by some gateways */
  additionalData?: Record<string, any>;
}

/**
 * Response from checking payment status
 */
export interface CheckPaymentStatusResponse {
  success: boolean;
  error?: string;
  message?: string;
  status: PaymentStatus;
  paidAmount?: number;
  paidAt?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  rawResponse?: any;
}

/**
 * Request to cancel a payment
 */
export interface CancelPaymentRequest {
  transactionId: string;
  gatewayTransactionId?: string;
  reason?: string;
  additionalData?: Record<string, any>;
}

/**
 * Response from cancelling a payment
 */
export interface CancelPaymentResponse {
  success: boolean;
  error?: string;
  rawResponse?: any;
}

/**
 * Parsed callback/webhook data from gateway
 */
export interface PaymentCallbackData {
  /** Our transaction ID */
  transactionId: string;
  /** Gateway transaction ID */
  gatewayTransactionId: string;
  /** Payment status */
  status: PaymentStatus;
  /** Amount paid */
  amount?: number;
  /** Payment method used */
  paymentMethod: string;
  /** Payment channel (bank/ewallet name) */
  channel?: string;
  /** Reference number from payment */
  referenceNumber?: string;
  /** When payment was made */
  paidAt?: string;
  /** Fee charged */
  fee?: number;
  /** Net amount after fee */
  netAmount?: number;
  /** Raw callback data */
  rawData: any;
}

/**
 * Available payment method info
 */
export interface PaymentMethodInfo {
  id: string;
  name: string;
  description: string;
  type: PaymentMethodType;
  bank?: VirtualAccountBank;
  ewallet?: EWalletType;
  enabled: boolean;
  /** Minimum amount (if any) */
  minAmount?: number;
  /** Maximum amount (if any) */
  maxAmount?: number;
  /** Fee structure */
  fee?: {
    type: 'fixed' | 'percentage' | 'mixed';
    fixed?: number;
    percentage?: number;
  };
  /** Logo URL */
  logoUrl?: string;
}

// ============================================
// PAYMENT GATEWAY INTERFACE
// ============================================

/**
 * Abstract interface for payment gateway implementations
 */
export interface IPaymentGateway {
  /**
   * Gateway provider identifier
   */
  readonly provider: PaymentGatewayProvider;

  /**
   * Get available payment methods from this gateway
   */
  getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]>;

  /**
   * Create a new payment
   */
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;

  /**
   * Check payment status
   */
  checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse>;

  /**
   * Cancel a pending payment
   */
  cancelPayment(request: CancelPaymentRequest): Promise<CancelPaymentResponse>;

  /**
   * Parse webhook/callback data from the gateway
   * Returns null if the callback is invalid or not from this gateway
   */
  parseCallback(
    headers: Record<string, string>,
    body: any
  ): Promise<PaymentCallbackData | null>;

  /**
   * Verify webhook/callback signature
   * Returns true if valid, false otherwise
   */
  verifyCallbackSignature(
    headers: Record<string, string>,
    body: any
  ): Promise<boolean>;

  /**
   * Get the expected response format for successful callback processing
   * Different gateways expect different response formats
   */
  getCallbackSuccessResponse(): any;
}

// ============================================
// BASE ABSTRACT CLASS
// ============================================

/**
 * Base abstract class with common functionality
 */
export abstract class BasePaymentGateway implements IPaymentGateway {
  abstract readonly provider: PaymentGatewayProvider;

  abstract getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]>;
  abstract createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse>;
  abstract checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse>;
  abstract cancelPayment(
    request: CancelPaymentRequest
  ): Promise<CancelPaymentResponse>;
  abstract parseCallback(
    headers: Record<string, string>,
    body: any
  ): Promise<PaymentCallbackData | null>;
  abstract verifyCallbackSignature(
    headers: Record<string, string>,
    body: any
  ): Promise<boolean>;
  abstract getCallbackSuccessResponse(): any;

  /**
   * Helper: Format amount to string with 2 decimal places
   */
  protected formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Helper: Generate expiry date
   */
  protected generateExpiryDate(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * Helper: Convert bank enum to gateway-specific code
   */
  protected abstract mapBankCode(bank: VirtualAccountBank): string;

  /**
   * Helper: Convert eWallet enum to gateway-specific code
   */
  protected abstract mapEWalletCode(ewallet: EWalletType): string;
}
