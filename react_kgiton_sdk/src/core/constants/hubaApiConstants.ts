/**
 * API Constants for Huba API Backend
 */
export const HubaApiConstants = {
  // Default base URL for Huba API
  defaultBaseUrl: 'http://localhost:3001',

  // API Endpoints
  endpoints: {
    // Profile endpoints
    profile: '/api/profile',

    // Item endpoints
    items: '/api/items',
    itemCategories: '/api/items/categories',
    itemById: (id: string) => `/api/items/${id}`,

    // Cart endpoints
    cart: '/api/cart',
    cartItem: (id: string) => `/api/cart/${id}`,

    // Transaction endpoints
    transactions: '/api/transactions',
    transactionById: (id: string) => `/api/transactions/${id}`,
    transactionStatus: (id: string) => `/api/transactions/${id}/status`,
  },

  // HTTP Headers
  headers: {
    authorization: 'Authorization',
    contentType: 'Content-Type',
  },

  // Content Types
  contentTypes: {
    json: 'application/json',
  },

  // Storage Keys
  storageKeys: {
    hubaBaseUrl: 'huba_base_url',
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

  // Default values
  defaults: {
    pageSize: 20,
    page: 1,
  },
} as const;

export type HubaApiConstantsType = typeof HubaApiConstants;
