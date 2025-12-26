import { HubaApiService } from '../api/hubaApiService';
import {
  ExtendedUserProfile,
  UpdateProfileRequest,
} from '../domain/entities/extendedUserProfile';
import {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
} from '../domain/entities/item';
import { CartItem, AddToCartRequest } from '../domain/entities/cartItem';
import { HubaTransaction, CheckoutRequest } from '../domain/entities/hubaTransaction';

/**
 * Helper class for Huba API operations
 * Provides simplified access to Huba features
 *
 * CRITICAL: All item/cart/transaction operations require licenseKey
 * Each license key has its own isolated ecosystem
 */
export class HubaHelper {
  private service: HubaApiService;

  constructor(options?: { baseUrl?: string; service?: HubaApiService }) {
    this.service = options?.service || new HubaApiService({ baseUrl: options?.baseUrl });
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.service.setAccessToken(token);
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.service.clearAccessToken();
  }

  // ==================== Profile Operations ====================
  // Profile is NOT license-key specific (shared across all license keys)

  /**
   * Get user profile
   */
  async getProfile(): Promise<ExtendedUserProfile> {
    return this.service.getProfile();
  }

  /**
   * Update user profile
   */
  async updateProfile(request: UpdateProfileRequest): Promise<ExtendedUserProfile> {
    return this.service.updateProfile(request);
  }

  // ==================== Item Operations ====================
  // Items are license-key specific

  /**
   * Browse items for a specific license key
   * [licenseKey] is REQUIRED - items are isolated per license key
   */
  async getItems(options: {
    licenseKey: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Item[]> {
    return this.service.getItems({
      licenseKey: options.licenseKey,
      category: options.category,
      search: options.search,
      page: options.page,
      limit: options.limit,
    });
  }

  /**
   * Get item details
   * [licenseKey] is REQUIRED - items are isolated per license key
   */
  async getItemById(id: string, licenseKey: string): Promise<Item> {
    return this.service.getItemById(id, licenseKey);
  }

  /**
   * Get all categories for a specific license key
   * [licenseKey] is REQUIRED - categories are isolated per license key
   */
  async getCategories(licenseKey: string): Promise<string[]> {
    return this.service.getCategories(licenseKey);
  }

  /**
   * Create a new item
   * [licenseKey] is REQUIRED - items are isolated per license key
   */
  async createItem(request: CreateItemRequest): Promise<Item> {
    return this.service.createItem(request);
  }

  /**
   * Update an existing item
   * [licenseKey] is REQUIRED - items are isolated per license key
   */
  async updateItem(request: UpdateItemRequest): Promise<Item> {
    return this.service.updateItem(request);
  }

  /**
   * Delete an item (soft delete)
   * [licenseKey] is REQUIRED - items are isolated per license key
   */
  async deleteItem(id: string, licenseKey: string): Promise<void> {
    return this.service.deleteItem(id, licenseKey);
  }

  // ==================== Cart Operations ====================
  // Cart is license-key specific

  /**
   * Get cart items for a specific license key
   * [licenseKey] is REQUIRED - cart is isolated per license key
   */
  async getCart(licenseKey: string): Promise<CartItem[]> {
    return this.service.getCart(licenseKey);
  }

  /**
   * Add item to cart with weighing support
   * [licenseKey] is REQUIRED - cart is isolated per license key
   * [quantity] is weight in kg (decimal)
   * [quantityPcs] is optional pieces count
   */
  async addToCart(request: AddToCartRequest): Promise<CartItem> {
    return this.service.addToCart(request);
  }

  /**
   * Update cart item quantity with weighing support
   */
  async updateCartQuantity(options: {
    cartItemId: string;
    quantity?: number;
    quantityPcs?: number;
    notes?: string;
  }): Promise<CartItem> {
    return this.service.updateCartItem({
      cartItemId: options.cartItemId,
      quantity: options.quantity,
      quantityPcs: options.quantityPcs,
      notes: options.notes,
    });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: string): Promise<void> {
    return this.service.removeFromCart(cartItemId);
  }

  /**
   * Clear entire cart for a specific license key
   * [licenseKey] is REQUIRED - cart is isolated per license key
   */
  async clearCart(licenseKey: string): Promise<void> {
    return this.service.clearCart(licenseKey);
  }

  /**
   * Get cart total amount for a specific license key
   * [licenseKey] is REQUIRED - cart is isolated per license key
   */
  async getCartTotal(licenseKey: string): Promise<number> {
    return this.service.getCartTotal(licenseKey);
  }

  // ==================== Transaction Operations ====================
  // Transactions are license-key specific

  /**
   * Create transaction and checkout
   * [licenseKey] is REQUIRED - transactions are isolated per license key
   */
  async checkout(request: CheckoutRequest): Promise<HubaTransaction> {
    return this.service.checkout(request);
  }

  /**
   * Get transaction history for a specific license key
   * [licenseKey] is REQUIRED - transactions are isolated per license key
   */
  async getTransactions(options: {
    licenseKey: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<HubaTransaction[]> {
    return this.service.getTransactions({
      licenseKey: options.licenseKey,
      status: options.status,
      page: options.page,
      limit: options.limit,
    });
  }

  /**
   * Get transaction details
   */
  async getTransactionById(id: string): Promise<HubaTransaction> {
    return this.service.getTransactionById(id);
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: string
  ): Promise<HubaTransaction> {
    return this.service.updateTransactionStatus(transactionId, status);
  }
}
