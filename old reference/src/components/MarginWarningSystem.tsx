import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  X, 
  TrendingDown, 
  DollarSign, 
  Clock,
  Zap,
  Shield
} from "lucide-react";
import { toast } from "sonner";

interface MarginWarning {
  id: string;
  user_id: string;
  position_id: string | null;
  margin_level: number;
  warning_type: 'maintenance_warning' | 'liquidation' | 'margin_call';
  message: string;
  is_read: boolean | null;
  created_at: string;
}

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  current_value: number;
  is_short: boolean;
  initial_margin: number | null;
  maintenance_margin: number | null;
}

const MarginWarningSystem = () => {
  const [warnings, setWarnings] = useState<MarginWarning[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('margin-warnings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'margin_warnings' }, () => {
        fetchWarnings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        await Promise.all([fetchWarnings(), fetchPositions()]);
      }
    } catch (error) {
      console.error('Error fetching margin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('margin_warnings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWarnings(data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('positions')
        .select(`
          id,
          quantity,
          current_value,
          is_short,
          initial_margin,
          maintenance_margin,
          assets (
            symbol
          )
        `)
        .eq('user_id', session.user.id)
        .eq('is_short', true);

      if (error) throw error;
      
      const formattedPositions = data?.map(pos => ({
        id: pos.id,
        symbol: pos.assets?.symbol || 'Unknown',
        quantity: pos.quantity,
        current_value: pos.current_value,
        is_short: pos.is_short,
        initial_margin: pos.initial_margin,
        maintenance_margin: pos.maintenance_margin
      })) || [];
      
      setPositions(formattedPositions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const markWarningAsRead = async (warningId: string) => {
    try {
      const { error } = await supabase
        .from('margin_warnings')
        .update({ is_read: true })
        .eq('id', warningId);

      if (error) throw error;
      
      setWarnings(prev => prev.map(w => 
        w.id === warningId ? { ...w, is_read: true } : w
      ));
    } catch (error) {
      console.error('Error marking warning as read:', error);
      toast.error('Failed to mark warning as read');
    }
  };

  const closePosition = async (positionId: string) => {
    try {
      // Get position details
      const position = positions.find(p => p.id === positionId);
      if (!position) {
        toast.error('Position not found');
        return;
      }

      // Get current asset price
      const { data: asset, error: assetError } = await supabase
        .from('positions')
        .select(`
          assets (
            current_price
          )
        `)
        .eq('id', positionId)
        .single();

      if (assetError || !asset) {
        toast.error('Failed to get asset price');
        return;
      }

      const currentPrice = asset.assets?.current_price || 0;

      // Create a market order to cover the short position
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          asset_id: positionId, // This should be asset_id, not position_id
          order_type: 'market',
          quantity: position.quantity,
          price: currentPrice,
          status: 'executed',
          executed_price: currentPrice,
          executed_at: new Date().toISOString(),
          is_buy: true // Buy to cover short position
        });

      if (orderError) {
        console.error('Order error:', orderError);
        toast.error('Failed to create cover order');
        return;
      }

      // Delete the position
      const { error: deleteError } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        toast.error('Failed to close position');
        return;
      }

      toast.success(`Short position in ${position.symbol} closed successfully`);
      fetchPositions();
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('Failed to close position');
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'liquidation':
        return <Zap className="h-5 w-5 text-red-500" />;
      case 'margin_call':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'liquidation':
        return 'border-red-200 bg-red-50';
      case 'margin_call':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getWarningTitle = (type: string) => {
    switch (type) {
      case 'liquidation':
        return 'Position Liquidated';
      case 'margin_call':
        return 'Margin Call';
      default:
        return 'Margin Warning';
    }
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadWarnings = warnings.filter(w => !w.is_read);
  const shortPositions = positions.filter(p => p.is_short);

  return (
    <div className="space-y-6">
      {/* Active Warnings */}
      {unreadWarnings.length > 0 && (
        <Card className="card-enhanced border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Active Margin Warnings ({unreadWarnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unreadWarnings.map((warning) => (
                <Alert key={warning.id} className={getWarningColor(warning.warning_type)}>
                  <div className="flex items-start gap-3">
                    {getWarningIcon(warning.warning_type)}
                    <div className="flex-1">
                      <AlertTitle className="text-red-800">
                        {getWarningTitle(warning.warning_type)}
                      </AlertTitle>
                      <AlertDescription className="text-red-700">
                        {warning.message}
                        {warning.margin_level > 0 && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-red-600 border-red-300">
                              Margin Level: {warning.margin_level.toFixed(2)}%
                            </Badge>
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markWarningAsRead(warning.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Short Positions Overview */}
      {shortPositions.length > 0 && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Short Positions ({shortPositions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shortPositions.map((position) => {
                const marginLevel = position.maintenance_margin 
                  ? (position.maintenance_margin / position.current_value) * 100 
                  : 0;
                
                const isLowMargin = marginLevel < 20;
                
                return (
                  <div
                    key={position.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isLowMargin 
                        ? 'border-orange-200 bg-orange-50' 
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{position.symbol}</span>
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            Short
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {position.quantity} shares
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">
                            ₹{position.current_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-sm ${isLowMargin ? 'text-orange-600' : 'text-muted-foreground'}`}>
                            Margin: {marginLevel.toFixed(1)}%
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closePosition(position.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Close Position
                        </Button>
                      </div>
                    </div>
                    
                    {isLowMargin && (
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <div className="flex items-center gap-2 text-orange-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Low margin level - consider closing position or adding funds
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Margin Requirements Info */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Margin Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Initial Margin</h4>
              <p className="text-sm text-muted-foreground">
                25% of position value required to open short positions
              </p>
              <Badge variant="outline">25%</Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Maintenance Margin</h4>
              <p className="text-sm text-muted-foreground">
                Minimum 15% margin level to maintain short positions
              </p>
              <Badge variant="outline">15%</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Warning: Positions below 18% margin will receive warnings. 
                Positions below 15% will be automatically liquidated.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning History */}
      {warnings.length > 0 && (
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Warning History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warnings.slice(0, 10).map((warning) => (
                <div
                  key={warning.id}
                  className={`p-3 rounded-lg border ${
                    warning.is_read 
                      ? 'border-border bg-muted/30' 
                      : getWarningColor(warning.warning_type)
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getWarningIcon(warning.warning_type)}
                      <span className="font-medium text-sm">
                        {getWarningTitle(warning.warning_type)}
                      </span>
                      {!warning.is_read && (
                        <Badge variant="outline" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(warning.created_at).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {warning.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarginWarningSystem;
