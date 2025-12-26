import { Alert } from 'react-native';

/**
 * Test result types
 */
export type TestStatus = 'pending' | 'running' | 'success' | 'error';

export interface TestResult {
  name: string;
  status: TestStatus;
  message?: string;
  data?: any;
  error?: string;
  duration?: number;
}

/**
 * Show alert helper
 */
export const showAlert = (title: string, message: string) => {
  Alert.alert(title, message);
};

/**
 * Show error alert
 */
export const showError = (error: any) => {
  const message = error?.message || error?.error || String(error);
  Alert.alert('Error', message);
};

/**
 * Show success alert
 */
export const showSuccess = (message: string) => {
  Alert.alert('Success', message);
};

/**
 * Format JSON for display
 */
export const formatJSON = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Generate random email for testing
 */
export const generateTestEmail = (): string => {
  const timestamp = Date.now();
  return `test${timestamp}@example.com`;
};

/**
 * Generate random phone number
 */
export const generateTestPhone = (): string => {
  const random = Math.floor(Math.random() * 100000000);
  return `+628${random.toString().padStart(8, '0')}`;
};
