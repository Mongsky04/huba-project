import Joi from 'joi';

export const userProfileSchema = Joi.object({
  phone_number: Joi.string().max(20).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  postal_code: Joi.string().max(20).optional(),
  country: Joi.string().max(100).optional(),
  date_of_birth: Joi.date().optional(),
  profile_image_url: Joi.string().uri().optional(),
  bio: Joi.string().max(500).optional()
});

export const addToCartSchema = Joi.object({
  license_key: Joi.string().required(), // REQUIRED: The license key string
  cart_session_id: Joi.string().optional(), // Optional: Session ID for grouping
  item_id: Joi.string().uuid().required(),
  quantity: Joi.number().min(0).required(), // Weight in kg (decimal)
  quantity_pcs: Joi.number().min(0).optional(), // Pieces count (optional)
  notes: Joi.string().max(500).optional(),
  unit_price: Joi.number().min(0).optional(),
  total_price: Joi.number().min(0).optional()
}).custom((value, helpers) => {
  // At least one of quantity or quantity_pcs must be > 0
  if (value.quantity <= 0 && (!value.quantity_pcs || value.quantity_pcs <= 0)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'quantity validation');

export const updateCartSchema = Joi.object({
  quantity: Joi.number().min(0).optional(), // Weight in kg (decimal)
  quantity_pcs: Joi.number().min(0).optional(), // Pieces count (optional)
  notes: Joi.string().max(500).optional()
}).custom((value, helpers) => {
  // At least one of quantity or quantity_pcs must be > 0 if both are provided
  if (value.quantity !== undefined && value.quantity <= 0 && 
      value.quantity_pcs !== undefined && value.quantity_pcs <= 0) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'quantity validation');

export const createTransactionSchema = Joi.object({
  license_key: Joi.string().required(), // REQUIRED: The license key string
  payment_method: Joi.string().max(50).optional(),
  shipping_address: Joi.string().max(500).optional(),
  shipping_city: Joi.string().max(100).optional(),
  shipping_state: Joi.string().max(100).optional(),
  shipping_postal_code: Joi.string().max(20).optional(),
  shipping_phone: Joi.string().max(20).optional(),
  notes: Joi.string().max(500).optional()
});

export const updateTransactionStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'failed').required()
});
