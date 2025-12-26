import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { generateApiKey } from '../utils/apiKey';
import { AppError } from '../middlewares/errorHandler';
import { registerSchema } from '../validators';
import { generateVerificationToken, sendVerificationEmail, encryptPassword, decryptPassword, generateResetToken, sendResetPasswordEmail } from '../utils/emailService';
import { emitWebhookEvent, WebhookEventType } from '../services/webhookService';
import fs from 'fs';
import path from 'path';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { email, password, name, license_key, referral_code, entity_type, company_name, phone_number, address, city, state, postal_code, country } = req.body;

    // Build extended profile object if any fields are provided
    const extendedProfile = (entity_type || company_name || phone_number || address || city || state || postal_code || country)
      ? JSON.stringify({ entity_type, company_name, phone_number, address, city, state, postal_code, country })
      : null;

    // Validate referral code if provided (but don't get referrer yet - will be done at verification)
    if (referral_code && referral_code.trim() !== '') {
      const { data: referrerData, error: referrerError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referral_code)
        .single();

      if (referrerError || !referrerData) {
        throw new AppError(400, 'Invalid referral code');
      }
    }

    // Check if user already exists in auth
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users.some(user => user.email === email);
    
    if (userExists) {
      throw new AppError(400, 'Email already registered');
    }

    // Check if email already in pending registrations
    const { data: pendingData } = await supabaseAdmin
      .from('pending_registrations')
      .select('id')
      .eq('email', email)
      .single();

    if (pendingData) {
      throw new AppError(400, 'Registration already pending. Please check your email for verification link.');
    }

    // Check if license key exists (using admin client to bypass RLS)
    const { data: licenseData, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('id, status, assigned_to')
      .eq('key', license_key)
      .single();

    if (licenseError || !licenseData) {
      throw new AppError(400, 'Invalid license key');
    }

    // Check if license is already assigned to another user
    if (licenseData.assigned_to !== null) {
      throw new AppError(400, 'License key is already assigned to another user');
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    // Encrypt password for secure storage
    const encryptedPassword = encryptPassword(password);

    // Store pending registration (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .insert({
        email,
        password_hash: encryptedPassword, // Store encrypted password
        name,
        license_key,
        referral_code: referral_code || null, // Store referral code
        verification_token: verificationToken,
        expires_at: expiresAt.toISOString(),
        extended_profile: extendedProfile, // Store extended profile for Huba API
      });

    if (pendingError) {
      console.error('Failed to create pending registration:', pendingError);
      throw new AppError(500, 'Failed to process registration');
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      // Rollback: delete pending registration if email fails
      await supabaseAdmin
        .from('pending_registrations')
        .delete()
        .eq('verification_token', verificationToken);
      
      console.error('Failed to send verification email:', emailError);
      throw new AppError(500, 'Failed to send verification email. Please try again later.');
    }

    res.status(200).json({
      success: true,
      message: 'Registration initiated. Please check your email to verify your account. The verification link will expire in 24 hours.',
      data: {
        email,
        name,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Get user details including API key - use supabaseAdmin to bypass RLS
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, api_key, referral_code')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      console.error('Failed to fetch user details:', userError);
      throw new AppError(500, 'Failed to fetch user details');
    }

    // Get total token balance from all user's license keys
    const { data: licenseData } = await supabaseAdmin
      .from('license_keys')
      .select('token_balance')
      .eq('assigned_to', userData.id);
    
    const totalTokenBalance = licenseData?.reduce((sum, license) => sum + license.token_balance, 0) || 0;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          api_key: userData.api_key,
          referral_code: userData.referral_code,
          total_token_balance: totalTokenBalance,
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Sign out from Supabase (invalidate the token)
      await supabase.auth.signOut();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Verification token is required');
    }

    // Get pending registration
    const { data: pendingData, error: pendingError } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (pendingError || !pendingData) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    // Check if token has expired
    if (new Date(pendingData.expires_at) < new Date()) {
      // Delete expired pending registration
      await supabaseAdmin
        .from('pending_registrations')
        .delete()
        .eq('id', pendingData.id);
      
      throw new AppError(400, 'Verification token has expired. Please register again.');
    }

    // Check if license key still exists and is available
    const { data: licenseData, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('id, status, assigned_to')
      .eq('key', pendingData.license_key)
      .single();

    if (licenseError || !licenseData) {
      // Delete pending registration
      await supabaseAdmin
        .from('pending_registrations')
        .delete()
        .eq('id', pendingData.id);
      
      throw new AppError(400, 'License key is no longer valid');
    }

    // Check if license is now assigned to another user
    if (licenseData.assigned_to !== null) {
      // Delete pending registration
      await supabaseAdmin
        .from('pending_registrations')
        .delete()
        .eq('id', pendingData.id);
      
      throw new AppError(400, 'License key has been assigned to another user');
    }

    // Decrypt password before sending to Supabase Auth
    const decryptedPassword = decryptPassword(pendingData.password_hash);
    
    // Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: pendingData.email,
      password: decryptedPassword, // Use decrypted password
      email_confirm: true,
    });

    if (authError) {
      throw new AppError(400, authError.message);
    }

    if (!authData.user) {
      throw new AppError(500, 'Failed to create user');
    }

    // Generate API key
    const apiKey = generateApiKey();

    // Generate unique referral code
    const generateReferralCode = (): string => {
      return Math.random().toString(36).substring(2, 12).toUpperCase();
    };

    let referralCode = generateReferralCode();
    let codeExists = true;
    
    // Ensure referral code is unique
    while (codeExists) {
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      if (!existingUser) {
        codeExists = false;
      } else {
        referralCode = generateReferralCode();
      }
    }

    // Get referrer ID if referral code was provided
    let referredBy: string | null = null;
    if (pendingData.referral_code) {
      const { data: referrerData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', pendingData.referral_code)
        .single();
      
      if (referrerData) {
        referredBy = referrerData.id;
      }
    }

    // Create user record in users table
    // The trigger handle_referral_bonus will automatically give bonus tokens
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        name: pendingData.name,
        email: pendingData.email,
        role: 'user',
        api_key: apiKey,
        referral_code: referralCode,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (userError) {
      // Rollback: delete auth user if user record creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new AppError(500, 'Failed to create user record');
    }

    // Assign license key to the user and track referral
    const { error: assignLicenseError } = await supabaseAdmin
      .from('license_keys')
      .update({
        assigned_to: authData.user.id,
        referred_by_user_id: referredBy,
      })
      .eq('id', licenseData.id);

    if (assignLicenseError) {
      // Rollback: delete user and auth user if license assignment fails
      await supabaseAdmin.from('users').delete().eq('id', authData.user.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new AppError(500, 'Failed to assign license key');
    }

    // Distribute referral bonus if there's a referrer
    // This must be done AFTER license key is assigned
    if (referredBy) {
      try {
        await supabaseAdmin.rpc('distribute_referral_bonus', {
          new_user_id: authData.user.id,
          referrer_user_id: referredBy,
        });
      } catch (bonusError) {
        // Log error but don't fail registration
        console.error('Failed to distribute referral bonus:', bonusError);
      }
    }

    // Emit webhook event for user verification
    // This will be delivered to Huba API to create extended profile
    try {
      const extendedProfileData = pendingData.extended_profile 
        ? JSON.parse(pendingData.extended_profile) 
        : null;

      await emitWebhookEvent(WebhookEventType.USER_VERIFIED, {
        user_id: authData.user.id,
        email: pendingData.email,
        name: pendingData.name,
        license_key: pendingData.license_key,
        extended_profile: extendedProfileData,
      });

      console.log('[Webhook] user.verified event emitted for:', authData.user.id);
    } catch (webhookError) {
      // Log error but don't fail verification
      // Webhook system has retry mechanism
      console.error('Failed to emit webhook event:', webhookError);
    }

    // Delete pending registration after successful verification
    await supabaseAdmin
      .from('pending_registrations')
      .delete()
      .eq('id', pendingData.id);

    // Get user's license keys to calculate total token balance
    const { data: userLicenses } = await supabaseAdmin
      .from('license_keys')
      .select('token_balance')
      .eq('assigned_to', authData.user.id);
    
    const totalTokenBalance = userLicenses?.reduce((sum, license) => sum + license.token_balance, 0) || 0;

    // Read success HTML template
    const successTemplatePath = path.join(__dirname, '../../public/views/verification-success.html');
    let successHtml = fs.readFileSync(successTemplatePath, 'utf-8');

    // Replace placeholders
    successHtml = successHtml
      .replace(/{{EMAIL}}/g, userData.email)
      .replace(/{{NAME}}/g, userData.name)
      .replace(/{{API_KEY}}/g, apiKey)
      .replace(/{{REFERRAL_CODE}}/g, referralCode)
      .replace(/{{TOKEN_BALANCE}}/g, totalTokenBalance.toString());

    // Return HTML response for better UX
    res.status(200).send(successHtml);
  } catch (error) {
    if (error instanceof AppError) {
      // Read error HTML template
      const errorTemplatePath = path.join(__dirname, '../../public/views/verification-failed.html');
      let errorHtml = fs.readFileSync(errorTemplatePath, 'utf-8');

      // Replace placeholders
      errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, error.message);

      // Return HTML error response
      res.status(error.statusCode).send(errorHtml);
    } else {
      console.error('Verification error:', error);

      // Read server error HTML template
      const serverErrorTemplatePath = path.join(__dirname, '../../public/views/verification-error.html');
      const serverErrorHtml = fs.readFileSync(serverErrorTemplatePath, 'utf-8');

      res.status(500).send(serverErrorHtml);
    }
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, 'Email is required');
    }

    // Check if user exists
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUsers?.users.find(u => u.email === email);

    if (!user) {
      // Don't reveal if email exists or not for security
      res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly.',
      });
      return;
    }

    // Get user details from users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    // Generate reset token
    const resetToken = generateResetToken();

    // Store reset token (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        email: email,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create reset token:', tokenError);
      throw new AppError(500, 'Failed to process password reset request');
    }

    // Send reset email
    try {
      await sendResetPasswordEmail(email, userData?.name || 'User', resetToken);
    } catch (emailError) {
      // Rollback: delete reset token if email fails
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('reset_token', resetToken);
      
      console.error('Failed to send reset password email:', emailError);
      throw new AppError(500, 'Failed to send reset password email. Please try again later.');
    }

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link shortly.',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const forgotPasswordPage = async (_req: Request, res: Response): Promise<void> => {
  try {
    const htmlPath = path.join(__dirname, '../../public/views/forgot-password.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error loading forgot password page:', error);
    res.status(500).send('Internal server error');
  }
};

export const resetPasswordPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Reset token is required');
    }

    // Verify token exists and is not expired
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('reset_token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      const errorHtmlPath = path.join(__dirname, '../../public/views/reset-password-failed.html');
      let errorHtml = fs.readFileSync(errorHtmlPath, 'utf-8');
      errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, 'Invalid or expired reset token');
      res.status(400).send(errorHtml);
      return;
    }

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', tokenData.id);

      const errorHtmlPath = path.join(__dirname, '../../public/views/reset-password-failed.html');
      let errorHtml = fs.readFileSync(errorHtmlPath, 'utf-8');
      errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, 'Reset token has expired. Please request a new one.');
      res.status(400).send(errorHtml);
      return;
    }

    // Show reset password form
    const htmlPath = path.join(__dirname, '../../public/views/reset-password-form.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error loading reset password page:', error);
    const errorHtmlPath = path.join(__dirname, '../../public/views/reset-password-failed.html');
    let errorHtml = fs.readFileSync(errorHtmlPath, 'utf-8');
    errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, 'An error occurred. Please try again.');
    res.status(500).send(errorHtml);
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Reset token is required');
    }

    if (!password || password.length < 6) {
      throw new AppError(400, 'Password must be at least 6 characters');
    }

    // Get reset token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('reset_token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .eq('id', tokenData.id);
      
      throw new AppError(400, 'Reset token has expired. Please request a new one.');
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { password: password }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError);
      throw new AppError(500, 'Failed to reset password');
    }

    // Delete token after successful password reset
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('id', tokenData.id);

    // Return success HTML
    const successHtmlPath = path.join(__dirname, '../../public/views/reset-password-success.html');
    const successHtml = fs.readFileSync(successHtmlPath, 'utf-8');
    res.status(200).send(successHtml);
  } catch (error) {
    if (error instanceof AppError) {
      const errorHtmlPath = path.join(__dirname, '../../public/views/reset-password-failed.html');
      let errorHtml = fs.readFileSync(errorHtmlPath, 'utf-8');
      errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, error.message);
      res.status(error.statusCode).send(errorHtml);
    } else {
      console.error('Reset password error:', error);
      const errorHtmlPath = path.join(__dirname, '../../public/views/reset-password-failed.html');
      let errorHtml = fs.readFileSync(errorHtmlPath, 'utf-8');
      errorHtml = errorHtml.replace(/{{ERROR_MESSAGE}}/g, 'An error occurred. Please try again.');
      res.status(500).send(errorHtml);
    }
  }
};
