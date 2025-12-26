# KGiTON API - License & Token Management

Backend API untuk mengelola sistem pendaftaran user dengan **License Key** dan **Top-up Transaction**. Sistem ini menangani registrasi user, manajemen License Key, dan pengelolaan token balance.

## 📚 Documentation

**📖 [Complete Documentation →](./docs/README.md)**

### Quick Links:
- **[Database Setup](./docs/DATABASE.md)** - Database schema dan setup
- **[Token Usage System](./docs/TOKEN_USAGE.md)** - Sistem penggunaan token
- **[Top-up Flow](./docs/TOPUP_FLOW.md)** - Proses top-up dan payment
- **[Referral System](./docs/REFERRAL_SYSTEM.md)** - Sistem referral dan bonus

## Features

- **User Registration** dengan License Key & Email Verification
- **Forgot Password** via Email dengan secure token
- **License Key Management** (Super Admin only)
- **Token Balance Management** - Top-up & Usage
- **Token Usage System** - 1 token per hit
- **Top-up Transaction Management**
- **Payment Webhook Integration**
- **Referral System** - Bonus untuk referrer & referee
- **API Documentation** dengan Swagger
- **Authentication** menggunakan Supabase Auth
- **Row Level Security (RLS)** untuk data protection
- **SMTP Email Integration** (Brevo)

## Tech Stack

- **Node.js** dengan **Express**
- **TypeScript**
- **Supabase** (Database & Auth)
- **Swagger** untuk API Documentation
- **Joi** untuk Validation

## Prerequisites

- Node.js (v18 atau lebih tinggi)
- npm atau yarn
- Akun Supabase

## Installation

### 1. Clone Repository

```bash
cd kgiton_api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan credentials Supabase Anda:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-anon-key
SUPABASE_SECRET_KEY=your-secret-service-role-key

API_KEY_PREFIX=kgiton_
WEBHOOK_SECRET=your-webhook-secret

# SMTP Email Configuration (untuk email verification & forgot password)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@example.com
APP_URL=http://localhost:3000
```

### 4. Setup Database

1. Buka Supabase Dashboard → **SQL Editor**
2. Copy semua isi dari file `database/schema.sql`
3. Paste dan Run (Ctrl+Enter)
4. Tunggu sampai selesai

**Schema ini includes:**
- ✅ Core tables (license_keys, users, transactions, voucher_codes)
- ✅ Email verification table (pending_registrations)
- ✅ Password reset table (password_reset_tokens)
- ✅ All indexes, triggers, RLS policies, dan cleanup functions

**Database Tables:**
- `license_keys` - License key management dengan status & assignment ke user
- `users` - User accounts (regular & super admin)
- `transactions` - Transaction history untuk top-up
- `pending_registrations` - Temporary storage untuk email verification (expires 24 jam)
- `password_reset_tokens` - Tokens untuk reset password (expires 1 jam)

### 5. Setup Super Admin

Gunakan create_super_admin.sql untuk membuat admin dan jalankan di supbase sql editor.

**Login Super Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

Setelah server berjalan, buka browser dan akses:

```
http://localhost:3000/api-docs
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user baru dengan license key (kirim email verification)
- `GET /api/auth/verify-email?token=xxx` - Verify email setelah registrasi
- `POST /api/auth/login` - Login dan mendapatkan access token
- `POST /api/auth/forgot-password` - Request password reset (kirim email)
- `GET /api/auth/forgot-password-page` - Halaman form forgot password
- `GET /api/auth/reset-password-page?token=xxx` - Halaman form reset password
- `POST /api/auth/reset-password?token=xxx` - Submit password baru

### License Keys (Super Admin Only)

- `POST /api/admin/license-keys` - Create license key baru
- `GET /api/admin/license-keys` - Get semua license keys
- `GET /api/admin/license-keys/:id` - Get license key by ID
- `PUT /api/admin/license-keys/:id` - Update license key
- `DELETE /api/admin/license-keys/:id` - Delete license key

### Top-up

- `POST /api/topup/request` - Request top-up tokens
- `GET /api/topup/history` - Get top-up history

### User

- `GET /api/user/token-balance` - Get token balance
- `GET /api/user/profile` - Get user profile
- `GET /api/user/transactions` - Get transaction history

### Webhook

- `POST /api/webhook/payment` - Payment webhook endpoint

## Authentication

API menggunakan dua metode autentikasi:

### 1. Bearer Token (untuk user endpoints)

Setelah login, gunakan access token di header:

```
Authorization: Bearer <your-access-token>
```

### 2. API Key (untuk integrasi aplikasi)

Gunakan API key yang didapat saat registrasi:

```
x-api-key: <your-api-key>
```

## Workflow Example

### 1. Super Admin: Create License Key

```bash
POST /api/admin/license-keys
Authorization: Bearer <super-admin-token>

{
  "key": "PREMIUM",
  "price_per_token": 100,
  "token_balance": 0,
  "status": "inactive"
}

# Note: License akan di-assign ke user saat registrasi
# Status akan otomatis berubah menjadi 'active' saat ada token
```

### 2. User: Register dengan License Key

```bash
POST /api/auth/register

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "license_key": "PREMIUM"
}

Response:
{
  "success": true,
  "message": "Registration initiated. Please check your email to verify your account.",
  "data": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Email Verification Flow:**
1. User register → Data disimpan di `pending_registrations`
2. Email verification dikirim (link valid 24 jam)
3. User klik link → Account dibuat & license key di-assign ke user
4. User bisa login

### 3. User: Request Top-up

```bash
POST /api/topup/request
Authorization: Bearer <user-token>

{
  "token_count": 1000,
  "license_key": "PREMIUM"
}

Response:
{
  "success": true,
  "message": "Top-up successful",
  "data": {
    "transaction_id": "uuid-here",
    "tokens_added": 1000,
    "new_balance": 1000
  }
}
```

### 4. Check Token Balance

```bash
GET /api/user/token-balance
Authorization: Bearer <user-token>

Response:
{
  "license_key": "PREMIUM",
  "token_balance": 10000,
  "price_per_token": 100
}
```

## Database Schema

### Core Tables

#### Users Table
- `id` (UUID, Primary Key, references auth.users)
- `name` (string)
- `email` (string, unique)
- `role` (enum: 'super_admin', 'user')
- `api_key` (string, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### License Keys Table
- `id` (UUID, Primary Key)
- `key` (string, unique)
- `price_per_token` (integer)
- `token_balance` (integer, default 0)
- `status` (enum: 'active', 'inactive', 'trial')
- `assigned_to` (UUID, Foreign Key to users)
- `trial_expires_at` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Transactions Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `license_key_id` (UUID, Foreign Key to license_keys)
- `amount` (integer, total payment amount)
- `tokens_added` (integer)
- `status` (enum: 'success', 'failed', 'pending')
- `payment_reference` (string, nullable)
- `created_at` (timestamp)

### Email & Security Tables

#### Pending Registrations Table
- `id` (UUID, Primary Key)
- `email` (string)
- `password_hash` (string)
- `name` (string)
- `license_key` (string)
- `verification_token` (string, unique)
- `expires_at` (timestamp, 24 hours from creation)
- `created_at` (timestamp)

#### Password Reset Tokens Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `email` (string)
- `reset_token` (string, unique)
- `expires_at` (timestamp) - 1 hour
- `used` (boolean)
- `created_at` (timestamp)

📖 **Dokumentasi lengkap**: [Database Setup Guide](docs/DATABASE_SETUP.md)

## Security Features

- **Helmet.js** untuk security headers
- **CORS** enabled
- **Row Level Security (RLS)** di Supabase
- **Input Validation** menggunakan Joi
- **JWT Authentication** via Supabase Auth
- **API Key Authentication** untuk integrasi
- **Webhook Secret** untuk payment verification

## Error Handling

API menggunakan format response yang konsisten:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Forgot Password Feature

**Flow:**
1. User request reset password via `POST /api/auth/forgot-password`
2. Email reset password dikirim (link valid 1 jam)
3. User klik link → Buka form reset password
4. User submit password baru → Token dihapus & password diupdate
5. User login dengan password baru

**Pages:**
- `/api/auth/forgot-password-page` - Form request reset
- `/api/auth/reset-password-page?token=xxx` - Form reset password
- Success/Failed pages tersedia di `public/views/`

## SMTP Email Configuration

Sistem menggunakan **Brevo** (formerly Sendinblue) untuk email:
- Email verification (registrasi)
- Reset password

**Setup:**
1. Buat akun di [Brevo](https://www.brevo.com)
2. Generate SMTP credentials
3. Tambahkan ke `.env`:
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@example.com
APP_URL=http://localhost:3000
```

## Project Structure

```
kgiton_api/
├── database/
│   ├── schema.sql                   # Complete database schema (all tables)
│   ├── create_admin.txt             # Info create super admin
│   ├── cron_setup.sql               # Cron job configurations
│   ├── reset.sql                    # Database reset script
│   └── README.md                    # Database documentationon
│   ├── FORGOT_PASSWORD_GUIDE.md     # Forgot password
│   └── PROJECT_SUMMARY.md           # Project overview
├── public/
│   ├── views/                       # HTML templates
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   ├── reset-password-form.html
│   │   ├── verification-email.html
│   │   ├── reset-password-email.html
│   │   └── ... (success/failed pages)
│   └── swagger-custom.js
├── src/
│   ├── config/
│   │   ├── supabase.ts              # Supabase config
│   │   └── swagger.ts               # Swagger config
│   ├── controllers/
│   │   ├── authController.ts        # Auth + Email Verification + Forgot Password
│   │   ├── setupController.ts       # Super admin setup
│   │   ├── licenseController.ts
│   │   ├── userController.ts
│   │   ├── topupController.ts
│   │   └── webhookController.ts
│   ├── middlewares/
│   │   ├── auth.ts                  # Authentication middleware
│   │   └── errorHandler.ts          # Error handling
│   ├── routes/
│   │   ├── authRoutes.ts            # Auth routes
│   │   ├── setupRoutes.ts
│   │   ├── licenseRoutes.ts
│   │   ├── topupRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── webhookRoutes.ts
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── utils/
│   │   ├── apiKey.ts                # API key generator
│   │   └── emailService.ts          # Email sending & templates
│   ├── validators/
│   │   └── index.ts                 # Joi validators
│   ├── app.ts                       # Express app setup
│   └── server.ts                    # Server entry point
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md                        # This file
```

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Troubleshooting

### Database Issues
- **Tables tidak terbuat**: Pastikan jalankan `database/schema.sql` dengan benar
- **RLS errors**: Check Supabase service_role key di `.env`

### Email Issues
- **Email tidak terkirim**: Check SMTP credentials di `.env`
- **Email masuk spam**: Verifikasi domain di Brevo
- **Link expired**: Token verification expires 24 jam, reset token expires 1 jam

### Authentication Issues
- **Login gagal**: Pastikan email sudah diverifikasi
- **API key tidak bekerja**: Check format header: `x-api-key: your-key`
- **Token expired**: Request token baru via login

## License

ISC

## Support

Untuk pertanyaan atau bantuan:
- **📚 Full Documentation**: [docs/README.md](./docs/README.md)
- **API Docs**: http://localhost:3000/api-docs
- **Database Setup**: [docs/DATABASE.md](./docs/DATABASE.md)
- Check server logs untuk error details
- Check Supabase Dashboard > Logs untuk database issues

---

**Version**: 1.0.0  
**Last Updated**: December 23, 2025

