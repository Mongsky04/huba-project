/**
 * Transaction Entity (Token Transaction)
 * Pure business object representing a token transaction.
 */
export interface Transaction {
  id: string;
  userId: string;
  licenseKeyId: string;
  amount: number;
  tokensAdded: number;
  status: 'pending' | 'success' | 'failed';
  paymentReference?: string;
  createdAt: Date;
}

/**
 * Transaction Data from API response
 */
export interface TransactionData {
  id: string;
  user_id: string;
  license_key_id: string;
  amount: number;
  tokens_added: number;
  status: string;
  payment_reference?: string;
  created_at: string;
}

/**
 * Parse TransactionData from API response to Transaction entity
 */
export function parseTransaction(data: TransactionData): Transaction {
  return {
    id: data.id,
    userId: data.user_id,
    licenseKeyId: data.license_key_id,
    amount: data.amount,
    tokensAdded: data.tokens_added,
    status: data.status as 'pending' | 'success' | 'failed',
    paymentReference: data.payment_reference,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Check if transaction is pending
 */
export function isTransactionPending(transaction: Transaction): boolean {
  return transaction.status === 'pending';
}

/**
 * Check if transaction is successful
 */
export function isTransactionSuccess(transaction: Transaction): boolean {
  return transaction.status === 'success';
}

/**
 * Check if transaction failed
 */
export function isTransactionFailed(transaction: Transaction): boolean {
  return transaction.status === 'failed';
}
