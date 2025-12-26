import { Item, ItemData, parseItem } from './item';

/**
 * Cart Item Entity
 * Supports weighing functionality with decimal quantity and quantity_pcs
 */
export interface CartItem {
  id: string;
  licenseKey: string;
  cartSessionId?: string;
  userId: string;
  itemId: string;
  quantity: number;
  quantityPcs?: number;
  notes?: string;
  unitPrice?: number;
  totalPrice?: number;
  addedAt: Date;
  updatedAt?: Date;
  item?: Item;
}

/**
 * Cart Item Data from API response
 */
export interface CartItemData {
  id: string;
  license_key: string;
  cart_session_id?: string;
  user_id: string;
  item_id: string;
  quantity: number;
  quantity_pcs?: number;
  notes?: string;
  unit_price?: number;
  total_price?: number;
  added_at: string;
  updated_at?: string;
  item?: ItemData;
}

/**
 * Parse CartItemData from API response to CartItem entity
 */
export function parseCartItem(data: CartItemData): CartItem {
  return {
    id: data.id,
    licenseKey: data.license_key || '',
    cartSessionId: data.cart_session_id,
    userId: data.user_id,
    itemId: data.item_id,
    quantity: Number(data.quantity) || 0,
    quantityPcs: data.quantity_pcs ? Number(data.quantity_pcs) : undefined,
    notes: data.notes,
    unitPrice: data.unit_price ? Number(data.unit_price) : undefined,
    totalPrice: data.total_price ? Number(data.total_price) : undefined,
    addedAt: new Date(data.added_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    item: data.item ? parseItem(data.item) : undefined,
  };
}

/**
 * Calculate subtotal for cart item
 */
export function calculateCartItemSubtotal(cartItem: CartItem): number {
  if (cartItem.totalPrice) return cartItem.totalPrice;
  if (!cartItem.item) return 0;

  let total = 0;
  if (cartItem.quantity > 0) {
    total += cartItem.item.price * cartItem.quantity;
  }
  if (
    cartItem.quantityPcs &&
    cartItem.quantityPcs > 0 &&
    cartItem.item.pricePerPcs
  ) {
    total += cartItem.item.pricePerPcs * cartItem.quantityPcs;
  }
  return total;
}

/**
 * Add to Cart Request
 */
export interface AddToCartRequest {
  licenseKey: string;
  itemId: string;
  quantity: number;
  quantityPcs?: number;
  notes?: string;
  unitPrice?: number;
  totalPrice?: number;
  cartSessionId?: string;
}

/**
 * Convert AddToCartRequest to API payload
 */
export function toAddToCartPayload(
  request: AddToCartRequest
): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    license_key: request.licenseKey,
    item_id: request.itemId,
    quantity: request.quantity,
  };

  if (request.quantityPcs !== undefined)
    payload.quantity_pcs = request.quantityPcs;
  if (request.notes) payload.notes = request.notes;
  if (request.unitPrice !== undefined) payload.unit_price = request.unitPrice;
  if (request.totalPrice !== undefined)
    payload.total_price = request.totalPrice;
  if (request.cartSessionId) payload.cart_session_id = request.cartSessionId;

  return payload;
}

/**
 * Update Cart Item Request
 */
export interface UpdateCartItemRequest {
  cartItemId: string;
  quantity?: number;
  quantityPcs?: number;
  notes?: string;
}

/**
 * Convert UpdateCartItemRequest to API payload
 */
export function toUpdateCartItemPayload(
  request: UpdateCartItemRequest
): Record<string, string | number> {
  const payload: Record<string, string | number> = {};

  if (request.quantity !== undefined) payload.quantity = request.quantity;
  if (request.quantityPcs !== undefined)
    payload.quantity_pcs = request.quantityPcs;
  if (request.notes) payload.notes = request.notes;

  return payload;
}
