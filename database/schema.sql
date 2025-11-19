-- Drop and recreate tables to ensure clean state
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS keys CASCADE;
DROP TABLE IF EXISTS brands CASCADE;

-- Create brands table
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    plans JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create keys table  
CREATE TABLE keys (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    plan VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'available',
    order_id VARCHAR(255),
    sold_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table - FIXED with proper brand_id
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Insert default brands
INSERT INTO brands (name, description, plans) VALUES 
('Vision', 'Advanced visual processing suite', 
 '[{"name": "1 Month", "price": 299}, {"name": "3 Months", "price": 799}, {"name": "1 Year", "price": 2599}]'),
('Bat', 'Network security and penetration toolkit', 
 '[{"name": "1 Month", "price": 399}, {"name": "3 Months", "price": 999}, {"name": "1 Year", "price": 3299}]')
ON CONFLICT (name) DO NOTHING;

-- Insert sample keys
INSERT INTO keys (brand_id, plan, key_value, status) VALUES 
(1, '1 Month', 'VISION-1M-ABC123XYZ', 'available'),
(1, '1 Month', 'VISION-1M-DEF456UVW', 'available'),
(1, '3 Months', 'VISION-3M-GHI789RST', 'available'),
(1, '1 Year', 'VISION-1Y-JKL012MNO', 'available'),
(2, '1 Month', 'BAT-1M-PQR345STU', 'available'),
(2, '1 Month', 'BAT-1M-VWX678YZA', 'available'),
(2, '3 Months', 'BAT-3M-BCD901EFG', 'available'),
(2, '1 Year', 'BAT-1Y-HIJ234KLM', 'available')
ON CONFLICT (key_value) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_keys_brand_id ON keys(brand_id);
CREATE INDEX IF NOT EXISTS idx_keys_status ON keys(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
