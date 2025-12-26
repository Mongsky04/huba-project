🎯 Flow Pembayaran (dengan Winpay Payment Gateway)
==================================================

**Dokumentasi lengkap Winpay:** [WINPAY_INTEGRATION.md](./WINPAY_INTEGRATION.md)

**Alur Proses:**
1. User request top-up dengan pilihan payment method → Sistem buat transaksi PENDING
2. Sistem create payment di Winpay → Return payment URL / VA number
3. User bayar via Winpay (Checkout Page atau VA langsung)
4. Winpay kirim webhook ke sistem → Update transaksi SUCCESS + tambah token
5. User bisa cek status transaksi

---

## 1. Get Available Payment Methods

```bash
GET /api/topup/payment-methods
Authorization: Bearer {user_token}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "checkout_page",
      "name": "Winpay Checkout Page",
      "description": "All payment methods in one page (VA, QRIS, eWallet)",
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
    // ... more methods
  ]
}
```

---

## 2. User Request Top-up

### Option A: Checkout Page (Recommended)

```bash
POST /api/topup/request
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "token_count": 750,
  "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
  "payment_method": "checkout_page"
}
```

Response:
```json
{
  "success": true,
  "message": "Top-up request created. Please complete the payment.",
  "data": {
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
    "tokens_requested": 750,
    "amount_to_pay": 41250,
    "price_per_token": 55,
    "status": "PENDING",
    "payment_method": "checkout_page",
    "payment_url": "https://checkout.winpay.id/xyz123abc",
    "invoice_id": "2edff262-6228-4da1-96d7-729bf9fc85f0",
    "expires_at": "2025-12-23T04:38:19.885Z"
  }
}
```

### Option B: Direct Virtual Account

```bash
POST /api/topup/request
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "token_count": 750,
  "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
  "payment_method": "va_bri",
  "customer_phone": "08123456789"
}
```

Response:
```json
{
  "success": true,
  "message": "Top-up request created. Please complete the payment.",
  "data": {
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
    "tokens_requested": 750,
    "amount_to_pay": 41250,
    "price_per_token": 55,
    "status": "PENDING",
    "payment_method": "va_bri",
    "virtual_account": {
      "number": "2269141693898987",
      "name": "John Doe",
      "bank": "BRI"
    },
    "contract_id": "ci80bff69-1073-4811-b1e1-13b738784d8b",
    "expires_at": "2025-12-24T02:38:19.885Z"
  }
}
```

---

## 3. User Completes Payment

### Checkout Page
- User buka `payment_url` di browser
- Pilih metode pembayaran (VA, QRIS, eWallet, dll)
- Selesaikan pembayaran

### Direct VA
- User transfer ke nomor `virtual_account.number` 
- Via ATM, Mobile Banking, atau Internet Banking
- Nominal harus sesuai dengan `amount_to_pay`

---

## 4. Winpay Callback (Automatic)

Setelah pembayaran berhasil, Winpay otomatis memanggil webhook:

### VA Callback
```
POST /api/webhook/winpay/va
```

### Checkout Callback  
```
POST /api/webhook/winpay/checkout
```

**Hasil:**
- Status transaksi diupdate ke `SUCCESS`
- Token balance di license key bertambah

---

## 5. User Check Status (Optional)

```bash
GET /api/topup/status/7e3a9d61-6416-4df4-98df-c140ae7d4584
Authorization: Bearer {user_token}
```

Response:
```json
{
  "success": true,
  "data": {
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
    "amount": 41250,
    "tokens_added": 750,
    "status": "SUCCESS",
    "payment_method": "checkout_page",
    "payment_reference": "WINPAY-CHECKOUT-abc123",
    "created_at": "2025-12-22T02:38:19.885Z"
  }
}
```

---

## 6. Cancel Pending Transaction (Optional)

```bash
POST /api/topup/cancel/7e3a9d61-6416-4df4-98df-c140ae7d4584
Authorization: Bearer {user_token}
```

Response:
```json
{
  "success": true,
  "message": "Transaction cancelled successfully",
  "data": {
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "status": "CANCELLED"
  }
}
```

---

## Transaction Statuses

| Status | Description |
|--------|-------------|
| `pending` | Menunggu pembayaran |
| `success` | Pembayaran berhasil, token sudah ditambahkan |
| `failed` | Pembayaran gagal |
| `expired` | Waktu pembayaran habis |
| `cancelled` | Dibatalkan oleh user |

---

## Payment Methods

| ID | Name | Type |
|----|------|------|
| `checkout_page` | Winpay Checkout Page | All-in-one |
| `va_bri` | Virtual Account BRI | VA |
| `va_bni` | Virtual Account BNI | VA |
| `va_bca` | Virtual Account BCA | VA |
| `va_mandiri` | Virtual Account Mandiri | VA |
| `va_permata` | Virtual Account Permata | VA |
| `va_bsi` | Virtual Account BSI | VA |
| `va_cimb` | Virtual Account CIMB | VA |
| `manual` | Manual Transfer | Manual (legacy) |

---

## Legacy Mode (tanpa Winpay)

Jika `WINPAY_ENABLED=false` di .env, sistem akan menggunakan mode manual:
    "payment_reference": "MIDTRANS-123456",
    "created_at": "2025-12-22T02:38:19.885Z"
  }
}
```


===========================

🔐 Keamanan:
1. Webhook Secret: Set di .env
   ```env
   WEBHOOK_SECRET=your_very_secret_key_here
   ```

2. Payment Gateway harus mengirim header:
   ```
   x-webhook-secret: your_very_secret_key_here
   ```

3. Webhook tidak perlu authentication token karena validasi pakai secret key


===========================

📝 Testing Webhook (Simulasi):

Untuk testing/development, Anda bisa langsung memanggil webhook endpoint untuk mensimulasikan callback dari payment gateway:

**Simulasi Pembayaran Berhasil:**
```bash
curl -X 'POST' \
  'http://localhost:3000/api/webhook/payment' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "order_id": "TEST-ORDER-001",
    "status": "success"
  }'
```

**Simulasi Pembayaran Gagal:**
```bash
curl -X 'POST' \
  'http://localhost:3000/api/webhook/payment' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "7e3a9d61-6416-4df4-98df-c140ae7d4584",
    "order_id": "TEST-ORDER-001",
    "status": "failed"
  }'
```

**Note:** 
- Untuk testing, `x-webhook-secret` header tidak diperlukan jika `WEBHOOK_SECRET` tidak di-set di `.env`
- Dalam production, pastikan set `WEBHOOK_SECRET` dan payment gateway mengirim header yang benar
