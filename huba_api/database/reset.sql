-- ===================================
-- RESET HUBA DATABASE
-- ===================================
-- WARNING: This will DELETE ALL DATA!
-- Run this before running schema.sql for a fresh start
-- ===================================

-- Drop all policies first (including legacy ones)
DROP POLICY IF EXISTS "Users can view items in their license keys" ON items;
DROP POLICY IF EXISTS "Users can insert items in their license keys" ON items;
DROP POLICY IF EXISTS "Users can update items in their license keys" ON items;
DROP POLICY IF EXISTS "Users can delete items in their license keys" ON items;
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;
DROP POLICY IF EXISTS "items_delete" ON items;

DROP POLICY IF EXISTS "Users can view their cart per license key" ON cart;
DROP POLICY IF EXISTS "Users can insert into their cart per license key" ON cart;
DROP POLICY IF EXISTS "Users can update their cart per license key" ON cart;
DROP POLICY IF EXISTS "Users can delete from their cart per license key" ON cart;
DROP POLICY IF EXISTS "cart_select" ON cart;
DROP POLICY IF EXISTS "cart_insert" ON cart;
DROP POLICY IF EXISTS "cart_update" ON cart;
DROP POLICY IF EXISTS "cart_delete" ON cart;

DROP POLICY IF EXISTS "Users can view their transactions per license key" ON transactions;
DROP POLICY IF EXISTS "Users can create their transactions per license key" ON transactions;
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

DROP POLICY IF EXISTS "Users can view their own transaction items" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_select" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_update" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_delete" ON transaction_items;

DROP POLICY IF EXISTS "Users can view their own profile" ON extended_user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON extended_user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_select" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_insert" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_update" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_delete" ON extended_user_profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS update_extended_profiles_updated_at ON extended_user_profiles;
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS generate_transaction_code_trigger ON transactions;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS generate_transaction_code();

-- Drop sequence
DROP SEQUENCE IF EXISTS transaction_code_seq;

-- Drop indexes (including legacy)
DROP INDEX IF EXISTS idx_items_is_active;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS extended_user_profiles CASCADE;
