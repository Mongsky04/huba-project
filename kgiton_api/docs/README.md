# 📚 KGiTON API Documentation

Dokumentasi lengkap untuk KGiTON API - License & Token Management System.

## 📑 Table of Contents

### 🗄️ Database Documentation
- **[DATABASE.md](./DATABASE.md)** - Database setup dan struktur lengkap
- **[REFERRAL_SYSTEM.md](./REFERRAL_SYSTEM.md)** - Sistem referral dan bonus
- **[TOKEN_USAGE.md](./TOKEN_USAGE.md)** - Detail sistem penggunaan token
- **[TOKEN_USAGE_QUICKSTART.md](./TOKEN_USAGE_QUICKSTART.md)** - Quick start guide token usage

### 💳 Top-up & Payment Documentation
- **[TOPUP_API.md](./TOPUP_API.md)** - API endpoints untuk top-up
- **[TOPUP_FLOW.md](./TOPUP_FLOW.md)** - Flow lengkap proses top-up dan payment
- **[WINPAY_INTEGRATION.md](./WINPAY_INTEGRATION.md)** - 🆕 Integrasi Winpay Payment Gateway

---

## 🚀 Quick Start

### 1. Database Setup
```bash
# Jalankan di Supabase SQL Editor
# Copy-paste seluruh isi schema.sql dan Run
```

📖 Detail: [DATABASE.md](./DATABASE.md)

### 2. Create Super Admin
```bash
# Via API (Recommended)
curl -X POST http://localhost:3000/api/setup/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "name": "Super Admin"
  }'
```

### 3. Main Features

#### 🔑 License Key Management
- Create license keys (Super Admin only)
- Assign license keys to users
- Set trial mode
- Add token balance

#### 💰 Token System
- **Top-up**: User can buy tokens → [TOPUP_API.md](./TOPUP_API.md)
- **Usage**: Use tokens (1 token per hit) → [TOKEN_USAGE.md](./TOKEN_USAGE.md)
- **Balance**: Check token balance
- **History**: Track all token transactions

#### 👥 Referral System
- Unique referral codes for users
- 1000 token bonus for referrer
- 1000 token bonus for referee
📖 Detail: [REFERRAL_SYSTEM.md](./REFERRAL_SYSTEM.md)

---

## 🔧 API Endpoints Overview

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/verify-email      - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
```

### User Endpoints
```
GET    /api/user/profile                          - Get user profile
GET    /api/user/token-balance                    - Get token balance
POST   /api/user/license-keys/:licenseKey/use-token  - Use 1 token (no body required)
```

### Top-up Endpoints
```
POST   /api/topup/request          - Request top-up
POST   /api/webhook/payment        - Payment webhook
GET    /api/topup/transactions     - Get user transactions
GET    /api/topup/transaction/:id  - Get transaction detail
```

### Admin Endpoints (Super Admin Only)
```
POST   /api/admin/license-keys                    - Create license key
GET    /api/admin/license-keys                    - Get all license keys
GET    /api/admin/license-keys/:key               - Get license key detail
PUT    /api/admin/license-keys/:key               - Update license key
DELETE /api/admin/license-keys/:key               - Delete license key
POST   /api/admin/license-keys/:key/trial         - Set trial mode
POST   /api/admin/license-keys/:key/add-tokens    - Add token balance
POST   /api/admin/license-keys/:key/unassign      - Unassign license key
POST   /api/admin/license-keys/bulk               - Bulk create license keys
POST   /api/admin/license-keys/bulk/csv           - Bulk upload from CSV
```

📖 Full API Documentation: Available at `/api-docs` when server is running

---

## 📊 Database Tables

### Core Tables
- `users` - User accounts (extends Supabase auth)
- `license_keys` - License keys dengan token balance
- `transactions` - Top-up transactions
- `token_usage` - Token usage history
- `token_balance_logs` - Admin token additions

### Supporting Tables
- `pending_registrations` - Email verification
- `password_reset_tokens` - Password reset

📖 Detail Schema: [DATABASE.md](./DATABASE.md)

---

## 🔐 Security Features

### Row Level Security (RLS)
- ✅ Super Admin: Full access ke semua data
- ✅ Regular User: Hanya bisa akses data sendiri
- ✅ Service Role: Bypass RLS untuk backend operations

### Authentication
- ✅ JWT Bearer Token
- ✅ Email verification required
- ✅ Secure password reset flow
- ✅ API key untuk setiap user

---

## 📈 Token System Flow

### Top-up Flow
```
1. User request top-up
   ↓
2. System create PENDING transaction
   ↓
3. User pay via payment gateway
   ↓
4. Payment gateway send webhook
   ↓
5. System update transaction to SUCCESS
   ↓
6. Token added to license key
```

📖 Detail: [TOPUP_FLOW.md](./TOPUP_FLOW.md)

### Token Usage Flow
```
1. User hit use-token endpoint
   ↓
2. System validate ownership & balance
   ↓
3. Reduce 1 token from balance
   ↓
4. Record usage to token_usage table
   ↓
5. Return updated balance
```

📖 Detail: [TOKEN_USAGE.md](./TOKEN_USAGE.md)

---

## 🧪 Testing

### Test Scripts Available
```bash
# Test token usage
./example_curl/token_usage_test.sh

# Test top-up flow
./example_curl/topup_complete_flow.sh
```

---

## 🛠️ Development

### Prerequisites
- Node.js >= 16
- PostgreSQL (via Supabase)
- Supabase account

### Environment Variables
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
PORT=3000
```

### Run Development Server
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

---

## 📞 Support & Resources

- **API Documentation**: `/api-docs` (when server running)
- **Database Schema**: [schema.sql](../database/schema.sql)
- **Migration Scripts**: [migration_token_usage.sql](../database/migration_token_usage.sql)
- **Test Scripts**: [example_curl/](../example_curl/)

---

## 📝 Notes

- Semua timestamp menggunakan `TIMESTAMP WITH TIME ZONE`
- UUID digunakan untuk semua primary keys
- Indexes dibuat untuk optimize query performance
- RLS policies aktif untuk semua tables
- Automatic cleanup functions untuk expired tokens

---

**Last Updated**: December 23, 2025  
**Version**: 1.0.0
