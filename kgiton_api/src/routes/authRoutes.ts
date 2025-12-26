import { Router } from 'express';
import { register, login, logout, verifyEmail, forgotPassword, forgotPasswordPage, resetPasswordPage, resetPassword } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - license_key
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *               license_key:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration initiated, check email for verification
 *       400:
 *         description: Invalid input or license key
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address after registration
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully, user created
 *       400:
 *         description: Invalid or expired verification token
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, logout);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent if email exists
 *       400:
 *         description: Invalid input
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/forgot-password-page:
 *   get:
 *     summary: Show forgot password page
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: HTML page for forgot password
 */
router.get('/forgot-password-page', forgotPasswordPage);

/**
 * @swagger
 * /api/auth/reset-password-page:
 *   get:
 *     summary: Show reset password form
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: HTML page for reset password form
 *       400:
 *         description: Invalid or expired token
 */
router.get('/reset-password-page', resetPasswordPage);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or password
 */
router.post('/reset-password', resetPassword);

export default router;
