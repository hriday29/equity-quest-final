import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  id: string;
  user_id: string;
  quantity: number;
  current_value: number;
  is_short: boolean;
  initial_margin: number | null;
  maintenance_margin: number | null;
  assets: {
    symbol: string;
    current_price: number;
  };
}

interface MarginWarning {
  user_id: string;
  position_id: string | null;
  margin_level: number;
  warning_type: 'maintenance_warning' | 'liquidation' | 'margin_call';
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all short positions
    const { data: positions, error: positionsError } = await supabaseClient
      .from('positions')
      .select(`
        id,
        user_id,
        quantity,
        current_value,
        is_short,
        initial_margin,
        maintenance_margin,
        assets (
          symbol,
          current_price
        )
      `)
      .eq('is_short', true)
      .gt('quantity', 0);

    if (positionsError) {
      throw new Error(`Error fetching positions: ${positionsError.message}`);
    }

    if (!positions || positions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No short positions found',
          warnings_sent: 0,
          liquidations: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const warnings: MarginWarning[] = [];
    let liquidations = 0;

    // Check each position for margin requirements
    for (const position of positions as Position[]) {
      if (!position.maintenance_margin || !position.initial_margin) {
        continue; // Skip positions without margin data
      }

      // Calculate current margin level
      const currentValue = position.quantity * position.assets.current_price;
      const marginLevel = (position.maintenance_margin / currentValue) * 100;

      // Check if position needs attention
      if (marginLevel < 15) {
        // Auto-liquidate position
        await liquidatePosition(supabaseClient, position);
        liquidations++;

        // Create liquidation warning
        warnings.push({
          user_id: position.user_id,
          position_id: position.id,
          margin_level: marginLevel,
          warning_type: 'liquidation',
          message: `Position in ${position.assets.symbol} was automatically liquidated due to insufficient margin (${marginLevel.toFixed(2)}%)`
        });
      } else if (marginLevel < 18) {
        // Send margin call warning
        warnings.push({
          user_id: position.user_id,
          position_id: position.id,
          margin_level: marginLevel,
          warning_type: 'margin_call',
          message: `Margin call for ${position.assets.symbol}: Margin level at ${marginLevel.toFixed(2)}%. Position will be liquidated if it falls below 15%.`
        });
      } else if (marginLevel < 20) {
        // Send maintenance warning
        warnings.push({
          user_id: position.user_id,
          position_id: position.id,
          margin_level: marginLevel,
          warning_type: 'maintenance_warning',
          message: `Low margin warning for ${position.assets.symbol}: Margin level at ${marginLevel.toFixed(2)}%. Consider closing position or adding funds.`
        });
      }
    }

    // Insert warnings into database
    if (warnings.length > 0) {
      const { error: warningsError } = await supabaseClient
        .from('margin_warnings')
        .insert(warnings.map(warning => ({
          ...warning,
          created_at: new Date().toISOString()
        })));

      if (warningsError) {
        console.error('Error inserting warnings:', warningsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${positions.length} short positions`,
        warnings_sent: warnings.length,
        liquidations: liquidations,
        positions_checked: positions.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in check-margins function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function liquidatePosition(supabaseClient: any, position: Position) {
  try {
    // Create a market order to cover the short position
    const { error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: position.user_id,
        asset_id: position.assets.symbol, // This should be asset_id, not symbol
        order_type: 'market',
        quantity: position.quantity,
        price: position.assets.current_price,
        status: 'executed',
        executed_price: position.assets.current_price,
        executed_at: new Date().toISOString(),
        is_buy: true // Buy to cover short position
      });

    if (orderError) {
      console.error('Error creating liquidation order:', orderError);
      return;
    }

    // Delete the position
    const { error: deleteError } = await supabaseClient
      .from('positions')
      .delete()
      .eq('id', position.id);

    if (deleteError) {
      console.error('Error deleting liquidated position:', deleteError);
    }

    // Update portfolio cash balance (return margin + profit/loss)
    const marginReturn = position.initial_margin || 0;
    const profitLoss = position.quantity * (position.assets.current_price - (position.current_value / position.quantity));
    const cashChange = marginReturn + profitLoss;

    const { error: portfolioError } = await supabaseClient
      .from('portfolios')
      .update({
        cash_balance: supabaseClient.raw(`cash_balance + ${cashChange}`),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', position.user_id);

    if (portfolioError) {
      console.error('Error updating portfolio after liquidation:', portfolioError);
    }

    console.log(`Liquidated position ${position.id} for user ${position.user_id}`);
  } catch (error) {
    console.error('Error liquidating position:', error);
  }
}