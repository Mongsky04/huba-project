import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, Item, PaginatedResponse } from '../types';
import crypto from 'crypto';

export const getItems = async (
  req: Request,
  res: Response<PaginatedResponse<Item[]>>
): Promise<void> => {
  try {
    const { license_key, category, search, page = 1, limit = 20 } = req.query;
    
    // license_key is REQUIRED for item operations
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('items')
      .select('*', { count: 'exact' })
      .eq('license_key', license_key);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Items retrieved successfully',
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getItemById = async (
  req: Request,
  res: Response<ApiResponse<Item>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { license_key } = req.query;

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('license_key', license_key)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Item not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Item retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCategories = async (
  req: Request,
  res: Response<ApiResponse<string[]>>
): Promise<void> => {
  try {
    const { license_key } = req.query;

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    const { data, error } = await supabase
      .from('items')
      .select('category')
      .eq('license_key', license_key)
      .not('category', 'is', null);

    if (error) {
      throw error;
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean);

    res.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories as string[]
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================
// CREATE ITEM
// ============================================
export const createItem = async (
  req: Request,
  res: Response<ApiResponse<Item>>
): Promise<void> => {
  try {
    const { license_key, name, unit, price, price_per_pcs, description, category } = req.body;

    // Validate required fields
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    if (!name || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'name is required'
      });
      return;
    }

    if (price === undefined || price === null || price < 0) {
      res.status(400).json({
        success: false,
        message: 'price is required and must be >= 0'
      });
      return;
    }

    // Generate a deterministic UUID from license_key for user_id
    // This ensures same license_key always gets same user_id
    const hash = crypto.createHash('sha256').update(license_key).digest('hex');
    const user_id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;

    const { data, error } = await supabase
      .from('items')
      .insert({
        license_key,
        user_id,
        name: name.trim(),
        unit: unit || 'kg',
        price,
        price_per_pcs: price_per_pcs || null,
        description: description || null,
        category: category || null,
        stock_quantity: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================
// UPDATE ITEM
// ============================================
export const updateItem = async (
  req: Request,
  res: Response<ApiResponse<Item>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { license_key, name, unit, price, price_per_pcs, description, category } = req.body;

    // Validate license_key
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit;
    if (price !== undefined) updateData.price = price;
    if (price_per_pcs !== undefined) updateData.price_per_pcs = price_per_pcs;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', id)
      .eq('license_key', license_key)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Item not found or does not belong to this license key'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      data
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================
// DELETE ITEM (permanent delete)
// ============================================
export const deleteItem = async (
  req: Request,
  res: Response<ApiResponse<null>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const { license_key } = req.query;

    // Validate license_key
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    // Permanent delete
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('license_key', license_key)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Item not found or does not belong to this license key'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Item deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
