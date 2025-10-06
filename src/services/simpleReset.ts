import { supabase } from '@/integrations/supabase/client';

export interface SimpleResetResult {
  success: boolean;
  message: string;
  details: {
    portfoliosReset: number;
    positionsDeleted: number;
    ordersDeleted: number;
    transactionsDeleted: number;
    marginWarningsDeleted: number;
    portfolioHistoryDeleted: number;
    competitionEventsDeleted: number;
    priceFluctuationsDeleted: number;
  };
}

export class SimpleResetService {
  private readonly defaultStartingCash = 100000; // ₹1,00,000

  /**
   * Perform a complete user data reset - clears ALL user interactions and gives everyone a fresh start
   * This also resets asset prices by fetching from yFinance
   */
  async resetCompetition(startingCash: number = 500000): Promise<SimpleResetResult> {
    try {
      console.log('Starting complete competition reset with starting cash: ₹', startingCash);

      const result: SimpleResetResult = {
        success: true,
        message: 'Competition reset completed - all data cleared and prices refreshed',
        details: {
          portfoliosReset: 0,
          positionsDeleted: 0,
          ordersDeleted: 0,
          transactionsDeleted: 0,
          marginWarningsDeleted: 0,
          portfolioHistoryDeleted: 0,
          competitionEventsDeleted: 0,
          priceFluctuationsDeleted: 0
        }
      };

      // Clear all data in proper order to avoid foreign key constraints

      // 1. Delete price fluctuation logs first (references events)
      try {
        const { count, error } = await supabase
          .from('price_fluctuation_log')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting price fluctuation logs:', error);
        } else {
          result.details.priceFluctuationsDeleted = count || 0;
          console.log(`Cleared ${count || 0} price fluctuation logs`);
        }
      } catch (error) {
        console.error('Exception deleting price fluctuation logs:', error);
      }

      // 2. Delete all user positions
      try {
        const { count, error } = await supabase
          .from('positions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting positions:', error);
        } else {
          result.details.positionsDeleted = count || 0;
          console.log(`Deleted ${count || 0} positions`);
        }
      } catch (error) {
        console.error('Exception deleting positions:', error);
      }

      // 3. Delete all orders
      try {
        const { count, error } = await supabase
          .from('orders')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting orders:', error);
        } else {
          result.details.ordersDeleted = count || 0;
          console.log(`Deleted ${count || 0} orders`);
        }
      } catch (error) {
        console.error('Exception deleting orders:', error);
      }

      // 4. Delete all transactions
      try {
        const { count, error } = await supabase
          .from('transactions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting transactions:', error);
        } else {
          result.details.transactionsDeleted = count || 0;
          console.log(`Deleted ${count || 0} transactions`);
        }
      } catch (error) {
        console.error('Exception deleting transactions:', error);
      }

      // 5. Clear margin warnings
      try {
        const { count, error } = await supabase
          .from('margin_warnings')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting margin warnings:', error);
        } else {
          result.details.marginWarningsDeleted = count || 0;
          console.log(`Cleared ${count || 0} margin warnings`);
        }
      } catch (error) {
        console.error('Exception deleting margin warnings:', error);
      }

      // 6. Clear portfolio history
      try {
        const { count, error } = await supabase
          .from('portfolio_history')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting portfolio history:', error);
        } else {
          result.details.portfolioHistoryDeleted = count || 0;
          console.log(`Cleared ${count || 0} portfolio history records`);
        }
      } catch (error) {
        console.error('Exception deleting portfolio history:', error);
      }

      // 7. Clear competition events (this will cascade delete price_fluctuation_log entries)
      try {
        const { count, error } = await supabase
          .from('competition_events')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.error('Error deleting competition events:', error);
        } else {
          result.details.competitionEventsDeleted = count || 0;
          console.log(`Cleared ${count || 0} competition events`);
        }
      } catch (error) {
        console.error('Exception deleting competition events:', error);
      }

      // 8. Reset ALL portfolios to starting cash using service role
      try {
        const { data: portfolios, error: fetchError } = await supabase
          .from('portfolios')
          .select('id, user_id');

        if (fetchError) {
          console.error('Error fetching portfolios:', fetchError);
        } else if (portfolios && portfolios.length > 0) {
          // Update all portfolios in a single query
          const { error: updateError } = await supabase
            .from('portfolios')
            .update({
              cash_balance: startingCash,
              total_value: startingCash,
              profit_loss: 0,
              profit_loss_percentage: 0,
              updated_at: new Date().toISOString()
            })
            .in('id', portfolios.map(p => p.id));

          if (updateError) {
            console.error('Error updating portfolios:', updateError);
          } else {
            result.details.portfoliosReset = portfolios.length;
            console.log(`Reset ${portfolios.length} portfolios to ₹${startingCash.toLocaleString()}`);
          }
        }
      } catch (error) {
        console.error('Exception resetting portfolios:', error);
      }

      // 9. Fetch fresh prices from yFinance
      try {
        console.log('Fetching fresh prices from yFinance...');
        const { data, error } = await supabase.functions.invoke('fetch-yfinance-data', {
          body: { resetMode: true }
        });

        if (error) {
          console.error('Error fetching yFinance data:', error);
        } else {
          console.log('Successfully refreshed asset prices from yFinance');
        }
      } catch (error) {
        console.error('Exception fetching yFinance data:', error);
      }

      // 9. Fetch fresh prices from yFinance
      try {
        console.log('Fetching fresh prices from yFinance...');
        const { data, error } = await supabase.functions.invoke('fetch-yfinance-data', {
          body: { resetMode: true }
        });

        if (error) {
          console.error('Error fetching yFinance data:', error);
        } else {
          console.log('Successfully refreshed asset prices from yFinance');
        }
      } catch (error) {
        console.error('Exception fetching yFinance data:', error);
      }

      console.log('Competition reset completed:', result);
      return result;

    } catch (error) {
      console.error('Error during competition reset:', error);
      return {
        success: false,
        message: `Competition reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          portfoliosReset: 0,
          positionsDeleted: 0,
          ordersDeleted: 0,
          transactionsDeleted: 0,
          marginWarningsDeleted: 0,
          portfolioHistoryDeleted: 0,
          competitionEventsDeleted: 0,
          priceFluctuationsDeleted: 0
        }
      };
    }
  }

  /**
   * Get current competition status
   */
  async getCompetitionStatus(): Promise<{
    totalParticipants: number;
    totalPortfolioValue: number;
    activePositions: number;
    pendingOrders: number;
  }> {
    try {
      // Get participant count
      const { count: participantCount } = await supabase
        .from('portfolios')
        .select('*', { count: 'exact', head: true });

      // Get total portfolio value
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('total_value');

      const totalPortfolioValue = portfolios?.reduce((sum, p) => sum + p.total_value, 0) || 0;

      // Get active positions count
      const { count: positionsCount } = await supabase
        .from('positions')
        .select('*', { count: 'exact', head: true })
        .gt('quantity', 0);

      // Get pending orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        totalParticipants: participantCount || 0,
        totalPortfolioValue,
        activePositions: positionsCount || 0,
        pendingOrders: ordersCount || 0
      };
    } catch (error) {
      console.error('Error getting competition status:', error);
      return {
        totalParticipants: 0,
        totalPortfolioValue: 0,
        activePositions: 0,
        pendingOrders: 0
      };
    }
  }
}

export const simpleResetService = new SimpleResetService();
