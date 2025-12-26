import { Router } from 'express';
import { getItems, getItemById, getCategories, createItem, updateItem, deleteItem } from '../controllers/itemController';

const router = Router();

/**
 * @route   GET /api/items
 * @desc    Get all items with pagination and filters
 * @access  Public (license_key required for isolation)
 */
router.get('/', getItems);

/**
 * @route   POST /api/items
 * @desc    Create a new item
 * @access  Public (license_key required for isolation)
 */
router.post('/', createItem);

/**
 * @route   GET /api/items/categories
 * @desc    Get all item categories
 * @access  Public (license_key required for isolation)
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/items/:id
 * @desc    Get item by ID
 * @access  Public (license_key required for isolation)
 */
router.get('/:id', getItemById);

/**
 * @route   PUT /api/items/:id
 * @desc    Update an item
 * @access  Public (license_key required for isolation)
 */
router.put('/:id', updateItem);

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete an item (soft delete)
 * @access  Public (license_key required for isolation)
 */
router.delete('/:id', deleteItem);

export default router;
