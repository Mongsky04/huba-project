import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, UserProfile } from '../types';
import { userProfileSchema } from '../validators';

export const getProfile = async (
  req: Request,
  res: Response<ApiResponse<UserProfile>>
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { data, error } = await supabase
      .from('extended_user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const createOrUpdateProfile = async (
  req: Request,
  res: Response<ApiResponse<UserProfile>>
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate request body
    const { error: validationError, value } = userProfileSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.details[0].message
      });
      return;
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('extended_user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabase
        .from('extended_user_profiles')
        .update({ ...value, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Create new profile
      result = await supabase
        .from('extended_user_profiles')
        .insert({ ...value, user_id: userId })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    res.json({
      success: true,
      message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Create/Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
