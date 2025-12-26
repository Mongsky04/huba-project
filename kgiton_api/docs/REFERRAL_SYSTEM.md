# Sistem Referral KGiTON API

Sistem referral memungkinkan user untuk mengajak user lain mendaftar dan mendapatkan bonus token gratis.

## Cara Kerja

### 1. Register dengan License Key (Wajib)
Setiap user **harus memiliki License Key** untuk bisa mendaftar.

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "license_key": "LICENSE-KEY-HERE",
  "referral_code": "ABC123XYZ" // Optional - kode referral dari user lain
}
```

### 2. Mendapatkan Referral Code
Setelah berhasil register dan verifikasi email, setiap user akan mendapatkan **referral code unik**.

Referral code ini dapat dilihat di:
- Email verifikasi sukses
- Response saat login
- Profile user

### 3. Mengajak User Lain (Referral)

User A (Referrer):
- Memiliki referral code: `ABC123XYZ`
- Share referral code ini ke User B

User B (Referee):
- Register dengan license key miliknya
- Sertakan referral code dari User A saat register
- Setelah verifikasi email berhasil, **kedua user** mendapat bonus

### 4. Bonus Token

Ketika User B berhasil mendaftar dengan referral code User A:

✅ **User A (Referrer)**: Mendapat 1000 token yang **dibagi rata ke semua license key** yang dimilikinya  
✅ **User B (Referee)**: Mendapat 1000 token yang **dibagi rata ke semua license key** yang dimilikinya

**Contoh:**
- User A punya 2 license keys → masing-masing license key dapat +500 token
- User A punya 1 license key → license key-nya dapat +1000 token
- User B punya 1 license key → license key-nya dapat +1000 token

**Catatan**: Bonus diberikan otomatis saat user B menyelesaikan verifikasi email.

### 5. Tracking Referral

Sistem mencatat:
- **User**: Siapa yang mereferral user ini (`referred_by`)
- **License Key**: License key user mana yang digunakan dengan referral siapa (`referred_by_user_id`)

## API Endpoints

### Register dengan Referral Code

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "userB@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "license_key": "USERB-LICENSE-KEY",
  "referral_code": "ABC123XYZ"  // Dari User A
}
```

### Login dan Lihat Referral Code

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "user",
      "api_key": "...",
      "referral_code": "ABC123XYZ",
      "total_token_balance": 1000
    }
  }
}
```

## Database Schema

### Tabel `users`

| Column | Type | Description |
|--------|------|-------------|
| `referral_code` | VARCHAR(20) | Kode referral unik user |
| `referred_by` | UUID | ID user yang mereferral |

**Note**: Token balance disimpan di `license_keys`, bukan di tabel `users`

### Tabel `license_keys`

| Column | Type | Description |
|--------|------|-------------|
| `referred_by_user_id` | UUID | ID user yang mereferral (untuk tracking license) |

### Tabel `pending_registrations`

| Column | Type | Description |
|--------|------|-------------|
| `referral_code` | VARCHAR(20) | Kode referral yang digunakan saat register |

## Cara Install/Update

1. Jalankan schema SQL:
```bash
# Di Supabase SQL Editor
# Copy paste isi file database/schema.sql
# (Schema sudah include sistem referral)
```

2. Schema akan otomatis membuat:
   - Kolom-kolom referral di tabel users dan license_keys
   - Fungsi generate referral code
   - Trigger untuk bonus otomatis
   - Semua table, function, dan trigger yang diperlukan

3. Restart aplikasi (tidak perlu rebuild, TypeScript sudah diupdate)

## Contoh Flow Lengkap

### User A Mendaftar (Tanpa Referral)

1. User A register dengan license key
2. Verifikasi email
3. Mendapat:
   - API Key
   - Referral Code: `ABC123XYZ`
   - License key dengan token balance: 0

### User B Mendaftar (Dengan Referral dari A)

1. User B register dengan:
   - License key miliknya
   - Referral code dari User A: `ABC123XYZ`
2. Verifikasi email
3. User B mendapat:
   - API Key
   - Referral Code sendiri: `DEF456GHI`
   - License key-nya bertambah: 0 → 1000 token
4. User A license key-nya bertambah: 0 → 1000 token

### User C Mendaftar (Dengan Referral dari B, dan B punya 2 license keys)

1. User B sekarang punya 2 license keys (masing-masing 1000 token)
2. User C register dengan:
   - License key miliknya
   - Referral code dari User B: `DEF456GHI`
3. Verifikasi email
4. User C license key-nya mendapat: 1000 token
5. User B dapat bonus 1000 token dibagi ke 2 license keys:
   - License key 1: 1000 → 1500 token (+500)
   - License key 2: 1000 → 1500 token (+500)
6. User A tidak dapat tambahan (bukan referral langsung)

## Validasi

### Referral Code Invalid
Jika user memasukkan referral code yang tidak ada:
```json
{
  "success": false,
  "error": "Invalid referral code"
}
```

### License Key Sudah Digunakan
```json
{
  "success": false,
  "error": "License key is already assigned to another user"
}
```

## Notes

- Referral code bersifat **case-insensitive** (ABC = abc)
- Setiap user **wajib** punya license key untuk register
- Bonus token **dibagi rata ke semua license keys** yang dimiliki user
- Bonus diberikan **1 kali** saat register berhasil
- Referral code dapat dishare berulang kali (unlimited referrals)
- Token balance disimpan di license key, bukan di user
- Total token balance user = jumlah dari semua token di license keys yang dimiliki

## Security

- Referral code di-generate secara random (10 karakter)
- Unique constraint memastikan tidak ada duplikasi
- Database trigger memastikan bonus diberikan atomic
- RLS (Row Level Security) tetap aktif untuk keamanan
