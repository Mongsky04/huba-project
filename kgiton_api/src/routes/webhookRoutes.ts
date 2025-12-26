import { Router } from 'express';
import { paymentWebhook, paymentGatewayCallback, winpayVACallback, winpayCheckoutCallback } from '../controllers/webhookController';

const router = Router();

/**
 * @swagger
 * /api/webhook/payment:
 *   post:
 *     summary: Payment webhook endpoint (dipanggil oleh payment gateway)
 *     description: Endpoint ini dipanggil oleh payment gateway (Midtrans, Xendit, dll) untuk mengupdate status pembayaran transaksi yang sudah dibuat melalui /api/topup/request
 *     tags: [Webhook]
 *     parameters:
 *       - in: header
 *         name: x-webhook-secret
 *         schema:
 *           type: string
 *         description: Webhook secret untuk validasi (jika dikonfigurasi)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transaction_id
 *               - status
 *             properties:
 *               transaction_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID transaksi yang dibuat dari /api/topup/request
 *                 example: "38c14b48-5fbb-4cbc-9b78-c261cdc50d0c"
 *               order_id:
 *                 type: string
 *                 description: Order ID dari payment gateway
 *                 example: "ORDER-123456"
 *               status:
 *                 type: string
 *                 enum: [success, pending, failed]
 *                 description: Status pembayaran dari payment gateway
 *                 example: "success"
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       401:
 *         description: Invalid webhook secret
 *       404:
 *         description: Transaction not found
 */
router.post('/payment', paymentWebhook);

/**
 * @swagger
 * /api/webhook/payment/callback:
 *   post:
 *     summary: Universal Payment Gateway Callback
 *     description: |
 *       Endpoint universal untuk callback dari semua payment gateway (Winpay, Xendit, Midtrans).
 *       Sistem akan secara otomatis mendeteksi provider berdasarkan konfigurasi.
 *       
 *       **Gunakan endpoint ini untuk semua provider payment gateway.**
 *     tags: [Webhook - Universal]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Payload callback dari payment gateway (format bervariasi per provider)
 *     responses:
 *       200:
 *         description: Callback processed successfully
 */
router.post('/payment/callback', paymentGatewayCallback);

/**
 * @swagger
 * /api/webhook/winpay/va:
 *   post:
 *     summary: Winpay SNAP API Virtual Account Callback
 *     description: |
 *       Endpoint ini dipanggil oleh Winpay saat pembayaran VA berhasil.
 *       Path ini harus didaftarkan di Winpay Dashboard.
 *       
 *       **Expected Response:** `{"responseCode": "2002500", "responseMessage": "Successful"}`
 *     tags: [Webhook - Winpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerServiceId:
 *                 type: string
 *                 description: Kode BIN dari bank
 *               customerNo:
 *                 type: string
 *                 description: Nomor Customer
 *               virtualAccountNo:
 *                 type: string
 *                 description: Nomor Virtual Account
 *               virtualAccountName:
 *                 type: string
 *                 description: Nama Virtual Account
 *               trxId:
 *                 type: string
 *                 description: ID transaksi (transaction_id dari sistem kita)
 *               paymentRequestId:
 *                 type: string
 *                 description: Nomor transaksi pembayaran
 *               paidAmount:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                     description: Nominal yang dibayar
 *                   currency:
 *                     type: string
 *                     description: Kode mata uang
 *               trxDateTime:
 *                 type: string
 *                 description: Tanggal transaksi (ISO8601)
 *               referenceNo:
 *                 type: string
 *                 description: Nomor referensi pembayaran
 *               additionalInfo:
 *                 type: object
 *                 properties:
 *                   channel:
 *                     type: string
 *                     description: Kode channel (BRI, BNI, BCA, dll)
 *                   contractId:
 *                     type: string
 *                     description: Contract ID dari Winpay
 *     responses:
 *       200:
 *         description: Callback processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseCode:
 *                   type: string
 *                   example: "2002500"
 *                 responseMessage:
 *                   type: string
 *                   example: "Successful"
 */
router.post('/winpay/va', winpayVACallback);

/**
 * @swagger
 * /api/webhook/winpay/checkout:
 *   post:
 *     summary: Winpay Checkout Page Callback
 *     description: |
 *       Endpoint ini dipanggil oleh Winpay saat pembayaran via Checkout Page berhasil.
 *       Path ini harus didaftarkan di Winpay Dashboard sebagai callback URL.
 *       
 *       **Expected Response:** String `ACCEPTED`
 *     tags: [Webhook - Winpay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uuid:
 *                 type: string
 *                 description: Invoice UUID
 *               created_at:
 *                 type: string
 *                 description: Waktu invoice dibuat (ISO8601)
 *               ref:
 *                 type: string
 *                 description: Referensi invoice (transaction_id dari sistem kita)
 *               channel:
 *                 type: string
 *                 description: Channel pembayaran (BSI, BRI, QRIS, dll)
 *               amount:
 *                 type: integer
 *                 description: Nominal yang dibayar
 *               fee:
 *                 type: integer
 *                 description: Fee transaksi
 *               nett_amount:
 *                 type: integer
 *                 description: Nominal bersih (amount - fee)
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     qty:
 *                       type: integer
 *                     price:
 *                       type: integer
 *               invoice:
 *                 type: object
 *                 properties:
 *                   uuid:
 *                     type: string
 *                   ref:
 *                     type: string
 *                   url:
 *                     type: string
 *                   customer:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *     responses:
 *       200:
 *         description: Callback processed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "ACCEPTED"
 */
router.post('/winpay/checkout', winpayCheckoutCallback);

export default router;
