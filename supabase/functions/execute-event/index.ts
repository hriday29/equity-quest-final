import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventMechanics {
  affected_assets: string[]; // asset symbols
  open_gap?: number; // immediate gap percentage
  drift?: number; // total drift percentage
  drift_duration?: number; // drift duration in minutes
  catalyst?: {
    at_minute: number;
    change: number;
  };
  special?: string; // 'black_swan', 'trading_halt', etc.
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    console.log(`Executing event ${eventId}`);

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from('competition_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    const mechanics: EventMechanics = event.mechanics;

    // Get affected assets
    const { data: assets, error: assetsError } = await supabaseClient
      .from('assets')
      .select('*')
      .in('symbol', mechanics.affected_assets);

    if (assetsError) throw assetsError;

    const updates = [];

    // Apply OPEN GAP (instant price change)
    if (mechanics.open_gap) {
      for (const asset of assets) {
        const oldPrice = parseFloat(asset.current_price);
        const newPrice = oldPrice * (1 + mechanics.open_gap);

        await supabaseClient
          .from('assets')
          .update({
            current_price: newPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', asset.id);

        // Log the gap
        await supabaseClient
          .from('price_fluctuation_log')
          .insert({
            asset_id: asset.id,
            old_price: oldPrice,
            new_price: newPrice,
            change_percentage: mechanics.open_gap * 100,
            fluctuation_type: 'gap',
            event_id: eventId,
          });

        updates.push({
          symbol: asset.symbol,
          type: 'gap',
          change: mechanics.open_gap * 100,
        });
      }
    }

    // Mark event as executing (drift will be handled by a separate scheduled function)
    await supabaseClient
      .from('competition_events')
      .update({
        status: 'executing',
        executed_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    // If this is a BLACK SWAN event
    if (mechanics.special === 'black_swan') {
      console.log('Executing BLACK SWAN event');
      
      // Get all stock assets
      const { data: allStocks } = await supabaseClient
        .from('assets')
        .select('*')
        .eq('asset_type', 'stock');

      // Apply -8% crash to all stocks
      for (const stock of allStocks || []) {
        const oldPrice = parseFloat(stock.current_price);
        const newPrice = oldPrice * 0.92; // -8%

        await supabaseClient
          .from('assets')
          .update({
            current_price: newPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stock.id);

        await supabaseClient
          .from('price_fluctuation_log')
          .insert({
            asset_id: stock.id,
            old_price: oldPrice,
            new_price: newPrice,
            change_percentage: -8,
            fluctuation_type: 'gap',
            event_id: eventId,
          });
      }

      // Pause competition for 90 seconds (trading halt)
      // This would need to be handled by the frontend/admin panel
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Event executed successfully',
        updates,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in execute-event function:', error);
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
