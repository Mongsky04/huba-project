/**
 * React Native KGiTON SDK
 *
 * React Native SDK untuk integrasi dengan KGiTON API Backend.
 * Mendukung autentikasi license key, manajemen token, top-up,
 * dan integrasi dengan Huba API.
 *
 * Terintegrasi dengan dua backend:
 * - KGiTON Core API: Autentikasi, license management, token operations
 * - Huba API: Items, cart, transactions, extended user profiles
 *
 * @example
 * ```typescript
 * import { KgitonSDK } from 'react-kgiton-sdk';
 *
 * const sdk = new KgitonSDK({
 *   coreApiUrl: 'http://localhost:3000',
 *   hubaApiUrl: 'http://localhost:3001',
 * });
 *
 * // Login
 * const authResult = await sdk.login('user@example.com', 'password');
 *
 * // Get items
 * const items = await sdk.huba.getItems({ licenseKey: 'LICENSE-KEY' });
 * ```
 */

// ==================== Main SDK ====================
export { KgitonSDK, KgitonSDKConfig } from './KgitonSDK';

// ==================== API Services ====================
export { HubaApiService } from './api/hubaApiService';

// ==================== Core ====================
// Constants
export { ApiConstants } from './core/constants/apiConstants';
export { HubaApiConstants } from './core/constants/hubaApiConstants';

// Exceptions
export {
  ApiException,
  NetworkException,
  AuthenticationException,
  AuthorizationException,
  ValidationException,
  NotFoundException,
  ServerException,
  TimeoutException,
  ParseException,
} from './core/exceptions/apiExceptions';

// Network Clients
export { KgitonApiClient, RequestOptions } from './core/network/kgitonApiClient';
export { HubaApiClient, HubaRequestOptions } from './core/network/hubaApiClient';

// ==================== Services ====================
export { AuthService } from './services/authService';
export { UserService } from './services/userService';
export { LicenseService } from './services/licenseService';
export { TopupService } from './services/topupService';

// ==================== Helpers ====================
export { HubaHelper } from './helpers/hubaHelper';

// ==================== Domain Entities ====================
// User
export {
  User,
  UserData,
  parseUser,
  isSuperAdmin,
  isRegularUser,
} from './domain/entities/user';

// Auth
export {
  AuthResult,
  AuthResponseData,
  parseAuthResult,
  LoginRequest,
  RegisterRequest,
  toRegisterPayload,
  RegisterResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  toResetPasswordPayload,
} from './domain/entities/auth';

// License Key
export {
  LicenseKey,
  LicenseKeyData,
  parseLicenseKey,
  isLicenseActive,
  isLicenseInactive,
  isLicenseTrial,
  isLicenseAssigned,
  CreateLicenseKeyRequest,
  BulkCreateLicenseKeysRequest,
  UpdateLicenseKeyRequest,
  SetTrialModeRequest,
  AddTokenBalanceRequest,
} from './domain/entities/licenseKey';

// Transaction (Token)
export {
  Transaction,
  TransactionData,
  parseTransaction,
  isTransactionPending,
  isTransactionSuccess,
  isTransactionFailed,
} from './domain/entities/transaction';

// Topup
export {
  TopupRequest,
  toTopupPayload,
  TopupResult,
  TopupResponseData,
  parseTopupResult,
  isTopupPending,
  isTopupSuccess,
  isTopupFailed,
} from './domain/entities/topup';

// Extended User Profile
export {
  ExtendedUserProfile,
  ExtendedUserProfileData,
  parseExtendedUserProfile,
  UpdateProfileRequest,
  toUpdateProfilePayload,
} from './domain/entities/extendedUserProfile';

// Item
export {
  Item,
  ItemData,
  parseItem,
  CreateItemRequest,
  toCreateItemPayload,
  UpdateItemRequest,
  toUpdateItemPayload,
  GetItemsRequest,
} from './domain/entities/item';

// Cart Item
export {
  CartItem,
  CartItemData,
  parseCartItem,
  calculateCartItemSubtotal,
  AddToCartRequest,
  toAddToCartPayload,
  UpdateCartItemRequest,
  toUpdateCartItemPayload,
} from './domain/entities/cartItem';

// Huba Transaction
export {
  HubaTransaction,
  HubaTransactionItem,
  HubaTransactionData,
  HubaTransactionItemData,
  parseHubaTransactionItem,
  parseHubaTransaction,
  CheckoutRequest,
  toCheckoutPayload,
  GetTransactionsRequest,
  UpdateTransactionStatusRequest,
} from './domain/entities/hubaTransaction';

// ==================== React Hooks ====================
export {
  initializeSDK,
  getSDK,
  useSDK,
  useAuth,
  useLicenseKeys,
  useTokenBalance,
  useCart,
  useItems,
} from './hooks/useKgiton';
