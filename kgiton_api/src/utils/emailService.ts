import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

  // Read HTML template from file
  const templatePath = path.join(__dirname, '../../public/views/verification-email.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

  // Replace placeholders with actual values
  htmlTemplate = htmlTemplate
    .replace(/{{NAME}}/g, name)
    .replace(/{{VERIFICATION_URL}}/g, verificationUrl)
    .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'sandikha@kgiton.com',
    to: email,
    subject: 'Verifikasi Email - KGiTON API',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypts password using AES-256-CBC
 * Returns format: iv:encryptedData
 */
export const encryptPassword = (password: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv and encrypted data separated by colon
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts password that was encrypted with encryptPassword
 * Expects format: iv:encryptedData
 */
export const decryptPassword = (encryptedPassword: string): string => {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const [ivHex, encryptedData] = encryptedPassword.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendResetPasswordEmail = async (
  email: string,
  name: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/reset-password-page?token=${token}`;

  // Read HTML template from file
  const templatePath = path.join(__dirname, '../../public/views/reset-password-email.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

  // Replace placeholders with actual values
  htmlTemplate = htmlTemplate
    .replace(/{{NAME}}/g, name)
    .replace(/{{RESET_URL}}/g, resetUrl)
    .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

  const mailOptions = {
    from: process.env.SMTP_FROM_EMAIL || 'sandikha@kgiton.com',
    to: email,
    subject: 'Reset Password - KGiTON API',
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset password email:', error);
    throw new Error('Failed to send reset password email');
  }
};
