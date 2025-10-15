import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import SectorNavigation from "@/components/SectorNavigation";
import StockDetailView from "@/components/StockDetailView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  ArrowLeft,
  Search,
  Activity,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { priceUpdateService, PriceUpdateEvent } from "@/services/priceUpdateService";
import { globalServiceManager } from "@/services/globalServiceManager";

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

const MarketAnalysis = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [marketStats, setMarketStats] = useState({
    totalValue: 0,
    totalChange: 0,
    activeStocks: 0,
    topGainers: [] as Asset[],
    topLosers: [] as Asset[]
  });
  const [priceUpdateSubscription, setPriceUpdateSubscription] = useState<string | null>(null);

  useEffect(() => {
    // Initialize global services
    const initializeGlobalServices = async () => {
      try {
        await globalServiceManager.initialize();
      } catch (error) {
        console.error('Error initializing global services:', error);
      }
    };

    initializeGlobalServices();
    fetchAssets();
    initializePriceUpdates();
    
    // Listen for live price updates from the noise service
    const handleAssetPriceUpdate = (event: CustomEvent) => {
      const { assetId, newPrice } = event.detail;
      console.log(`📊 Market Analysis - Live price update: Asset ${assetId} = ₹${newPrice}`);
      
      // Update the assets array with the new price
      setAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === assetId 
            ? { ...asset, current_price: newPrice }
            : asset
        )
      );
    };

    window.addEventListener('assetPriceUpdate', handleAssetPriceUpdate as EventListener);
    
    return () => {
      if (priceUpdateSubscription) {
        priceUpdateService.unsubscribe(priceUpdateSubscription);
      }
      window.removeEventListener('assetPriceUpdate', handleAssetPriceUpdate as EventListener);
    };
  }, []);

  // Re-initialize price updates when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Always refresh data when component becomes visible (handles reset scenarios)
        fetchAssets();
        if (!priceUpdateSubscription) {
          initializePriceUpdates();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [priceUpdateSubscription]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('symbol');

      if (error) throw error;

      setAssets(data || []);
      calculateMarketStats(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const calculateMarketStats = (assetsData: Asset[]) => {
    const totalValue = assetsData.reduce((sum, asset) => sum + asset.current_price, 0);
    const totalChange = assetsData.reduce((sum, asset) => {
      const change = ((asset.current_price - asset.previous_close) / asset.previous_close) * 100;
      return sum + change;
    }, 0) / assetsData.length;

    // Calculate top gainers and losers
    const sortedByChange = [...assetsData].sort((a, b) => {
      const changeA = ((a.current_price - a.previous_close) / a.previous_close) * 100;
      const changeB = ((b.current_price - b.previous_close) / b.previous_close) * 100;
      return changeB - changeA;
    });

    setMarketStats({
      totalValue,
      totalChange,
      activeStocks: assetsData.length,
      topGainers: sortedByChange.slice(0, 5),
      topLosers: sortedByChange.slice(-5).reverse()
    });
  };

  const initializePriceUpdates = useCallback(async () => {
    try {
      // Clean up existing subscription if any
      if (priceUpdateSubscription) {
        priceUpdateService.unsubscribe(priceUpdateSubscription);
        setPriceUpdateSubscription(null);
      }

      await priceUpdateService.initialize();
      
      const subscriptionId = priceUpdateService.subscribe((update: PriceUpdateEvent) => {
        // Update assets with new price
        setAssets(prevAssets => {
          const updatedAssets = prevAssets.map(asset => {
            if (asset.id === update.assetId) {
              return {
                ...asset,
                current_price: update.newPrice
              };
            }
            return asset;
          });
          
          // Recalculate market stats with updated prices
          calculateMarketStats(updatedAssets);
          return updatedAssets;
        });

        // Update selected asset if it's the one being updated
        if (selectedAsset && selectedAsset.id === update.assetId) {
          setSelectedAsset(prev => prev ? {
            ...prev,
            current_price: update.newPrice
          } : null);
        }
      });

      setPriceUpdateSubscription(subscriptionId);
      console.log('Price updates initialized for MarketAnalysis');
    } catch (error) {
      console.error('Error initializing price updates:', error);
    }
  }, [selectedAsset, priceUpdateSubscription]);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const formatPrice = (price: number, assetType?: string) => {
    if (assetType === 'commodity') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleBackToSectors = () => {
    setSelectedAsset(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
              <BarChart3 className="h-8 w-8 text-primary" />
              Market Analysis
            </h1>
            <p className="text-muted-foreground">
              Explore sectors and analyze individual stocks with detailed charts and metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!priceUpdateSubscription && (
              <Button 
                variant="outline" 
                onClick={initializePriceUpdates}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reconnect
              </Button>
            )}
            {selectedAsset && (
              <Button 
                variant="outline" 
                onClick={handleBackToSectors}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sectors
              </Button>
            )}
          </div>
        </div>

        {!selectedAsset ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Sector Navigation */}
            <div className="lg:col-span-1">
              <SectorNavigation 
                onAssetSelect={handleAssetSelect}
                selectedAsset={selectedAsset}
              />
            </div>

            {/* Market Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Market Overview
                    <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/70">
                      <div className={`text-2xl font-bold transition-colors duration-300 ${
                        marketStats.totalChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {marketStats.totalChange >= 0 ? '+' : ''}{marketStats.totalChange.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Market Change</div>
                    </div>
                    {/* <div className="text-center p-4 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-blue-600 transition-all duration-300">
                        ₹{(marketStats.totalValue / 10000000).toFixed(1)} Cr
                      </div>
                      <div className="text-sm text-muted-foreground">Total Market Cap</div>
                    </div> */}
                    <div className="text-center p-4 bg-muted/50 rounded-lg transition-all duration-300 hover:bg-muted/70">
                      <div className="text-2xl font-bold text-purple-600 transition-all duration-300">
                        {marketStats.activeStocks}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Stocks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketStats.topGainers.map((stock, index) => {
                      const change = ((stock.current_price - stock.previous_close) / stock.previous_close) * 100;
                      return (
                        <div 
                          key={stock.symbol} 
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleAssetSelect(stock)}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                              {index + 1}
                            </Badge>
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-muted-foreground">{stock.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium transition-all duration-300">
                              {formatPrice(stock.current_price, stock.asset_type)}
                            </div>
                            <div className="text-sm text-green-600 font-medium transition-all duration-300">
                              +{change.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-primary" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketStats.topLosers.map((stock, index) => {
                      const change = ((stock.current_price - stock.previous_close) / stock.previous_close) * 100;
                      return (
                        <div 
                          key={stock.symbol} 
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-all duration-300 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleAssetSelect(stock)}
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0">
                              {index + 1}
                            </Badge>
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-muted-foreground">{stock.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium transition-all duration-300">
                              {formatPrice(stock.current_price, stock.asset_type)}
                            </div>
                            <div className="text-sm text-red-600 font-medium transition-all duration-300">
                              {change.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <StockDetailView asset={selectedAsset} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarketAnalysis;
