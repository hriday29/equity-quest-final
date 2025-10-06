import { supabase } from '@/integrations/supabase/client';

export interface OrderExecutionResult {
  success: boolean;
  message: string;
  executedPrice?: number;
  executedAt?: string;
}

export interface TradingConstraints {
  maxStockPosition: number; // 20% of portfolio
  maxCommodityPosition: number; // 25% of portfolio
  maxSectorPosition: number; // 40% of portfolio
  transactionCost: number; // 0.10%
  shortSellingInitialMargin: number; // 25%
  shortSellingMaintenanceMargin: number; // 15%
}

export class OrderExecutionEngine {
  private constraints: TradingConstraints = {
    maxStockPosition: 0.20,
    maxCommodityPosition: 0.25,
    maxSectorPosition: 0.40,
    transactionCost: 0.001, // 0.10%
    shortSellingInitialMargin: 0.25, // 25%
    shortSellingMaintenanceMargin: 0.15, // 15%
  };

  async executeOrder(
    userId: string,
    assetId: string,
    orderType: 'market' | 'limit' | 'stop_loss',
    quantity: number,
    price: number | null,
    stopPrice: number | null,
    isBuy: boolean,
    isShortSell: boolean = false
  ): Promise<OrderExecutionResult> {
    try {
      console.log('Executing order:', { userId, assetId, orderType, quantity, price, isBuy });
      
      // 0. Check if competition is active
      const competitionStatus = await this.checkCompetitionStatus();
      if (!competitionStatus.active) {
        return {
          success: false,
          message: `Competition is not active. Current status: ${competitionStatus.status}`
        };
      }

      // 1. Ensure user has a portfolio
      await this.ensureUserPortfolio(userId);

      // 2. Validate order constraints
      const validationResult = await this.validateOrderConstraints(
        userId,
        assetId,
        quantity,
        price,
        isBuy,
        isShortSell
      );

      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.message
        };
      }

      // 2. Get current asset price
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError || !asset) {
        return {
          success: false,
          message: 'Asset not found'
        };
      }

      // 3. Determine execution price based on order type
      let executionPrice: number;
      if (orderType === 'market') {
        executionPrice = asset.current_price;
      } else if (orderType === 'limit' && price) {
        if (isBuy && price < asset.current_price) {
          return {
            success: false,
            message: 'Limit price below market price for buy order'
          };
        }
        if (!isBuy && price > asset.current_price) {
          return {
            success: false,
            message: 'Limit price above market price for sell order'
          };
        }
        executionPrice = price;
      } else if (orderType === 'stop_loss' && stopPrice) {
        if (isBuy && stopPrice > asset.current_price) {
          return {
            success: false,
            message: 'Stop price above market price for buy order'
          };
        }
        if (!isBuy && stopPrice < asset.current_price) {
          return {
            success: false,
            message: 'Stop price below market price for sell order'
          };
        }
        executionPrice = stopPrice;
      } else {
        return {
          success: false,
          message: 'Invalid order parameters'
        };
      }

      // 4. Calculate transaction costs
      const totalValue = quantity * executionPrice;
      const transactionCost = totalValue * this.constraints.transactionCost;
      const totalCost = isBuy ? totalValue + transactionCost : totalValue - transactionCost;

      // 5. Check sufficient funds for buy orders
      if (isBuy) {
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('cash_balance')
          .eq('user_id', userId)
          .single();

        if (!portfolio || portfolio.cash_balance < totalCost) {
          return {
            success: false,
            message: 'Insufficient funds for this order'
          };
        }
      }

      // 6. Check sufficient position for sell orders (unless it's a short sell)
      if (!isBuy && !isShortSell) {
        const { data: position } = await supabase
          .from('positions')
          .select('quantity')
          .eq('user_id', userId)
          .eq('asset_id', assetId)
          .single();

        if (!position || position.quantity < quantity) {
          return {
            success: false,
            message: 'Insufficient position for this sell order'
          };
        }
      }

      // 7. Execute the order
      const executionResult = await this.processOrderExecution(
        userId,
        assetId,
        quantity,
        executionPrice,
        isBuy,
        transactionCost,
        isShortSell
      );

      if (executionResult.success) {
        // 8. Update portfolio values
        await this.updatePortfolioValues(userId);

        // 9. Check for margin calls on short positions
        await this.checkMarginCalls(userId);

        return {
          success: true,
          message: 'Order executed successfully',
          executedPrice: executionPrice,
          executedAt: new Date().toISOString()
        };
      } else {
        return executionResult;
      }
    } catch (error) {
      console.error('Order execution error:', error);
      return {
        success: false,
        message: `Failed to execute order: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async validateOrderConstraints(
    userId: string,
    assetId: string,
    quantity: number,
    price: number | null,
    isBuy: boolean,
    isShortSell: boolean = false
  ): Promise<{ valid: boolean; message: string }> {
    try {
      // Get current portfolio and positions
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('total_value, cash_balance')
        .eq('user_id', userId)
        .single();

      if (!portfolio) {
        return { valid: false, message: 'Portfolio not found' };
      }

      const { data: positions } = await supabase
        .from('positions')
        .select('*, assets(*)')
        .eq('user_id', userId);

      const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (!asset) {
        return { valid: false, message: 'Asset not found' };
      }

      // Calculate current position value
      const currentPosition = positions?.find(p => p.asset_id === assetId);
      const currentPositionValue = currentPosition ? 
        currentPosition.quantity * asset.current_price : 0;

      // Calculate new position value after order
      const orderValue = quantity * (price || asset.current_price);
      const newPositionValue = isBuy ? 
        currentPositionValue + orderValue : 
        Math.max(0, currentPositionValue - orderValue);

      // Check position limits based on asset type
      const maxPositionValue = portfolio.total_value * this.getMaxPositionLimit(asset.asset_type);
      
      if (isBuy && newPositionValue > maxPositionValue) {
        return {
          valid: false,
          message: `Position would exceed ${(this.getMaxPositionLimit(asset.asset_type) * 100).toFixed(0)}% limit for ${asset.asset_type} assets`
        };
      }

      // Check sector limits if asset has a sector
      if (asset.sector) {
        const sectorPositions = positions?.filter(p => p.assets?.sector === asset.sector) || [];
        const currentSectorValue = sectorPositions.reduce((sum, pos) => 
          sum + (pos.quantity * (pos.assets?.current_price || 0)), 0);
        
        const newSectorValue = isBuy ? 
          currentSectorValue + orderValue : 
          Math.max(0, currentSectorValue - orderValue);

        if (isBuy && newSectorValue > portfolio.total_value * this.constraints.maxSectorPosition) {
          return {
            valid: false,
            message: `Position would exceed ${(this.constraints.maxSectorPosition * 100).toFixed(0)}% sector limit`
          };
        }
      }

      // Check short selling margin requirements
      if (isShortSell || (!isBuy && quantity > (currentPosition?.quantity || 0))) {
        const shortQuantity = isShortSell ? quantity : quantity - (currentPosition?.quantity || 0);
        const shortValue = shortQuantity * (price || asset.current_price);
        const requiredMargin = shortValue * this.constraints.shortSellingInitialMargin;

        if (portfolio.cash_balance < requiredMargin) {
          return {
            valid: false,
            message: `Insufficient margin for short selling. Required: ₹${requiredMargin.toFixed(2)}`
          };
        }

        // Check if short selling is allowed in current round
        const { data: currentRound } = await supabase
          .from('competition_rounds')
          .select('round_number')
          .eq('status', 'active')
          .single();

        if (currentRound && currentRound.round_number === 1) {
          return {
            valid: false,
            message: 'Short selling is not allowed in Round 1'
          };
        }
      }

      return { valid: true, message: '' };
    } catch (error) {
      console.error('Constraint validation error:', error);
      return { valid: false, message: 'Failed to validate order constraints' };
    }
  }

  private getMaxPositionLimit(assetType: string): number {
    switch (assetType) {
      case 'stock':
        return this.constraints.maxStockPosition;
      case 'commodity':
        return this.constraints.maxCommodityPosition;
      default:
        return this.constraints.maxStockPosition;
    }
  }

  private async processOrderExecution(
    userId: string,
    assetId: string,
    quantity: number,
    executionPrice: number,
    isBuy: boolean,
    transactionCost: number,
    isShortSell: boolean = false
  ): Promise<OrderExecutionResult> {
    try {
      // Get current position
      const { data: currentPosition } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_id', assetId)
        .single();

      const currentQuantity = currentPosition?.quantity || 0;
      const currentAveragePrice = currentPosition?.average_price || 0;
      const isCurrentlyShort = currentPosition?.is_short || false;

      let newQuantity: number;
      let newAveragePrice: number;
      let newIsShort: boolean;

      if (isBuy) {
        if (isCurrentlyShort) {
          // Covering short position
          newQuantity = Math.max(0, currentQuantity - quantity);
          newAveragePrice = currentAveragePrice;
          newIsShort = newQuantity > 0;
        } else {
          // Regular buy
          newQuantity = currentQuantity + quantity;
          if (currentQuantity > 0) {
            // Calculate weighted average price
            const currentValue = currentQuantity * currentAveragePrice;
            const newValue = quantity * executionPrice;
            newAveragePrice = (currentValue + newValue) / newQuantity;
          } else {
            newAveragePrice = executionPrice;
          }
          newIsShort = false;
        }
      } else {
        if (isShortSell) {
          // Opening short position
          if (isCurrentlyShort) {
            // Adding to short position
            newQuantity = currentQuantity + quantity;
            if (currentQuantity > 0) {
              const currentValue = currentQuantity * currentAveragePrice;
              const newValue = quantity * executionPrice;
              newAveragePrice = (currentValue + newValue) / newQuantity;
            } else {
              newAveragePrice = executionPrice;
            }
          } else {
            // New short position
            newQuantity = quantity;
            newAveragePrice = executionPrice;
          }
          newIsShort = true;
        } else {
          // Regular sell
          newQuantity = Math.max(0, currentQuantity - quantity);
          newAveragePrice = currentAveragePrice;
          newIsShort = isCurrentlyShort;
        }
      }

      // Update or create position
      if (newQuantity > 0) {
        if (currentPosition) {
          // Update existing position
          const { error: positionError } = await supabase
            .from('positions')
            .update({
              quantity: newQuantity,
              average_price: newAveragePrice,
              current_value: newQuantity * executionPrice,
              profit_loss: newQuantity * (newIsShort ? (newAveragePrice - executionPrice) : (executionPrice - newAveragePrice)),
              is_short: newIsShort,
              initial_margin: newIsShort ? newQuantity * executionPrice * this.constraints.shortSellingInitialMargin : null,
              maintenance_margin: newIsShort ? newQuantity * executionPrice * this.constraints.shortSellingMaintenanceMargin : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentPosition.id);

          if (positionError) {
            console.error('Position update error:', positionError);
            return { success: false, message: 'Failed to update position' };
          }
        } else {
          // Create new position
          const { error: positionError } = await supabase
            .from('positions')
            .insert({
              user_id: userId,
              asset_id: assetId,
              quantity: newQuantity,
              average_price: newAveragePrice,
              current_value: newQuantity * executionPrice,
              profit_loss: newQuantity * (newIsShort ? (newAveragePrice - executionPrice) : (executionPrice - newAveragePrice)),
              is_short: newIsShort,
              initial_margin: newIsShort ? newQuantity * executionPrice * this.constraints.shortSellingInitialMargin : null,
              maintenance_margin: newIsShort ? newQuantity * executionPrice * this.constraints.shortSellingMaintenanceMargin : null
            });

          if (positionError) {
            console.error('Position insert error:', positionError);
            return { success: false, message: 'Failed to create position' };
          }
        }
      } else if (currentPosition) {
        // Delete position if quantity becomes zero
        const { error: deleteError } = await supabase
          .from('positions')
          .delete()
          .eq('id', currentPosition.id);

        if (deleteError) {
          console.error('Position delete error:', deleteError);
          return { success: false, message: 'Failed to delete position' };
        }
      }

      // Update cash balance
      const totalValue = quantity * executionPrice;
      let cashChange: number;
      
      if (isBuy) {
        if (isCurrentlyShort) {
          // Covering short position - pay to buy back
          cashChange = -(totalValue + transactionCost);
        } else {
          // Regular buy
          cashChange = -(totalValue + transactionCost);
        }
      } else {
        if (isShortSell) {
          // Short sell - receive cash but need to set aside margin
          const marginRequired = totalValue * this.constraints.shortSellingInitialMargin;
          cashChange = totalValue - transactionCost - marginRequired;
        } else {
          // Regular sell
          cashChange = totalValue - transactionCost;
        }
      }

      // Get current cash balance and update it
      const { data: currentPortfolio } = await supabase
        .from('portfolios')
        .select('cash_balance')
        .eq('user_id', userId)
        .single();

      if (currentPortfolio) {
        const newCashBalance = currentPortfolio.cash_balance + cashChange;
        
        const { error: cashError } = await supabase
          .from('portfolios')
          .update({
            cash_balance: newCashBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (cashError) {
          return { success: false, message: 'Failed to update cash balance' };
        }
      }

      return { success: true, message: 'Order executed successfully' };
    } catch (error) {
      console.error('Order processing error:', error);
      return { success: false, message: 'Failed to process order' };
    }
  }

  private async ensureUserPortfolio(userId: string): Promise<void> {
    try {
      const { data: existingPortfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingPortfolio) {
        // Create portfolio for user
        const { error } = await supabase
          .from('portfolios')
          .insert({
            user_id: userId,
            cash_balance: 500000.00, // Starting capital ₹5,00,000
            total_value: 500000.00,
            profit_loss: 0.00,
            profit_loss_percentage: 0.00
          });

        if (error) {
          console.error('Error creating portfolio:', error);
          throw new Error('Failed to create user portfolio');
        }
      }
    } catch (error) {
      console.error('Error ensuring user portfolio:', error);
      throw error;
    }
  }

  private async checkCompetitionStatus(): Promise<{ active: boolean; status: string }> {
    try {
      const { data: round } = await supabase
        .from("competition_rounds")
        .select("status")
        .eq("round_number", 1)
        .single();

      if (!round) {
        return { active: false, status: "not_initialized" };
      }

      return { 
        active: round.status === "active", 
        status: round.status 
      };
    } catch (error) {
      console.error("Error checking competition status:", error);
      return { active: false, status: "error" };
    }
  }

  private async updatePortfolioValues(userId: string): Promise<void> {
    try {
      // Get all positions with current asset prices
      const { data: positions } = await supabase
        .from('positions')
        .select('*, assets(*)')
        .eq('user_id', userId);

      if (!positions) return;

      // Calculate total portfolio value
      let totalValue = 0;
      for (const position of positions) {
        const currentValue = position.quantity * (position.assets?.current_price || 0);
        totalValue += currentValue;

        // Update position current value and P&L
        const profitLoss = position.quantity * ((position.assets?.current_price || 0) - position.average_price);
        
        await supabase
          .from('positions')
          .update({
            current_value: currentValue,
            profit_loss: profitLoss,
            updated_at: new Date().toISOString()
          })
          .eq('id', position.id);
      }

      // Get cash balance
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('cash_balance')
        .eq('user_id', userId)
        .single();

      if (portfolio) {
        const totalPortfolioValue = totalValue + portfolio.cash_balance;
        const initialValue = 500000; // Starting capital ₹5,00,000
        const profitLoss = totalPortfolioValue - initialValue;
        const profitLossPercentage = (profitLoss / initialValue) * 100;

        // Update portfolio
        await supabase
          .from('portfolios')
          .update({
            total_value: totalPortfolioValue,
            profit_loss: profitLoss,
            profit_loss_percentage: profitLossPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Portfolio update error:', error);
    }
  }

  private async checkMarginCalls(userId: string): Promise<void> {
    try {
      // Get all short positions for the user
      const { data: shortPositions } = await supabase
        .from('positions')
        .select('*, assets(*)')
        .eq('user_id', userId)
        .eq('is_short', true);

      if (!shortPositions || shortPositions.length === 0) return;

      // Get current portfolio value
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('total_value, cash_balance')
        .eq('user_id', userId)
        .single();

      if (!portfolio) return;

      for (const position of shortPositions) {
        const currentPrice = position.assets?.current_price || 0;
        const positionValue = position.quantity * currentPrice;
        
        // Calculate margin level: (Cash Balance / Position Value) * 100
        const marginLevel = (portfolio.cash_balance / positionValue) * 100;

        // Check if margin level is below maintenance margin (15%)
        if (marginLevel < (this.constraints.shortSellingMaintenanceMargin * 100)) {
          // Send margin warning at 18% or liquidate at 15%
          if (marginLevel < 18 && marginLevel >= 15) {
            // Send warning - check if we already sent one recently
            const { data: existingWarning } = await supabase
              .from('margin_warnings')
              .select('id')
              .eq('user_id', userId)
              .eq('position_id', position.id)
              .eq('warning_type', 'maintenance_warning')
              .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Within last minute
              .single();

            if (!existingWarning) {
              await supabase
                .from('margin_warnings')
                .insert({
                  user_id: userId,
                  position_id: position.id,
                  margin_level: marginLevel,
                  warning_type: 'maintenance_warning',
                  message: `⚠️ MARGIN WARNING: Your short position in ${position.assets?.symbol} has a margin level of ${marginLevel.toFixed(2)}%. Please add funds or close the position to avoid liquidation.`
                });
            }
          } else if (marginLevel < 15) {
            // Auto-liquidate position
            await this.liquidatePosition(userId, position.id, position.quantity, currentPrice);
          }
        }
      }
    } catch (error) {
      console.error('Margin call check error:', error);
    }
  }

  private async liquidatePosition(userId: string, positionId: string, quantity: number, currentPrice: number): Promise<void> {
    try {
      // Get the position to find the asset_id
      const { data: position } = await supabase
        .from('positions')
        .select('asset_id')
        .eq('id', positionId)
        .single();

      if (!position) return;

      // Create a liquidation order (buy to cover short position)
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          asset_id: position.asset_id,
          order_type: 'market',
          quantity: quantity,
          price: currentPrice,
          status: 'executed',
          executed_price: currentPrice,
          executed_at: new Date().toISOString(),
          is_buy: true // Buy to cover short position
        });

      if (orderError) {
        console.error('Liquidation order error:', orderError);
        return;
      }

      // Delete the position
      await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      // Send liquidation notification
      await supabase
        .from('margin_warnings')
        .insert({
          user_id: userId,
          position_id: positionId,
          margin_level: 0,
          warning_type: 'liquidation',
          message: `Position automatically liquidated due to margin call.`
        });

      console.log(`Position ${positionId} liquidated for user ${userId}`);
    } catch (error) {
      console.error('Position liquidation error:', error);
    }
  }
}

export const orderExecutionEngine = new OrderExecutionEngine();
