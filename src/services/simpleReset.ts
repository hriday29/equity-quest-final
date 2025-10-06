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
   * This does NOT reset competition rounds or asset prices - only user data is cleared
   */
  async resetCompetition(startingCash: number = 500000): Promise<SimpleResetResult> { // ₹5,00,000 default
    try {
      console.log('Starting complete user data reset with starting cash: ₹', startingCash);

      const result: SimpleResetResult = {
        success: true,
        message: 'User data reset completed - all users have clean start with ₹' + startingCash,
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

      // Clear all user interactions in proper order to avoid foreign key constraints

      // 1. Delete all user positions (stocks/assets they own)
      try {
        const { count: positionsCount, error: positionsError } = await supabase
          .from('positions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (positionsError) {
          console.error('Error deleting positions:', positionsError);
        } else {
          result.details.positionsDeleted = positionsCount || 0;
          console.log(`Deleted ${result.details.positionsDeleted} positions`);
        }
      } catch (error) {
        console.error('Exception deleting positions:', error);
      }

      // 2. Delete all pending orders (buy/sell orders users placed)
      try {
        const { count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (ordersError) {
          console.error('Error deleting orders:', ordersError);
        } else {
          result.details.ordersDeleted = ordersCount || 0;
          console.log(`Deleted ${result.details.ordersDeleted} pending orders`);
        }
      } catch (error) {
        console.error('Exception deleting orders:', error);
      }

      // 3. Delete all transaction history (buy/sell records)
      try {
        const { count: transactionsCount, error: transactionsError } = await supabase
          .from('transactions')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (transactionsError) {
          console.error('Error deleting transactions:', transactionsError);
        } else {
          result.details.transactionsDeleted = transactionsCount || 0;
          console.log(`Deleted ${result.details.transactionsDeleted} transaction records`);
        }
      } catch (error) {
        console.error('Exception deleting transactions:', error);
      }

      // 4. Clear all margin warnings
      try {
        const { count: marginWarningsCount, error: marginWarningsError } = await supabase
          .from('margin_warnings')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (marginWarningsError) {
          console.error('Error deleting margin warnings:', marginWarningsError);
        } else {
          result.details.marginWarningsDeleted = marginWarningsCount || 0;
          console.log(`Cleared ${marginWarningsCount || 0} margin warnings`);
        }
      } catch (error) {
        console.error('Exception deleting margin warnings:', error);
      }

      // 5. Clear portfolio performance history
      try {
        const { count: portfolioHistoryCount, error: portfolioHistoryError } = await supabase
          .from('portfolio_history')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (portfolioHistoryError) {
          console.error('Error deleting portfolio history:', portfolioHistoryError);
        } else {
          result.details.portfolioHistoryDeleted = portfolioHistoryCount || 0;
          console.log(`Cleared ${portfolioHistoryCount || 0} portfolio history records`);
        }
      } catch (error) {
        console.error('Exception deleting portfolio history:', error);
      }

      // 6. Clear competition events (admin-triggered events)
      try {
        const { count: eventsCount, error: eventsError } = await supabase
          .from('competition_events')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (eventsError) {
          console.error('Error deleting competition events:', eventsError);
        } else {
          result.details.competitionEventsDeleted = eventsCount || 0;
          console.log(`Cleared ${eventsCount || 0} competition events`);
        }
      } catch (error) {
        console.error('Exception deleting competition events:', error);
      }

      // 7. Clear price fluctuation logs (if table exists)
      try {
        // Note: price_fluctuations table might not exist in all schemas
        // This is handled gracefully with try-catch
        const { count: priceFluctuationsCount, error: priceFluctuationsError } = await supabase
          .from('price_fluctuations' as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (priceFluctuationsError) {
          console.log('Note: price_fluctuations table might not exist');
        } else {
          result.details.priceFluctuationsDeleted = priceFluctuationsCount || 0;
          console.log(`Cleared ${priceFluctuationsCount || 0} price fluctuation logs`);
        }
      } catch (error) {
        console.log('Note: price_fluctuations table might not exist');
      }

      // 8. Reset all portfolios to starting cash (₹5L default)
      try {
        const { data: portfolios, error: portfoliosError } = await supabase
          .from('portfolios')
          .select('id')
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (portfoliosError) {
          console.error('Error fetching portfolios:', portfoliosError);
        } else if (portfolios && portfolios.length > 0) {
          // Update each portfolio individually to ensure updates work
          for (const portfolio of portfolios) {
            const { error: updateError } = await supabase
              .from('portfolios')
              .update({
                cash_balance: startingCash,
                total_value: startingCash,
                profit_loss: 0,
                profit_loss_percentage: 0,
                updated_at: new Date().toISOString()
              })
              .eq('id', portfolio.id);

            if (updateError) {
              console.error('Error updating portfolio:', updateError);
            }
          }
          
          result.details.portfoliosReset = portfolios.length;
          console.log(`Reset ${result.details.portfoliosReset} portfolios to ₹${startingCash.toLocaleString()}`);
        } else {
          console.log('No portfolios found to reset');
        }
      } catch (error) {
        console.error('Exception resetting portfolios:', error);
      }

      // 9. Note: Competition rounds are NOT reset - admins control the competition flow
      // The reset only clears user data, not the competition structure

      // Note: Asset prices are NOT reset - they keep current market values from yFinance
      // Competition rounds are NOT reset - admins control the competition flow
      // Only user data is cleared for a fresh start

      console.log('Complete user data reset completed:', result);
      return result;

    } catch (error) {
      console.error('Error during comprehensive competition reset:', error);
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
