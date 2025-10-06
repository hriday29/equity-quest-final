-- Fix database schema alignment with PRD requirements
-- This migration adds missing tables and fixes field inconsistencies

-- Add missing columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_code TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS yfinance_ticker TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS market_cap DECIMAL(20, 2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS pe_ratio DECIMAL(10, 2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS week_52_high DECIMAL(15, 2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS week_52_low DECIMAL(15, 2);

-- Add missing columns to positions table for short selling
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS initial_margin DECIMAL(15, 2);
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS maintenance_margin DECIMAL(15, 2);
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS borrowing_cost DECIMAL(15, 2);

-- Create team_codes table
CREATE TABLE IF NOT EXISTS public.team_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  team_name TEXT NOT NULL,
  max_members INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table (for trade history)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'short_sell', 'cover'
  quantity DECIMAL(15, 4) NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  fees DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create portfolio_history table
CREATE TABLE IF NOT EXISTS public.portfolio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_code TEXT,
  total_value DECIMAL(15, 2) NOT NULL,
  cash_balance DECIMAL(15, 2) NOT NULL,
  profit_loss DECIMAL(15, 2) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create margin_warnings table
CREATE TABLE IF NOT EXISTS public.margin_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  margin_level DECIMAL(10, 4) NOT NULL,
  warning_type TEXT NOT NULL, -- 'initial_warning', 'maintenance_warning', 'liquidation'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create competition_events table
CREATE TABLE IF NOT EXISTS public.competition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_number INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  headline TEXT NOT NULL,
  mechanics JSONB NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create competition_settings table
CREATE TABLE IF NOT EXISTS public.competition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_fluctuation_log table
CREATE TABLE IF NOT EXISTS public.price_fluctuation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  old_price DECIMAL(15, 2) NOT NULL,
  new_price DECIMAL(15, 2) NOT NULL,
  change_percentage DECIMAL(10, 4) NOT NULL,
  fluctuation_type TEXT NOT NULL, -- 'admin_change', 'event_impact', 'noise', 'black_swan_crash', 'blue_chip_recovery'
  event_id UUID REFERENCES public.competition_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create financial_metrics table
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin_messages table
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_content TEXT,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE public.team_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_fluctuation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables
CREATE POLICY "Everyone can view team codes" ON public.team_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage team codes" ON public.team_codes FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own portfolio history" ON public.portfolio_history FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can create portfolio history" ON public.portfolio_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own margin warnings" ON public.margin_warnings FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can update own margin warnings" ON public.margin_warnings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view competition events" ON public.competition_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage competition events" ON public.competition_events FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Everyone can view competition settings" ON public.competition_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage competition settings" ON public.competition_settings FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Everyone can view price fluctuation log" ON public.price_fluctuation_log FOR SELECT USING (true);
CREATE POLICY "Admins can create price fluctuation log" ON public.price_fluctuation_log FOR INSERT WITH CHECK (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Everyone can view financial metrics" ON public.financial_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage financial metrics" ON public.financial_metrics FOR ALL USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Users can view own admin messages" ON public.admin_messages FOR SELECT USING (auth.uid() = sender_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can create admin messages" ON public.admin_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create reset_competition function
CREATE OR REPLACE FUNCTION public.reset_competition()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all user data in proper order to avoid foreign key constraints
  DELETE FROM public.margin_warnings;
  DELETE FROM public.transactions;
  DELETE FROM public.portfolio_history;
  DELETE FROM public.positions;
  DELETE FROM public.orders;
  DELETE FROM public.competition_events;
  DELETE FROM public.price_fluctuation_log;
  
  -- Reset all portfolios to starting cash (₹5,00,000)
  UPDATE public.portfolios SET 
    cash_balance = 500000.00,
    total_value = 500000.00,
    profit_loss = 0.00,
    profit_loss_percentage = 0.00,
    updated_at = now();
    
  -- Reset competition rounds to not_started
  UPDATE public.competition_rounds SET 
    status = 'not_started',
    start_time = NULL,
    end_time = NULL,
    updated_at = now();
    
  -- Clear competition settings
  DELETE FROM public.competition_settings WHERE setting_key = 'trading_halt';
END;
$$;

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_competition_events_updated_at BEFORE UPDATE ON public.competition_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_competition_settings_updated_at BEFORE UPDATE ON public.competition_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.margin_warnings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_fluctuation_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_messages;

-- Insert default competition settings
INSERT INTO public.competition_settings (setting_key, setting_value) VALUES 
('circuit_limits', '{"stocks": 0.10, "commodities": 0.06}'),
('transaction_cost', '0.001'),
('short_selling_initial_margin', '0.25'),
('short_selling_maintenance_margin', '0.15'),
('starting_capital', '500000')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default competition rounds if they don't exist
INSERT INTO public.competition_rounds (round_number, status, duration_minutes) VALUES 
(1, 'not_started', 20),
(2, 'not_started', 30),
(3, 'not_started', 30)
ON CONFLICT (round_number) DO NOTHING;
