-- Add comprehensive NIFTY 50 stocks and commodities with detailed information

-- Clear existing sample data
DELETE FROM price_history;
DELETE FROM positions;
DELETE FROM orders;
DELETE FROM assets;

-- Insert NIFTY 50 Stocks with real-world starting prices and sectors
INSERT INTO public.assets (symbol, name, asset_type, sector, current_price, previous_close, is_active) VALUES
-- Banking & Financial Services
('HDFCBANK', 'HDFC Bank Ltd', 'stock', 'Banking', 1650.00, 1650.00, true),
('ICICIBANK', 'ICICI Bank Ltd', 'stock', 'Banking', 1125.00, 1125.00, true),
('SBIN', 'State Bank of India', 'stock', 'Banking', 785.00, 785.00, true),
('AXISBANK', 'Axis Bank Ltd', 'stock', 'Banking', 1095.00, 1095.00, true),
('KOTAKBANK', 'Kotak Mahindra Bank', 'stock', 'Banking', 1875.00, 1875.00, true),
('BAJAJFINSV', 'Bajaj Finserv Ltd', 'stock', 'Financial Services', 1625.00, 1625.00, true),
('BAJFINANCE', 'Bajaj Finance Ltd', 'stock', 'Financial Services', 7250.00, 7250.00, true),
('HDFCLIFE', 'HDFC Life Insurance', 'stock', 'Financial Services', 685.00, 685.00, true),
('SBILIFE', 'SBI Life Insurance', 'stock', 'Financial Services', 1465.00, 1465.00, true),

-- Information Technology
('TCS', 'Tata Consultancy Services', 'stock', 'IT', 3950.00, 3950.00, true),
('INFY', 'Infosys Ltd', 'stock', 'IT', 1825.00, 1825.00, true),
('WIPRO', 'Wipro Ltd', 'stock', 'IT', 565.00, 565.00, true),
('HCLTECH', 'HCL Technologies', 'stock', 'IT', 1785.00, 1785.00, true),
('TECHM', 'Tech Mahindra Ltd', 'stock', 'IT', 1695.00, 1695.00, true),
('LTIM', 'LTIMindtree Ltd', 'stock', 'IT', 5875.00, 5875.00, true),

-- Energy & Power
('RELIANCE', 'Reliance Industries', 'stock', 'Energy', 2925.00, 2925.00, true),
('ONGC', 'Oil & Natural Gas Corp', 'stock', 'Energy', 285.00, 285.00, true),
('BPCL', 'Bharat Petroleum Corp', 'stock', 'Energy', 595.00, 595.00, true),
('NTPC', 'NTPC Ltd', 'stock', 'Power', 365.00, 365.00, true),
('POWERGRID', 'Power Grid Corp', 'stock', 'Power', 315.00, 315.00, true),
('COALINDIA', 'Coal India Ltd', 'stock', 'Energy', 445.00, 445.00, true),
('TATAPOWER', 'Tata Power Company', 'stock', 'Power', 425.00, 425.00, true),

-- Automobiles
('MARUTI', 'Maruti Suzuki India', 'stock', 'Automobile', 12750.00, 12750.00, true),
('M&M', 'Mahindra & Mahindra', 'stock', 'Automobile', 2875.00, 2875.00, true),
('TATAMOTORS', 'Tata Motors Ltd', 'stock', 'Automobile', 985.00, 985.00, true),
('BAJAJ-AUTO', 'Bajaj Auto Ltd', 'stock', 'Automobile', 9525.00, 9525.00, true),
('EICHERMOT', 'Eicher Motors Ltd', 'stock', 'Automobile', 4875.00, 4875.00, true),
('HEROMOTOCO', 'Hero MotoCorp Ltd', 'stock', 'Automobile', 4625.00, 4625.00, true),

-- Metals & Mining
('TATASTEEL', 'Tata Steel Ltd', 'stock', 'Metals', 165.00, 165.00, true),
('HINDALCO', 'Hindalco Industries', 'stock', 'Metals', 645.00, 645.00, true),
('JSWSTEEL', 'JSW Steel Ltd', 'stock', 'Metals', 925.00, 925.00, true),

-- Pharmaceuticals
('SUNPHARMA', 'Sun Pharmaceutical', 'stock', 'Pharma', 1785.00, 1785.00, true),
('DRREDDY', 'Dr Reddy''s Laboratories', 'stock', 'Pharma', 1295.00, 1295.00, true),
('CIPLA', 'Cipla Ltd', 'stock', 'Pharma', 1465.00, 1465.00, true),
('DIVISLAB', 'Divi''s Laboratories', 'stock', 'Pharma', 5925.00, 5925.00, true),
('APOLLOHOSP', 'Apollo Hospitals', 'stock', 'Healthcare', 6875.00, 6875.00, true),

-- FMCG & Consumer
('HINDUNILVR', 'Hindustan Unilever', 'stock', 'FMCG', 2385.00, 2385.00, true),
('ITC', 'ITC Ltd', 'stock', 'FMCG', 465.00, 465.00, true),
('BRITANNIA', 'Britannia Industries', 'stock', 'FMCG', 4925.00, 4925.00, true),
('NESTLEIND', 'Nestlé India Ltd', 'stock', 'FMCG', 2465.00, 2465.00, true),
('TATACONSUMER', 'Tata Consumer Products', 'stock', 'FMCG', 1125.00, 1125.00, true),
('ASIANPAINT', 'Asian Paints Ltd', 'stock', 'Consumer Durables', 2875.00, 2875.00, true),
('TITAN', 'Titan Company Ltd', 'stock', 'Consumer Durables', 3425.00, 3425.00, true),

-- Telecom
('BHARTIARTL', 'Bharti Airtel Ltd', 'stock', 'Telecom', 1565.00, 1565.00, true),

-- Cement & Construction
('ULTRACEMCO', 'UltraTech Cement', 'stock', 'Cement', 10875.00, 10875.00, true),
('GRASIM', 'Grasim Industries', 'stock', 'Cement', 2625.00, 2625.00, true),
('LT', 'Larsen & Toubro', 'stock', 'Construction', 3625.00, 3625.00, true),

-- Diversified
('ADANIENT', 'Adani Enterprises', 'stock', 'Diversified', 2875.00, 2875.00, true),
('ADANIPORTS', 'Adani Ports & SEZ', 'stock', 'Infrastructure', 1275.00, 1275.00, true),
('UPL', 'UPL Ltd', 'stock', 'Chemicals', 545.00, 545.00, true),

-- Commodities
('GOLD', 'Gold (XAU/INR)', 'commodity', NULL, 62500.00, 62500.00, true),
('SILVER', 'Silver (XAG/INR)', 'commodity', NULL, 74500.00, 74500.00, true);

-- Initialize price history for all assets
INSERT INTO price_history (asset_id, price, changed_by)
SELECT id, current_price, NULL
FROM assets
WHERE is_active = true;