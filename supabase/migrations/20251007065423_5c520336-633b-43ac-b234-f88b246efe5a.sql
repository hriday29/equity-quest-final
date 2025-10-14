-- Fix Competition Reset to work for ALL users, not just admin
-- The existing reset_competition() function is broken - it only resets the admin's data
-- We need to create a new function that properly resets ALL user data

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS public.reset_competition();

-- Create a new comprehensive reset function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.reset_competition_all_users(starting_cash numeric DEFAULT 500000)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  portfolios_count integer;
  positions_count integer;
  orders_count integer;
  transactions_count integer;
  warnings_count integer;
  history_count integer;
  events_count integer;
  fluctuations_count integer;
BEGIN
  -- Only admins/owners can execute this
  IF NOT is_admin_or_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can reset competition';
  END IF;

  -- 1. Delete price fluctuation logs (references events)
  DELETE FROM public.price_fluctuation_log;
  GET DIAGNOSTICS fluctuations_count = ROW_COUNT;

  -- 2. Delete all user positions
  DELETE FROM public.positions;
  GET DIAGNOSTICS positions_count = ROW_COUNT;

  -- 3. Delete all orders
  DELETE FROM public.orders;
  GET DIAGNOSTICS orders_count = ROW_COUNT;

  -- 4. Delete all transactions
  DELETE FROM public.transactions;
  GET DIAGNOSTICS transactions_count = ROW_COUNT;

  -- 5. Clear margin warnings
  DELETE FROM public.margin_warnings;
  GET DIAGNOSTICS warnings_count = ROW_COUNT;

  -- 6. Clear portfolio history
  DELETE FROM public.portfolio_history;
  GET DIAGNOSTICS history_count = ROW_COUNT;

  -- 7. Clear competition events
  DELETE FROM public.competition_events;
  GET DIAGNOSTICS events_count = ROW_COUNT;

  -- 8. Reset ALL portfolios to starting cash
  UPDATE public.portfolios SET
    cash_balance = starting_cash,
    total_value = starting_cash,
    profit_loss = 0.00,
    profit_loss_percentage = 0.00,
    updated_at = now();
  GET DIAGNOSTICS portfolios_count = ROW_COUNT;

  -- 9. Reset competition round status
  UPDATE public.competition_rounds SET
    status = 'not_started',
    start_time = NULL,
    end_time = NULL
  WHERE round_number = 1;

  -- Build result JSON
  result := jsonb_build_object(
    'success', true,
    'message', 'Competition reset completed successfully',
    'details', jsonb_build_object(
      'portfoliosReset', portfolios_count,
      'positionsDeleted', positions_count,
      'ordersDeleted', orders_count,
      'transactionsDeleted', transactions_count,
      'marginWarningsDeleted', warnings_count,
      'portfolioHistoryDeleted', history_count,
      'competitionEventsDeleted', events_count,
      'priceFluctuationsDeleted', fluctuations_count
    )
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (but the function itself checks for admin)
GRANT EXECUTE ON FUNCTION public.reset_competition_all_users(numeric) TO authenticated;