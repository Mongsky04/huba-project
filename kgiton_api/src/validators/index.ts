import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  license_key: Joi.string().required(),
  referral_code: Joi.string().optional().allow(''),
  // Entity type fields
  entity_type: Joi.string().valid('individual', 'company').optional().default('individual'),
  company_name: Joi.string().optional().allow(''),
  // Extended profile fields for Huba API (optional)
  phone_number: Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  state: Joi.string().optional().allow(''),
  postal_code: Joi.string().optional().allow(''),
  country: Joi.string().optional().allow(''),
});

export const createLicenseKeySchema = Joi.object({
  key: Joi.string().required(),
  price_per_token: Joi.number().integer().min(1).required(),
  token_balance: Joi.number().integer().min(0).default(0),
});

export const bulkCreateLicenseKeysSchema = Joi.object({
  count: Joi.number().integer().min(1).max(100).required(),
  price_per_token: Joi.number().integer().min(1).required(),
  token_balance: Joi.number().integer().min(0).default(0),
});

export const topupRequestSchema = Joi.object({
  token_count: Joi.number().integer().min(1).required(),
  license_key: Joi.string().required(),
});

export const topupWithPaymentMethodSchema = Joi.object({
  token_count: Joi.number().integer().min(1).required(),
  license_key: Joi.string().required(),
  payment_method: Joi.string()
    .valid(
      'checkout_page',
      'va_bri',
      'va_bni',
      'va_bca',
      'va_mandiri',
      'va_permata',
      'va_bsi',
      'va_cimb',
      'va_sinarmas',
      'va_muamalat',
      'va_indomaret',
      'va_alfamart',
      'manual'
    )
    .default('checkout_page'),
  customer_phone: Joi.string().optional(),
});

export const setTrialModeSchema = Joi.object({
  trial_days: Joi.number().integer().min(1).required(),
  token_balance: Joi.number().integer().min(1).required(),
});

export const addTokenBalanceSchema = Joi.object({
  token_balance: Joi.number().integer().min(1).required(),
  notes: Joi.string().optional().allow(''),
});

export const webhookSchema = Joi.object({
  order_id: Joi.string().required(),
  status: Joi.string().valid('success', 'pending', 'failed').required(),
  amount: Joi.number().integer().min(1).required(),
  license_key_id: Joi.string().uuid().required(),
  user_id: Joi.string().uuid().required(),
});
