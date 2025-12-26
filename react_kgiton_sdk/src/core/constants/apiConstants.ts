/**
 * API Constants for KGiTON Core API Backend
 */
export const ApiConstants = {
  // Default base URL for API
  defaultBaseUrl: 'http://localhost:3000',

  // API Endpoints
  endpoints: {
    // Auth endpoints
    authRegister: '/api/auth/register',
    authLogin: '/api/auth/login',
    authVerifyEmail: '/api/auth/verify-email',
    authForgotPassword: '/api/auth/forgot-password',
    authResetPassword: '/api/auth/reset-password',

    // Admin endpoints
    adminLicenseKeys: '/api/admin/license-keys',

    // Topup endpoints
    topupRequest: '/api/topup/request',
    topupHistory: '/api/topup/history',

    // User endpoints
    userTokenBalance: '/api/user/token-balance',
    userProfile: '/api/user/profile',
    userTransactions: '/api/user/transactions',
    userAssignLicense: '/api/user/assign-license',
    userLicenseKeyUseToken: (licenseKey: string) =>
      `/api/user/license-keys/${licenseKey}/use-token`,

    // Webhook endpoints
    webhookPayment: '/api/webhook/payment',
  },

  // HTTP Headers
  headers: {
    authorization: 'Authorization',
    apiKey: 'x-api-key',
    contentType: 'Content-Type',
  },

  // Content Types
  contentTypes: {
    json: 'application/json',
  },

  // Storage Keys for AsyncStorage
  storageKeys: {
    accessToken: 'kgiton_access_token',
    refreshToken: 'kgiton_refresh_token',
    apiKey: 'kgiton_api_key',
    baseUrl: 'kgiton_base_url',
    userId: 'kgiton_user_id',
    userEmail: 'kgiton_user_email',
    userName: 'kgiton_user_name',
    userRole: 'kgiton_user_role',
  },

  // HTTP Status Codes
  statusCodes: {
    ok: 200,
    created: 201,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    internalServerError: 500,
  },

  // Token Configuration
  tokenExpiryBuffer: 300, // 5 minutes in seconds

  // User Roles
  roles: {
    superAdmin: 'super_admin',
    user: 'user',
  },

  // License Status
  licenseStatus: {
    active: 'active',
    inactive: 'inactive',
    trial: 'trial',
  },

  // Transaction Status
  transactionStatus: {
    success: 'success',
    failed: 'failed',
    pending: 'pending',
  },

  // Payment Methods
  paymentMethods: {
    qris: 'qris',
    cash: 'cash',
    bankTransfer: 'bank_transfer',
  },
} as const;

export type ApiConstantsType = typeof ApiConstants;
