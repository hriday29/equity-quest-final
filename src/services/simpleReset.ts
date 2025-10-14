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
   * This uses a database function with SECURITY DEFINER to bypass RLS and reset ALL users' data
   */
  async resetCompetition(startingCash: number = 500000): Promise<SimpleResetResult> {
    try {
      console.log('Starting complete competition reset with starting cash: ₹', startingCash);

      // Call the database function that resets ALL users' data
      const { data, error } = await supabase.rpc('reset_competition_all_users', {
        starting_cash: startingCash
      });

      if (error) {
        console.error('Error calling reset function:', error);
        throw error;
      }

      // Parse the JSON response
      const resultResponse = data as {
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
      };

      // Fetch fresh prices from yFinance
      try {
        console.log('Fetching fresh prices from yFinance...');
        const { error: fetchError } = await supabase.functions.invoke('fetch-yfinance-data', {
          body: { resetMode: true }
        });

        if (fetchError) {
          console.error('Error fetching yFinance data:', fetchError);
        } else {
          console.log('Successfully refreshed asset prices from yFinance');
        }
      } catch (error) {
        console.error('Exception fetching yFinance data:', error);
      }

      const result: SimpleResetResult = {
        success: resultResponse.success,
        message: resultResponse.message,
        details: {
          portfoliosReset: resultResponse.details.portfoliosReset || 0,
          positionsDeleted: resultResponse.details.positionsDeleted || 0,
          ordersDeleted: resultResponse.details.ordersDeleted || 0,
          transactionsDeleted: resultResponse.details.transactionsDeleted || 0,
          marginWarningsDeleted: resultResponse.details.marginWarningsDeleted || 0,
          portfolioHistoryDeleted: resultResponse.details.portfolioHistoryDeleted || 0,
          competitionEventsDeleted: resultResponse.details.competitionEventsDeleted || 0,
          priceFluctuationsDeleted: resultResponse.details.priceFluctuationsDeleted || 0
        }
      };

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
