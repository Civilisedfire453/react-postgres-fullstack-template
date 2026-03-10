-- Schema for water filter e-commerce with variant-level inventory

-- Drop legacy table if present (safe for fresh dev DBs)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS inventory_adjustments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users (customers + admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products (water filters)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    category VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Product variants (e.g. capacities, pack sizes) with stock
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g. "Standard 5L", "Family 10L"
    capacity_liters NUMERIC(10,2),
    pack_size INTEGER DEFAULT 1,
    price_cents INTEGER NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Images per product or variant
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Carts (customer or anonymous)
CREATE TABLE IF NOT EXISTS carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    anonymous_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'converted', 'abandoned'
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Cart items (variant-level)
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cart_id, product_variant_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'cancelled'
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'AUD',
    shipping_name VARCHAR(255),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postcode VARCHAR(20),
    shipping_country VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id INTEGER NOT NULL REFERENCES product_variants(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inventory adjustments (audit log)
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    product_variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    reason VARCHAR(255),
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments (Fat Zebra)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway_reference VARCHAR(255),
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'AUD',
    status VARCHAR(20) NOT NULL, -- 'pending', 'succeeded', 'failed', 'refunded'
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed an admin user (login: admin@example.com / password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES (
    'admin@example.com',
    '$2a$10$yiNvIpXehXpXzX5BCDnAM.wKmDHk1iqbRJ6clAXG/f8YFKznbXBL.',
    'Store',
    'Admin',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Seed example water filter products and variants
INSERT INTO products (id, name, description, brand, category, is_active)
VALUES
    (1, 'PureFlow Standard Pitcher', 'Slim, everyday water filter pitcher ideal for apartments and small households.', 'PureFlow', 'Pitcher Filters', TRUE),
    (2, 'AquaMax Family Countertop', 'High‑capacity countertop filter designed for busy family kitchens.', 'AquaMax', 'Countertop Filters', TRUE),
    (3, 'CrystalStream Under‑Sink System', 'Under‑sink filtration system that delivers crisp, filtered water straight from a dedicated tap.', 'CrystalStream', 'Under‑Sink Systems', TRUE),
    (4, 'HydroGuard Whole‑House Filter', 'Whole‑house sediment and carbon filtration to protect every tap in your home.', 'HydroGuard', 'Whole‑House Systems', TRUE),
    (5, 'PureFlow Replacement Cartridges', 'Long‑life replacement cartridges compatible with all PureFlow pitchers.', 'PureFlow', 'Replacement Cartridges', TRUE),
    (6, 'AquaMax RO System', 'Reverse‑osmosis system with remineralisation for premium drinking water quality.', 'AquaMax', 'Reverse Osmosis', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (
    product_id,
    sku,
    name,
    capacity_liters,
    pack_size,
    price_cents,
    stock_quantity,
    reorder_threshold
)
VALUES
    -- PureFlow pitchers
    (1, 'PF-STD-3L', 'PureFlow 3L Compact Pitcher', 3.0, 1, 4999, 40, 10),
    (1, 'PF-STD-5L', 'PureFlow 5L Family Pitcher', 5.0, 1, 5999, 25, 5),
    (1, 'PF-STD-7L', 'PureFlow 7L Entertainer Pitcher', 7.0, 1, 7999, 12, 4),

    -- AquaMax countertop
    (2, 'AM-CT-8L', 'AquaMax 8L Countertop Filter', 8.0, 1, 11999, 18, 5),
    (2, 'AM-CT-12L', 'AquaMax 12L Countertop Filter', 12.0, 1, 13999, 10, 3),

    -- CrystalStream under‑sink
    (3, 'CS-US-2STG', 'CrystalStream 2‑Stage Under‑Sink System', 0, 1, 15999, 9, 3),
    (3, 'CS-US-3STG', 'CrystalStream 3‑Stage Under‑Sink System', 0, 1, 18999, 7, 2),

    -- HydroGuard whole‑house
    (4, 'HG-WH-SED-CARB', 'HydroGuard Whole‑House Sediment + Carbon', 0, 1, 24999, 6, 2),
    (4, 'HG-WH-TRIPLE', 'HydroGuard Triple‑Stage Whole‑House', 0, 1, 29999, 4, 2),

    -- Replacement cartridges
    (5, 'PF-CART-2PK', 'PureFlow Pitcher Cartridges (2‑pack)', 0, 2, 3499, 80, 15),
    (5, 'PF-CART-4PK', 'PureFlow Pitcher Cartridges (4‑pack)', 0, 4, 5999, 60, 12),

    -- AquaMax RO
    (6, 'AM-RO-4STG', 'AquaMax 4‑Stage RO System', 0, 1, 32999, 5, 2),
    (6, 'AM-RO-4STG-CART', 'AquaMax RO Replacement Cartridge Set', 0, 1, 8999, 20, 5)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_images (product_id, image_url, is_primary)
VALUES
    (1, '/images/filters/pureflow-standard.jpg', TRUE),
    (2, '/images/filters/aquamax-family.jpg', TRUE),
    (3, '/images/filters/crystalstream-under-sink.jpg', TRUE),
    (4, '/images/filters/hydroguard-whole-house.jpg', TRUE),
    (5, '/images/filters/pureflow-cartridges.jpg', TRUE),
    (6, '/images/filters/aquamax-ro.jpg', TRUE)
ON CONFLICT DO NOTHING;

-- Add customer contact columns to orders if they don't exist (for existing DBs)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
