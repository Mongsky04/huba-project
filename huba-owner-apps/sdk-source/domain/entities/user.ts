/**
 * User Entity
 * Pure business object representing a user in the system.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  apiKey?: string;
  referralCode?: string;
  createdAt: Date;
}

/**
 * User Data from API response
 */
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  api_key?: string;
  referral_code?: string;
  created_at: string;
}

/**
 * Parse UserData from API response to User entity
 */
export function parseUser(data: UserData): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    apiKey: data.api_key,
    referralCode: data.referral_code,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin';
}

/**
 * Check if user is regular user
 */
export function isRegularUser(user: User): boolean {
  return user.role === 'user';
}
