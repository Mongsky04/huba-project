# Token Usage Feature - Quick Start

## 📌 Overview
Fitur ini memungkinkan user untuk menggunakan token dari license key mereka. **Setiap hit otomatis mengurangi 1 token**.

## 🎯 Endpoint

```
POST /api/user/license-keys/:licenseKey/use-token
```

**Authentication:** Bearer Token (JWT)  
**Request Body:** Optional (bisa kosong)

## 🚀 Quick Example

### Tanpa Body (Simple)
```bash
curl -X POST https://your-api.com/api/user/license-keys/ABC12-XYZ34/use-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Dengan Purpose & Metadata (Optional)
```bash
curl -X POST https://your-api.com/api/user/license-keys/ABC12-XYZ34/use-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "API request",
    "metadata": {
      "endpoint": "/api/data"
    }
  }'
```

## 📋 Response

```json
{
  "success": true,
  "message": "Token used successfully",
  "data": {
    "license_key": "ABC12-XYZ34",
    "previous_balance": 100,
    "new_balance": 99,
    "tokens_used": 1
  }
}
```

## 📚 Documentation

- **Full API Documentation**: See [TOKEN_USAGE.md](./database/TOKEN_USAGE.md)
- **Database Migration**: Run [migration_token_usage.sql](./database/migration_token_usage.sql)
- **Test Script**: Run [token_usage_test.sh](./example_curl/token_usage_test.sh)

## 🔧 Setup

### 1. Database Already Setup
Table `token_usage` sudah termasuk dalam `schema.sql`. Tidak perlu migration terpisah.

### 2. Deploy API
```bash
npm run build
npm start
```

### 3. Test Endpoint
```bash
# Edit credentials in the script first
./example_curl/token_usage_test.sh
```

## ✅ Validation Rules

- ✓ User harus terautentikasi
- ✓ License key harus dimiliki oleh user
- ✓ License status harus `active` atau `trial`
- ✓ Token balance harus >= 1
- ✓ Setiap hit mengurangi tepat 1 token

## 📊 Key Features

- **Fixed Token Consumption**: Always 1 token per hit
- **Audit Trail**: All usage logged with timestamp
- **Flexible Metadata**: Store additional info in JSONB
- **Automatic Status Update**: License becomes inactive when balance = 0
- **History Tracking**: Complete usage history per license

## 🔍 Query Usage History

```sql
SELECT * FROM token_usage 
WHERE license_key_id = 'YOUR_LICENSE_ID'
ORDER BY created_at DESC;
```

## 💡 Use Cases

1. **API Rate Limiting**: Track API calls per license
2. **Usage Analytics**: Monitor token consumption patterns
3. **Billing**: Generate usage reports for customers
4. **Auditing**: Complete trail of token usage

## 📞 Support

For questions or issues, please refer to:
- Main README: [README.md](./README.md)
- Database Schema: [schema.sql](./database/schema.sql)
- API Documentation: Available at `/api-docs` when server is running
