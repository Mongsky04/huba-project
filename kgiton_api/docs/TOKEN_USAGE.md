# Token Usage System

## Overview
Sistem penggunaan token yang memungkinkan user untuk menggunakan token dari license key mereka. Setiap hit/request akan otomatis mengurangi **1 token** dari balance.

## Database Schema

### Table: `token_usage`
Table ini mencatat setiap penggunaan token dari license key.

```sql
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key_id UUID NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_balance INTEGER NOT NULL CHECK (previous_balance >= 0),
    new_balance INTEGER NOT NULL CHECK (new_balance >= 0),
    purpose TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier untuk setiap record usage
- `license_key_id`: ID dari license key yang digunakan
- `user_id`: ID dari user yang menggunakan token
- `previous_balance`: Balance sebelum penggunaan
- `new_balance`: Balance setelah penggunaan (previous_balance - 1)
- `purpose`: Deskripsi tujuan penggunaan token (optional)
- `metadata`: Data tambahan dalam format JSON (optional)
- `created_at`: Timestamp saat token digunakan

## API Endpoint

### Use Token
**Endpoint:** `POST /api/user/license-keys/:licenseKey/use-token`

**Authentication:** Required (Bearer Token)

**Description:** Menggunakan 1 token dari license key yang ditentukan. Setiap hit akan otomatis mengurangi 1 token.

**Path Parameters:**
- `licenseKey` (string, required): License key (contoh: `ABC12-XYZ34-QWE56`)

**Request Body (OPTIONAL - Bisa kosong):**
```json
{
  "purpose": "API request",
  "metadata": {
    "endpoint": "/api/data",
    "method": "GET"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token used successfully",
  "data": {
    "license_key": "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E",
    "previous_balance": 100,
    "new_balance": 99,
    "tokens_used": 1
  }
}
```

**Error Responses:**

- **400 Bad Request - Insufficient Balance:**
```json
{
  "success": false,
  "error": "Insufficient token balance"
}
```

- **400 Bad Request - License Not Active:**
```json
{
  "success": false,
  "error": "License key is not active"
}
```

- **403 Forbidden - Not Owner:**
```json
{
  "success": false,
  "error": "You do not have permission to use this license key"
}
```

- **404 Not Found:**
```json
{
  "success": false,
  "error": "License key not found"
}
```

## Usage Examples

### Example 1: Basic Token Usage - Tanpa Body (curl)
```bash
curl -X POST https://api.kgiton.com/api/user/license-keys/CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E/use-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 2: Token Usage dengan Purpose dan Metadata (Optional)
```bash
curl -X POST https://api.kgiton.com/api/user/license-keys/CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E/use-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "Data API request",
    "metadata": {
      "endpoint": "/api/v1/get-data",
      "method": "POST"
    }
  }'
```

### Example 3: JavaScript/Node.js - Simple (No Body)
```javascript
const axios = require('axios');

async function useToken(licenseKey) {
  try {
    const response = await axios.post(
      `https://api.kgiton.com/api/user/license-keys/${licenseKey}/use-token`,
      {}, // Empty body
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    console.log('Token used successfully:', response.data);
    console.log('Remaining balance:', response.data.data.new_balance);
  } catch (error) {
    console.error('Error using token:', error.response.data);
  }
}

useToken('CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E');
```

### Example 4: Python - Simple (No Body)
```python
import requests

def use_token(license_key, jwt_token):
    url = f"https://api.kgiton.com/api/user/license-keys/{license_key}/use-token"
    headers = {
        "Authorization": f"Bearer {jwt_token}"
    }
    
    response = requests.post(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Token used successfully!")
        print(f"Remaining balance: {data['data']['new_balance']}")
    else:
        print(f"Error: {response.json()['error']}")

use_token("CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E", "YOUR_JWT_TOKEN")
```

## Business Logic

### Validation Flow:
1. **Authentication Check**: Pastikan user terautentikasi
2. **License Ownership Check**: Verifikasi bahwa license key dimiliki oleh user
3. **Status Check**: License key harus dalam status `active` atau `trial`
4. **Balance Check**: Token balance harus >= 1
5. **Update Balance**: Kurangi balance sebanyak 1 token
6. **Record Usage**: Simpan record penggunaan ke table `token_usage`

### Automatic Status Update:
Status license key akan otomatis diupdate oleh trigger database:
- Jika `token_balance` menjadi 0 → status berubah ke `inactive`
- License dengan status `inactive` tidak bisa digunakan

## Query Examples

### Get Token Usage History for a License Key
```sql
SELECT 
    tu.id,
    tu.previous_balance,
    tu.new_balance,
    tu.purpose,
    tu.metadata,
    tu.created_at,
    u.name as user_name,
    u.email as user_email
FROM token_usage tu
JOIN users u ON tu.user_id = u.id
WHERE tu.license_key_id = 'YOUR_LICENSE_KEY_ID'
ORDER BY tu.created_at DESC
LIMIT 100;
```

### Get Total Token Usage by User
```sql
SELECT 
    u.name,
    u.email,
    COUNT(tu.id) as total_usage,
    MAX(tu.created_at) as last_usage
FROM users u
JOIN token_usage tu ON u.id = tu.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_usage DESC;
```

### Get Token Usage Statistics
```sql
SELECT 
    DATE(tu.created_at) as usage_date,
    COUNT(*) as total_tokens_used,
    COUNT(DISTINCT tu.user_id) as unique_users,
    COUNT(DISTINCT tu.license_key_id) as unique_licenses
FROM token_usage tu
WHERE tu.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(tu.created_at)
ORDER BY usage_date DESC;
```

## Notes

1. **Fixed Token Usage**: Setiap hit selalu mengurangi **1 token**, tidak bisa mengatur jumlah custom
2. **Transaction Safety**: Update balance dan insert usage record dilakukan dalam sequence, jika insert usage gagal, balance tetap terupdate (logged error)
3. **Metadata Flexibility**: Field `metadata` menggunakan JSONB untuk fleksibilitas data tambahan
4. **Audit Trail**: Semua penggunaan token tercatat dengan timestamp dan detail lengkap

## Database Setup

Table `token_usage` sudah termasuk dalam `database/schema.sql`. 

Jika fresh install, langsung jalankan `schema.sql` dan semua table termasuk `token_usage` akan dibuat otomatis.

**Note:** Table ini sudah memiliki Row Level Security (RLS) policies untuk proteksi data.
