/**
 * Item/Product Entity
 * Supports dual pricing:
 * - price: Price per main unit (kg)
 * - pricePerPcs: Price per piece (optional, for dual pricing)
 */
export interface Item {
  id: string;
  licenseKey: string;
  name: string;
  description?: string;
  price: number;
  pricePerPcs?: number;
  imageUrl?: string;
  category?: string;
  stockQuantity: number;
  unit?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Item Data from API response
 */
export interface ItemData {
  id: string;
  license_key: string;
  name: string;
  description?: string;
  price: number;
  price_per_pcs?: number;
  image_url?: string;
  category?: string;
  stock_quantity: number;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Parse ItemData from API response to Item entity
 */
export function parseItem(data: ItemData): Item {
  return {
    id: data.id,
    licenseKey: data.license_key || '',
    name: data.name,
    description: data.description,
    price: Number(data.price),
    pricePerPcs: data.price_per_pcs ? Number(data.price_per_pcs) : undefined,
    imageUrl: data.image_url,
    category: data.category,
    stockQuantity: data.stock_quantity,
    unit: data.unit,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
  };
}

/**
 * Create Item Request
 */
export interface CreateItemRequest {
  licenseKey: string;
  name: string;
  unit: string;
  price: number;
  pricePerPcs?: number;
  description?: string;
  category?: string;
}

/**
 * Convert CreateItemRequest to API payload
 */
export function toCreateItemPayload(
  request: CreateItemRequest
): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    license_key: request.licenseKey,
    name: request.name,
    unit: request.unit,
    price: request.price,
  };

  if (request.pricePerPcs && request.pricePerPcs > 0) {
    payload.price_per_pcs = request.pricePerPcs;
  }
  if (request.description) payload.description = request.description;
  if (request.category) payload.category = request.category;

  return payload;
}

/**
 * Update Item Request
 */
export interface UpdateItemRequest {
  id: string;
  licenseKey: string;
  name?: string;
  unit?: string;
  price?: number;
  pricePerPcs?: number;
  description?: string;
  category?: string;
}

/**
 * Convert UpdateItemRequest to API payload
 */
export function toUpdateItemPayload(
  request: UpdateItemRequest
): Record<string, string | number> {
  const payload: Record<string, string | number> = {
    license_key: request.licenseKey,
  };

  if (request.name) payload.name = request.name;
  if (request.unit) payload.unit = request.unit;
  if (request.price !== undefined) payload.price = request.price;
  if (request.pricePerPcs !== undefined)
    payload.price_per_pcs = request.pricePerPcs;
  if (request.description) payload.description = request.description;
  if (request.category) payload.category = request.category;

  return payload;
}

/**
 * Get Items Request
 */
export interface GetItemsRequest {
  licenseKey: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}
