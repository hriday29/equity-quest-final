-- Create enum types
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'user');
CREATE TYPE public.order_type AS ENUM ('market', 'limit', 'stop_loss');
CREATE TYPE public.order_status AS ENUM ('pending', 'executed', 'cancelled', 'rejected');
CREATE TYPE public.asset_type AS ENUM ('stock', 'commodity', 'index');
CREATE TYPE public.round_status AS ENUM ('not_started', 'active', 'paused', 'completed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  team_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  sector TEXT,
  current_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  previous_close DECIMAL(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Competition rounds table
CREATE TABLE public.competition_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL UNIQUE,
  status round_status NOT NULL DEFAULT 'not_started',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Portfolios table
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cash_balance DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
  total_value DECIMAL(15, 2) NOT NULL DEFAULT 500000.00,
  profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  profit_loss_percentage DECIMAL(10, 4) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Positions table
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL DEFAULT 0,
  average_price DECIMAL(15, 2) NOT NULL,
  current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  profit_loss DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  order_type order_type NOT NULL,
  quantity DECIMAL(15, 4) NOT NULL,
  price DECIMAL(15, 2),
  stop_price DECIMAL(15, 2),
  status order_status NOT NULL DEFAULT 'pending',
  executed_price DECIMAL(15, 2),
  executed_at TIMESTAMPTZ,
  is_buy BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- News table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table (private insider tips)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Price history table
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(15, 2) NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is admin or owner
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only owners can insert roles" ON public.user_roles FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Only owners can delete roles" ON public.user_roles FOR DELETE 
  USING (public.has_role(auth.uid(), 'owner'));

-- RLS Policies for assets
CREATE POLICY "Everyone can view assets" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Admins can manage assets" ON public.assets FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for competition_rounds
CREATE POLICY "Everyone can view rounds" ON public.competition_rounds FOR SELECT USING (true);
CREATE POLICY "Admins can manage rounds" ON public.competition_rounds FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for portfolios
CREATE POLICY "Users can view own portfolio" ON public.portfolios FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can insert own portfolio" ON public.portfolios FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio" ON public.portfolios FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all portfolios" ON public.portfolios FOR SELECT 
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for positions
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can manage own positions" ON public.positions FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT 
  USING (auth.uid() = user_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for news
CREATE POLICY "Everyone can view public news" ON public.news FOR SELECT USING (is_public = true);
CREATE POLICY "Admins can manage news" ON public.news FOR ALL 
  USING (public.is_admin_or_owner(auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT 
  USING (auth.uid() = recipient_id OR public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can send messages" ON public.messages FOR INSERT 
  WITH CHECK (public.is_admin_or_owner(auth.uid()));
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- RLS Policies for price_history
CREATE POLICY "Everyone can view price history" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Admins can add price history" ON public.price_history FOR INSERT 
  WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.competition_rounds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create portfolio when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.portfolios (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;
ALTER PUBLICATION supabase_realtime ADD TABLE public.positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_rounds;