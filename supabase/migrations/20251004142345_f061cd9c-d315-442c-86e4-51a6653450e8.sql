-- Drop team_name from profiles and add team_code
ALTER TABLE public.profiles DROP COLUMN IF EXISTS team_name;
ALTER TABLE public.profiles ADD COLUMN team_code TEXT;

-- Create team_codes table
CREATE TABLE IF NOT EXISTS public.team_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create competition_settings table
CREATE TABLE IF NOT EXISTS public.competition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.competition_settings (setting_key, setting_value) VALUES
  ('max_team_size', '{"value": 5}'::jsonb),
  ('borrowing_cost_rate', '{"value": 0.0005}'::jsonb),
  ('short_selling_enabled', '{"round_1": false, "round_2": true, "round_3": true}'::jsonb),
  ('margin_requirements', '{"initial": 0.25, "maintenance": 0.15, "warning": 0.18}'::jsonb),
  ('circuit_limits', '{"stocks": 0.10, "commodities": 0.06}'::jsonb);

-- Create competition_events table
CREATE TABLE IF NOT EXISTS public.competition_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL,
  event_number INTEGER NOT NULL,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'news', 'catalyst', 'black_swan'
  headline TEXT NOT NULL,
  mechanics JSONB NOT NULL, -- contains open_gap, drift, duration, affected_assets
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  executed_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'executing', 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create financial_metrics table for historical data
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL, -- 'historical_price', 'volume', 'market_cap'
  data JSONB NOT NULL, -- stores time-series data
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_fluctuation_log table
CREATE TABLE IF NOT EXISTS public.price_fluctuation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  change_percentage NUMERIC NOT NULL,
  fluctuation_type TEXT NOT NULL, -- 'noise', 'drift', 'gap', 'catalyst'
  event_id UUID REFERENCES public.competition_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create portfolio_history table for Sortino calculation
CREATE TABLE IF NOT EXISTS public.portfolio_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_code TEXT,
  total_value NUMERIC NOT NULL,
  cash_balance NUMERIC NOT NULL,
  profit_loss NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create margin_warnings table
CREATE TABLE IF NOT EXISTS public.margin_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id UUID REFERENCES public.positions(id),
  warning_type TEXT NOT NULL, -- 'warning', 'liquidation'
  margin_level NUMERIC NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin_messages table (participant to admin)
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  reply_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add yfinance_ticker and more sector info to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS yfinance_ticker TEXT;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS market_cap NUMERIC;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS pe_ratio NUMERIC;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS week_52_high NUMERIC;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS week_52_low NUMERIC;

-- Add short_position fields to positions table
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS initial_margin NUMERIC DEFAULT 0;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS maintenance_margin NUMERIC DEFAULT 0;
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS borrowing_cost NUMERIC DEFAULT 0;

-- Add transactions table for better tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'buy', 'sell', 'short', 'cover'
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  fees NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.team_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_fluctuation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_codes
CREATE POLICY "Everyone can view team codes" ON public.team_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage team codes" ON public.team_codes FOR ALL USING (is_admin_or_owner(auth.uid()));

-- RLS Policies for competition_settings
CREATE POLICY "Everyone can view settings" ON public.competition_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.competition_settings FOR ALL USING (is_admin_or_owner(auth.uid()));

-- RLS Policies for competition_events
CREATE POLICY "Everyone can view events" ON public.competition_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.competition_events FOR ALL USING (is_admin_or_owner(auth.uid()));

-- RLS Policies for financial_metrics
CREATE POLICY "Everyone can view metrics" ON public.financial_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can manage metrics" ON public.financial_metrics FOR ALL USING (is_admin_or_owner(auth.uid()));

-- RLS Policies for price_fluctuation_log
CREATE POLICY "Everyone can view price logs" ON public.price_fluctuation_log FOR SELECT USING (true);
CREATE POLICY "System can insert price logs" ON public.price_fluctuation_log FOR INSERT WITH CHECK (true);

-- RLS Policies for portfolio_history
CREATE POLICY "Users can view own history" ON public.portfolio_history FOR SELECT USING (auth.uid() = user_id OR is_admin_or_owner(auth.uid()));
CREATE POLICY "System can insert history" ON public.portfolio_history FOR INSERT WITH CHECK (true);

-- RLS Policies for margin_warnings
CREATE POLICY "Users can view own warnings" ON public.margin_warnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own warnings" ON public.margin_warnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert warnings" ON public.margin_warnings FOR INSERT WITH CHECK (true);

-- RLS Policies for admin_messages
CREATE POLICY "Users can view own messages to admin" ON public.admin_messages FOR SELECT USING (auth.uid() = sender_id OR is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can send messages to admin" ON public.admin_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can update messages" ON public.admin_messages FOR UPDATE USING (is_admin_or_owner(auth.uid()));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id OR is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update assets with yFinance tickers for NIFTY 50
UPDATE public.assets SET yfinance_ticker = symbol || '.NS' WHERE asset_type = 'stock';
UPDATE public.assets SET yfinance_ticker = 'GC=F' WHERE symbol = 'GOLD';
UPDATE public.assets SET yfinance_ticker = 'SI=F' WHERE symbol = 'SILVER';

-- Create function to reset competition
CREATE OR REPLACE FUNCTION public.reset_competition()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can execute this
  IF NOT is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete all transactional data
  DELETE FROM public.transactions;
  DELETE FROM public.orders;
  DELETE FROM public.positions;
  DELETE FROM public.portfolio_history;
  DELETE FROM public.margin_warnings;
  DELETE FROM public.messages;
  DELETE FROM public.price_fluctuation_log;
  
  -- Reset all portfolios to default
  UPDATE public.portfolios SET
    cash_balance = 500000.00,
    total_value = 500000.00,
    profit_loss = 0.00,
    profit_loss_percentage = 0.00,
    updated_at = now();
  
  -- Reset competition round
  UPDATE public.competition_rounds SET
    status = 'not_started',
    start_time = NULL,
    end_time = NULL
  WHERE round_number = (SELECT MAX(round_number) FROM public.competition_rounds);
  
  -- Mark all events as pending
  UPDATE public.competition_events SET
    status = 'pending',
    executed_at = NULL,
    scheduled_at = NULL;
END;
$$;