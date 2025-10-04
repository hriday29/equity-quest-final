import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  DollarSign, 
  Calendar,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  sector: string;
  asset_type: 'stock' | 'commodity' | 'index';
  week_52_high?: number;
  week_52_low?: number;
  market_cap?: number;
  pe_ratio?: number;
}

interface PriceHistory {
  timestamp: number;
  close: number;
  volume: number;
}

interface StockDetailViewProps {
  asset: Asset;
}

const StockDetailView = ({ asset }: StockDetailViewProps) => {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M'>('1W');

  useEffect(() => {
    if (asset) {
      fetchPriceHistory();
    }
  }, [asset, timeRange]);

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      
      // Get historical data from financial_metrics table
      const { data: metrics, error } = await supabase
        .from('financial_metrics')
        .select('data')
        .eq('asset_id', asset.id)
        .eq('metric_type', 'historical_price')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !metrics) {
        // If no historical data, create mock data for demonstration
        const mockData = generateMockPriceHistory();
        setPriceHistory(mockData);
        return;
      }

      const historicalData = metrics.data as PriceHistory[];
      
      // Filter data based on time range
      const now = Date.now();
      const filteredData = historicalData.filter(point => {
        const pointTime = point.timestamp * 1000; // Convert to milliseconds
        switch (timeRange) {
          case '1D':
            return now - pointTime <= 24 * 60 * 60 * 1000;
          case '1W':
            return now - pointTime <= 7 * 24 * 60 * 60 * 1000;
          case '1M':
            return now - pointTime <= 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });

      setPriceHistory(filteredData);
    } catch (error) {
      console.error('Error fetching price history:', error);
      // Fallback to mock data
      setPriceHistory(generateMockPriceHistory());
    } finally {
      setLoading(false);
    }
  };

  const generateMockPriceHistory = (): PriceHistory[] => {
    const data: PriceHistory[] = [];
    const now = Date.now();
    const basePrice = asset.current_price;
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily data
      const randomChange = (Math.random() - 0.5) * 0.1; // ±5% daily change
      const price = basePrice * (1 + randomChange);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        close: price,
        volume
      });
    }
    
    return data;
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriceChange = () => {
    const change = asset.current_price - asset.previous_close;
    const changePercent = (change / asset.previous_close) * 100;
    return { change, changePercent };
  };

  const { change, changePercent } = getPriceChange();
  const isPositive = change >= 0;

  const chartData = priceHistory.map(point => ({
    date: formatDate(point.timestamp),
    price: point.close,
    volume: point.volume
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{asset.symbol}</CardTitle>
              <p className="text-muted-foreground">{asset.name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{asset.sector}</Badge>
                <Badge variant="secondary">{asset.asset_type.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatPrice(asset.current_price)}</div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isPositive ? '+' : ''}{formatPrice(change)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-enhanced">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Previous Close</span>
            </div>
            <div className="text-xl font-bold mt-1">{formatPrice(asset.previous_close)}</div>
          </CardContent>
        </Card>

        {asset.week_52_high && (
          <Card className="card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">52W High</span>
              </div>
              <div className="text-xl font-bold mt-1">{formatPrice(asset.week_52_high)}</div>
            </CardContent>
          </Card>
        )}

        {asset.week_52_low && (
          <Card className="card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">52W Low</span>
              </div>
              <div className="text-xl font-bold mt-1">{formatPrice(asset.week_52_low)}</div>
            </CardContent>
          </Card>
        )}

        {asset.market_cap && (
          <Card className="card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Market Cap</span>
              </div>
              <div className="text-xl font-bold mt-1">
                ₹{(asset.market_cap / 10000000).toFixed(1)} Cr
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <Card className="card-enhanced">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Price Chart
            </CardTitle>
            <div className="flex gap-2">
              {(['1D', '1W', '1M'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="price" className="space-y-4">
            <TabsList>
              <TabsTrigger value="price">Price</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
            </TabsList>
            
            <TabsContent value="price">
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                        tickFormatter={(value) => `₹${value.toFixed(0)}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatPrice(value), 'Price']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="volume">
              <div className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#666' }}
                        tickFormatter={(value) => formatVolume(value)}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatVolume(value), 'Volume']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar 
                        dataKey="volume" 
                        fill="hsl(var(--primary))" 
                        opacity={0.7}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Trading Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-medium">{asset.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector:</span>
                  <span className="font-medium">{asset.sector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{asset.asset_type}</span>
                </div>
              </div>
            </div>
            
            {asset.pe_ratio && (
              <div>
                <h4 className="font-medium mb-2">Valuation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P/E Ratio:</span>
                    <span className="font-medium">{asset.pe_ratio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockDetailView;
