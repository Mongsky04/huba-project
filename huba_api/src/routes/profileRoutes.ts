import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getProfile, createOrUpdateProfile } from '../controllers/profileController';

const router = Router();

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/', authenticate, getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Create or update user profile
 * @access  Private
 */
router.put('/', authenticate, createOrUpdateProfile);

export default router;
