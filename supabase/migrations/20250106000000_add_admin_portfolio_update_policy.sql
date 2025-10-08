-- Add admin policy for updating all portfolios
-- This allows admins to reset all user portfolios during competition resets

CREATE POLICY "Admins can update all portfolios" ON public.portfolios FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

-- Also add admin policy for deleting portfolios (in case needed for cleanup)
CREATE POLICY "Admins can delete all portfolios" ON public.portfolios FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

-- Add admin policies for other critical tables that might need admin access during resets
CREATE POLICY "Admins can update all positions" ON public.positions FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all positions" ON public.positions FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all orders" ON public.orders FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all transactions" ON public.transactions FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all transactions" ON public.transactions FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all margin_warnings" ON public.margin_warnings FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all margin_warnings" ON public.margin_warnings FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all portfolio_history" ON public.portfolio_history FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all portfolio_history" ON public.portfolio_history FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all price_fluctuation_log" ON public.price_fluctuation_log FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all price_fluctuation_log" ON public.price_fluctuation_log FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update all messages" ON public.messages FOR UPDATE 
  USING (public.is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete all messages" ON public.messages FOR DELETE 
  USING (public.is_admin_or_owner(auth.uid()));

