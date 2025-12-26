-- ===================================
-- HUBA API DATABASE SCHEMA
-- ===================================
-- Complete schema for Huba e-commerce API
-- Security: License key isolation + RLS policies
-- ===================================

-- ===================================
-- SEQUENCE (must be created first)
-- ===================================
CREATE SEQUENCE IF NOT EXISTS transaction_code_seq START 1;

-- ===================================
-- EXTENDED USER PROFILES
-- ===================================
CREATE TABLE IF NOT EXISTS extended_user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    entity_type VARCHAR(20) DEFAULT 'individual',
    company_name VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Indonesia',
    date_of_birth DATE,
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extended_profiles_user_id ON extended_user_profiles(user_id);

-- ===================================
-- ITEMS/PRODUCTS
-- ===================================
-- Supports dual pricing: price (per kg) and price_per_pcs (per piece)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    price_per_pcs DECIMAL(10, 2) CHECK (price_per_pcs >= 0),
    image_url TEXT,
    category VARCHAR(100),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    unit VARCHAR(50) DEFAULT 'kg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_license_key ON items(license_key);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_license_user ON items(license_key, user_id);

-- ===================================
-- CART
-- ===================================
-- Supports weighing: quantity (decimal for kg), quantity_pcs (for pieces)
-- Multiple entries allowed for same item (different weighings)
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL,
    cart_session_id TEXT,
    user_id UUID NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    quantity_pcs DECIMAL(10, 2) CHECK (quantity_pcs >= 0),
    notes TEXT,
    unit_price DECIMAL(10, 2),
    price_per_pcs DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cart_quantity_check CHECK (quantity > 0 OR (quantity_pcs IS NOT NULL AND quantity_pcs > 0))
);

CREATE INDEX IF NOT EXISTS idx_cart_license_key ON cart(license_key);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_item_id ON cart(item_id);
CREATE INDEX IF NOT EXISTS idx_cart_license_user ON cart(license_key, user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(cart_session_id);

-- Ensure all numeric columns are DECIMAL (fix if table already exists with wrong types)
DO $$ 
BEGIN
    ALTER TABLE cart 
        ALTER COLUMN quantity TYPE DECIMAL(10, 3),
        ALTER COLUMN quantity_pcs TYPE DECIMAL(10, 2);
EXCEPTION
    WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN cart.quantity IS 'Weight in kg (decimal for precision)';
COMMENT ON COLUMN cart.quantity_pcs IS 'Quantity in pieces (optional, for dual pricing)';
COMMENT ON COLUMN cart.cart_session_id IS 'Session ID for grouping cart items (typically license_key)';
COMMENT ON COLUMN cart.notes IS 'Optional notes for the cart item';
COMMENT ON COLUMN cart.unit_price IS 'Price per kg at time of adding to cart';
COMMENT ON COLUMN cart.price_per_pcs IS 'Price per piece at time of adding to cart';
COMMENT ON COLUMN cart.total_price IS 'Pre-calculated total price';

-- ===================================
-- TRANSACTIONS
-- ===================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    license_key TEXT NOT NULL,
    user_id UUID NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_transactions_license_key ON transactions(license_key);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_code ON transactions(transaction_code);
CREATE INDEX IF NOT EXISTS idx_transactions_license_user ON transactions(license_key, user_id);

-- ===================================
-- TRANSACTION ITEMS
-- ===================================
-- Supports weighing: quantity (decimal for kg), quantity_pcs (for pieces)
CREATE TABLE IF NOT EXISTS transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    item_name VARCHAR(255) NOT NULL,
    item_price DECIMAL(10, 2) NOT NULL,
    price_per_pcs DECIMAL(10, 2),
    quantity DECIMAL(10, 3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    quantity_pcs DECIMAL(10, 2) CHECK (quantity_pcs >= 0),
    notes TEXT,
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT transaction_items_quantity_check CHECK (quantity > 0 OR (quantity_pcs IS NOT NULL AND quantity_pcs > 0))
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_item_id ON transaction_items(item_id);

-- Ensure all numeric columns are DECIMAL (fix if table already exists with wrong types)
DO $$ 
BEGIN
    ALTER TABLE transaction_items 
        ALTER COLUMN quantity TYPE DECIMAL(10, 3),
        ALTER COLUMN quantity_pcs TYPE DECIMAL(10, 2),
        ALTER COLUMN item_price TYPE DECIMAL(10, 2),
        ALTER COLUMN price_per_pcs TYPE DECIMAL(10, 2),
        ALTER COLUMN subtotal TYPE DECIMAL(10, 2);
EXCEPTION
    WHEN others THEN NULL;
END $$;

COMMENT ON COLUMN transaction_items.quantity IS 'Weight in kg (decimal for precision)';
COMMENT ON COLUMN transaction_items.quantity_pcs IS 'Quantity in pieces (optional)';
COMMENT ON COLUMN transaction_items.price_per_pcs IS 'Price per piece at time of transaction';
COMMENT ON COLUMN transaction_items.notes IS 'Optional notes for the item';

-- ===================================
-- FUNCTIONS (with secure search_path)
-- ===================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Auto-generate transaction code (TRX-YYYYMMDD-XXXXXX)
CREATE OR REPLACE FUNCTION public.generate_transaction_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.transaction_code = 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('public.transaction_code_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

-- ===================================
-- TRIGGERS
-- ===================================

DROP TRIGGER IF EXISTS update_extended_profiles_updated_at ON extended_user_profiles;
CREATE TRIGGER update_extended_profiles_updated_at
    BEFORE UPDATE ON extended_user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_updated_at ON cart;
CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON cart
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS generate_transaction_code_trigger ON transactions;
CREATE TRIGGER generate_transaction_code_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.transaction_code IS NULL)
    EXECUTE FUNCTION generate_transaction_code();

-- ===================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================
-- Security via license_key isolation at application level
-- Policies allow all operations (service_role key used)

ALTER TABLE extended_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Extended User Profiles Policies
DROP POLICY IF EXISTS "extended_user_profiles_select" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_insert" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_update" ON extended_user_profiles;
DROP POLICY IF EXISTS "extended_user_profiles_delete" ON extended_user_profiles;

CREATE POLICY "extended_user_profiles_select" ON extended_user_profiles FOR SELECT USING (true);
CREATE POLICY "extended_user_profiles_insert" ON extended_user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "extended_user_profiles_update" ON extended_user_profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "extended_user_profiles_delete" ON extended_user_profiles FOR DELETE USING (true);

-- Items Policies
DROP POLICY IF EXISTS "items_select" ON items;
DROP POLICY IF EXISTS "items_insert" ON items;
DROP POLICY IF EXISTS "items_update" ON items;
DROP POLICY IF EXISTS "items_delete" ON items;

CREATE POLICY "items_select" ON items FOR SELECT USING (true);
CREATE POLICY "items_insert" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_update" ON items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "items_delete" ON items FOR DELETE USING (true);

-- Cart Policies
DROP POLICY IF EXISTS "cart_select" ON cart;
DROP POLICY IF EXISTS "cart_insert" ON cart;
DROP POLICY IF EXISTS "cart_update" ON cart;
DROP POLICY IF EXISTS "cart_delete" ON cart;

CREATE POLICY "cart_select" ON cart FOR SELECT USING (true);
CREATE POLICY "cart_insert" ON cart FOR INSERT WITH CHECK (true);
CREATE POLICY "cart_update" ON cart FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "cart_delete" ON cart FOR DELETE USING (true);

-- Transactions Policies
DROP POLICY IF EXISTS "transactions_select" ON transactions;
DROP POLICY IF EXISTS "transactions_insert" ON transactions;
DROP POLICY IF EXISTS "transactions_update" ON transactions;
DROP POLICY IF EXISTS "transactions_delete" ON transactions;

CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (true);

-- Transaction Items Policies
DROP POLICY IF EXISTS "transaction_items_select" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_insert" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_update" ON transaction_items;
DROP POLICY IF EXISTS "transaction_items_delete" ON transaction_items;

CREATE POLICY "transaction_items_select" ON transaction_items FOR SELECT USING (true);
CREATE POLICY "transaction_items_insert" ON transaction_items FOR INSERT WITH CHECK (true);
CREATE POLICY "transaction_items_update" ON transaction_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "transaction_items_delete" ON transaction_items FOR DELETE USING (true);

-- ===================================
-- COMMENTS
-- ===================================
COMMENT ON TABLE items IS 'Items isolated per license_key';
COMMENT ON TABLE cart IS 'Cart isolated per license_key';
COMMENT ON TABLE transactions IS 'Transactions isolated per license_key';
COMMENT ON COLUMN items.price IS 'Price per main unit (kg)';
COMMENT ON COLUMN items.price_per_pcs IS 'Price per piece (optional, for dual pricing)';
