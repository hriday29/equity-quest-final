import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking margin requirements...');

    // Get margin settings
    const { data: marginSettings } = await supabaseClient
      .from('competition_settings')
      .select('setting_value')
      .eq('setting_key', 'margin_requirements')
      .single();

    const margins = marginSettings?.setting_value || {
      initial: 0.25,
      maintenance: 0.15,
      warning: 0.18,
    };

    // Get all short positions
    const { data: shortPositions, error: posError } = await supabaseClient
      .from('positions')
      .select(`
        *,
        assets (
          symbol,
          current_price
        )
      `)
      .eq('is_short', true)
      .gt('quantity', 0);

    if (posError) throw posError;

    const warnings = [];
    const liquidations = [];

    for (const position of shortPositions || []) {
      const currentPrice = parseFloat(position.assets.current_price);
      const averagePrice = parseFloat(position.average_price);
      const quantity = parseFloat(position.quantity);

      // Calculate P&L for short position
      const positionValue = quantity * currentPrice;
      const initialValue = quantity * averagePrice;
      const pnl = initialValue - positionValue;

      // Calculate margin level
      const currentMargin = parseFloat(position.initial_margin) + pnl;
      const marginPercentage = currentMargin / positionValue;

      console.log(`Position ${position.id} - Margin: ${(marginPercentage * 100).toFixed(2)}%`);

      // Check for liquidation (15% threshold)
      if (marginPercentage <= margins.maintenance) {
        console.log(`LIQUIDATION TRIGGERED for position ${position.id}`);

        // Close the position (cover short)
        await supabaseClient
          .from('positions')
          .delete()
          .eq('id', position.id);

        // Update portfolio cash
        const finalValue = positionValue;
        const returnedMargin = currentMargin;
        const totalReturn = returnedMargin;

        const { data: portfolio } = await supabaseClient
          .from('portfolios')
          .select('cash_balance')
          .eq('user_id', position.user_id)
          .single();

        if (portfolio) {
          await supabaseClient
            .from('portfolios')
            .update({
              cash_balance: parseFloat(portfolio.cash_balance) + totalReturn,
            })
            .eq('user_id', position.user_id);
        }

        // Create warning record
        await supabaseClient
          .from('margin_warnings')
          .insert({
            user_id: position.user_id,
            position_id: position.id,
            warning_type: 'liquidation',
            margin_level: marginPercentage,
            message: `Your short position in ${position.assets.symbol} has been liquidated due to insufficient margin (${(marginPercentage * 100).toFixed(2)}%).`,
          });

        liquidations.push({
          userId: position.user_id,
          symbol: position.assets.symbol,
          marginLevel: marginPercentage,
        });
      }
      // Check for warning (18% threshold)
      else if (marginPercentage <= margins.warning) {
        console.log(`MARGIN WARNING for position ${position.id}`);

        // Check if warning already sent recently (within last hour)
        const { data: recentWarnings } = await supabaseClient
          .from('margin_warnings')
          .select('*')
          .eq('position_id', position.id)
          .eq('warning_type', 'warning')
          .gte('created_at', new Date(Date.now() - 3600000).toISOString());

        if (!recentWarnings || recentWarnings.length === 0) {
          await supabaseClient
            .from('margin_warnings')
            .insert({
              user_id: position.user_id,
              position_id: position.id,
              warning_type: 'warning',
              margin_level: marginPercentage,
              message: `WARNING: Your short position in ${position.assets.symbol} is approaching margin call. Current margin: ${(marginPercentage * 100).toFixed(2)}%. Maintenance margin: ${(margins.maintenance * 100)}%.`,
            });

          warnings.push({
            userId: position.user_id,
            symbol: position.assets.symbol,
            marginLevel: marginPercentage,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Margin check completed',
        warnings: warnings.length,
        liquidations: liquidations.length,
        details: {
          warnings,
          liquidations,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-margins function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
