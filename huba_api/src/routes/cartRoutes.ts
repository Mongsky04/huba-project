import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController';

const router = Router();

/**
 * @route   GET /api/cart
 * @desc    Get user cart
 * @access  Private
 */
router.get('/', authenticate, getCart);

/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', authenticate, addToCart);

/**
 * @route   PUT /api/cart/:id
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:id', authenticate, updateCartItem);

/**
 * @route   DELETE /api/cart/:id
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:id', authenticate, removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear cart
 * @access  Private
 */
router.delete('/', authenticate, clearCart);

export default router;
