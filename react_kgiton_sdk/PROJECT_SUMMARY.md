# React Native KGiTON SDK - Project Summary

## 📋 Overview

`react_kgiton_sdk` is a React Native SDK that integrates with the KGiTON backend APIs. It provides the same functionality as `flutter_kgiton_sdk` but for React Native applications.

## 🎯 Key Features

### 1. Authentication
- ✅ User registration with license key
- ✅ Email verification
- ✅ Login with JWT tokens
- ✅ Forgot password with email reset
- ✅ Token management (access & refresh)
- ✅ Session persistence with AsyncStorage
- ✅ Referral system support

### 2. License & Token Management
- ✅ Multiple license keys per user
- ✅ Token balance tracking
- ✅ Token top-up with payment gateway
- ✅ Transaction history
- ✅ License ownership verification
- ✅ Token usage tracking

### 3. Super Admin (License Management)
- ✅ Create single license key
- ✅ Bulk create license keys
- ✅ Update license key (price, balance, status)
- ✅ Delete license key
- ✅ Set trial mode
- ✅ Add token balance

### 4. Huba API Integration
- ✅ Extended user profiles
- ✅ Items/Products with dual pricing
- ✅ Cart with weighing support
- ✅ Transactions/Checkout
- ✅ License key data isolation

### 5. Developer Experience
- ✅ TypeScript support
- ✅ Custom React hooks
- ✅ Comprehensive error handling
- ✅ Logging (development mode)
- ✅ Clean architecture

## 📁 Project Structure

```
react_kgiton_sdk/
├── package.json                # NPM package configuration
├── tsconfig.json               # TypeScript configuration
├── README.md                   # Documentation
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT License
│
└── src/
    ├── index.ts                # Main exports
    ├── KgitonSDK.ts            # Main SDK facade
    │
    ├── core/                   # Core utilities
    │   ├── constants/          # API constants
    │   │   ├── apiConstants.ts
    │   │   └── hubaApiConstants.ts
    │   ├── exceptions/         # Custom exceptions
    │   │   └── apiExceptions.ts
    │   └── network/            # HTTP clients
    │       ├── kgitonApiClient.ts
    │       └── hubaApiClient.ts
    │
    ├── domain/                 # Domain layer
    │   └── entities/           # Business entities
    │       ├── user.ts
    │       ├── auth.ts
    │       ├── licenseKey.ts
    │       ├── transaction.ts
    │       ├── topup.ts
    │       ├── extendedUserProfile.ts
    │       ├── item.ts
    │       ├── cartItem.ts
    │       └── hubaTransaction.ts
    │
    ├── services/               # Core API services
    │   ├── authService.ts
    │   ├── userService.ts
    │   ├── licenseService.ts
    │   └── topupService.ts
    │
    ├── api/                    # External API services
    │   └── hubaApiService.ts
    │
    ├── helpers/                # Helper classes
    │   └── hubaHelper.ts
    │
    └── hooks/                  # React hooks
        └── useKgiton.ts
```

## 🔧 Main Classes

### KgitonSDK

Main entry point providing simplified API access:

```typescript
import { KgitonSDK } from 'react-kgiton-sdk';

const sdk = new KgitonSDK({
  coreApiUrl: 'http://localhost:3000',
  hubaApiUrl: 'http://localhost:3001',
});

// Authentication
await sdk.register({ email, password, name, licenseKey });
const auth = await sdk.login(email, password);
await sdk.logout();

// User operations
const balance = await sdk.getTotalTokenBalance();
const profile = await sdk.getUserProfile();

// Huba operations via sdk.huba
const items = await sdk.huba.getItems({ licenseKey });
await sdk.huba.addToCart({ licenseKey, itemId, quantity });
```

### React Hooks

```typescript
import { 
  initializeSDK, 
  useAuth, 
  useLicenseKeys,
  useCart,
  useItems 
} from 'react-kgiton-sdk';

// Initialize once
initializeSDK({ coreApiUrl: '...', hubaApiUrl: '...' });

// In components
const { isAuthenticated, user, login, logout } = useAuth();
const { licenseKeys, totalBalance } = useLicenseKeys();
const { items, addToCart, removeFromCart } = useCart(licenseKey);
```

## 🔗 API Integration

### Core API (Port 3000)

```
/api/auth/register          # Registration
/api/auth/login             # Login
/api/auth/verify-email      # Email verification
/api/auth/forgot-password   # Password reset request
/api/auth/reset-password    # Password reset
/api/user/profile           # User profile
/api/user/token-balance     # Token balance
/api/topup/request          # Top-up request
/api/admin/license-keys     # Admin operations
```

### Huba API (Port 3001)

```
/api/profile                # Extended profile
/api/items                  # Items
/api/cart                   # Cart
/api/transactions           # Transactions
```

## 📊 Comparison with Flutter SDK

| Feature | flutter_kgiton_sdk | react_kgiton_sdk |
|---------|-------------------|------------------|
| Language | Dart | TypeScript |
| Platform | Flutter | React Native |
| Storage | SharedPreferences | AsyncStorage |
| HTTP Client | http package | fetch API |
| Architecture | Clean Architecture | Clean Architecture |
| BLE Support | Yes (kgiton_ble_sdk) | Not included* |

*BLE support can be added separately using react-native-ble-plx

## 🚀 Getting Started

```bash
# Install
npm install react-kgiton-sdk @react-native-async-storage/async-storage

# iOS
cd ios && pod install

# Usage
import { KgitonSDK } from 'react-kgiton-sdk';

const sdk = new KgitonSDK({
  coreApiUrl: 'http://localhost:3000',
});

await sdk.login('user@example.com', 'password');
```

## 📱 Platform URLs

```typescript
// iOS Simulator
coreApiUrl: 'http://localhost:3000'

// Android Emulator
coreApiUrl: 'http://10.0.2.2:3000'

// Real Device
coreApiUrl: 'http://YOUR_COMPUTER_IP:3000'
```
