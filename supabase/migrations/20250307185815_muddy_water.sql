/*
  # Initial database schema for UK Tax Calculator

  1. New Tables
    - `users` - Stores user information
    - `tax_calculations` - Stores saved tax calculations
    - `tax_rates` - Stores tax rates for different years
    - `ni_rates` - Stores National Insurance rates
    - `car_benefit_calculations` - Stores company car benefit calculations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create tax_calculations table
CREATE TABLE IF NOT EXISTS tax_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  salary DECIMAL(12, 2) NOT NULL,
  tax_code TEXT NOT NULL,
  tax_year TEXT NOT NULL,
  is_cumulative BOOLEAN DEFAULT TRUE,
  income_tax DECIMAL(12, 2) NOT NULL,
  national_insurance DECIMAL(12, 2) NOT NULL,
  net_pay DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create tax_rates table
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year TEXT NOT NULL,
  region TEXT NOT NULL, -- 'UK', 'Scotland', 'Wales'
  band_name TEXT NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  threshold_from DECIMAL(12, 2) NOT NULL,
  threshold_to DECIMAL(12, 2) NULL, -- NULL for unlimited
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tax_year, region, band_name)
);

-- Create ni_rates table
CREATE TABLE IF NOT EXISTS ni_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year TEXT NOT NULL,
  rate_type TEXT NOT NULL, -- 'MAIN_RATE', 'HIGHER_RATE'
  rate DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tax_year, rate_type)
);

-- Create ni_thresholds table
CREATE TABLE IF NOT EXISTS ni_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year TEXT NOT NULL,
  period_type TEXT NOT NULL, -- 'WEEKLY', 'MONTHLY', 'ANNUAL'
  threshold_type TEXT NOT NULL, -- 'PRIMARY_THRESHOLD', 'UPPER_EARNINGS_LIMIT'
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tax_year, period_type, threshold_type)
);

-- Create car_benefit_calculations table
CREATE TABLE IF NOT EXISTS car_benefit_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tax_year TEXT NOT NULL,
  list_price DECIMAL(12, 2) NOT NULL,
  co2_emissions INTEGER NOT NULL,
  fuel_type TEXT NOT NULL, -- 'petrol', 'diesel', 'electric', 'hybrid'
  rde2_compliant BOOLEAN DEFAULT FALSE,
  capital_contribution DECIMAL(12, 2) DEFAULT 0,
  private_fuel_provided BOOLEAN DEFAULT FALSE,
  available_from DATE NOT NULL,
  available_to DATE NULL,
  bik_value DECIMAL(12, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) NOT NULL,
  tax_payable DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create co2_bands table
CREATE TABLE IF NOT EXISTS co2_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_year TEXT NOT NULL,
  emissions INTEGER NOT NULL,
  petrol_percentage DECIMAL(5, 2) NOT NULL,
  diesel_percentage DECIMAL(5, 2) NOT NULL,
  electric_percentage DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ni_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ni_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_benefit_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE co2_bands ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only read/write their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Tax calculations policies
CREATE POLICY "Users can read own tax calculations" ON tax_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax calculations" ON tax_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax calculations" ON tax_calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax calculations" ON tax_calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Car benefit calculations policies
CREATE POLICY "Users can read own car benefit calculations" ON car_benefit_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own car benefit calculations" ON car_benefit_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own car benefit calculations" ON car_benefit_calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own car benefit calculations" ON car_benefit_calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Tax rates, NI rates, NI thresholds, and CO2 bands are public read-only
CREATE POLICY "Tax rates are public readable" ON tax_rates
  FOR SELECT USING (true);

CREATE POLICY "NI rates are public readable" ON ni_rates
  FOR SELECT USING (true);

CREATE POLICY "NI thresholds are public readable" ON ni_thresholds
  FOR SELECT USING (true);

CREATE POLICY "CO2 bands are public readable" ON co2_bands
  FOR SELECT USING (true);