# Database Setup

## File SQL

Folder ini berisi 3 file SQL:

### 1. `schema.sql` (WAJIB)
Database schema lengkap untuk KGiTON API. **Jalankan file ini untuk setup semua tables**.

**Cara menjalankan:**
1. Buka Supabase Dashboard → SQL Editor
2. Copy semua isi file `schema.sql`
3. Paste dan jalankan (Run atau Ctrl+Enter)
4. Tunggu sampai selesai

File ini akan membuat:
- ✅ Core Tables: `license_keys`, `users`, `transactions`
- ✅ Email & Security Tables: `pending_registrations`, `password_reset_tokens`
- ✅ Referral System: `referral_code`, `referred_by` columns dan bonus logic
- ✅ ENUM types: `user_role`, `license_status`, `transaction_status`
- ✅ Indexes untuk performance
- ✅ Triggers untuk auto-update `updated_at` dan referral bonus
- ✅ Row Level Security (RLS) policies
- ✅ Cleanup functions untuk expired tokens
- ✅ Optional cron job configurations

### 2. `create_super_admin.sql` (OPSIONAL)
Script untuk create super admin secara manual via SQL.

**HANYA gunakan jika:**
- Anda tidak ingin menggunakan endpoint API
- Anda lebih nyaman dengan SQL manual

**Cara yang direkomendasikan:**
Gunakan endpoint API: `POST /api/setup/super-admin` (lebih mudah dan aman)

## Setup Flow

```
1. Run schema.sql di Supabase SQL Editor (includes all tables)
   ↓
2. Setup Super Admin (pilih salah satu):

   Opsi A (Recommended): Via API Endpoint
   → POST /api/setup/super-admin

   Opsi B (Manual): Via SQL
   → Buat user di Supabase Auth
   → Jalankan create_super_admin.sql
   ↓
3. Configure SMTP di .env untuk email verification & reset password
   ↓
4. User bisa register dengan email verification
   ↓
5. User bisa reset password via forgot password
   ↓
6. Login dan mulai gunakan API
```

## Catatan Penting

### Super Admin
- ❌ **TIDAK PERLU** license key
- ✅ `license_key_id` akan NULL
- ✅ Bisa manage semua license keys
- ✅ Bisa create voucher codes

### Regular User
- ✅ **WAJIB** memiliki license key saat register
- ✅ `license_key_id` harus diisi
- ✅ Bisa redeem voucher codes
- ✅ Bisa check token balance

## Troubleshooting

### Error: "type user_role already exists"
Anda sudah pernah run schema sebelumnya. Skip error ini atau drop type dulu:
```sql
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
```

### Error: "table users already exists"
Tables sudah ada. Anda bisa:
- Skip jika struktur sama
- Drop tables jika ingin reset (HATI-HATI: data akan hilang)
```sql
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS voucher_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
```

### Ingin Reset Database
**PERINGATAN: Semua data akan hilang!**
```sql
-- Drop semua dalam urutan terbalik
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS voucher_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Kemudian jalankan ulang schema.sql
```

## Row Level Security (RLS)

Database menggunakan RLS untuk security. Policy yang sudah dibuat:

### License Keys
- Super admin: Full access
- Regular users: Read only

### Users
- Users: Bisa lihat data sendiri
- Super admin: Bisa lihat semua users

### Voucher Codes
- Super admin: Full access
- Users: Read all, update untuk redeem

### Transactions
- Users: Lihat transaksi sendiri
- Super admin: Lihat semua transaksi

## Backup & Restore

Supabase menyediakan automatic backup. Untuk manual backup:

1. Buka Supabase Dashboard → Database → Backups
2. Download backup sesuai kebutuhan

Atau via SQL dump:
```bash
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```
