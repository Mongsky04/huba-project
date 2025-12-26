import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { ApiResponse, Transaction, TransactionItem, PaginatedResponse } from '../types';
import { createTransactionSchema, updateTransactionStatusSchema } from '../validators';

export const createTransaction = async (
  req: Request,
  res: Response<ApiResponse<Transaction>>
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
    const { error: validationError, value } = createTransactionSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.details[0].message
      });
      return;
    }

    const { license_key, payment_method, shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_phone, notes } = value;

    // license_key is REQUIRED
    if (!license_key) {
      res.status(400).json({
        success: false,
        message: 'license_key is required'
      });
      return;
    }

    // Get cart items for this license_key
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select(`
        *,
        item:items(*)
      `)
      .eq('license_key', license_key)
      .eq('user_id', userId);

    if (cartError) {
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cart is empty for this license key'
      });
      return;
    }

    // Calculate total (stock validation disabled for scale-based checkout)
    let totalAmount = 0;
    const transactionItems: any[] = [];

    for (const cartItem of cartItems) {
      const item = cartItem.item as any;
      
      if (!item) {
        res.status(400).json({
          success: false,
          message: `Item not found in cart`
        });
        return;
      }

      // Stock validation disabled - for scale-based checkout where stock isn't tracked digitally
      // Uncomment below to enable stock validation:
      // if (item.stock_quantity !== null && item.stock_quantity < cartItem.quantity) {
      //   res.status(400).json({
      //     success: false,
      //     message: `Insufficient stock for ${item.name}`
      //   });
      //   return;
      // }

      // Use total_price from cart if available (calculated with kg + pcs), otherwise calculate
      const subtotal = cartItem.total_price || (item.price * cartItem.quantity);
      totalAmount += subtotal;

      // Ensure numeric types are properly parsed (all DECIMAL in database)
      const qty = parseFloat(cartItem.quantity) || 0;
      const qtyPcs = cartItem.quantity_pcs != null ? parseFloat(cartItem.quantity_pcs) : null;
      const pricePcs = cartItem.price_per_pcs != null ? parseFloat(cartItem.price_per_pcs) : (item.price_per_pcs != null ? parseFloat(item.price_per_pcs) : null);
      const itemPrice = parseFloat(cartItem.unit_price || item.price) || 0;

      transactionItems.push({
        item_id: item.id,
        item_name: item.name,
        item_price: itemPrice,
        price_per_pcs: pricePcs,
        quantity: qty,
        quantity_pcs: qtyPcs,
        notes: cartItem.notes || null,
        subtotal: parseFloat(subtotal.toFixed(2))
      });
    }

    // Create transaction with license_key
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        license_key,
        user_id: userId,
        total_amount: totalAmount,
        status: 'pending',
        payment_method,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_phone,
        notes
      })
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Add transaction items
    const itemsWithTransactionId = transactionItems.map(item => ({
      ...item,
      transaction_id: transaction.id
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsWithTransactionId);

    if (itemsError) {
      // Rollback transaction
      await supabase.from('transactions').delete().eq('id', transaction.id);
      throw itemsError;
    }

    // Stock deduction disabled - for scale-based checkout where stock isn't tracked digitally
    // Uncomment below to enable stock deduction:
    // for (const cartItem of cartItems) {
    //   const item = cartItem.item as any;
    //   await supabase
    //     .from('items')
    //     .update({ stock_quantity: item.stock_quantity - cartItem.quantity })
    //     .eq('id', item.id);
    // }

    // Clear cart for this license_key
    await supabase
      .from('cart')
      .delete()
      .eq('license_key', license_key)
      .eq('user_id', userId);

    res.json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Handle Supabase/PostgreSQL errors
    const errorMessage = error?.message || error?.details || error?.hint || 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: errorMessage
    });
  }
};

export const getTransactions = async (
  req: Request,
  res: Response<PaginatedResponse<Transaction[]>>
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

    const { license_key, status, page = 1, limit = 20 } = req.query;

    // license_key is REQUIRED
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
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('license_key', license_key)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
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
      message: 'Transactions retrieved successfully',
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response<ApiResponse<Transaction & { items: TransactionItem[] }>>
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

    // Get transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (transactionError || !transaction) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    // Get transaction items
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', id);

    if (itemsError) {
      throw itemsError;
    }

    res.json({
      success: true,
      message: 'Transaction retrieved successfully',
      data: {
        ...transaction,
        items: items || []
      }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTransactionStatus = async (
  req: Request,
  res: Response<ApiResponse<Transaction>>
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
    const { error: validationError, value } = updateTransactionStatusSchema.validate(req.body);
    if (validationError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: validationError.details[0].message
      });
      return;
    }

    const updateData: any = {
      status: value.status,
      updated_at: new Date().toISOString()
    };

    if (value.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
