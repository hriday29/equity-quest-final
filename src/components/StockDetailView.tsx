import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign, 
  Calendar,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Gauge,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { priceUpdateService, PriceUpdateEvent } from "@/services/priceUpdateService";

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
  const [currentPrice, setCurrentPrice] = useState(asset.current_price);
  const [priceChange, setPriceChange] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [priceUpdateSubscription, setPriceUpdateSubscription] = useState<string | null>(null);

  const generateMockPriceHistory = (): PriceHistory[] => {
    const data: PriceHistory[] = [];
    const now = Date.now();
    const basePrice = asset.current_price || 100; // Fallback price
    
    console.log('Generating mock data for:', asset.symbol, 'basePrice:', basePrice);
    
    // Generate 30 days of historical data
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily data
      const randomChange = (Math.random() - 0.5) * 0.08; // ±4% daily change for more realistic data
      const price = basePrice * (1 + randomChange);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        close: Math.max(price, basePrice * 0.5), // Ensure price doesn't go too low
        volume
      });
    }
    
    // Add current price as the latest point
    data.push({
      timestamp: Math.floor(now / 1000),
      close: currentPrice || basePrice,
      volume: 1000000
    });
    
    console.log('Generated mock data:', data.length, 'points');
    return data;
  };

  // Initialize with mock data if no data is available
  useEffect(() => {
    if (priceHistory.length === 0 && !loading) {
      console.log('No price history, initializing with mock data');
      const mockData = generateMockPriceHistory();
      setPriceHistory(mockData);
    }
  }, [priceHistory.length, loading]);

  useEffect(() => {
    if (asset) {
      fetchPriceHistory();
    }
  }, [asset, timeRange]);

  const setupPriceUpdates = useCallback(() => {
    if (priceUpdateSubscription) {
      priceUpdateService.unsubscribe(priceUpdateSubscription);
    }

    const subscriptionId = priceUpdateService.subscribe((update: PriceUpdateEvent) => {
      if (update.assetId === asset.id) {
        setCurrentPrice(update.newPrice);
        setPriceChange(update.changePercentage);
        
        // Update the price history for live chart movement
        setPriceHistory(prev => {
          const newHistory = [...prev];
          const currentTimestamp = Math.floor(Date.now() / 1000);
          
          // For live updates, always add a new point to show movement
          if (newHistory.length > 0) {
            const lastPoint = newHistory[newHistory.length - 1];
            const timeDiff = currentTimestamp - lastPoint.timestamp;
            
            // Add new point every 5 seconds for live movement, or if price changed significantly
            const priceChange = Math.abs(update.newPrice - lastPoint.close) / lastPoint.close;
            if (timeDiff >= 5 || priceChange > 0.0005) { // 0.05% price change threshold for more sensitive updates
              newHistory.push({
                timestamp: currentTimestamp,
                close: update.newPrice,
                volume: 1000000
              });
              
              // Keep only last 50 points to prevent memory issues
              if (newHistory.length > 50) {
                newHistory.shift();
              }
            } else {
              // Update the existing last point for minor changes
              newHistory[newHistory.length - 1] = {
                ...lastPoint,
                close: update.newPrice,
                timestamp: currentTimestamp
              };
            }
          } else {
            // If no history, create the first point
            newHistory.push({
              timestamp: currentTimestamp,
              close: update.newPrice,
              volume: 1000000
            });
          }
          
          console.log('Updated price history:', newHistory.length, 'points, latest price:', update.newPrice);
          return newHistory;
        });
      }
    }, [asset.id]);

    setPriceUpdateSubscription(subscriptionId);
  }, [asset.id]);

  useEffect(() => {
    if (asset) {
      setupPriceUpdates();
    }
    
    return () => {
      if (priceUpdateSubscription) {
        priceUpdateService.unsubscribe(priceUpdateSubscription);
      }
    };
  }, [asset.id, setupPriceUpdates]);

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

      let historicalData: PriceHistory[] = [];

      if (error || !metrics) {
        console.log('No historical data found, generating mock data');
        historicalData = generateMockPriceHistory();
      } else {
        // Parse the historical data from yFinance
        const rawData = metrics.data as any;
        console.log('Raw historical data:', rawData);
        
        if (Array.isArray(rawData)) {
          historicalData = rawData.map((point: any) => ({
            timestamp: point.timestamp || Math.floor(Date.now() / 1000),
            close: point.close || point.price || asset.current_price,
            volume: point.volume || 1000000
          }));
        } else if (rawData && typeof rawData === 'object') {
          // Handle different data structures from yFinance
          const timestamps = rawData.timestamps || rawData.timestamp || [];
          const prices = rawData.prices || rawData.close || rawData.price || [];
          const volumes = rawData.volumes || rawData.volume || [];
          
          historicalData = timestamps.map((timestamp: any, index: number) => ({
            timestamp: typeof timestamp === 'number' ? timestamp : Math.floor(new Date(timestamp).getTime() / 1000),
            close: prices[index] || asset.current_price,
            volume: volumes[index] || 1000000
          }));
        } else {
          historicalData = generateMockPriceHistory();
        }
      }

      // Add current price as the latest point
      const currentTimestamp = Math.floor(Date.now() / 1000);
      historicalData.push({
        timestamp: currentTimestamp,
        close: currentPrice,
        volume: 1000000
      });

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

      // Sort by timestamp to ensure proper order
      filteredData.sort((a, b) => a.timestamp - b.timestamp);
      
      // Ensure we always have at least some data
      if (filteredData.length === 0) {
        console.log('No filtered data, using mock data as fallback');
        const mockData = generateMockPriceHistory();
        setPriceHistory(mockData);
      } else {
        setPriceHistory(filteredData);
      }
      
      console.log('Final price history:', filteredData);
    } catch (error) {
      console.error('Error fetching price history:', error);
      // Fallback to mock data
      setPriceHistory(generateMockPriceHistory());
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, assetType?: string) => {
    if (assetType === 'commodity') {
      // For commodities, use $ symbol and different formatting
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };


  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'timestamp:', timestamp);
      return 'Invalid Date';
    }
  };

  const getPriceChange = () => {
    const change = currentPrice - asset.previous_close;
    const changePercent = (change / asset.previous_close) * 100;
    return { change, changePercent };
  };

  const { change, changePercent } = getPriceChange();
  const isPositive = change >= 0;

  const chartData = priceHistory.map((point, index) => ({
    date: formatDate(point.timestamp),
    price: point.close,
    volume: point.volume,
    timestamp: point.timestamp,
    index: index // Add index for better chart rendering
  }));

  // Debug logging
  console.log('StockDetailView Debug:', {
    asset: asset.symbol,
    priceHistoryLength: priceHistory.length,
    chartDataLength: chartData.length,
    loading,
    currentPrice,
    priceHistory: priceHistory.slice(0, 3), // First 3 items
    chartData: chartData.slice(0, 3) // First 3 items
  });

  // Force generate data if none exists
  useEffect(() => {
    if (chartData.length === 0 && !loading) {
      console.log('Force generating chart data...');
      const mockData = generateMockPriceHistory();
      setPriceHistory(mockData);
    }
  }, [chartData.length, loading, generateMockPriceHistory]);

  // Add a test button to manually trigger chart updates
  const addTestDataPoint = () => {
    const newPoint = {
      timestamp: Math.floor(Date.now() / 1000),
      close: currentPrice + (Math.random() - 0.5) * 10, // Random price change
      volume: 1000000
    };
    setPriceHistory(prev => [...prev, newPoint]);
  };

  // Force render chart with minimal data
  const forceRenderChart = () => {
    const testData = [
      { timestamp: Math.floor(Date.now() / 1000) - 3600, close: 100, volume: 1000000 },
      { timestamp: Math.floor(Date.now() / 1000) - 1800, close: 105, volume: 1000000 },
      { timestamp: Math.floor(Date.now() / 1000), close: 110, volume: 1000000 }
    ];
    setPriceHistory(testData);
    setLoading(false);
  };

  // Create ultra-simple chart data
  const createSimpleChart = () => {
    const simpleData = [
      { date: 'A', price: 100 },
      { date: 'B', price: 120 },
      { date: 'C', price: 110 },
      { date: 'D', price: 130 }
    ];
    console.log('Creating simple chart with data:', simpleData);
    // This will be used in a simple chart test
  };

  // Ensure we have at least 2 data points for the chart
  const finalChartData = chartData.length >= 2 ? chartData : [
    { date: 'Yesterday', price: asset.previous_close || 100, volume: 1000000, timestamp: Math.floor(Date.now() / 1000) - 86400, index: 0 },
    { date: 'Today', price: currentPrice || asset.current_price || 100, volume: 1000000, timestamp: Math.floor(Date.now() / 1000), index: 1 }
  ];

  // Force ensure we always have data
  const guaranteedChartData = finalChartData.length > 0 ? finalChartData : [
    { date: 'Start', price: 100, volume: 1000000, timestamp: Math.floor(Date.now() / 1000) - 3600, index: 0 },
    { date: 'Now', price: 100, volume: 1000000, timestamp: Math.floor(Date.now() / 1000), index: 1 }
  ];

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
              <div className="flex items-center gap-2 mb-1">
                <div className="text-3xl font-bold tracking-tight">{formatPrice(currentPrice, asset.asset_type)}</div>
                {isLive && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    LIVE
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {isPositive ? '+' : ''}{formatPrice(change, asset.asset_type)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
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
            <div className="text-xl font-bold mt-1">{formatPrice(asset.previous_close, asset.asset_type)}</div>
          </CardContent>
        </Card>

        {asset.week_52_high && (
          <Card className="card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">52W High</span>
              </div>
              <div className="text-xl font-bold mt-1">{formatPrice(asset.week_52_high, asset.asset_type)}</div>
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
              <div className="text-xl font-bold mt-1">{formatPrice(asset.week_52_low, asset.asset_type)}</div>
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

      {/* Enhanced Charts */}
      {/*
      <Card className="card-enhanced border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Market Analytics</CardTitle>
                <p className="text-sm text-muted-foreground">Real-time price movements & volume analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className="flex items-center gap-2"
              >
                {isLive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {isLive ? 'Live' : 'Paused'}
              </Button>
              <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                {(['1D', '1W', '1M'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className="h-8 px-3 text-xs font-medium"
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUpIcon className="h-4 w-4" />
              Price Movement Chart
            </div>
            
            <div className="space-y-4">
              <div className="h-96 relative">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
                      <p className="text-muted-foreground">Loading market data...</p>
                    </div>
                  </div>
                ) : guaranteedChartData.length < 2 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                      <BarChart3 className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No price data available</p>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            console.log('Generating test data...');
                            const testData = generateMockPriceHistory();
                            setPriceHistory(testData);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Generate Test Data
                        </Button>
                        <Button 
                          onClick={forceRenderChart}
                          variant="outline"
                          size="sm"
                        >
                          Force Render
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent rounded-lg"></div>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={guaranteedChartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={(value) => asset.asset_type === 'commodity' ? `$${value.toFixed(0)}` : `₹${value.toFixed(0)}`} />
                        <Tooltip 
                          formatter={(value: number) => [formatPrice(value, asset.asset_type), 'Price']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    
                    
                    {isLive && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium border border-green-500/20 animate-pulse">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        LIVE PRICE
                      </div>
                    )}
                    
                  </div>
                )}
              </div>
              
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Current</div>
                  <div className="font-bold text-lg">{formatPrice(currentPrice, asset.asset_type)}</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Change</div>
                  <div className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Previous</div>
                  <div className="font-bold text-lg">{formatPrice(asset.previous_close, asset.asset_type)}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      */}

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