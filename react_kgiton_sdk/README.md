# React Native KGiTON SDK

React Native SDK for integration with KGiTON API Backend. Supports license key authentication, token management, top-up, and integration with Huba API.

## 🎯 Overview

This SDK integrates with two backends:

| API | Default Port | Purpose |
|-----|--------------|---------|
| **KGiTON Core API** | 3000 | Authentication, License Keys, Token Management |
| **Huba API** | 3001 | E-commerce, Items, Cart, Transactions, Extended Profiles |

## 📦 Installation

```bash
# Using npm
npm install react-kgiton-sdk @react-native-async-storage/async-storage

# Using yarn
yarn add react-kgiton-sdk @react-native-async-storage/async-storage
```

### iOS Setup

```bash
cd ios && pod install
```

## 🚀 Quick Start

### Initialize SDK

```typescript
import { KgitonSDK } from 'react-kgiton-sdk';

const sdk = new KgitonSDK({
  coreApiUrl: 'http://localhost:3000',
  hubaApiUrl: 'http://localhost:3001',
});
```

### Register User

```typescript
await sdk.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  licenseKey: 'LICENSE-KEY-123',
  // Optional extended profile
  phoneNumber: '+62812345678',
  address: 'Jl. Example No. 123',
  city: 'Jakarta',
});
```

### Login

```typescript
const authResult = await sdk.login('user@example.com', 'password123');

console.log('User:', authResult.user.name);
console.log('Token:', authResult.accessToken);
```

### Get Token Balance

```typescript
const balance = await sdk.getTotalTokenBalance();
console.log('Total Balance:', balance);

const licenseKeys = await sdk.getUserLicenseKeys();
licenseKeys.forEach(lk => {
  console.log(`${lk.key}: ${lk.tokenBalance} tokens`);
});
```

### Browse Items (Huba API)

```typescript
const items = await sdk.huba.getItems({
  licenseKey: 'LICENSE-KEY-123',
  category: 'vegetables',
  search: 'tomato',
  page: 1,
  limit: 20,
});
```

### Add to Cart

```typescript
await sdk.huba.addToCart({
  licenseKey: 'LICENSE-KEY-123',
  itemId: 'item-uuid',
  quantity: 2.5, // Weight in kg
  quantityPcs: 5, // Optional: pieces count
});
```

### Checkout

```typescript
const transaction = await sdk.huba.checkout({
  licenseKey: 'LICENSE-KEY-123',
  paymentMethod: 'cash',
  notes: 'Deliver before 5 PM',
});

console.log('Transaction Code:', transaction.transactionCode);
```

## 📖 API Reference

### KgitonSDK

The main SDK class that provides access to all features.

#### Constructor

```typescript
new KgitonSDK({
  coreApiUrl: string,      // Required: Core API URL
  hubaApiUrl?: string,     // Optional: Huba API URL
  timeout?: number,        // Optional: Request timeout (default: 30000)
  enableLogging?: boolean, // Optional: Enable logging (default: __DEV__)
})
```

#### Authentication Methods

| Method | Description |
|--------|-------------|
| `register(request)` | Register new user with license key |
| `login(email, password)` | Login and get tokens |
| `logout()` | Clear tokens and logout |
| `verifyEmail(token)` | Verify email with token |
| `forgotPassword(email)` | Request password reset |
| `resetPassword(token, newPassword)` | Reset password |
| `isAuthenticated()` | Check if user is authenticated |
| `getAccessToken()` | Get current access token |
| `setAccessToken(token)` | Set access token (restore session) |

#### User Methods

| Method | Description |
|--------|-------------|
| `getUserProfile()` | Get user profile |
| `getUserLicenseKeys()` | Get all user's license keys |
| `getTotalTokenBalance()` | Get total token balance |
| `getLicenseKeyBalance(key)` | Get balance for specific license |
| `getTransactionHistory()` | Get transaction history |
| `verifyLicenseOwnership(key)` | Verify license ownership |
| `hasSufficientBalance(key, tokens)` | Check if license has enough tokens |
| `useToken(key, tokens)` | Use tokens from license |
| `assignLicense(key)` | Assign new license to user |

#### Admin Methods (Super Admin Only)

| Method | Description |
|--------|-------------|
| `createLicenseKey(options)` | Create new license key |
| `bulkCreateLicenseKeys(options)` | Create multiple license keys |
| `listLicenseKeys()` | List all license keys |
| `getLicenseKeyById(id)` | Get license by ID |
| `updateLicenseKey(options)` | Update license key |
| `deleteLicenseKey(id)` | Delete license key |
| `setTrialMode(id, days)` | Set trial mode |
| `addTokenBalance(id, tokens)` | Add tokens to license |

#### Top-up Methods

| Method | Description |
|--------|-------------|
| `requestTopup(tokenCount, licenseKey)` | Request token top-up |
| `getTopupHistory()` | Get top-up history |

### HubaHelper (sdk.huba)

Access Huba API features through `sdk.huba`.

#### Profile Methods

| Method | Description |
|--------|-------------|
| `getProfile()` | Get extended user profile |
| `updateProfile(request)` | Update profile |

#### Item Methods

| Method | Description |
|--------|-------------|
| `getItems(options)` | Get items with filters |
| `getItemById(id, licenseKey)` | Get item by ID |
| `getCategories(licenseKey)` | Get all categories |
| `createItem(request)` | Create new item |
| `updateItem(request)` | Update item |
| `deleteItem(id, licenseKey)` | Delete item |

#### Cart Methods

| Method | Description |
|--------|-------------|
| `getCart(licenseKey)` | Get cart items |
| `addToCart(request)` | Add item to cart |
| `updateCartQuantity(options)` | Update cart item |
| `removeFromCart(cartItemId)` | Remove from cart |
| `clearCart(licenseKey)` | Clear entire cart |
| `getCartTotal(licenseKey)` | Get cart total |

#### Transaction Methods

| Method | Description |
|--------|-------------|
| `checkout(request)` | Create transaction |
| `getTransactions(options)` | Get transaction history |
| `getTransactionById(id)` | Get transaction details |
| `updateTransactionStatus(id, status)` | Update status |

## 🔐 License Key Isolation

Each license key has its own isolated ecosystem:

```
User A
├── License Key 1 → Items, Cart, Transactions
├── License Key 2 → Items, Cart, Transactions
└── License Key 3 → Items, Cart, Transactions
```

All item/cart/transaction operations require a `licenseKey` parameter.

## 📱 Platform-Specific URLs

```typescript
// For iOS Simulator
const sdk = new KgitonSDK({
  coreApiUrl: 'http://localhost:3000',
  hubaApiUrl: 'http://localhost:3001',
});

// For Android Emulator
const sdk = new KgitonSDK({
  coreApiUrl: 'http://10.0.2.2:3000',
  hubaApiUrl: 'http://10.0.2.2:3001',
});

// For Real Device (use your computer's IP)
const sdk = new KgitonSDK({
  coreApiUrl: 'http://192.168.x.x:3000',
  hubaApiUrl: 'http://192.168.x.x:3001',
});
```

## 🔄 Session Persistence

The SDK automatically saves tokens to AsyncStorage after login.

### Restore Session

```typescript
// On app start
await sdk.loadConfiguration();

if (sdk.isAuthenticated()) {
  // User is logged in
  const profile = await sdk.getUserProfile();
}
```

### Manual Save

```typescript
await sdk.saveConfiguration();
```

### Clear Session

```typescript
await sdk.clearConfiguration();
```

## ⚠️ Error Handling

The SDK throws specific exceptions for different error types:

```typescript
import {
  ApiException,
  AuthenticationException,
  ValidationException,
  NetworkException,
  NotFoundException,
} from 'react-kgiton-sdk';

try {
  await sdk.login(email, password);
} catch (error) {
  if (error instanceof AuthenticationException) {
    // Invalid credentials
    console.log('Invalid email or password');
  } else if (error instanceof ValidationException) {
    // Invalid input
    console.log('Validation error:', error.message);
  } else if (error instanceof NetworkException) {
    // Network error
    console.log('Network error, check your connection');
  } else if (error instanceof ApiException) {
    // Other API error
    console.log('Error:', error.message);
  }
}
```

## 📊 TypeScript Support

Full TypeScript support with all types exported:

```typescript
import {
  KgitonSDK,
  User,
  LicenseKey,
  AuthResult,
  Item,
  CartItem,
  HubaTransaction,
  TopupResult,
} from 'react-kgiton-sdk';
```

## 🏗️ Architecture

The SDK follows Clean Architecture principles:

```
src/
├── index.ts              # Main exports
├── KgitonSDK.ts          # Main SDK facade
├── core/
│   ├── constants/        # API constants
│   ├── exceptions/       # Custom exceptions
│   └── network/          # HTTP clients
├── domain/
│   └── entities/         # Business entities
├── services/             # Core API services
│   ├── authService.ts
│   ├── userService.ts
│   ├── licenseService.ts
│   └── topupService.ts
├── api/
│   └── hubaApiService.ts # Huba API service
└── helpers/
    └── hubaHelper.ts     # Huba helper
```

## � Local Development

### Building the SDK

```bash
cd react_kgiton_sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Type check
npm run typecheck
```

### Using Local SDK in Your App

For testing during development:

```bash
# In your React Native app
npm install ../react_kgiton_sdk

# Or using npm link
cd react_kgiton_sdk
npm link

cd ../your-react-native-app
npm link react-kgiton-sdk
```

### Publishing to npm

```bash
# Update version in package.json first
npm version patch  # or minor, or major

# Publish
npm publish
```

## �📋 Requirements

- React Native 0.60+
- Node.js 16+
- @react-native-async-storage/async-storage

## 📄 License

MIT License

## 🔗 Related

- [KGiTON Core API](../kgiton_api)
- [Huba API](../huba_api)
- [Flutter KGiTON SDK](../flutter_kgiton_sdk)
