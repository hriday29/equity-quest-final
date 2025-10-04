import { supabase } from '@/integrations/supabase/client';

export interface PortfolioMetrics {
  userId: string;
  teamCode: string | null;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  sortinoRatio: number;
  finalScore: number;
  rank: number;
  portfolioHistory: Array<{
    timestamp: string;
    totalValue: number;
    profitLoss: number;
  }>;
}

export interface CompetitionResults {
  participants: PortfolioMetrics[];
  winner: PortfolioMetrics | null;
  averageReturn: number;
  totalParticipants: number;
  competitionEndTime: string;
}

export class PortfolioScoringEngine {
  private readonly riskFreeRate = 0.05; // 5% annual risk-free rate (assumed)
  private readonly competitionDurationDays = 1; // Assuming 1-day competition

  /**
   * Calculate Sortino Ratio for a portfolio
   * Sortino Ratio = (Portfolio Return - Risk-Free Rate) / Downside Deviation
   */
  async calculateSortinoRatio(userId: string): Promise<number> {
    try {
      // Get portfolio history for the user
      const { data: history, error } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (error || !history || history.length < 2) {
        return 0; // Not enough data for calculation
      }

      // Calculate daily returns
      const returns: number[] = [];
      for (let i = 1; i < history.length; i++) {
        const currentValue = history[i].total_value;
        const previousValue = history[i - 1].total_value;
        const dailyReturn = (currentValue - previousValue) / previousValue;
        returns.push(dailyReturn);
      }

      if (returns.length === 0) return 0;

      // Calculate average return
      const averageReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

      // Calculate downside deviation (only negative returns)
      const negativeReturns = returns.filter(ret => ret < 0);
      if (negativeReturns.length === 0) {
        // If no negative returns, Sortino ratio is very high
        return averageReturn > 0 ? 100 : 0;
      }

      const downsideVariance = negativeReturns.reduce((sum, ret) => sum + ret * ret, 0) / negativeReturns.length;
      const downsideDeviation = Math.sqrt(downsideVariance);

      if (downsideDeviation === 0) {
        return averageReturn > 0 ? 100 : 0;
      }

      // Annualize the returns (assuming daily data)
      const annualizedReturn = averageReturn * 365;
      const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(365);

      // Calculate Sortino Ratio
      const sortinoRatio = (annualizedReturn - this.riskFreeRate) / annualizedDownsideDeviation;

      return Math.max(0, sortinoRatio); // Ensure non-negative
    } catch (error) {
      console.error('Error calculating Sortino ratio:', error);
      return 0;
    }
  }

  /**
   * Calculate final score using the formula: (0.7 × Portfolio P&L) + (0.3 × Sortino Ratio)
   */
  async calculateFinalScore(userId: string): Promise<number> {
    try {
      // Get current portfolio
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select('profit_loss, profit_loss_percentage')
        .eq('user_id', userId)
        .single();

      if (error || !portfolio) {
        return 0;
      }

      // Calculate Sortino ratio
      const sortinoRatio = await this.calculateSortinoRatio(userId);

      // Normalize P&L percentage to a 0-100 scale for scoring
      const normalizedPnL = Math.max(0, portfolio.profit_loss_percentage + 50); // Shift to make negative returns start from 0

      // Calculate final score: 70% P&L + 30% Sortino Ratio
      const finalScore = (0.7 * normalizedPnL) + (0.3 * sortinoRatio);

      return Math.max(0, finalScore);
    } catch (error) {
      console.error('Error calculating final score:', error);
      return 0;
    }
  }

  /**
   * Get comprehensive portfolio metrics for a user
   */
  async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics | null> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_code')
        .eq('id', userId)
        .single();

      if (profileError) return null;

      // Get current portfolio
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (portfolioError) return null;

      // Get portfolio history
      const { data: history, error: historyError } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true });

      if (historyError) return null;

      // Calculate metrics
      const sortinoRatio = await this.calculateSortinoRatio(userId);
      const finalScore = await this.calculateFinalScore(userId);

      return {
        userId,
        teamCode: profile.team_code,
        totalValue: portfolio.total_value,
        profitLoss: portfolio.profit_loss,
        profitLossPercentage: portfolio.profit_loss_percentage,
        sortinoRatio,
        finalScore,
        rank: 0, // Will be set when ranking all participants
        portfolioHistory: history?.map(h => ({
          timestamp: h.recorded_at,
          totalValue: h.total_value,
          profitLoss: h.profit_loss
        })) || []
      };
    } catch (error) {
      console.error('Error getting portfolio metrics:', error);
      return null;
    }
  }

  /**
   * Get competition results with rankings
   */
  async getCompetitionResults(): Promise<CompetitionResults> {
    try {
      // Get all portfolios with user info
      const { data: portfolios, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          profiles (
            team_code
          )
        `);

      if (error || !portfolios) {
        return {
          participants: [],
          winner: null,
          averageReturn: 0,
          totalParticipants: 0,
          competitionEndTime: new Date().toISOString()
        };
      }

      // Calculate metrics for all participants
      const participants: PortfolioMetrics[] = [];
      
      for (const portfolio of portfolios) {
        const metrics = await this.getPortfolioMetrics(portfolio.user_id);
        if (metrics) {
          participants.push(metrics);
        }
      }

      // Sort by final score (descending)
      participants.sort((a, b) => b.finalScore - a.finalScore);

      // Assign ranks
      participants.forEach((participant, index) => {
        participant.rank = index + 1;
      });

      // Calculate average return
      const averageReturn = participants.length > 0 
        ? participants.reduce((sum, p) => sum + p.profitLossPercentage, 0) / participants.length
        : 0;

      return {
        participants,
        winner: participants.length > 0 ? participants[0] : null,
        averageReturn,
        totalParticipants: participants.length,
        competitionEndTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting competition results:', error);
      return {
        participants: [],
        winner: null,
        averageReturn: 0,
        totalParticipants: 0,
        competitionEndTime: new Date().toISOString()
      };
    }
  }

  /**
   * Record portfolio snapshot for historical analysis
   */
  async recordPortfolioSnapshot(userId: string): Promise<void> {
    try {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !portfolio) return;

      // Get user's team code
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_code')
        .eq('id', userId)
        .single();

      // Insert snapshot
      await supabase
        .from('portfolio_history')
        .insert({
          user_id: userId,
          team_code: profile?.team_code || null,
          total_value: portfolio.total_value,
          cash_balance: portfolio.cash_balance,
          profit_loss: portfolio.profit_loss,
          recorded_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording portfolio snapshot:', error);
    }
  }

  /**
   * Update all portfolio metrics and rankings
   */
  async updateAllPortfolioMetrics(): Promise<void> {
    try {
      // Get all portfolios
      const { data: portfolios, error } = await supabase
        .from('portfolios')
        .select('user_id');

      if (error || !portfolios) return;

      // Record snapshots for all users
      for (const portfolio of portfolios) {
        await this.recordPortfolioSnapshot(portfolio.user_id);
      }

      console.log(`Updated portfolio metrics for ${portfolios.length} users`);
    } catch (error) {
      console.error('Error updating portfolio metrics:', error);
    }
  }
}

export const portfolioScoringEngine = new PortfolioScoringEngine();
