# Huba API Database

Database schema for Huba e-commerce API.

## Files

| File | Description |
|------|-------------|
| `schema.sql` | Complete database schema (tables, indexes, triggers, RLS) |
| `reset.sql` | Reset database (drop all tables) - **WARNING: deletes all data!** |

## Tables

| Table | Description |
|-------|-------------|
| `extended_user_profiles` | Additional user info (phone, address, etc.) |
| `items` | Product catalog (isolated per license_key) |
| `cart` | Shopping cart (isolated per license_key) |
| `transactions` | Purchase history (isolated per license_key) |
| `transaction_items` | Items in each transaction |

## Dual Pricing

Items support 3 pricing modes:
1. **Per kg only**: `price` set, `price_per_pcs` NULL
2. **Per pcs only**: `price` = 0, `price_per_pcs` set
3. **Dual price**: Both `price` and `price_per_pcs` set

## Setup

1. Go to Supabase Dashboard → SQL Editor
2. Run `reset.sql` (optional, for fresh start)
3. Run `schema.sql`

## Security

- RLS enabled on all tables
- Policies allow all operations (security handled via license_key isolation at API level)
- Each license_key has isolated data access
