# Winpay Payment Gateway Integration

Dokumentasi lengkap integrasi Winpay sebagai payment gateway untuk top-up token balance KGiTON.

## 📋 Overview

KGiTON menggunakan [Winpay](https://winpay.id) sebagai payment gateway utama dengan dua metode integrasi:

1. **Checkout Page** - Halaman pembayaran all-in-one (VA, QRIS, eWallet)
2. **SNAP API** - Direct API untuk Virtual Account spesifik bank

## 🔧 Setup & Configuration

### 1. Daftar di Winpay

1. Kunjungi [https://dashboard.winpay.id](https://dashboard.winpay.id)
2. Daftar sebagai merchant
3. Dapatkan credentials:
   - **Partner ID** (untuk SNAP API)
   - **Private Key** (untuk SNAP API signature)
   - **Checkout Key** (untuk Checkout Page)
   - **Checkout Secret** (untuk Checkout Page signature)

### 2. Generate RSA Key Pair (untuk SNAP API)

```bash
# Generate private key
openssl genrsa -out winpay-private-key.pem 2048

# Generate public key (untuk didaftarkan ke Winpay)
openssl rsa -in winpay-private-key.pem -pubout -out winpay-public-key.pem
```

### 3. Konfigurasi Environment

Tambahkan ke file `.env`:

```env
# Winpay SNAP API
WINPAY_PARTNER_ID=your-partner-id
WINPAY_PRIVATE_KEY_PATH=./keys/winpay-private-key.pem
# atau langsung content (untuk Docker/Cloud):
# WINPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Winpay Checkout Page
WINPAY_CHECKOUT_KEY=your-checkout-key
WINPAY_CHECKOUT_SECRET=your-checkout-secret

# Common
WINPAY_BACK_URL=https://your-app.com/payment/complete
WINPAY_ENABLED=true
```

### 4. Daftarkan Webhook URL di Winpay Dashboard

Daftarkan URL callback berikut di Winpay Dashboard:

| Tipe | URL Callback |
|------|--------------|
| SNAP VA Callback | `https://your-api.com/api/webhook/winpay/va` |
| Checkout Callback | `https://your-api.com/api/webhook/winpay/checkout` |

### 5. Jalankan Database Migration

```bash
# Jalankan di Supabase SQL Editor
-- Lihat file: database/migration_winpay.sql
```

## 💳 Payment Methods

### Checkout Page (Recommended)

User diarahkan ke halaman Winpay yang menampilkan semua metode pembayaran:

- Virtual Account (semua bank)
- QRIS
- eWallet (OVO, DANA, ShopeePay, dll)
- Retail (Indomaret, Alfamart)

### Direct Virtual Account

Langsung generate nomor VA untuk bank tertentu:

| ID | Bank |
|----|------|
| `va_bri` | Bank Rakyat Indonesia |
| `va_bni` | Bank Negara Indonesia |
| `va_bca` | Bank Central Asia |
| `va_mandiri` | Bank Mandiri |
| `va_permata` | Bank Permata |
| `va_bsi` | Bank Syariah Indonesia |
| `va_cimb` | Bank CIMB Niaga |

## 🔗 API Endpoints

### 1. Get Payment Methods

```http
GET /api/topup/payment-methods
Authorization: Bearer {token}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "checkout_page",
      "name": "Winpay Checkout Page",
      "description": "All payment methods in one page",
      "type": "checkout",
      "enabled": true
    },
    {
      "id": "va_bri",
      "name": "Virtual Account BRI",
      "description": "Bank Rakyat Indonesia",
      "type": "va",
      "enabled": true
    }
  ]
}
```

### 2. Create Top-up Request

```http
POST /api/topup/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "token_count": 1000,
  "license_key": "XXXXX-XXXXX-XXXXX-XXXXX",
  "payment_method": "checkout_page",
  "customer_phone": "08123456789"
}
```

**Response (Checkout Page):**
```json
{
  "success": true,
  "message": "Top-up request created. Please complete the payment.",
  "data": {
    "transaction_id": "abc123-xxx-xxx",
    "license_key": "XXXXX-XXXXX-XXXXX-XXXXX",
    "tokens_requested": 1000,
    "amount_to_pay": 55000,
    "price_per_token": 55,
    "status": "PENDING",
    "payment_method": "checkout_page",
    "payment_url": "https://checkout.winpay.id/xyz123",
    "invoice_id": "inv-abc123",
    "expires_at": "2024-12-25T10:00:00Z"
  }
}
```

**Response (Virtual Account):**
```json
{
  "success": true,
  "message": "Top-up request created. Please complete the payment.",
  "data": {
    "transaction_id": "abc123-xxx-xxx",
    "license_key": "XXXXX-XXXXX-XXXXX-XXXXX",
    "tokens_requested": 1000,
    "amount_to_pay": 55000,
    "status": "PENDING",
    "payment_method": "va_bri",
    "virtual_account": {
      "number": "123456789012345",
      "name": "John Doe",
      "bank": "BRI"
    },
    "contract_id": "ci-xxx-xxx",
    "expires_at": "2024-12-26T10:00:00Z"
  }
}
```

### 3. Check Transaction Status

```http
GET /api/topup/status/{transaction_id}
Authorization: Bearer {token}
```

### 4. Cancel Transaction

```http
POST /api/topup/cancel/{transaction_id}
Authorization: Bearer {token}
```

## 🔔 Webhook Callbacks

### SNAP VA Callback

**Endpoint:** `POST /api/webhook/winpay/va`

Dipanggil oleh Winpay saat pembayaran VA berhasil.

**Request dari Winpay:**
```json
{
  "partnerServiceId": "   22691",
  "customerNo": "41693903614",
  "virtualAccountNo": "   2269141693903614",
  "virtualAccountName": "John Doe",
  "trxId": "abc123-xxx-xxx",
  "paymentRequestId": "88889123",
  "paidAmount": {
    "value": "55000",
    "currency": "IDR"
  },
  "trxDateTime": "2024-12-24T22:47:00+07:00",
  "referenceNo": "36238",
  "additionalInfo": {
    "channel": "BRI",
    "contractId": "ci71a51730-xxx"
  }
}
```

**Expected Response:**
```json
{
  "responseCode": "2002500",
  "responseMessage": "Successful"
}
```

### Checkout Page Callback

**Endpoint:** `POST /api/webhook/winpay/checkout`

Dipanggil oleh Winpay saat pembayaran via Checkout Page berhasil.

**Request dari Winpay:**
```json
{
  "uuid": "40777df1-xxx",
  "created_at": "2024-12-24T10:48:00+07:00",
  "ref": "abc123-xxx-xxx",
  "channel": "BSI",
  "amount": 55000,
  "fee": 0,
  "nett_amount": 55000,
  "products": [...],
  "invoice": {
    "uuid": "f6bd0574-xxx",
    "ref": "abc123-xxx-xxx",
    "url": "https://checkout.winpay.id/xxx",
    "customer": {...}
  }
}
```

**Expected Response:** String `ACCEPTED`

## 📊 Transaction Flow

```
┌─────────────────┐
│   User Request  │
│   Top-up API    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create PENDING  │
│  Transaction    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Call Winpay    │
│  Create VA/     │
│  Checkout       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Payment  │
│  URL / VA Info  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Completes │
│    Payment      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Winpay Callback │
│  to Webhook     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Status   │
│   SUCCESS +     │
│  Add Tokens     │
└─────────────────┘
```

## 🧪 Testing

### Development Environment

Gunakan Winpay Sandbox:
- SNAP API: `https://sandbox-api.bmstaging.id/snap`
- Checkout: `https://checkout.bmstaging.id`

### Manual Webhook Simulation

```bash
# Simulasi VA Callback
curl -X POST 'http://localhost:3000/api/webhook/winpay/va' \
  -H 'Content-Type: application/json' \
  -d '{
    "trxId": "YOUR_TRANSACTION_ID",
    "paidAmount": {"value": "55000", "currency": "IDR"},
    "referenceNo": "12345",
    "additionalInfo": {"channel": "BRI", "contractId": "ci-xxx"}
  }'

# Simulasi Checkout Callback
curl -X POST 'http://localhost:3000/api/webhook/winpay/checkout' \
  -H 'Content-Type: application/json' \
  -d '{
    "uuid": "inv-xxx",
    "ref": "YOUR_TRANSACTION_ID",
    "channel": "QRIS",
    "amount": 55000
  }'
```

## ⚠️ Important Notes

1. **Transaction ID as Reference**
   - `trxId` di Winpay = `transaction_id` di database kita
   - `ref` di Checkout Page = `transaction_id` di database kita

2. **Signature Verification**
   - SNAP API menggunakan RSA-SHA256
   - Checkout Page menggunakan HMAC-SHA256

3. **Expiry Time**
   - Checkout Page: 2 jam (default)
   - Virtual Account: 24 jam (default)
   - Dapat dikonfigurasi per request

4. **Retry Mechanism**
   - Winpay akan retry callback 3x jika tidak mendapat response yang benar
   - Selalu return success response untuk menghindari duplicate processing

5. **Production Checklist**
   - [ ] Daftarkan public key ke Winpay
   - [ ] Konfigurasi callback URL di Winpay Dashboard
   - [ ] Test semua payment method
   - [ ] Pastikan HTTPS untuk webhook endpoint

## 📚 References

- [Winpay Documentation](https://docs.winpay.id)
- [SNAP API Overview](https://docs.winpay.id/docs/payments/snap-api/overview)
- [Checkout Page Overview](https://docs.winpay.id/docs/payments/checkout-page/overview)
