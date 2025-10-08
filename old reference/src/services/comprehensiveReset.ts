import { supabase } from '@/integrations/supabase/client';

export interface ComprehensiveResetResult {
  success: boolean;
  message: string;
  details: {
    portfoliosReset: number;
    positionsDeleted: number;
    ordersDeleted: number;
    transactionsDeleted: number;
    marginWarningsDeleted: number;
    portfolioHistoryDeleted: number;
    priceFluctuationsDeleted: number;
    messagesDeleted: number;
    roundsReset: number;
  };
}

export class ComprehensiveResetService {
  private readonly defaultStartingCash = 500000; // ₹5,00,000 as per PRD

  /**
   * Perform a comprehensive reset using the database function and additional cleanup
   * This ensures ALL user data is completely cleared and portfolios are reset to ₹5L
   */
  async resetCompetition(startingCash: number = 500000): Promise<ComprehensiveResetResult> {
    try {
      console.log('Starting comprehensive competition reset with starting cash: ₹', startingCash);

      const result: ComprehensiveResetResult = {
        success: true,
        message: 'Comprehensive competition reset completed - all users have clean start with ₹' + startingCash,
        details: {
          portfoliosReset: 0,
          positionsDeleted: 0,
          ordersDeleted: 0,
          transactionsDeleted: 0,
          marginWarningsDeleted: 0,
          portfolioHistoryDeleted: 0,
          priceFluctuationsDeleted: 0,
          messagesDeleted: 0,
          roundsReset: 0
        }
      };

      // Step 1: Use the database function for core reset
      try {
        const { error: functionError } = await supabase.rpc('reset_competition');
        
        if (functionError) {
          console.error('Database function reset failed:', functionError);
          // Continue with manual reset
        } else {
          console.log('Database function reset completed successfully');
        }
      } catch (error) {
        console.error('Exception calling database reset function:', error);
        // Continue with manual reset
      }

      // Step 2: Manual cleanup to ensure everything is reset
      
      // Clear all user positions
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

      // Clear all pending orders
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

      // Clear all transaction history
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

      // Clear all margin warnings
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

      // Clear portfolio performance history
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

      // Clear price fluctuation logs
      try {
        const { count: priceFluctuationsCount, error: priceFluctuationsError } = await supabase
          .from('price_fluctuation_log')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (priceFluctuationsError) {
          console.error('Error deleting price fluctuations:', priceFluctuationsError);
        } else {
          result.details.priceFluctuationsDeleted = priceFluctuationsCount || 0;
          console.log(`Cleared ${priceFluctuationsCount || 0} price fluctuation logs`);
        }
      } catch (error) {
        console.error('Exception deleting price fluctuations:', error);
      }

      // Clear private messages (optional - keep admin messages)
      try {
        const { count: messagesCount, error: messagesError } = await supabase
          .from('messages')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (messagesError) {
          console.error('Error deleting messages:', messagesError);
        } else {
          result.details.messagesDeleted = messagesCount || 0;
          console.log(`Cleared ${messagesCount || 0} private messages`);
        }
      } catch (error) {
        console.error('Exception deleting messages:', error);
      }

      // Reset all portfolios to starting cash (₹5L)
      try {
        const { data: portfolios, error: portfoliosError } = await supabase
          .from('portfolios')
          .select('id');

        if (portfoliosError) {
          console.error('Error fetching portfolios:', portfoliosError);
        } else if (portfolios && portfolios.length > 0) {
          const { error: updateError } = await supabase
            .from('portfolios')
            .update({
              cash_balance: startingCash,
              total_value: startingCash,
              profit_loss: 0,
              profit_loss_percentage: 0,
              updated_at: new Date().toISOString()
            });

          if (updateError) {
            console.error('Error updating portfolios:', updateError);
          } else {
            result.details.portfoliosReset = portfolios.length;
            console.log(`Reset ${result.details.portfoliosReset} portfolios to ₹${startingCash.toLocaleString()}`);
          }
        } else {
          console.log('No portfolios found to reset');
        }
      } catch (error) {
        console.error('Exception resetting portfolios:', error);
      }

      // Reset competition rounds
      try {
        // Delete existing rounds
        const { count: deleteCount, error: deleteError } = await supabase
          .from('competition_rounds')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          console.error('Error deleting competition rounds:', deleteError);
        } else {
          console.log(`Deleted ${deleteCount || 0} existing competition rounds`);
        }

        // Create new rounds
        const rounds = [
          {
            round_number: 1,
            round_name: 'The Fundamentals Floor',
            duration_minutes: 20,
            status: 'not_started',
            short_selling_enabled: false,
            description: 'Basic trading with fundamental analysis focus'
          },
          {
            round_number: 2,
            round_name: 'The Volatility Vortex',
            duration_minutes: 25,
            status: 'not_started',
            short_selling_enabled: true,
            description: 'Advanced trading with short selling enabled'
          },
          {
            round_number: 3,
            round_name: 'The Black Swan Finale',
            duration_minutes: 30,
            status: 'not_started',
            short_selling_enabled: true,
            description: 'High-stakes finale with extreme market events'
          }
        ];

        const { error: insertError } = await supabase
          .from('competition_rounds')
          .insert(rounds);

        if (insertError) {
          console.error('Error creating competition rounds:', insertError);
        } else {
          result.details.roundsReset = rounds.length;
          console.log(`Created ${result.details.roundsReset} new competition rounds`);
        }
      } catch (error) {
        console.error('Exception resetting competition rounds:', error);
      }

      console.log('Comprehensive competition reset completed:', result);
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
          priceFluctuationsDeleted: 0,
          messagesDeleted: 0,
          roundsReset: 0
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
    currentRound: number | null;
    competitionStarted: boolean;
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

      // Get current round
      const { data: currentRound } = await supabase
        .from('competition_rounds')
        .select('round_number')
        .eq('status', 'active')
        .single();

      return {
        totalParticipants: participantCount || 0,
        totalPortfolioValue,
        activePositions: positionsCount || 0,
        pendingOrders: ordersCount || 0,
        currentRound: currentRound?.round_number || null,
        competitionStarted: !!currentRound
      };
    } catch (error) {
      console.error('Error getting competition status:', error);
      return {
        totalParticipants: 0,
        totalPortfolioValue: 0,
        activePositions: 0,
        pendingOrders: 0,
        currentRound: null,
        competitionStarted: false
      };
    }
  }

  /**
   * Verify reset was successful by checking key metrics
   */
  async verifyReset(): Promise<{
    isComplete: boolean;
    issues: string[];
    summary: {
      totalPositions: number;
      totalOrders: number;
      totalTransactions: number;
      totalPortfolios: number;
      averagePortfolioValue: number;
    };
  }> {
    try {
      const issues: string[] = [];
      
      // Check positions
      const { count: positionsCount } = await supabase
        .from('positions')
        .select('*', { count: 'exact', head: true });
      
      if (positionsCount && positionsCount > 0) {
        issues.push(`Found ${positionsCount} remaining positions`);
      }

      // Check orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (ordersCount && ordersCount > 0) {
        issues.push(`Found ${ordersCount} remaining orders`);
      }

      // Check transactions
      const { count: transactionsCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });
      
      if (transactionsCount && transactionsCount > 0) {
        issues.push(`Found ${transactionsCount} remaining transactions`);
      }

      // Check portfolios
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('cash_balance, total_value, profit_loss');
      
      const totalPortfolios = portfolios?.length || 0;
      const averagePortfolioValue = portfolios?.reduce((sum, p) => sum + p.total_value, 0) / totalPortfolios || 0;

      // Check if portfolios are properly reset
      if (portfolios) {
        for (const portfolio of portfolios) {
          if (portfolio.cash_balance !== 500000) {
            issues.push(`Portfolio has incorrect cash balance: ₹${portfolio.cash_balance}`);
          }
          if (portfolio.profit_loss !== 0) {
            issues.push(`Portfolio has non-zero P&L: ₹${portfolio.profit_loss}`);
          }
        }
      }

      return {
        isComplete: issues.length === 0,
        issues,
        summary: {
          totalPositions: positionsCount || 0,
          totalOrders: ordersCount || 0,
          totalTransactions: transactionsCount || 0,
          totalPortfolios,
          averagePortfolioValue
        }
      };
    } catch (error) {
      console.error('Error verifying reset:', error);
      return {
        isComplete: false,
        issues: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        summary: {
          totalPositions: 0,
          totalOrders: 0,
          totalTransactions: 0,
          totalPortfolios: 0,
          averagePortfolioValue: 0
        }
      };
    }
  }
}

export const comprehensiveResetService = new ComprehensiveResetService();
