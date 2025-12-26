# React KGiTON SDK - End-to-End Testing App

Aplikasi testing komprehensif untuk menguji semua fitur dari **react-kgiton-sdk**.

## 📱 Fitur Testing

### 1. 🔐 Authentication Tests
- **Register User**: Test registrasi user baru dengan license key
- **Login**: Test login dengan email dan password
- **Email Verification**: Test verifikasi email
- **Forgot Password**: Test request reset password
- **Reset Password**: Test reset password dengan token
- **Logout**: Test logout dan clear session

### 2. 💳 Core API Tests
- **Get Current User**: Test ambil data user yang sedang login
- **Get License Keys**: Test ambil daftar license key milik user
- **Get Token Balance**: Test ambil token balance dari semua license key
- **Transaction History**: Test ambil riwayat transaksi
- **Topup**: Test topup token ke license key

### 3. 🛒 Huba API Tests
- **Extended Profile**:
  - Get extended profile
  - Update profile (phone, address, city)
- **Browse Items**: Test ambil daftar items dengan filter
- **Shopping Cart**:
  - Get cart
  - Add to cart (dengan support weighing)
  - Clear cart
- **Checkout**: Test checkout cart menjadi transaction
- **Transaction History**: Test ambil riwayat transaksi Huba

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SDK URLs

Edit file `lib/sdk-config.ts`:

```typescript
export const SDK_CONFIG = {
  coreApiUrl: 'http://YOUR_IP:3000',  // Ganti dengan IP backend
  hubaApiUrl: 'http://YOUR_IP:3001',  // Ganti dengan IP backend
  enableLogging: true,
};
```

**URL Configuration untuk berbagai platform:**

| Platform | Core API | Huba API |
|----------|----------|----------|
| **Android Emulator** | `http://10.0.2.2:3000` | `http://10.0.2.2:3001` |
| **iOS Simulator** | `http://localhost:3000` | `http://localhost:3001` |
| **Physical Device** | `http://YOUR_IP:3000` | `http://YOUR_IP:3001` |

### 3. Start Backend Servers

Pastikan backend API berjalan:

```bash
# Core API (port 3000)
cd /path/to/core-api
npm start

# Huba API (port 3001)
cd /path/to/huba-api
npm start
```

### 4. Run App

```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📖 Testing Flow

### Step 1: Authentication
1. Buka tab **Auth**
2. Click "Generate Test Data" untuk generate data test random
3. Masukkan **license key yang valid** dari backend
4. Click **Register** → akan dikirim email verifikasi
5. Check email dan copy verification token
6. Paste token di "Verify Email" section
7. Click **Verify Email**
8. Sekarang bisa **Login** dengan email & password

### Step 2: Core API Testing
1. Buka tab **Core API**
2. Test **Get Current User** → harus return data user yang login
3. Test **Get License Keys** → harus return license keys yang dimiliki
4. Test **Get Token Balance** → harus return balance dari setiap license key
5. Test **Transaction History** → return riwayat topup
6. Test **Topup** → topup token ke license key tertentu

### Step 3: Huba API Testing
1. Buka tab **Huba API**
2. Test **Get Profile** dengan license key
3. Test **Update Profile** dengan data baru
4. Test **Browse Items** → return daftar items
5. Copy **Item ID** dari hasil items
6. Test **Add to Cart** dengan Item ID tersebut
7. Test **Get Cart** → harus ada item yang ditambahkan
8. Test **Checkout** → convert cart menjadi transaction
9. Test **Transaction History** → lihat transaction yang baru dibuat

## 🎨 Struktur App

```
app/
├── index.tsx                 # Home screen dengan overview
├── (tabs)/
│   ├── auth-test.tsx        # Authentication testing
│   ├── core-test.tsx        # Core API testing  
│   └── huba-test.tsx        # Huba API testing
│
components/
└── test-components.tsx       # Reusable UI components
│
lib/
├── sdk-config.ts             # SDK configuration
└── test-utils.ts             # Testing utilities
```

## 🧪 Test Scenarios

### Scenario 1: Complete User Journey
1. Register → Verify Email → Login
2. Get License Keys & Token Balance
3. Browse Items → Add to Cart → Checkout
4. Check Transaction History

### Scenario 2: Token Management
1. Login dengan user existing
2. Check Token Balance
3. Topup Token
4. Verify balance bertambah
5. Check Transaction History

### Scenario 3: Shopping Flow
1. Login
2. Browse Items (dengan filter category/search)
3. Add multiple items to cart
4. Update cart items
5. Checkout
6. Verify transaction created

## 📝 Testing Checklist

### Authentication
- [ ] Register dengan license key valid
- [ ] Register dengan license key invalid (should fail)
- [ ] Verify email dengan token valid
- [ ] Verify email dengan token invalid (should fail)
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid (should fail)
- [ ] Forgot password
- [ ] Reset password dengan token valid
- [ ] Logout

### Core API
- [ ] Get current user
- [ ] Get license keys
- [ ] Get token balance
- [ ] Get transactions (all)
- [ ] Get transactions (by license key)
- [ ] Topup token

### Huba API
- [ ] Get extended profile
- [ ] Update extended profile
- [ ] Get items (no filter)
- [ ] Get items (with category)
- [ ] Get items (with search)
- [ ] Get cart (empty)
- [ ] Add item to cart
- [ ] Get cart (with items)
- [ ] Update cart item
- [ ] Remove cart item
- [ ] Clear cart
- [ ] Checkout
- [ ] Get Huba transactions

## 🐛 Troubleshooting

### Error: Network Request Failed
- Pastikan backend servers sedang running
- Check URL di `lib/sdk-config.ts` sudah benar
- Untuk Android Emulator, gunakan `10.0.2.2` bukan `localhost`
- Untuk physical device, pastikan di network yang sama dengan backend

### Error: Invalid License Key
- Pastikan license key sudah dibuat di backend
- License key harus status "active"
- Satu license key hanya bisa digunakan oleh satu user

### Error: Unauthorized
- Token mungkin expired, coba login ulang
- Pastikan sudah verify email sebelum login

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Developer

Created for testing react-kgiton-sdk
