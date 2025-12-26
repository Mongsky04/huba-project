import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransactionStatus
} from '../controllers/transactionController';

const router = Router();

/**
 * @route   POST /api/transactions
 * @desc    Create transaction from cart
 * @access  Private
 */
router.post('/', authenticate, createTransaction);

/**
 * @route   GET /api/transactions
 * @desc    Get user transactions with pagination
 * @access  Private
 */
router.get('/', authenticate, getTransactions);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID with items
 * @access  Private
 */
router.get('/:id', authenticate, getTransactionById);

/**
 * @route   PUT /api/transactions/:id/status
 * @desc    Update transaction status
 * @access  Private
 */
router.put('/:id/status', authenticate, updateTransactionStatus);

export default router;
