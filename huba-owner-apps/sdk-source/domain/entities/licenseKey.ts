/**
 * License Key Entity
 * Pure business object representing a license key.
 */
export interface LicenseKey {
  id: string;
  key: string;
  pricePerToken: number;
  tokenBalance: number;
  status: 'active' | 'inactive' | 'trial';
  assignedTo?: string;
  trialExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * License Key Data from API response
 */
export interface LicenseKeyData {
  id: string;
  key: string;
  price_per_token: number;
  token_balance: number;
  status: string;
  assigned_to?: string;
  trial_expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Parse LicenseKeyData from API response to LicenseKey entity
 */
export function parseLicenseKey(data: LicenseKeyData): LicenseKey {
  return {
    id: data.id,
    key: data.key,
    pricePerToken: data.price_per_token,
    tokenBalance: data.token_balance,
    status: data.status as 'active' | 'inactive' | 'trial',
    assignedTo: data.assigned_to,
    trialExpiresAt: data.trial_expires_at
      ? new Date(data.trial_expires_at)
      : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Check if license is active
 */
export function isLicenseActive(license: LicenseKey): boolean {
  return license.status === 'active';
}

/**
 * Check if license is inactive
 */
export function isLicenseInactive(license: LicenseKey): boolean {
  return license.status === 'inactive';
}

/**
 * Check if license is in trial mode
 */
export function isLicenseTrial(license: LicenseKey): boolean {
  return license.status === 'trial';
}

/**
 * Check if license is assigned
 */
export function isLicenseAssigned(license: LicenseKey): boolean {
  return license.assignedTo !== undefined && license.assignedTo !== null;
}

/**
 * Create License Key Request
 */
export interface CreateLicenseKeyRequest {
  key: string;
  pricePerToken: number;
  tokenBalance?: number;
}

/**
 * Bulk Create License Keys Request
 */
export interface BulkCreateLicenseKeysRequest {
  count: number;
  pricePerToken: number;
  tokenBalance?: number;
}

/**
 * Update License Key Request
 */
export interface UpdateLicenseKeyRequest {
  id: string;
  pricePerToken?: number;
  tokenBalance?: number;
  status?: 'active' | 'inactive' | 'trial';
}

/**
 * Set Trial Mode Request
 */
export interface SetTrialModeRequest {
  id: string;
  trialDays: number;
}

/**
 * Add Token Balance Request
 */
export interface AddTokenBalanceRequest {
  id: string;
  tokens: number;
}
