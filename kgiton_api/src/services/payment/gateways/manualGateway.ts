/**
 * Manual Payment Gateway Implementation
 *
 * This gateway is used when no external payment gateway is integrated.
 * It creates transactions that require manual verification by admin.
 *
 * Use cases:
 * - Bank transfer with manual confirmation
 * - Cash payment at office
 * - Development/testing environment
 */

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
// MANUAL GATEWAY CONFIGURATION
// ============================================

interface ManualGatewayConfig {
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  companyName: string;
  instructions: string;
  expiryHours: number;
}

const getManualConfig = (): ManualGatewayConfig => {
  return {
    bankName: process.env.MANUAL_BANK_NAME || 'BCA',
    bankAccountNumber:
      process.env.MANUAL_BANK_ACCOUNT_NUMBER || '1234567890',
    bankAccountName:
      process.env.MANUAL_BANK_ACCOUNT_NAME || 'PT KGITON DIGITAL INDONESIA',
    companyName: process.env.COMPANY_NAME || 'KGiTON',
    instructions:
      process.env.MANUAL_PAYMENT_INSTRUCTIONS ||
      'Transfer to the account above and send proof of payment via WhatsApp.',
    expiryHours: parseInt(process.env.MANUAL_PAYMENT_EXPIRY_HOURS || '24'),
  };
};

// ============================================
// MANUAL GATEWAY IMPLEMENTATION
// ============================================

export class ManualGateway extends BasePaymentGateway {
  readonly provider = PaymentGatewayProvider.MANUAL;
  private config: ManualGatewayConfig;

  constructor() {
    super();
    this.config = getManualConfig();
  }

  protected mapBankCode(bank: VirtualAccountBank): string {
    return bank.toUpperCase();
  }

  protected mapEWalletCode(ewallet: EWalletType): string {
    return ewallet.toUpperCase();
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]> {
    return [
      {
        id: 'manual_transfer',
        name: 'Manual Bank Transfer',
        description: `Transfer to ${this.config.bankName} - ${this.config.bankAccountNumber} (${this.config.bankAccountName})`,
        type: PaymentMethodType.MANUAL,
        enabled: true,
      },
      {
        id: 'manual_cash',
        name: 'Cash Payment',
        description: `Pay at ${this.config.companyName} office`,
        type: PaymentMethodType.MANUAL,
        enabled: true,
      },
    ];
  }

  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    const expiryDate = this.generateExpiryDate(
      request.expiryMinutes || this.config.expiryHours * 60
    );

    // Generate a unique reference code for this transaction
    const referenceCode = this.generateReferenceCode(request.transactionId);

    return {
      success: true,
      gatewayTransactionId: request.transactionId,
      manualPayment: {
        bankName: this.config.bankName,
        accountNumber: this.config.bankAccountNumber,
        accountName: this.config.bankAccountName,
        amount: request.amount,
        referenceCode: referenceCode,
        instructions: this.config.instructions,
      },
      expiresAt: expiryDate.toISOString(),
      rawResponse: {
        provider: 'manual',
        transactionId: request.transactionId,
        amount: request.amount,
        expiry: expiryDate.toISOString(),
        referenceCode: referenceCode,
      },
    };
  }

  /**
   * Generate a unique reference code that customer should include in transfer notes
   */
  private generateReferenceCode(transactionId: string): string {
    // Use last 8 characters of transaction ID as reference code
    const shortId = transactionId.replace(/-/g, '').slice(-8).toUpperCase();
    return `PAY-${shortId}`;
  }

  async checkPaymentStatus(
    request: CheckPaymentStatusRequest
  ): Promise<CheckPaymentStatusResponse> {
    // Manual gateway doesn't have external API to check
    // Status is managed manually in database
    return {
      success: true,
      status: PaymentStatus.PENDING,
      message: 'Manual payment requires admin verification',
      rawResponse: {
        provider: 'manual',
        transactionId: request.transactionId,
        message:
          'Check database for current status. Admin must verify payment manually.',
      },
    };
  }

  async cancelPayment(
    request: CancelPaymentRequest
  ): Promise<CancelPaymentResponse> {
    // Manual cancellation just returns success
    // The actual status update is done in database
    return {
      success: true,
      rawResponse: {
        provider: 'manual',
        transactionId: request.transactionId,
        message: 'Transaction marked for cancellation',
      },
    };
  }

  async parseCallback(
    _headers: Record<string, string>,
    body: any
  ): Promise<PaymentCallbackData | null> {
    // Manual gateway typically doesn't receive callbacks
    // This is here for admin-initiated payment confirmations
    const transactionId = body.transaction_id || body.transactionId;
    if (!transactionId) return null;

    let status: PaymentStatus;
    switch (body.status) {
      case 'success':
      case 'paid':
      case 'confirmed':
        status = PaymentStatus.SUCCESS;
        break;
      case 'expired':
        status = PaymentStatus.EXPIRED;
        break;
      case 'cancelled':
        status = PaymentStatus.CANCELLED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    return {
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      amount: body.amount || 0,
      paymentMethod: 'manual',
      channel: body.channel || 'bank_transfer',
      paidAt: body.paid_at || body.confirmedAt,
      rawData: body,
    };
  }

  async verifyCallbackSignature(
    headers: Record<string, string>,
    _body: any
  ): Promise<boolean> {
    // Manual gateway uses internal admin authentication
    // No external signature to verify
    const adminToken = headers['x-admin-token'];
    const expectedToken = process.env.MANUAL_PAYMENT_ADMIN_TOKEN;

    if (!expectedToken) {
      // If no token configured, only allow from internal sources
      return headers['x-internal-source'] === 'true';
    }

    return adminToken === expectedToken;
  }

  getCallbackSuccessResponse(): any {
    return {
      success: true,
      message: 'Manual payment confirmation received',
    };
  }

  /**
   * Additional method for manual gateway: Confirm payment by admin
   * This would be called from admin dashboard
   */
  async confirmPayment(
    transactionId: string,
    adminId: string,
    _proofOfPayment?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // This method provides the data needed to update the transaction
    // The actual database update should be done in the controller
    return {
      success: true,
      message: `Payment ${transactionId} confirmed by admin ${adminId}`,
    };
  }
}
