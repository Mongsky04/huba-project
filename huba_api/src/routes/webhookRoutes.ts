/**
 * Webhook Routes
 * Receives webhooks from KGiTON Core API
 */

import { Router } from 'express';
import { handleKgitonWebhook } from '../controllers/webhookController';

const router = Router();

/**
 * @route POST /api/webhooks/kgiton
 * @desc Receive webhooks from KGiTON Core API
 * @access Protected (HMAC signature verification)
 */
router.post('/kgiton', handleKgitonWebhook);

export default router;
