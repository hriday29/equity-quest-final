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
      console.log('About to process order execution with:', {
        userId,
        assetId,
        quantity,
        executionPrice,
        isBuy,
        transactionCost,
        isShortSell
      });
      
      const executionResult = await this.processOrderExecution(
        userId,
        assetId,
        quantity,
        executionPrice,
        isBuy,
        transactionCost,
        isShortSell
      );
      
      console.log('Order processing result:', executionResult);

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

      // Check if this is a short sell (explicit short sell or selling more than owned)
      const isActuallyShortSell = isShortSell || (!isBuy && quantity > (currentPosition?.quantity || 0));
      
      if (isActuallyShortSell) {
        // For short selling, we need to check margin requirements
        const shortQuantity = isShortSell ? quantity : quantity - (currentPosition?.quantity || 0);
        const shortValue = shortQuantity * (price || asset.current_price);
        const requiredMargin = shortValue * this.constraints.shortSellingInitialMargin;

        if (portfolio.cash_balance < requiredMargin) {
          return {
            valid: false,
            message: `Insufficient margin for short selling. Required: ₹${requiredMargin.toFixed(2)}`
          };
        }

        // Check if short selling is enabled for the current round
        const { data: currentRound } = await supabase
          .from('competition_rounds')
          .select('round_number')
          .eq('status', 'active')
          .single();

        if (currentRound) {
          const { data: shortSellingSettings } = await supabase
            .from('competition_settings')
            .select('setting_value')
            .eq('setting_key', 'short_selling_enabled')
            .single();

          if (shortSellingSettings) {
            const shortSellingConfig = JSON.parse(shortSellingSettings.setting_value as string);
            const roundKey = `round_${currentRound.round_number}` as keyof typeof shortSellingConfig;
            const isShortSellingEnabled = shortSellingConfig[roundKey];
            
            if (!isShortSellingEnabled) {
              return {
                valid: false,
                message: `Short selling is disabled for Round ${currentRound.round_number}`
              };
            }
          } else {
            // Fallback: if no settings found, use old logic (backward compatibility)
            if (currentRound.round_number === 1) {
              return {
                valid: false,
                message: 'Short selling is not allowed in Round 1'
              };
            }
          }
        } else {
          return {
            valid: false,
            message: 'No active competition round found'
          };
        }
      } else if (!isBuy && currentPosition && quantity > currentPosition.quantity) {
        // This is a regular sell order trying to sell more than owned - not allowed
        return {
          valid: false,
          message: `Insufficient position. You can only sell ${currentPosition.quantity} shares`
        };
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
      console.log('Starting processOrderExecution with:', {
        userId,
        assetId,
        quantity,
        executionPrice,
        isBuy,
        transactionCost,
        isShortSell
      });
      // Get current positions (both long and short)
      const { data: currentPositions } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_id', assetId);

      const longPosition = currentPositions?.find(p => !p.is_short);
      const shortPosition = currentPositions?.find(p => p.is_short);

      if (isBuy) {
        console.log('Processing BUY order');
        if (isShortSell) {
          // This shouldn't happen - short sell should be isBuy = false
          return { success: false, message: 'Invalid order: Cannot buy and short sell simultaneously' };
        }

        if (shortPosition && shortPosition.quantity > 0) {
          console.log('Covering short position:', { shortPosition, quantity });
          // Covering short position
          const coverQuantity = Math.min(quantity, shortPosition.quantity);
          const remainingQuantity = shortPosition.quantity - coverQuantity;
          
          if (remainingQuantity > 0) {
            // Partial cover - update short position
            const { error: updateError } = await supabase
              .from('positions')
              .update({
                quantity: remainingQuantity,
                current_value: remainingQuantity * executionPrice,
                profit_loss: remainingQuantity * (shortPosition.average_price - executionPrice),
                updated_at: new Date().toISOString()
              })
              .eq('id', shortPosition.id);

            if (updateError) {
              console.error('Short position update error:', updateError);
              return { success: false, message: 'Failed to update short position' };
            }
          } else {
            // Complete cover - delete short position
            const { error: deleteError } = await supabase
              .from('positions')
              .delete()
              .eq('id', shortPosition.id);

            if (deleteError) {
              console.error('Short position deletion error:', deleteError);
              return { success: false, message: 'Failed to delete short position' };
            }
          }

          // Add remaining quantity as long position if any
          const remainingBuyQuantity = quantity - coverQuantity;
          if (remainingBuyQuantity > 0) {
            await this.createOrUpdateLongPosition(userId, assetId, remainingBuyQuantity, executionPrice, longPosition);
          }
        } else {
          console.log('Regular buy - creating/updating long position');
          // Regular buy - add to long position
          await this.createOrUpdateLongPosition(userId, assetId, quantity, executionPrice, longPosition);
          console.log('Long position created/updated successfully');
        }
      } else {
        if (isShortSell) {
          // Short sell - add to short position
          await this.createOrUpdateShortPosition(userId, assetId, quantity, executionPrice, shortPosition);
        } else {
          // Regular sell - reduce long position
          if (!longPosition || longPosition.quantity < quantity) {
            return { success: false, message: 'Insufficient long position for regular sell' };
          }

          const remainingQuantity = longPosition.quantity - quantity;
          
          if (remainingQuantity > 0) {
            // Partial sell - update long position
            const { error: updateError } = await supabase
              .from('positions')
              .update({
                quantity: remainingQuantity,
                current_value: remainingQuantity * executionPrice,
                profit_loss: remainingQuantity * (executionPrice - longPosition.average_price),
                updated_at: new Date().toISOString()
              })
              .eq('id', longPosition.id);

            if (updateError) {
              console.error('Long position update error:', updateError);
              return { success: false, message: 'Failed to update long position' };
            }
          } else {
            // Complete sell - delete long position
            const { error: deleteError } = await supabase
              .from('positions')
              .delete()
              .eq('id', longPosition.id);

            if (deleteError) {
              console.error('Long position deletion error:', deleteError);
              return { success: false, message: 'Failed to delete long position' };
            }
          }
        }
      }


      // Update cash balance
      const totalValue = quantity * executionPrice;
      let cashChange: number;
      
      if (isBuy) {
        if (shortPosition && shortPosition.quantity > 0) {
          // Covering short position - pay to buy back
          const coverQuantity = Math.min(quantity, shortPosition.quantity);
          cashChange = -(coverQuantity * executionPrice + transactionCost);
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
            cash_balance: 500000.00, // Starting capital
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
      let totalLongValue = 0;  // Value of long positions
      let totalShortValue = 0; // Value of short positions (liability)
      
      for (const position of positions) {
        const currentPrice = position.assets?.current_price || 0;
        let positionValue: number;
        let profitLoss: number;

        if (position.is_short) {
          // For short positions:
          // - We received cash when we sold: quantity * average_price (already in cash balance)
          // - We owe shares worth: quantity * current_price (this is a liability)
          // - P&L = (average_price - current_price) * quantity (profit when price goes down)
          positionValue = position.quantity * currentPrice; // Current value of what we owe
          profitLoss = position.quantity * (position.average_price - currentPrice);
          totalShortValue += positionValue; // Add to liability
        } else {
          // For long positions:
          // - We own shares worth: quantity * current_price
          // - P&L = (current_price - average_price) * quantity (profit when price goes up)
          positionValue = position.quantity * currentPrice; // Current value of what we own
          profitLoss = position.quantity * (currentPrice - position.average_price);
          totalLongValue += positionValue; // Add to assets
        }

        // Update position current value and P&L
        await supabase
          .from('positions')
          .update({
            current_value: positionValue, // Store current market value
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
        // Total portfolio value = Cash + Long Positions - Short Positions (liabilities)
        const totalPortfolioValue = portfolio.cash_balance + totalLongValue - totalShortValue;
        // The initial value should be the starting capital (500,000)
        const initialValue = 500000; // Starting capital amount
        const profitLoss = totalPortfolioValue - initialValue;
        const profitLossPercentage = initialValue > 0 ? (profitLoss / initialValue) * 100 : 0;

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
        const marginLevel = (portfolio.cash_balance / positionValue) * 100;

        // Check if margin level is below maintenance margin (15%)
        if (marginLevel < (this.constraints.shortSellingMaintenanceMargin * 100)) {
          // Send margin warning at 18% or liquidate at 15%
          if (marginLevel < 18 && marginLevel >= 15) {
            // Send warning
            await supabase
              .from('margin_warnings')
              .insert({
                user_id: userId,
                position_id: position.id,
                margin_level: marginLevel,
                warning_type: 'maintenance_warning',
                message: `Margin level at ${marginLevel.toFixed(2)}%. Please add funds or close position.`
              });
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

  /**
   * Create or update long position
   */
  private async createOrUpdateLongPosition(
    userId: string,
    assetId: string,
    quantity: number,
    executionPrice: number,
    existingLongPosition: any
  ): Promise<void> {
    console.log('createOrUpdateLongPosition called with:', {
      userId,
      assetId,
      quantity,
      executionPrice,
      existingLongPosition
    });
    
    if (existingLongPosition) {
      // Update existing long position
      const newQuantity = existingLongPosition.quantity + quantity;
      const currentValue = existingLongPosition.quantity * existingLongPosition.average_price;
      const newValue = quantity * executionPrice;
      const newAveragePrice = (currentValue + newValue) / newQuantity;

      const { error } = await supabase
        .from('positions')
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          current_value: newQuantity * executionPrice,
          profit_loss: newQuantity * (executionPrice - newAveragePrice),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLongPosition.id);

      if (error) {
        console.error('Long position update error:', error);
        throw new Error('Failed to update long position');
      }
    } else {
      console.log('Creating new long position');
      // Create new long position
      const { error } = await supabase
        .from('positions')
        .insert({
          user_id: userId,
          asset_id: assetId,
          quantity: quantity,
          average_price: executionPrice,
          current_value: quantity * executionPrice,
          profit_loss: 0,
          is_short: false,
          initial_margin: null,
          maintenance_margin: null
        });

      if (error) {
        console.error('Long position creation error:', error);
        throw new Error('Failed to create long position');
      }
      console.log('New long position created successfully');
    }
  }

  /**
   * Create or update short position
   */
  private async createOrUpdateShortPosition(
    userId: string,
    assetId: string,
    quantity: number,
    executionPrice: number,
    existingShortPosition: any
  ): Promise<void> {
    if (existingShortPosition) {
      // Update existing short position
      const newQuantity = existingShortPosition.quantity + quantity;
      const currentValue = existingShortPosition.quantity * existingShortPosition.average_price;
      const newValue = quantity * executionPrice;
      const newAveragePrice = (currentValue + newValue) / newQuantity;

      const { error } = await supabase
        .from('positions')
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          current_value: newQuantity * executionPrice,
          profit_loss: newQuantity * (newAveragePrice - executionPrice),
          initial_margin: newQuantity * executionPrice * this.constraints.shortSellingInitialMargin,
          maintenance_margin: newQuantity * executionPrice * this.constraints.shortSellingMaintenanceMargin,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShortPosition.id);

      if (error) {
        console.error('Short position update error:', error);
        throw new Error('Failed to update short position');
      }
    } else {
      // Create new short position
      const { error } = await supabase
        .from('positions')
        .insert({
          user_id: userId,
          asset_id: assetId,
          quantity: quantity,
          average_price: executionPrice,
          current_value: quantity * executionPrice,
          profit_loss: 0,
          is_short: true,
          initial_margin: quantity * executionPrice * this.constraints.shortSellingInitialMargin,
          maintenance_margin: quantity * executionPrice * this.constraints.shortSellingMaintenanceMargin
        });

      if (error) {
        console.error('Short position creation error:', error);
        throw new Error('Failed to create short position');
      }
    }
  }
}

export const orderExecutionEngine = new OrderExecutionEngine();
