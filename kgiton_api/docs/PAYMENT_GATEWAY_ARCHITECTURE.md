# Payment Gateway Architecture

## Overview

KGiTON API menggunakan arsitektur payment gateway yang **robust dan modular**, memungkinkan switching antara berbagai payment provider dengan mudah.

## Supported Payment Gateways

| Provider   | Status       | Features                                    |
|------------|--------------|---------------------------------------------|
| **Winpay** | ✅ Fully Implemented | Checkout Page, SNAP VA, QRIS, eWallet  |
| **Xendit** | 🔧 Stub Ready | Invoice, VA, eWallet, QRIS               |
| **Midtrans** | 🔧 Stub Ready | Snap, VA, GoPay, ShopeePay, QRIS        |
| **Manual** | ✅ Implemented | Manual bank transfer with admin verification |

## Architecture

```
src/services/payment/
├── index.ts                    # Central exports
├── paymentGatewayInterface.ts  # Interface & types
├── paymentGatewayFactory.ts    # Factory pattern & PaymentService
└── gateways/
    ├── winpayGateway.ts        # Winpay implementation
    ├── xenditGateway.ts        # Xendit stub
    ├── midtransGateway.ts      # Midtrans stub
    └── manualGateway.ts        # Manual payment mode
```

## Quick Start

### 1. Configure Payment Gateway

Edit `.env` file:

```bash
# Choose payment gateway provider
PAYMENT_GATEWAY_PROVIDER=winpay   # winpay | xendit | midtrans | manual

# Enable/disable payment gateway
PAYMENT_GATEWAY_ENABLED=true

# Common settings
PAYMENT_REDIRECT_URL=https://your-app.com/payment/complete
PAYMENT_CHECKOUT_EXPIRY_MINUTES=120
PAYMENT_VA_EXPIRY_MINUTES=1440
```

### 2. Provider-Specific Configuration

#### Winpay
```bash
WINPAY_PARTNER_ID=your-partner-id
WINPAY_PRIVATE_KEY_PATH=./keys/winpay-private-key.pem
WINPAY_CHECKOUT_KEY=your-checkout-key
WINPAY_CHECKOUT_SECRET=your-checkout-secret
```

#### Xendit
```bash
XENDIT_SECRET_KEY=xnd_production_xxx
XENDIT_PUBLIC_KEY=xnd_public_xxx
XENDIT_WEBHOOK_TOKEN=your-webhook-token
```

#### Midtrans
```bash
MIDTRANS_SERVER_KEY=Mid-server-xxx
MIDTRANS_CLIENT_KEY=Mid-client-xxx
MIDTRANS_MERCHANT_ID=your-merchant-id
```

## Usage

### Using PaymentService

```typescript
import { PaymentService, PaymentMethodType, VirtualAccountBank } from '../services/payment';

const paymentService = new PaymentService();

// Get available payment methods
const methods = await paymentService.getAvailablePaymentMethods();

// Create a payment (Checkout Page)
const result = await paymentService.createPayment({
  transactionId: 'tx-123',
  amount: 100000,
  methodType: PaymentMethodType.CHECKOUT_PAGE,
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '08123456789',
  },
  items: [{ id: 'token', name: 'Token Top-up', price: 100000, quantity: 1 }],
});

// Create VA payment
const vaResult = await paymentService.createPayment({
  transactionId: 'tx-123',
  amount: 100000,
  methodType: PaymentMethodType.VIRTUAL_ACCOUNT,
  bank: VirtualAccountBank.BCA,
  customer: { name: 'John', email: 'john@example.com', phone: '08123456789' },
  items: [{ id: 'token', name: 'Token', price: 100000, quantity: 1 }],
});
```

### Handling Webhooks

```typescript
import { PaymentService, PaymentStatus } from '../services/payment';

const paymentService = new PaymentService();

// In webhook handler
const isValid = await paymentService.verifyCallbackSignature(headers, body);
const callbackData = await paymentService.parseCallback(headers, body);

if (callbackData?.status === PaymentStatus.SUCCESS) {
  // Process successful payment
}

// Return proper response to gateway
res.json(paymentService.getCallbackSuccessResponse());
```

## Switching Payment Gateway

### Step 1: Update Environment
```bash
# From Winpay to Xendit
PAYMENT_GATEWAY_PROVIDER=xendit
```

### Step 2: Add Provider Credentials
```bash
XENDIT_SECRET_KEY=xnd_production_xxx
XENDIT_PUBLIC_KEY=xnd_public_xxx
XENDIT_WEBHOOK_TOKEN=your-webhook-token
```

### Step 3: Update Webhook URLs
Register these webhook URLs at the new provider's dashboard:

```
Universal: /api/webhook/payment/callback
```

**That's it!** No code changes required.

## API Endpoints

### Top-up Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/topup/request` | POST | Create new top-up transaction |
| `/api/topup/payment-methods` | GET | Get available payment methods |
| `/api/topup/cancel/:transaction_id` | POST | Cancel pending transaction |
| `/api/topup/status/:transaction_id` | GET | Check transaction status |

### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhook/payment/callback` | POST | Universal callback for all gateways |
| `/api/webhook/winpay/va` | POST | Winpay VA-specific callback |
| `/api/webhook/winpay/checkout` | POST | Winpay Checkout-specific callback |

## Payment Method Types

```typescript
enum PaymentMethodType {
  CHECKOUT_PAGE = 'checkout_page',  // All-in-one payment page
  VIRTUAL_ACCOUNT = 'virtual_account',
  EWALLET = 'ewallet',
  QRIS = 'qris',
  CREDIT_CARD = 'credit_card',
  RETAIL = 'retail',
  MANUAL = 'manual',
}
```

## Payment Status Flow

```
PENDING → SUCCESS (Payment completed)
PENDING → FAILED (Payment failed)
PENDING → EXPIRED (Payment timed out)
PENDING → CANCELLED (User/Admin cancelled)
```

## Database Schema

New columns for gateway abstraction:

```sql
ALTER TABLE transactions ADD COLUMN gateway_provider VARCHAR(50);
ALTER TABLE transactions ADD COLUMN gateway_transaction_id TEXT;
ALTER TABLE transactions ADD COLUMN gateway_va_number VARCHAR(100);
ALTER TABLE transactions ADD COLUMN gateway_channel VARCHAR(50);
ALTER TABLE transactions ADD COLUMN gateway_payment_url TEXT;
```

Run migration:
```bash
psql -d your_database -f database/migration_payment_gateway.sql
```

## Implementing New Gateway

1. Create new file: `src/services/payment/gateways/newGateway.ts`
2. Implement `IPaymentGateway` interface
3. Add to factory: `paymentGatewayFactory.ts`
4. Add provider to enum in `paymentGatewayInterface.ts`
5. Update `.env.example` with new config variables

### Interface to Implement

```typescript
interface IPaymentGateway {
  readonly provider: PaymentGatewayProvider;
  
  getAvailablePaymentMethods(): Promise<PaymentMethodInfo[]>;
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  checkPaymentStatus(request: CheckPaymentStatusRequest): Promise<CheckPaymentStatusResponse>;
  cancelPayment(request: CancelPaymentRequest): Promise<CancelPaymentResponse>;
  parseCallback(headers: Record<string, string>, body: any): Promise<PaymentCallbackData | null>;
  verifyCallbackSignature(headers: Record<string, string>, body: any): Promise<boolean>;
  getCallbackSuccessResponse(): any;
}
```

## Security Considerations

1. **Callback Verification**: Each gateway has its own signature verification method
2. **HTTPS Only**: All webhook URLs must use HTTPS in production
3. **IP Whitelisting**: Consider whitelisting gateway IPs for callbacks
4. **Token Expiry**: Default 2 hours for checkout, 24 hours for VA

## Troubleshooting

### Gateway Not Working
1. Check `PAYMENT_GATEWAY_ENABLED=true`
2. Verify provider credentials
3. Check logs for API errors

### Webhook Not Received
1. Verify webhook URL registered at provider dashboard
2. Check callback URL is publicly accessible
3. Review gateway's webhook logs

### Signature Verification Failed
1. Ensure secrets match between provider and `.env`
2. Check for trailing/leading whitespace in keys
