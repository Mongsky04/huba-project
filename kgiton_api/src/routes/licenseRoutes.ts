import { Router } from 'express';
import multer from 'multer';
import {
  createLicenseKey,
  getAllLicenseKeys,
  getLicenseKeyById,
  updateLicenseKey,
  deleteLicenseKey,
  setTrialMode,
  addTokenBalance,
  unassignLicenseKey,
  bulkCreateLicenseKeys,
  bulkUploadLicensesFromCSV,
} from '../controllers/licenseController';
import { authenticate, requireSuperAdmin } from '../middlewares/auth';

const router = Router();

// Configure multer for CSV upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/admin/license-keys:
 *   post:
 *     summary: Create a new license key (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - price_per_token
 *             properties:
 *               key:
 *                 type: string
 *               price_per_token:
 *                 type: integer
 *                 minimum: 1
 *               token_balance:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *     responses:
 *       201:
 *         description: License key created successfully
 *       400:
 *         description: Invalid input or license key already exists
 *       403:
 *         description: Super admin access required
 */
router.post('/', authenticate, requireSuperAdmin, createLicenseKey);

/**
 * @swagger
 * /api/admin/license-keys/bulk:
 *   post:
 *     summary: Bulk create license keys (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - count
 *               - price_per_token
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 10
 *                 description: Jumlah license key yang akan dibuat
 *               price_per_token:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1000
 *                 description: Harga per token untuk semua license key
 *               token_balance:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 example: 0
 *                 description: Saldo token awal (opsional, default 0)
 *     responses:
 *       201:
 *         description: License keys created successfully
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
 *                   example: Successfully created 10 license keys
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 10
 *                     license_keys:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Super admin access required
 *       500:
 *         description: Failed to create license keys
 */
router.post('/bulk', authenticate, requireSuperAdmin, bulkCreateLicenseKeys);

/**
 * @swagger
 * /api/admin/license-keys/bulk-upload:
 *   post:
 *     summary: Bulk upload license keys from CSV file (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with columns license_key, price_per_token, token_balance, assigned_to (optional)
 *           example: |
 *             license_key, price_per_token, token_balance, assigned_to
 *             P8T3G-FNZWC-5XYG9-FUZZD-BBE86, 55, 0, 
 *             G23AA-PAXYH-5UP2S-2LT82-2JCL5, 55, 100, a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *             M5XN5-5S6UW-CD2KP-KD4ET-URGSE, 55, 0,
 *     responses:
 *       201:
 *         description: Bulk upload completed
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
 *                   example: Bulk upload completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_rows:
 *                       type: integer
 *                       example: 100
 *                       description: Total baris di CSV
 *                     inserted:
 *                       type: integer
 *                       example: 95
 *                       description: Jumlah license key berhasil diinsert
 *                     skipped:
 *                       type: integer
 *                       example: 3
 *                       description: Jumlah license key yang di-skip (sudah ada)
 *                     invalid:
 *                       type: integer
 *                       example: 2
 *                       description: Jumlah baris invalid
 *                     skipped_keys:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Daftar license key yang di-skip
 *                     invalid_rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           row:
 *                             type: integer
 *                           reason:
 *                             type: string
 *                       description: Daftar baris invalid dengan alasannya
 *       400:
 *         description: Invalid CSV file or format
 *       403:
 *         description: Super admin access required
 *       500:
 *         description: Failed to process CSV
 */
router.post('/bulk-upload', authenticate, requireSuperAdmin, upload.single('file'), bulkUploadLicensesFromCSV);

/**
 * @swagger
 * /api/admin/license-keys:
 *   get:
 *     summary: Get all license keys (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all license keys
 *       403:
 *         description: Super admin access required
 */
router.get('/', authenticate, requireSuperAdmin, getAllLicenseKeys);

/**
 * @swagger
 * /api/admin/license-keys/{id}:
 *   get:
 *     summary: Get license key by ID (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: License key details
 *       404:
 *         description: License key not found
 */
router.get('/:id', authenticate, requireSuperAdmin, getLicenseKeyById);

/**
 * @swagger
 * /api/admin/license-keys/{id}:
 *   put:
 *     summary: Update license key (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price_per_token:
 *                 type: integer
 *               token_balance:
 *                 type: integer
 *     responses:
 *       200:
 *         description: License key updated successfully
 *       404:
 *         description: License key not found
 */
router.put('/:id', authenticate, requireSuperAdmin, updateLicenseKey);

/**
 * @swagger
 * /api/admin/license-keys/{id}:
 *   delete:
 *     summary: Delete license key (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: License key deleted successfully
 *       500:
 *         description: Failed to delete license key
 */
router.delete('/:id', authenticate, requireSuperAdmin, deleteLicenseKey);

/**
 * @swagger
 * /api/admin/license-keys/{license_key}/trial:
 *   post:
 *     summary: Set license key to trial mode (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: license_key
 *         required: true
 *         schema:
 *           type: string
 *         example: "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trial_days
 *               - token_balance
 *             properties:
 *               trial_days:
 *                 type: integer
 *                 minimum: 1
 *                 example: 7
 *                 description: Durasi trial dalam hari
 *               token_balance:
 *                 type: integer
 *                 minimum: 1
 *                 example: 100
 *                 description: Jumlah token gratis untuk trial
 *     responses:
 *       200:
 *         description: Trial mode activated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: License key not found
 */
router.post('/:license_key/trial', authenticate, requireSuperAdmin, setTrialMode);

/**
 * @swagger
 * /api/admin/license-keys/{license_key}/add-token:
 *   post:
 *     summary: Add token balance to license key (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: license_key
 *         required: true
 *         schema:
 *           type: string
 *         example: "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token_balance
 *             properties:
 *               token_balance:
 *                 type: integer
 *                 minimum: 1
 *                 example: 500
 *                 description: Jumlah token yang akan ditambahkan ke license key
 *               notes:
 *                 type: string
 *                 example: "Bonus untuk pelanggan setia"
 *                 description: Catatan tambahan untuk log penambahan token (opsional)
 *     responses:
 *       200:
 *         description: Token balance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     previous_balance:
 *                       type: integer
 *                     added_tokens:
 *                       type: integer
 *                     token_balance:
 *                       type: integer
 *       400:
 *         description: Invalid input
 *       404:
 *         description: License key not found
 */
router.post('/:license_key/add-token', authenticate, requireSuperAdmin, addTokenBalance);

/**
 * @swagger
 * /api/admin/license-keys/{license_key}/unassign:
 *   post:
 *     summary: Unassign license key from user (Super Admin only)
 *     tags: [License Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: license_key
 *         required: true
 *         schema:
 *           type: string
 *         example: "CCDXF-LKN45-6J6SJ-PDJ8C-L3M2E"
 *         description: License key yang akan di-reset
 *     description: |
 *       Reset license key ke kondisi awal:
 *       - assigned_to = null
 *       - token_balance = 0
 *       - status = inactive
 *       - trial_expires_at = null
 *     responses:
 *       200:
 *         description: License key reset and unassigned successfully
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
 *                   example: License key unassigned successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     license_key:
 *                       type: string
 *                     previous_user:
 *                       type: object
 *                     note:
 *                       type: string
 *       400:
 *         description: License key is not assigned to any user
 *       404:
 *         description: License key not found
 *       403:
 *         description: Super admin access required
 */
router.post('/:license_key/unassign', authenticate, requireSuperAdmin, unassignLicenseKey);

export default router;
