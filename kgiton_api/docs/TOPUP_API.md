# Top-up API Testing Examples

Dokumentasi dan contoh testing untuk API top-up KGiTON.

## 📋 Overview

Sistem top-up menggunakan flow **request → payment → webhook callback**:

1. **User request top-up** → Sistem buat transaksi PENDING
2. **User bayar** → Di payment gateway (Midtrans/Xendit/dll)  
3. **Payment gateway callback** → Webhook update status SUCCESS + tambah token
4. **User cek status** → Optional, untuk tracking pembayaran

## 🔗 Endpoints

| Endpoint | Method | Auth | Deskripsi |
|----------|--------|------|-----------|
| `/api/topup/request` | POST | ✅ Bearer | Buat request top-up (PENDING) |
| `/api/webhook/payment` | POST | ❌ Secret | Webhook dari payment gateway |
| `/api/topup/status/{id}` | GET | ✅ Bearer | Cek status transaksi |
| `/api/topup/history` | GET | ✅ Bearer | Riwayat transaksi user |

## 🚀 Quick Start

### 1. Manual Testing (Step by Step)

Lihat file [topup.md](./topup.md) untuk contoh lengkap dengan curl commands.

### 2. Automated Testing Script

Jalankan script bash untuk testing flow lengkap:

```bash
./topup_complete_flow.sh
```

Script ini akan:
- Create top-up request
- Simulate payment webhook (success)
- Check transaction status

**Note:** Edit variable di script sesuai kebutuhan Anda:
- `BASE_URL` - URL API Anda
- `AUTH_TOKEN` - Bearer token dari login
- `LICENSE_KEY` - License key yang valid
- `TOKEN_COUNT` - Jumlah token yang ingin di-top-up

## 📝 Testing Flow

### Step 1: Request Top-up

```bash
curl -X POST 'http://localhost:3000/api/topup/request' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "token_count": 750,
    "license_key": "YOUR_LICENSE_KEY"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Top-up request created. Please complete the payment.",
  "data": {
    "transaction_id": "xxx-xxx-xxx",
    "status": "PENDING",
    "amount_to_pay": 41250,
    "payment_url": "https://payment-gateway.example.com/pay/xxx"
  }
}
```

### Step 2: Simulate Payment (Webhook)

```bash
curl -X POST 'http://localhost:3000/api/webhook/payment' \
  -H 'Content-Type: application/json' \
  -d '{
    "transaction_id": "xxx-xxx-xxx",
    "order_id": "ORDER-123",
    "status": "success"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment processed and tokens added",
  "data": {
    "transaction_id": "xxx-xxx-xxx",
    "status": "SUCCESS",
    "tokens_added": 750,
    "new_balance": 750
  }
}
```

### Step 3: Check Status

```bash
curl -X GET 'http://localhost:3000/api/topup/status/xxx-xxx-xxx' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## 🔐 Security

### Webhook Secret (Production)

Untuk production, set webhook secret di `.env`:

```env
WEBHOOK_SECRET=your_very_secret_key_here
```

Payment gateway harus mengirim header:

```bash
-H 'x-webhook-secret: your_very_secret_key_here'
```

### Testing vs Production

| Environment | Webhook Secret | Payment URL |
|-------------|---------------|-------------|
| **Development** | Optional | Simulasi (langsung call webhook) |
| **Production** | Required | Real payment gateway (Midtrans/Xendit) |

## ⚠️ Important Notes

1. **Payment URL**: Di production, `payment_url` didapat dari payment gateway API setelah create order
2. **Webhook**: Di production, webhook dipanggil oleh payment gateway, bukan manual
3. **Transaction Status**: 
   - `PENDING` → Menunggu pembayaran
   - `SUCCESS` → Pembayaran berhasil, token sudah ditambahkan
   - `FAILED` → Pembayaran gagal

## 🔄 Integration dengan Payment Gateway

Contoh integrasi dengan Midtrans/Xendit:

```typescript
// Saat request top-up
const paymentGatewayResponse = await createMidtransOrder({
  order_id: transactionData.id,
  amount: totalAmount,
  customer_details: { ... }
});

// Gunakan URL dari payment gateway
const paymentUrl = paymentGatewayResponse.redirect_url;
```

Payment gateway akan otomatis memanggil `/api/webhook/payment` setelah user bayar.

## 📚 Additional Resources

- [Midtrans Documentation](https://docs.midtrans.com)
- [Xendit Documentation](https://developers.xendit.co)
- [API Swagger Documentation](http://localhost:3000/api-docs)

## 🐛 Troubleshooting

### Transaction tidak SUCCESS setelah webhook

Cek:
1. ✅ `transaction_id` benar
2. ✅ Status kirim `"success"` (lowercase)
3. ✅ Transaksi masih PENDING (belum diproses sebelumnya)

### Webhook gagal validasi

Cek:
1. ✅ `WEBHOOK_SECRET` di .env sudah benar
2. ✅ Header `x-webhook-secret` sesuai dengan .env
3. ✅ Format body JSON benar

### Token tidak bertambah

Cek:
1. ✅ Webhook response success
2. ✅ Transaction status jadi SUCCESS
3. ✅ License key balance di database

---

**Need Help?** Check [topup.md](./topup.md) for detailed examples.
