import { HubaApiClient } from '../core/network/hubaApiClient';
import { HubaApiConstants } from '../core/constants/hubaApiConstants';
import {
  ExtendedUserProfile,
  ExtendedUserProfileData,
  parseExtendedUserProfile,
  UpdateProfileRequest,
  toUpdateProfilePayload,
} from '../domain/entities/extendedUserProfile';
import {
  Item,
  ItemData,
  parseItem,
  CreateItemRequest,
  toCreateItemPayload,
  UpdateItemRequest,
  toUpdateItemPayload,
  GetItemsRequest,
} from '../domain/entities/item';
import {
  CartItem,
  CartItemData,
  parseCartItem,
  AddToCartRequest,
  toAddToCartPayload,
  UpdateCartItemRequest,
  toUpdateCartItemPayload,
} from '../domain/entities/cartItem';
import {
  HubaTransaction,
  HubaTransactionData,
  parseHubaTransaction,
  CheckoutRequest,
  toCheckoutPayload,
  GetTransactionsRequest,
} from '../domain/entities/hubaTransaction';

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Huba API Service
 *
 * Handles all Huba API operations:
 * - Profile (shared across all license keys)
 * - Items (isolated per license key)
 * - Cart (isolated per license key)
 * - Transactions (isolated per license key)
 *
 * IMPORTANT: All item/cart/transaction methods require licenseKey for data isolation
 */
export class HubaApiService {
  private client: HubaApiClient;

  constructor(options?: { baseUrl?: string; client?: HubaApiClient }) {
    this.client = options?.client || new HubaApiClient({ baseUrl: options?.baseUrl });
  }

  // ==================== Token Management ====================

  /**
   * Set access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.client.setAccessToken(token);
  }

  /**
   * Clear access token
   */
  clearAccessToken(): void {
    this.client.clearAccessToken();
  }

  // ==================== Profile Methods ====================
  // Profile is NOT license-key specific (shared across all license keys)

  /**
   * Get user profile
   */
  async getProfile(): Promise<ExtendedUserProfile> {
    const response = await this.client.get<ApiResponse<ExtendedUserProfileData>>(
      HubaApiConstants.endpoints.profile,
      undefined,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to get profile');
    }

    return parseExtendedUserProfile(response.data);
  }

  /**
   * Update user profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<ExtendedUserProfile> {
    const payload = toUpdateProfilePayload(request);

    const response = await this.client.put<ApiResponse<ExtendedUserProfileData>>(
      HubaApiConstants.endpoints.profile,
      payload,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to update profile');
    }

    return parseExtendedUserProfile(response.data);
  }

  // ==================== Item Methods ====================
  // Items are license-key specific

  /**
   * Get items with pagination and filters
   * [licenseKey] is REQUIRED for data isolation
   */
  async getItems(request: GetItemsRequest): Promise<Item[]> {
    const queryParams: Record<string, string | number | undefined> = {
      license_key: request.licenseKey,
      page: request.page || HubaApiConstants.defaults.page,
      limit: request.limit || HubaApiConstants.defaults.pageSize,
    };

    if (request.category) queryParams.category = request.category;
    if (request.search) queryParams.search = request.search;

    const response = await this.client.get<ApiResponse<ItemData[]>>(
      HubaApiConstants.endpoints.items,
      queryParams
    );

    if (!response.data) {
      return [];
    }

    return response.data.map(parseItem);
  }

  /**
   * Get item by ID
   * [licenseKey] is REQUIRED for data isolation
   */
  async getItemById(id: string, licenseKey: string): Promise<Item> {
    const response = await this.client.get<ApiResponse<ItemData>>(
      HubaApiConstants.endpoints.itemById(id),
      { license_key: licenseKey }
    );

    if (!response.data) {
      throw new Error('Item not found');
    }

    return parseItem(response.data);
  }

  /**
   * Get item categories
   * [licenseKey] is REQUIRED for data isolation
   */
  async getCategories(licenseKey: string): Promise<string[]> {
    const response = await this.client.get<ApiResponse<string[]>>(
      HubaApiConstants.endpoints.itemCategories,
      { license_key: licenseKey }
    );

    return response.data || [];
  }

  /**
   * Create a new item
   * [licenseKey] is REQUIRED for data isolation
   */
  async createItem(request: CreateItemRequest): Promise<Item> {
    const payload = toCreateItemPayload(request);

    const response = await this.client.post<ApiResponse<ItemData>>(
      HubaApiConstants.endpoints.items,
      payload
    );

    if (!response.data) {
      throw new Error('Failed to create item');
    }

    return parseItem(response.data);
  }

  /**
   * Update an existing item
   * [licenseKey] is REQUIRED for data isolation
   */
  async updateItem(request: UpdateItemRequest): Promise<Item> {
    const payload = toUpdateItemPayload(request);

    const response = await this.client.put<ApiResponse<ItemData>>(
      HubaApiConstants.endpoints.itemById(request.id),
      payload
    );

    if (!response.data) {
      throw new Error('Failed to update item');
    }

    return parseItem(response.data);
  }

  /**
   * Delete an item (soft delete)
   * [licenseKey] is REQUIRED for data isolation
   */
  async deleteItem(id: string, licenseKey: string): Promise<void> {
    await this.client.delete<ApiResponse<unknown>>(
      HubaApiConstants.endpoints.itemById(id),
      { license_key: licenseKey }
    );
  }

  // ==================== Cart Methods ====================
  // Cart is license-key specific

  /**
   * Get user cart
   * [licenseKey] is REQUIRED for data isolation
   */
  async getCart(licenseKey: string): Promise<CartItem[]> {
    const response = await this.client.get<ApiResponse<CartItemData[]>>(
      HubaApiConstants.endpoints.cart,
      { license_key: licenseKey },
      { requiresAuth: true }
    );

    if (!response.data) {
      return [];
    }

    return response.data.map(parseCartItem);
  }

  /**
   * Add item to cart with weighing support
   * [licenseKey] is REQUIRED for data isolation
   */
  async addToCart(request: AddToCartRequest): Promise<CartItem> {
    const payload = toAddToCartPayload(request);

    const response = await this.client.post<ApiResponse<CartItemData>>(
      HubaApiConstants.endpoints.cart,
      payload,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to add to cart');
    }

    return parseCartItem(response.data);
  }

  /**
   * Update cart item quantity with weighing support
   */
  async updateCartItem(request: UpdateCartItemRequest): Promise<CartItem> {
    const payload = toUpdateCartItemPayload(request);

    const response = await this.client.put<ApiResponse<CartItemData>>(
      HubaApiConstants.endpoints.cartItem(request.cartItemId),
      payload,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to update cart item');
    }

    return parseCartItem(response.data);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string): Promise<void> {
    await this.client.delete<ApiResponse<unknown>>(
      HubaApiConstants.endpoints.cartItem(cartItemId),
      undefined,
      { requiresAuth: true }
    );
  }

  /**
   * Clear cart
   * [licenseKey] is REQUIRED for data isolation
   */
  async clearCart(licenseKey: string): Promise<void> {
    await this.client.delete<ApiResponse<unknown>>(
      HubaApiConstants.endpoints.cart,
      { license_key: licenseKey },
      { requiresAuth: true }
    );
  }

  /**
   * Get cart total
   * [licenseKey] is REQUIRED for data isolation
   */
  async getCartTotal(licenseKey: string): Promise<number> {
    const cartItems = await this.getCart(licenseKey);
    return cartItems.reduce((total, item) => {
      if (item.totalPrice) return total + item.totalPrice;
      if (item.item) {
        let subtotal = item.item.price * item.quantity;
        if (item.quantityPcs && item.item.pricePerPcs) {
          subtotal += item.item.pricePerPcs * item.quantityPcs;
        }
        return total + subtotal;
      }
      return total;
    }, 0);
  }

  // ==================== Transaction Methods ====================
  // Transactions are license-key specific

  /**
   * Create transaction and checkout
   * [licenseKey] is REQUIRED for data isolation
   */
  async checkout(request: CheckoutRequest): Promise<HubaTransaction> {
    const payload = toCheckoutPayload(request);

    const response = await this.client.post<ApiResponse<HubaTransactionData>>(
      HubaApiConstants.endpoints.transactions,
      payload,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to create transaction');
    }

    return parseHubaTransaction(response.data);
  }

  /**
   * Get transaction history
   * [licenseKey] is REQUIRED for data isolation
   */
  async getTransactions(request: GetTransactionsRequest): Promise<HubaTransaction[]> {
    const queryParams: Record<string, string | number | undefined> = {
      license_key: request.licenseKey,
      page: request.page || HubaApiConstants.defaults.page,
      limit: request.limit || HubaApiConstants.defaults.pageSize,
    };

    if (request.status) queryParams.status = request.status;

    const response = await this.client.get<ApiResponse<HubaTransactionData[]>>(
      HubaApiConstants.endpoints.transactions,
      queryParams,
      { requiresAuth: true }
    );

    if (!response.data) {
      return [];
    }

    return response.data.map(parseHubaTransaction);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<HubaTransaction> {
    const response = await this.client.get<ApiResponse<HubaTransactionData>>(
      HubaApiConstants.endpoints.transactionById(id),
      undefined,
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Transaction not found');
    }

    return parseHubaTransaction(response.data);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: string
  ): Promise<HubaTransaction> {
    const response = await this.client.put<ApiResponse<HubaTransactionData>>(
      HubaApiConstants.endpoints.transactionStatus(transactionId),
      { status },
      { requiresAuth: true }
    );

    if (!response.data) {
      throw new Error('Failed to update transaction status');
    }

    return parseHubaTransaction(response.data);
  }
}
