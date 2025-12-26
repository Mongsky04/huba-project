/**
 * Huba Transaction Entity (different from token transaction)
 * Represents an e-commerce transaction
 */
export interface HubaTransaction {
  id: string;
  transactionCode: string;
  licenseKey: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  paymentMethod?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  items?: HubaTransactionItem[];
}

/**
 * Huba Transaction Item Entity
 */
export interface HubaTransactionItem {
  id: string;
  transactionId: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  subtotal: number;
  createdAt: Date;
}

/**
 * Huba Transaction Data from API response
 */
export interface HubaTransactionData {
  id: string;
  transaction_code: string;
  license_key: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_phone?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  items?: HubaTransactionItemData[];
}

/**
 * Huba Transaction Item Data from API response
 */
export interface HubaTransactionItemData {
  id: string;
  transaction_id: string;
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

/**
 * Parse HubaTransactionItemData from API response
 */
export function parseHubaTransactionItem(
  data: HubaTransactionItemData
): HubaTransactionItem {
  return {
    id: data.id,
    transactionId: data.transaction_id,
    itemId: data.item_id,
    itemName: data.item_name,
    itemPrice: Number(data.item_price),
    quantity: data.quantity,
    subtotal: Number(data.subtotal),
    createdAt: new Date(data.created_at),
  };
}

/**
 * Parse HubaTransactionData from API response to HubaTransaction entity
 */
export function parseHubaTransaction(
  data: HubaTransactionData
): HubaTransaction {
  return {
    id: data.id,
    transactionCode: data.transaction_code,
    licenseKey: data.license_key || '',
    userId: data.user_id,
    totalAmount: Number(data.total_amount),
    status: data.status as HubaTransaction['status'],
    paymentMethod: data.payment_method,
    shippingAddress: data.shipping_address,
    shippingCity: data.shipping_city,
    shippingState: data.shipping_state,
    shippingPostalCode: data.shipping_postal_code,
    shippingPhone: data.shipping_phone,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    items: data.items?.map(parseHubaTransactionItem),
  };
}

/**
 * Checkout/Create Transaction Request
 */
export interface CheckoutRequest {
  licenseKey: string;
  paymentMethod?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingPhone?: string;
  notes?: string;
}

/**
 * Convert CheckoutRequest to API payload
 */
export function toCheckoutPayload(
  request: CheckoutRequest
): Record<string, string> {
  const payload: Record<string, string> = {
    license_key: request.licenseKey,
  };

  if (request.paymentMethod) payload.payment_method = request.paymentMethod;
  if (request.shippingAddress)
    payload.shipping_address = request.shippingAddress;
  if (request.shippingCity) payload.shipping_city = request.shippingCity;
  if (request.shippingState) payload.shipping_state = request.shippingState;
  if (request.shippingPostalCode)
    payload.shipping_postal_code = request.shippingPostalCode;
  if (request.shippingPhone) payload.shipping_phone = request.shippingPhone;
  if (request.notes) payload.notes = request.notes;

  return payload;
}

/**
 * Get Transactions Request
 */
export interface GetTransactionsRequest {
  licenseKey: string;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * Update Transaction Status Request
 */
export interface UpdateTransactionStatusRequest {
  transactionId: string;
  status: string;
}
