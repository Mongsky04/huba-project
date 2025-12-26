import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import { createLicenseKeySchema, setTrialModeSchema, bulkCreateLicenseKeysSchema, addTokenBalanceSchema } from '../validators';
import { AuthRequest } from '../middlewares/auth';
import { generateLicenseKey } from '../utils/apiKey';
import { parse } from 'csv-parse/sync';

export const createLicenseKey = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { error: validationError } = createLicenseKeySchema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { key, price_per_token, token_balance = 0 } = req.body;

    // Check if license key already exists
    const { data: existingKey } = await supabaseAdmin
      .from('license_keys')
      .select('id')
      .eq('key', key)
      .single();

    if (existingKey) {
      throw new AppError(400, 'License key already exists');
    }

    // Create license key
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .insert({
        key,
        price_per_token,
        token_balance,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(500, 'Failed to create license key');
    }

    res.status(201).json({
      success: true,
      message: `License Key ${key} created successfully`,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Create license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const bulkCreateLicenseKeys = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { error: validationError } = bulkCreateLicenseKeysSchema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { count, price_per_token, token_balance = 0 } = req.body;

    // Get all existing license keys to check for duplicates
    const { data: existingKeys, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('key');

    if (fetchError) {
      throw new AppError(500, 'Failed to fetch existing license keys');
    }

    const existingKeysSet = new Set(existingKeys?.map(k => k.key) || []);
    const generatedKeys: string[] = [];
    const maxAttempts = count * 10; // Safety limit
    let attempts = 0;

    // Generate unique license keys
    while (generatedKeys.length < count && attempts < maxAttempts) {
      const newKey = generateLicenseKey();
      
      // Check if key is not in existing keys and not in current generated keys
      if (!existingKeysSet.has(newKey) && !generatedKeys.includes(newKey)) {
        generatedKeys.push(newKey);
      }
      
      attempts++;
    }

    if (generatedKeys.length < count) {
      throw new AppError(500, `Could only generate ${generatedKeys.length} unique keys out of ${count} requested`);
    }

    // Prepare bulk insert data
    const licenseKeysData = generatedKeys.map(key => ({
      key,
      price_per_token,
      token_balance,
    }));

    // Bulk insert license keys
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .insert(licenseKeysData)
      .select();

    if (error) {
      throw new AppError(500, 'Failed to create license keys');
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${count} license keys`,
      data: {
        count: data.length,
        license_keys: data,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Bulk create license keys error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const getAllLicenseKeys = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(500, 'Failed to fetch license keys');
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get license keys error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const getLicenseKeyById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError(404, 'License key not found');
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Get license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const updateLicenseKey = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { price_per_token, token_balance } = req.body;

    const updateData: any = {};
    if (price_per_token !== undefined) updateData.price_per_token = price_per_token;
    if (token_balance !== undefined) updateData.token_balance = token_balance;

    if (Object.keys(updateData).length === 0) {
      throw new AppError(400, 'No fields to update');
    }

    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(404, 'License key not found');
    }

    res.status(200).json({
      success: true,
      message: 'License key updated successfully',
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Update license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const deleteLicenseKey = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('license_keys')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, 'Failed to delete license key');
    }

    res.status(200).json({
      success: true,
      message: 'License key deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Delete license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const setTrialMode = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { error: validationError } = setTrialModeSchema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { license_key } = req.params;
    const { trial_days, token_balance } = req.body;

    // Calculate trial expiration date
    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trial_days);

    // Get current license data by key
    const { data: licenseData, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key', license_key)
      .single();

    if (fetchError || !licenseData) {
      throw new AppError(404, 'License key not found');
    }

    // Update license to trial mode
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({
        status: 'trial',
        token_balance: token_balance,
        trial_expires_at: trialExpiresAt.toISOString(),
      })
      .eq('key', license_key)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(500, 'Failed to set trial mode');
    }

    res.status(200).json({
      success: true,
      message: `Trial mode activated for ${trial_days} days with ${token_balance} tokens`,
      data,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Set trial mode error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

// Add token balance to license key (Super Admin only)
export const addTokenBalance = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { error: validationError } = addTokenBalanceSchema.validate(req.body);
    if (validationError) {
      throw new AppError(400, validationError.details[0].message);
    }

    const { license_key } = req.params;
    const { token_balance, notes } = req.body;

    // Get current license data by key
    const { data: licenseData, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key', license_key)
      .single();

    if (fetchError || !licenseData) {
      throw new AppError(404, 'License key not found');
    }

    // Calculate new token balance
    const currentBalance = licenseData.token_balance || 0;
    const newBalance = currentBalance + token_balance;

    // Update license token balance
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({
        token_balance: newBalance,
      })
      .eq('key', license_key)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(500, 'Failed to add token balance');
    }

    // Insert log into token_balance_logs table
    const { error: logError } = await supabaseAdmin
      .from('token_balance_logs')
      .insert({
        license_key_id: licenseData.id,
        admin_id: req.user!.id,
        tokens_added: token_balance,
        previous_balance: currentBalance,
        new_balance: newBalance,
        notes: notes || `Token balance added by super admin via API`,
      });

    if (logError) {
      console.error('Failed to insert token balance log:', logError);
      // Note: We don't throw error here to avoid blocking the main operation
    }

    res.status(200).json({
      success: true,
      message: `Successfully added ${token_balance} tokens. New balance: ${newBalance} tokens`,
      data: {
        ...data,
        previous_balance: currentBalance,
        added_tokens: token_balance,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Add token balance error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const unassignLicenseKey = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { license_key } = req.params;

    // Get current license data by key
    const { data: licenseData, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('*, users!license_keys_assigned_to_fkey(id, name, email)')
      .eq('key', license_key)
      .single();

    if (fetchError || !licenseData) {
      throw new AppError(404, 'License key not found');
    }

    if (!licenseData.assigned_to) {
      throw new AppError(400, 'License key is not assigned to any user');
    }

    const previousUser = licenseData.users;

    // Reset license key to initial state
    const { data, error } = await supabaseAdmin
      .from('license_keys')
      .update({
        assigned_to: null,
        token_balance: 0,
        status: 'inactive',
        trial_expires_at: null,
      })
      .eq('key', license_key)
      .select()
      .single();

    if (error || !data) {
      throw new AppError(500, 'Failed to unassign license key');
    }

    res.status(200).json({
      success: true,
      message: 'License key reset and unassigned successfully',
      data: {
        license_key: data.key,
        previous_user: previousUser,
        current_status: {
          assigned_to: data.assigned_to,
          token_balance: data.token_balance,
          status: data.status,
          trial_expires_at: data.trial_expires_at,
        },
        note: 'License key has been reset to initial state and is now available for reassignment',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Unassign license key error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const bulkUploadLicensesFromCSV = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      throw new AppError(400, 'No CSV file uploaded');
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    
    let records: any[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseError) {
      throw new AppError(400, 'Invalid CSV format');
    }

    if (!records || records.length === 0) {
      throw new AppError(400, 'CSV file is empty');
    }

    // Validate CSV structure
    const requiredColumns = ['license_key', 'price_per_token', 'token_balance'];
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(
      col => !(col in firstRecord)
    );

    if (missingColumns.length > 0) {
      throw new AppError(
        400,
        `CSV missing required columns: ${missingColumns.join(', ')}`
      );
    }

    // Get all existing license keys
    const { data: existingKeys, error: fetchError } = await supabaseAdmin
      .from('license_keys')
      .select('key');

    if (fetchError) {
      throw new AppError(500, 'Failed to fetch existing license keys');
    }

    const existingKeysSet = new Set(existingKeys?.map(k => k.key) || []);

    // Get unique user IDs from CSV if assigned_to column exists
    const hasAssignedTo = 'assigned_to' in firstRecord;
    const userIdsToValidate = new Set<string>();
    
    if (hasAssignedTo) {
      records.forEach(record => {
        const assignedTo = record.assigned_to?.trim();
        if (assignedTo && assignedTo !== '') {
          userIdsToValidate.add(assignedTo);
        }
      });
    }

    // Validate user IDs if any assigned_to values are present
    const validUserIds = new Set<string>();
    if (userIdsToValidate.size > 0) {
      const { data: existingUsers, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('id')
        .in('id', Array.from(userIdsToValidate));

      if (userFetchError) {
        throw new AppError(500, 'Failed to validate user IDs');
      }

      existingUsers?.forEach(user => validUserIds.add(user.id));
    }

    // Prepare data for insertion
    const licenseKeysData = [];
    const skippedKeys = [];
    const invalidRows = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const licenseKey = record.license_key?.trim();
      const pricePerToken = parseInt(record.price_per_token);
      const tokenBalance = parseInt(record.token_balance);
      const assignedTo = record.assigned_to?.trim();

      // Validate data
      if (!licenseKey) {
        invalidRows.push({ row: i + 2, reason: 'Missing license_key' });
        continue;
      }

      if (isNaN(pricePerToken) || pricePerToken < 1) {
        invalidRows.push({
          row: i + 2,
          reason: 'Invalid price_per_token (must be >= 1)',
        });
        continue;
      }

      if (isNaN(tokenBalance) || tokenBalance < 0) {
        invalidRows.push({
          row: i + 2,
          reason: 'Invalid token_balance (must be >= 0)',
        });
        continue;
      }

      // Validate assigned_to if provided
      if (assignedTo && assignedTo !== '' && !validUserIds.has(assignedTo)) {
        invalidRows.push({
          row: i + 2,
          reason: `Invalid assigned_to: user ID '${assignedTo}' does not exist`,
        });
        continue;
      }

      // Check if key already exists
      if (existingKeysSet.has(licenseKey)) {
        skippedKeys.push(licenseKey);
        continue;
      }

      const licenseData: any = {
        key: licenseKey,
        price_per_token: pricePerToken,
        token_balance: tokenBalance,
      };

      // Add assigned_to if provided and not empty
      if (assignedTo && assignedTo !== '') {
        licenseData.assigned_to = assignedTo;
        licenseData.status = 'active'; // Set status to active when assigned
      }

      licenseKeysData.push(licenseData);
    }

    // Insert valid license keys
    let insertedCount = 0;
    if (licenseKeysData.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('license_keys')
        .insert(licenseKeysData)
        .select();

      if (error) {
        throw new AppError(500, 'Failed to insert license keys');
      }

      insertedCount = data?.length || 0;
    }

    res.status(201).json({
      success: true,
      message: `Bulk upload completed`,
      data: {
        total_rows: records.length,
        inserted: insertedCount,
        skipped: skippedKeys.length,
        invalid: invalidRows.length,
        skipped_keys: skippedKeys,
        invalid_rows: invalidRows,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Bulk upload CSV error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};

export const useToken = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { licenseKey } = req.params;
    const userId = req.user?.id;
    const { purpose, metadata } = req.body;

    if (!userId) {
      throw new AppError(401, 'User not authenticated');
    }

    if (!licenseKey) {
      throw new AppError(400, 'License key is required');
    }

    // Get license key and verify ownership
    const { data: license, error: licenseError } = await supabaseAdmin
      .from('license_keys')
      .select('*')
      .eq('key', licenseKey)
      .single();

    if (licenseError || !license) {
      throw new AppError(404, 'License key not found');
    }

    // Verify user owns this license key
    if (license.assigned_to !== userId) {
      throw new AppError(403, 'You do not have permission to use this license key');
    }

    // Check if license is active
    if (license.status !== 'active' && license.status !== 'trial') {
      throw new AppError(400, 'License key is not active');
    }

    // Check if there's enough balance (need at least 1 token)
    if (license.token_balance < 1) {
      throw new AppError(400, 'Insufficient token balance');
    }

    const previousBalance = license.token_balance;
    const newBalance = previousBalance - 1;

    // Update license key balance (reduce by 1 token)
    const { error: updateError } = await supabaseAdmin
      .from('license_keys')
      .update({ token_balance: newBalance })
      .eq('key', licenseKey);

    if (updateError) {
      throw new AppError(500, 'Failed to update token balance');
    }

    // Record token usage
    const { error: usageError } = await supabaseAdmin
      .from('token_usage')
      .insert({
        license_key_id: license.id,
        user_id: userId,
        previous_balance: previousBalance,
        new_balance: newBalance,
        purpose: purpose || null,
        metadata: metadata || null,
      });

    if (usageError) {
      // Log error but don't fail the request since balance was already updated
      console.error('Failed to record token usage:', usageError);
    }

    res.status(200).json({
      success: true,
      message: 'Token used successfully',
      data: {
        license_key: licenseKey,
        previous_balance: previousBalance,
        new_balance: newBalance,
        tokens_used: 1,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Use token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
};
