export interface UserProfile {
  id?: string;
  user_id: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  profile_image_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id?: string;
  license_key: string; // CRITICAL: Item belongs to a license key (using key string directly)
  user_id: string; // Owner of the license key
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity: number;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id?: string;
  license_key: string; // CRITICAL: Cart item belongs to a license key (using key string directly)
  cart_session_id?: string; // Session ID for grouping cart items
  user_id: string;
  item_id: string;
  quantity: number; // Weight in kg (decimal)
  quantity_pcs?: number; // Quantity in pieces (optional)
  notes?: string;
  unit_price?: number; // Price per kg at time of adding
  price_per_pcs?: number; // Price per piece at time of adding
  total_price?: number;
  added_at?: string;
  updated_at?: string;
  item?: Item; // Populated when joined
}

export interface Transaction {
  id?: string;
  transaction_code?: string;
  license_key: string; // CRITICAL: Transaction belongs to a license key (using key string directly)
  user_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  payment_method?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export interface TransactionItem {
  id?: string;
  transaction_id: string;
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
