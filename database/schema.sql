-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    plans JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create keys table  
CREATE TABLE IF NOT EXISTS keys (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER REFERENCES brands(id),
    plan VARCHAR(100) NOT NULL,
    key_value TEXT NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'available',
    order_id VARCHAR(255),
    sold_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) UNIQUE NOT NULL,
    brand_id INTEGER REFERENCES brands(id),
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Insert default brands
INSERT INTO brands (name, description, plans) VALUES 
('Vision', 'Advanced visual processing suite', 
 '[{"name": "1 Month", "price": 299}, {"name": "3 Months", "price": 799}, {"name": "1 Year", "price": 2599}]'),
('Bat', 'Network security and penetration toolkit', 
 '[{"name": "1 Month", "price": 399}, {"name": "3 Months", "price": 999}, {"name": "1 Year", "price": 3299}]')
ON CONFLICT DO NOTHING;

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
