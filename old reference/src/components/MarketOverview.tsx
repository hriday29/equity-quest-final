import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  asset_type: string;
  sector: string | null;
}

interface MarketOverviewProps {
  assets: Asset[];
  priceChanges: Record<string, 'up' | 'down' | null>;
}

const MarketOverview = ({ assets, priceChanges }: MarketOverviewProps) => {
  const getPriceChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Memoize expensive calculations
  const { sectorPerformance, topGainers, topLosers } = useMemo(() => {
    const sectors: Record<string, { total: number; count: number }> = {};
    
    assets.forEach(asset => {
      if (asset.sector && asset.previous_close) {
        const change = ((asset.current_price - asset.previous_close) / asset.previous_close) * 100;
        if (!sectors[asset.sector]) {
          sectors[asset.sector] = { total: 0, count: 0 };
        }
        sectors[asset.sector].total += change;
        sectors[asset.sector].count += 1;
      }
    });

    const avgSectors: Record<string, { avg: number; count: number }> = {};
    Object.keys(sectors).forEach(sector => {
      avgSectors[sector] = {
        avg: sectors[sector].total / sectors[sector].count,
        count: sectors[sector].count
      };
    });

    const assetsWithChanges = assets.map(asset => ({
      ...asset,
      change: getPriceChange(asset.current_price, asset.previous_close)
    }));

    const topGainers = assetsWithChanges
      .sort((a, b) => b.change - a.change)
      .slice(0, 5);

    const topLosers = assetsWithChanges
      .sort((a, b) => a.change - b.change)
      .slice(0, 5);

    return { sectorPerformance: avgSectors, topGainers, topLosers };
  }, [assets]);

  return (
    <div className="space-y-6">
      {/* Market Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Stocks & Commodities</p>
          </CardContent>
        </Card>

        <Card className="card-enhanced glow-success">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Gainer</CardTitle>
          </CardHeader>
          <CardContent>
            {topGainers[0] && (
              <>
                <div className="text-xl font-bold text-profit">{topGainers[0].symbol}</div>
                <div className="flex items-center gap-1 text-profit">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+{topGainers[0].change.toFixed(2)}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-enhanced glow-danger">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Loser</CardTitle>
          </CardHeader>
          <CardContent>
            {topLosers[0] && (
              <>
                <div className="text-xl font-bold text-loss">{topLosers[0].symbol}</div>
                <div className="flex items-center gap-1 text-loss">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{topLosers[0].change.toFixed(2)}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Sectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(sectorPerformance).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Market Sectors</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Movers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-profit" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topGainers.map((asset, index) => (
              <div 
                key={asset.id} 
                className={`flex items-center justify-between p-3 rounded-lg border border-border hover:border-profit/50 transition-all animate-fade-in ${
                  priceChanges[asset.id] === 'up' ? 'bg-profit/5' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="font-semibold">{asset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                  {asset.sector && (
                    <Badge variant="secondary" className="text-xs mt-1">{asset.sector}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{asset.current_price.toFixed(2)}</div>
                  <div className="flex items-center gap-1 text-profit justify-end">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-sm">+{asset.change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-loss" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLosers.map((asset, index) => (
              <div 
                key={asset.id} 
                className={`flex items-center justify-between p-3 rounded-lg border border-border hover:border-loss/50 transition-all animate-fade-in ${
                  priceChanges[asset.id] === 'down' ? 'bg-loss/5' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <div className="font-semibold">{asset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                  {asset.sector && (
                    <Badge variant="secondary" className="text-xs mt-1">{asset.sector}</Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{asset.current_price.toFixed(2)}</div>
                  <div className="flex items-center gap-1 text-loss justify-end">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-sm">{asset.change.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Sector Performance */}
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Sector Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(sectorPerformance)
              .sort((a, b) => b[1].avg - a[1].avg)
              .map(([sector, data], index) => (
                <div 
                  key={sector}
                  className={`p-4 rounded-lg border transition-all animate-fade-in ${
                    data.avg >= 0 
                      ? 'border-profit/20 bg-profit/5 hover:border-profit/50' 
                      : 'border-loss/20 bg-loss/5 hover:border-loss/50'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{sector}</div>
                      <div className="text-xs text-muted-foreground">{data.count} stocks</div>
                    </div>
                    <div className={`text-right font-bold ${data.avg >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {data.avg >= 0 ? '+' : ''}{data.avg.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketOverview;
