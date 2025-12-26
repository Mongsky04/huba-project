import { Router } from 'express';
import {
  getTokenBalance,
  getUserProfile,
  assignLicenseKey,
} from '../controllers/userController';
import { useToken } from '../controllers/licenseController';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/user/token-balance:
 *   get:
 *     summary: Get user's token balance from all license keys
 *     description: Returns all license keys owned by the user with their balances and total balance
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     license_keys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           license_key:
 *                             type: string
 *                           token_balance:
 *                             type: integer
 *                           price_per_token:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, trial]
 *                     total_balance:
 *                       type: integer
 *                       description: Sum of all token balances from all license keys
 *       400:
 *         description: User does not have any license keys
 *       404:
 *         description: User not found
 */
router.get('/token-balance', authenticate, getTokenBalance);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile with all license keys
 *     description: Returns user profile information including all owned license keys
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, super_admin]
 *                     api_key:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     license_keys:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           key:
 *                             type: string
 *                           token_balance:
 *                             type: integer
 *                           price_per_token:
 *                             type: integer
 *                           status:
 *                             type: string
 *                             enum: [active, inactive, trial]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticate, getUserProfile);

/**
 * @swagger
 * /api/user/license-keys/{licenseKey}/use-token:
 *   post:
 *     summary: Use 1 token from license key (User only)
 *     description: Reduces token balance by 1 and records the usage. Each hit automatically uses 1 token. No request body required.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: licenseKey
 *         required: true
 *         schema:
 *           type: string
 *         description: License key (e.g., ABC12-XYZ34-QWE56)
 *         example: CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purpose:
 *                 type: string
 *                 description: Optional purpose description
 *                 example: API request
 *               metadata:
 *                 type: object
 *                 description: Optional additional data
 *                 example: { "endpoint": "/api/data", "method": "GET" }
 *     responses:
 *       200:
 *         description: Token used successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token used successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     license_key:
 *                       type: string
 *                       example: CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E
 *                     previous_balance:
 *                       type: integer
 *                       example: 100
 *                     new_balance:
 *                       type: integer
 *                       example: 99
 *                     tokens_used:
 *                       type: integer
 *                       example: 1
 *       400:
 *         description: Insufficient token balance or license not active
 *       403:
 *         description: User does not own this license key
 *       404:
 *         description: License key not found
 */
router.post('/license-keys/:licenseKey/use-token', authenticate, useToken);

/**
 * @swagger
 * /api/user/assign-license:
 *   post:
 *     summary: Assign a new license key to user account
 *     description: Allows authenticated user to add an additional license key to their account. The license key must exist and not be assigned to any other user.
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - license_key
 *             properties:
 *               license_key:
 *                 type: string
 *                 description: The license key to assign
 *                 example: ABC12-XYZ34-QWE56-RTY78-UIO90
 *     responses:
 *       200:
 *         description: License key assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: License key assigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     license_key:
 *                       type: string
 *                     token_balance:
 *                       type: integer
 *                     price_per_token:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: License key already assigned or invalid
 *       404:
 *         description: License key not found
 */
router.post('/assign-license', authenticate, assignLicenseKey);

export default router;
