import express from 'express';
import { requestTopup, getTransactionHistory, getAllTransactions, checkTransactionStatus, checkTransactionStatusPublic, cancelTransaction, getPaymentMethods } from '../controllers/topupController';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /api/topup/payment-methods:
 *   get:
 *     summary: Get available payment methods
 *     description: Returns list of available payment methods (Winpay VA, Checkout Page, etc.)
 *     tags: [Top-up]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "checkout_page"
 *                       name:
 *                         type: string
 *                         example: "Winpay Checkout Page"
 *                       description:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [checkout, va, manual]
 *                       enabled:
 *                         type: boolean
 */
router.get('/payment-methods', authenticate, getPaymentMethods);

/**
 * @swagger
 * /api/topup/request:
 *   post:
 *     summary: Request top-up token balance
 *     description: >
 *       Membuat request top-up dan mengembalikan payment URL atau VA number.
 *       Token belum ditambahkan sampai pembayaran dikonfirmasi melalui webhook.
 *     tags: [Top-up]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token_count
 *               - license_key
 *             properties:
 *               token_count:
 *                 type: integer
 *                 description: Jumlah token yang ingin dibeli
 *                 example: 1000
 *               license_key:
 *                 type: string
 *                 description: License key yang akan di top-up
 *                 example: "ABCDE-12345-FGHIJ-67890-KLMNO"
 *               payment_method:
 *                 type: string
 *                 description: >
 *                   Metode pembayaran yang tersedia:
 *                   * `checkout_page` - Winpay Checkout Page (semua metode dalam satu halaman)
 *                   * `va_bri` - Virtual Account BRI
 *                   * `va_bni` - Virtual Account BNI
 *                   * `va_bca` - Virtual Account BCA
 *                   * `va_mandiri` - Virtual Account Mandiri
 *                   * `va_permata` - Virtual Account Permata
 *                   * `va_bsi` - Virtual Account BSI
 *                   * `va_cimb` - Virtual Account CIMB
 *                   * `manual` - Transfer manual (verifikasi admin)
 *                 enum: [checkout_page, va_bri, va_bni, va_bca, va_mandiri, va_permata, va_bsi, va_cimb, manual]
 *                 default: checkout_page
 *                 example: "checkout_page"
 *               customer_phone:
 *                 type: string
 *                 description: Nomor telepon customer (opsional, jika tidak ada di profil)
 *                 example: "08123456789"
 *           examples:
 *             checkout:
 *               summary: Checkout Page (Recommended)
 *               value:
 *                 token_count: 1000
 *                 license_key: "ABCDE-12345-FGHIJ-67890-KLMNO"
 *                 payment_method: "checkout_page"
 *             va_bri:
 *               summary: Virtual Account BRI
 *               value:
 *                 token_count: 500
 *                 license_key: "ABCDE-12345-FGHIJ-67890-KLMNO"
 *                 payment_method: "va_bri"
 *             manual:
 *               summary: Manual Transfer
 *               value:
 *                 token_count: 2000
 *                 license_key: "ABCDE-12345-FGHIJ-67890-KLMNO"
 *                 payment_method: "manual"
 *     responses:
 *       200:
 *         description: Request top-up berhasil dibuat (status PENDING)
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
 *                   example: "Top-up request created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                       format: uuid
 *                       example: "38c14b48-5fbb-4cbc-9b78-c261cdc50d0c"
 *                     license_key:
 *                       type: string
 *                       example: "ABCDE-12345-FGHIJ-67890-KLMNO"
 *                     tokens_requested:
 *                       type: integer
 *                       example: 1000
 *                     amount_to_pay:
 *                       type: number
 *                       example: 100000
 *                     price_per_token:
 *                       type: number
 *                       example: 100
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     payment_method:
 *                       type: string
 *                       example: "checkout_page"
 *                     gateway_provider:
 *                       type: string
 *                       example: "winpay"
 *                     payment_url:
 *                       type: string
 *                       description: URL checkout (jika payment_method = checkout_page)
 *                       example: "https://checkout.winpay.id/pay/abc123"
 *                     virtual_account:
 *                       type: object
 *                       description: Info VA (jika payment_method = va_*)
 *                       properties:
 *                         number:
 *                           type: string
 *                           example: "88810001234567890"
 *                         name:
 *                           type: string
 *                           example: "KGITON - John Doe"
 *                         bank:
 *                           type: string
 *                           example: "BRI"
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-25T12:00:00.000Z"
 *       400:
 *         description: Invalid input (token_count harus > 0)
 *       401:
 *         description: Unauthorized (token tidak valid)
 *       403:
 *         description: License key tidak ter-assign ke user ini
 *       404:
 *         description: License key tidak ditemukan
 */
router.post('/request', authenticate, requestTopup);

/**
 * @swagger
 * /api/topup/check/{transaction_id}:
 *   get:
 *     summary: Cek status transaksi (Public)
 *     description: >
 *       Endpoint public untuk mengecek status pembayaran.
 *       Digunakan oleh halaman payment-complete setelah redirect dari payment gateway.
 *       Tidak memerlukan authentication.
 *     tags: [Top-up]
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID transaksi yang ingin dicek
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     tokens_added:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PENDING, SUCCESS, FAILED, EXPIRED, CANCELLED]
 *       404:
 *         description: Transaksi tidak ditemukan
 */
router.get('/check/:transaction_id', checkTransactionStatusPublic);

/**
 * @swagger
 * /api/topup/status/{transaction_id}:
 *   get:
 *     summary: Cek status transaksi (Authenticated)
 *     description: Endpoint untuk mengecek status pembayaran transaksi top-up (memerlukan login)
 *     tags: [Top-up]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID transaksi yang ingin dicek
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diambil
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaksi tidak ditemukan
 */
router.get('/status/:transaction_id', authenticate, checkTransactionStatus);

/**
 * @swagger
 * /api/topup/history:
 *   get:
 *     summary: Get transaction history user
 *     tags: [Top-up]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan transaction history
 *       401:
 *         description: Unauthorized
 */
router.get('/history', authenticate, getTransactionHistory);

/**
 * @swagger
 * /api/topup/cancel/{transaction_id}:
 *   post:
 *     summary: Cancel pending transaction
 *     description: Cancel a pending top-up transaction. Only works for transactions with PENDING status.
 *     tags: [Top-up]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID transaksi yang ingin di-cancel
 *     responses:
 *       200:
 *         description: Transaction cancelled successfully
 *       400:
 *         description: Cannot cancel non-pending transaction
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.post('/cancel/:transaction_id', authenticate, cancelTransaction);

// Super Admin only endpoint - hidden from public Swagger documentation
router.get('/all', authenticate, requireSuperAdmin, getAllTransactions);

export default router;
