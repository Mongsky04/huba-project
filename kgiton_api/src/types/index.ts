export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  USER = 'user',
}

export enum TransactionStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  // Winpay Checkout Page (all payment methods in one page)
  CHECKOUT_PAGE = 'checkout_page',
  // Winpay Virtual Account
  VA_BRI = 'va_bri',
  VA_BNI = 'va_bni',
  VA_BCA = 'va_bca',
  VA_MANDIRI = 'va_mandiri',
  VA_PERMATA = 'va_permata',
  VA_BSI = 'va_bsi',
  VA_CIMB = 'va_cimb',
  VA_SINARMAS = 'va_sinarmas',
  VA_MUAMALAT = 'va_muamalat',
  VA_INDOMARET = 'va_indomaret',
  VA_ALFAMART = 'va_alfamart',
  // Legacy (for backward compatibility)
  MANUAL = 'manual',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  api_key: string;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export enum LicenseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
}

export interface LicenseKey {
  id: string;
  key: string;
  price_per_token: number;
  token_balance: number;
  status: LicenseStatus;
  assigned_to: string | null;
  referred_by_user_id: string | null;
  trial_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  license_key_id: string;
  amount: number;
  tokens_added: number;
  status: TransactionStatus;
  payment_reference?: string;
  payment_method?: PaymentMethod;
  // Winpay specific fields
  winpay_contract_id?: string;
  winpay_invoice_id?: string;
  winpay_va_number?: string;
  winpay_channel?: string;
  expires_at?: string;
  created_at: string;
}

export interface TokenUsage {
  id: string;
  license_key_id: string;
  user_id: string;
  previous_balance: number;
  new_balance: number;
  purpose?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
