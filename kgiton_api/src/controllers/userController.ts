import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

export const getTokenBalance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User not found');
    }

    // Get all user's license keys (user can have multiple license keys)
    const { data: licenseData, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('id, key, token_balance, price_per_token, status, created_at')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (licenseError) {
      throw new AppError(500, 'Failed to fetch license keys');
    }

    if (!licenseData || licenseData.length === 0) {
      throw new AppError(400, 'User does not have any license keys');
    }

    // Calculate total token balance from all license keys
    const totalBalance = licenseData.reduce((sum, license) => sum + license.token_balance, 0);

    // Format response
    const formattedLicenseKeys = licenseData.map(license => ({
      id: license.id,
      license_key: license.key,
      token_balance: license.token_balance,
      price_per_token: license.price_per_token,
      status: license.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        license_keys: formattedLicenseKeys,
        total_balance: totalBalance,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get token balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, api_key, created_at')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw new AppError(404, 'User not found');
    }

    // Get all license keys for this user
    const { data: licenseKeys, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('id, key, token_balance, price_per_token, status, created_at')
      .eq('assigned_to', userId)
      .order('created_at', { ascending: false });

    if (licenseError) {
      throw new AppError(500, 'Failed to fetch license keys');
    }

    res.status(200).json({
      success: true,
      data: {
        ...userData,
        license_keys: licenseKeys || [],
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

/**
 * Assign a new license key to the authenticated user
 * User can add additional license keys to their account
 */
export const assignLicenseKey = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { license_key } = req.body;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!license_key) {
      throw new AppError(400, 'License key is required');
    }

    // Normalize the license key (uppercase, remove extra spaces)
    const normalizedKey = license_key.trim().toUpperCase();

    // Check if license key exists
    const { data: licenseData, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('id, key, assigned_to, status, token_balance, price_per_token')
      .eq('key', normalizedKey)
      .single();

    if (licenseError || !licenseData) {
      throw new AppError(404, 'License key not found');
    }

    // Check if license is already assigned
    if (licenseData.assigned_to !== null) {
      if (licenseData.assigned_to === userId) {
        throw new AppError(400, 'License key is already assigned to your account');
      }
      throw new AppError(400, 'License key is already assigned to another user');
    }

    // Assign the license key to the user
    const { error: assignError } = await supabaseAdmin
      .from('license_keys')
      .update({
        assigned_to: userId,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', licenseData.id);

    if (assignError) {
      console.error('Assign license error:', assignError);
      throw new AppError(500, 'Failed to assign license key');
    }

    res.status(200).json({
      success: true,
      message: 'License key assigned successfully',
      data: {
        license_key: licenseData.key,
        token_balance: licenseData.token_balance,
        price_per_token: licenseData.price_per_token,
        status: 'active',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Assign license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};


