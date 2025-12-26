import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, CartItem } from '../types';
import { addToCartSchema, updateCartSchema } from '../validators';

export const getCart = async (
  req: Request,
  res: Response<ApiResponse<CartItem[]>>
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { license_key } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        item:items(*)
      `)
      .eq('license_key', license_key)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: data || []
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const addToCart = async (
  req: Request,
  res: Response<ApiResponse<CartItem>>
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
    const { error: validationError, value } = addToCartSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.details[0].message
      });
      return;
    }

    const { license_key, cart_session_id, item_id, quantity, quantity_pcs, notes, unit_price, total_price } = value;

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    // Check if item exists and belongs to this license_key
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, name, price, price_per_pcs, stock_quantity, license_key')
      .eq('id', item_id)
      .eq('license_key', license_key)
      .single();

    if (itemError || !item) {
      res.status(404).json({
        success: false,
        message: 'Item not found for this license key'
      });
      return;
    }

    // Calculate prices if not provided
    const calculatedUnitPrice = unit_price ?? item.price;
    const calculatedPricePerPcs = item.price_per_pcs || null;
    let calculatedTotalPrice = total_price;
    
    if (!calculatedTotalPrice) {
      if (quantity > 0) {
        calculatedTotalPrice = calculatedUnitPrice * quantity;
      }
      if (quantity_pcs && quantity_pcs > 0 && item.price_per_pcs) {
        calculatedTotalPrice = (calculatedTotalPrice || 0) + (item.price_per_pcs * quantity_pcs);
      }
    }

    // ALWAYS create new cart entry (multiple weighings allowed)
    const result = await supabase
      .from('cart')
      .insert({
        license_key,
        cart_session_id: cart_session_id || license_key, // Default to license_key
        user_id: userId,
        item_id,
        quantity: quantity || 0,
        quantity_pcs: quantity_pcs || null,
        notes: notes || null,
        unit_price: calculatedUnitPrice,
        price_per_pcs: calculatedPricePerPcs,
        total_price: calculatedTotalPrice
      })
      .select(`
        *,
        item:items(*)
      `)
      .single();

    if (result.error) {
      throw result.error;
    }

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateCartItem = async (
  req: Request,
  res: Response<ApiResponse<CartItem>>
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate request body
    const { error: validationError, value } = updateCartSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.details[0].message
      });
      return;
    }

    const { quantity, quantity_pcs, notes } = value;

    // Get cart item with item details
    const { data: cartItem, error: cartError } = await supabase
      .from('cart')
      .select('*, item:items(price, price_per_pcs)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (cartError || !cartItem) {
      res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
      return;
    }

    // Build update object
    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (quantity_pcs !== undefined) updateData.quantity_pcs = quantity_pcs;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate total price if quantity changed
    if (quantity !== undefined || quantity_pcs !== undefined) {
      const newQty = quantity ?? cartItem.quantity;
      const newQtyPcs = quantity_pcs ?? cartItem.quantity_pcs;
      const item = cartItem.item as any;
      
      let totalPrice = 0;
      if (newQty > 0 && item?.price) {
        totalPrice += item.price * newQty;
      }
      if (newQtyPcs > 0 && item?.price_per_pcs) {
        totalPrice += item.price_per_pcs * newQtyPcs;
      }
      updateData.total_price = totalPrice;
    }

    // Update cart item
    const { data, error } = await supabase
      .from('cart')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        item:items(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const removeFromCart = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const clearCart = async (
  req: Request,
  res: Response<ApiResponse>
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { license_key } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('license_key', license_key)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
