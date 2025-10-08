import { supabase } from '@/integrations/supabase/client';

export interface PriceEvent {
  assetId: string;
  openGap: number; // Percentage change at minute 0
  drift: number; // Total drift percentage over 30 minutes
  driftDuration: number; // Duration in minutes
  triggerTime: Date;
  eventId?: string;
}

export interface NoiseConfig {
  amplitude: number; // ±0.5% by default
  frequency: number; // Every minute
}

export class PriceManagementService {
  private readonly defaultNoiseConfig: NoiseConfig = {
    amplitude: 0.005, // ±0.5%
    frequency: 60000 // 1 minute in milliseconds
  };

  /**
   * Apply price change from admin event (Open Gap + Drift)
   * This is the core of the hybrid price model - only admin events change prices
   */
  async applyPriceEvent(event: PriceEvent): Promise<{ success: boolean; message: string }> {
    try {
      // Get the asset
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', event.assetId)
        .single();

      if (assetError || !asset) {
        return { success: false, message: 'Asset not found' };
      }

      const oldPrice = asset.current_price;
      
      // Apply open gap (immediate change)
      const openGapPrice = oldPrice * (1 + event.openGap / 100);
      
      // Update asset price with open gap
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          current_price: openGapPrice,
          previous_close: oldPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.assetId);

      if (updateError) {
        return { success: false, message: 'Failed to update asset price' };
      }

      // Log price fluctuation
      await this.logPriceFluctuation(
        event.assetId,
        oldPrice,
        openGapPrice,
        'event_open_gap',
        event.eventId
      );

      // Schedule drift application
      if (event.drift !== 0 && event.driftDuration > 0) {
        this.scheduleDrift(event, openGapPrice);
      }

      return { 
        success: true, 
        message: `Applied ${event.openGap > 0 ? '+' : ''}${event.openGap.toFixed(2)}% open gap to ${asset.symbol}` 
      };

    } catch (error) {
      console.error('Error applying price event:', error);
      return { 
        success: false, 
        message: `Failed to apply price event: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Schedule drift application over time
   */
  private async scheduleDrift(event: PriceEvent, currentPrice: number): Promise<void> {
    const driftPerMinute = event.drift / event.driftDuration;
    const totalMinutes = event.driftDuration;
    
    for (let minute = 1; minute <= totalMinutes; minute++) {
      setTimeout(async () => {
        try {
          // Get current asset price
          const { data: asset } = await supabase
            .from('assets')
            .select('current_price')
            .eq('id', event.assetId)
            .single();

          if (!asset) return;

          const oldPrice = asset.current_price;
          const driftChange = (driftPerMinute / 100) * currentPrice;
          const newPrice = oldPrice + driftChange;

          // Apply drift
          await supabase
            .from('assets')
            .update({
              current_price: newPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', event.assetId);

          // Log drift
          await this.logPriceFluctuation(
            event.assetId,
            oldPrice,
            newPrice,
            'event_drift',
            event.eventId
          );

        } catch (error) {
          console.error(`Error applying drift at minute ${minute}:`, error);
        }
      }, minute * 60000); // Wait for each minute
    }
  }

  /**
   * Apply background noise (small random fluctuations)
   * This runs continuously during active rounds
   */
  async applyBackgroundNoise(): Promise<{ success: boolean; updates: number }> {
    try {
      // Check if competition is active
      const { data: round } = await supabase
        .from('competition_rounds')
        .select('status')
        .eq('status', 'active')
        .single();

      if (!round) {
        return { success: false, updates: 0 };
      }

      // Get all active assets
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true);

      if (!assets || assets.length === 0) {
        return { success: true, updates: 0 };
      }

      let updatesCount = 0;

      for (const asset of assets) {
        // Generate random noise: ±0.5%
        const noise = (Math.random() - 0.5) * 2 * this.defaultNoiseConfig.amplitude;
        const oldPrice = asset.current_price;
        const newPrice = oldPrice * (1 + noise);

        // Apply circuit limits (±10% for stocks, ±6% for commodities)
        const maxLimit = asset.asset_type === 'stock' ? 0.10 : 0.06;
        const maxPrice = asset.previous_close * (1 + maxLimit);
        const minPrice = asset.previous_close * (1 - maxLimit);
        const finalPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

        // Update price
        const { error: updateError } = await supabase
          .from('assets')
          .update({
            current_price: finalPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', asset.id);

        if (!updateError) {
          updatesCount++;
          
          // Log noise
          await this.logPriceFluctuation(
            asset.id,
            oldPrice,
            finalPrice,
            'background_noise'
          );
        }
      }

      return { success: true, updates: updatesCount };

    } catch (error) {
      console.error('Error applying background noise:', error);
      return { success: false, updates: 0 };
    }
  }

  /**
   * Start background noise service (runs every minute during active rounds)
   */
  startBackgroundNoise(): void {
    // Apply noise immediately
    this.applyBackgroundNoise();

    // Schedule recurring noise every minute
    setInterval(() => {
      this.applyBackgroundNoise();
    }, 60000); // 1 minute
  }

  /**
   * Apply percentage price change manually (for admin controls)
   */
  async applyPercentageChange(
    assetId: string, 
    percentage: number, 
    adminId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError || !asset) {
        return { success: false, message: 'Asset not found' };
      }

      const oldPrice = asset.current_price;
      const newPrice = oldPrice * (1 + percentage / 100);

      // Apply circuit limits
      const maxLimit = asset.asset_type === 'stock' ? 0.10 : 0.06;
      const maxPrice = asset.previous_close * (1 + maxLimit);
      const minPrice = asset.previous_close * (1 - maxLimit);
      const finalPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

      const { error: updateError } = await supabase
        .from('assets')
        .update({
          current_price: finalPrice,
          previous_close: oldPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', assetId);

      if (updateError) {
        return { success: false, message: 'Failed to update asset price' };
      }

      // Log admin price change
      await this.logPriceFluctuation(
        assetId,
        oldPrice,
        finalPrice,
        'admin_change',
        undefined,
        adminId
      );

      return { 
        success: true, 
        message: `Applied ${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}% change to ${asset.symbol}` 
      };

    } catch (error) {
      console.error('Error applying percentage change:', error);
      return { 
        success: false, 
        message: `Failed to apply price change: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Log price fluctuation for audit trail
   */
  private async logPriceFluctuation(
    assetId: string,
    oldPrice: number,
    newPrice: number,
    reason: string,
    eventId?: string,
    changedBy?: string
  ): Promise<void> {
    try {
      const changePercentage = ((newPrice - oldPrice) / oldPrice) * 100;

      await supabase
        .from('price_fluctuation_log')
        .insert({
          asset_id: assetId,
          old_price: oldPrice,
          new_price: newPrice,
          change_percentage: changePercentage,
          fluctuation_type: reason,
          event_id: eventId
        });

      // Also log to price_history for admin tracking
      if (changedBy) {
        await supabase
          .from('price_history')
          .insert({
            asset_id: assetId,
            price: newPrice,
            changed_by: changedBy
          });
      }

    } catch (error) {
      console.error('Error logging price fluctuation:', error);
    }
  }

  /**
   * Initialize asset prices from yFinance (only at competition start)
   * This should only be called once at the beginning, not during rounds
   */
  async initializeAssetPrices(): Promise<{ success: boolean; message: string; updated: number }> {
    try {
      // Check if competition is already active
      const { data: activeRound } = await supabase
        .from('competition_rounds')
        .select('status')
        .eq('status', 'active')
        .single();

      if (activeRound) {
        return { 
          success: false, 
          message: 'Cannot initialize prices during active competition', 
          updated: 0 
        };
      }

      // Call yFinance function to fetch initial prices
      const { data: result, error } = await supabase.functions.invoke('fetch-yfinance-data');

      if (error) {
        return { 
          success: false, 
          message: `Failed to fetch yFinance data: ${error.message}`, 
          updated: 0 
        };
      }

      return { 
        success: true, 
        message: 'Asset prices initialized from yFinance', 
        updated: result?.results?.length || 0 
      };

    } catch (error) {
      console.error('Error initializing asset prices:', error);
      return { 
        success: false, 
        message: `Failed to initialize prices: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        updated: 0 
      };
    }
  }

  /**
   * Get price history for an asset
   */
  async getPriceHistory(assetId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('price_fluctuation_log')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching price history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }
}

export const priceManagementService = new PriceManagementService();
