import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  asset_type: string;
  sector: string | null;
}

interface CollapsibleMarketOverviewProps {
  assets: Asset[];
  priceChanges: Record<string, 'up' | 'down' | null>;
  competitionStatus: string;
}

const CollapsibleMarketOverview = ({ assets, priceChanges, competitionStatus }: CollapsibleMarketOverviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sectorPerformance, setSectorPerformance] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    calculateSectorPerformance();
  }, [assets]);

  const calculateSectorPerformance = () => {
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

    setSectorPerformance(avgSectors);
  };

  const getPriceChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const topGainers = assets
    .map(asset => ({
      ...asset,
      change: getPriceChange(asset.current_price, asset.previous_close)
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 5);

  const topLosers = assets
    .map(asset => ({
      ...asset,
      change: getPriceChange(asset.current_price, asset.previous_close)
    }))
    .sort((a, b) => a.change - b.change)
    .slice(0, 5);

  // Show message if competition hasn't started
  const hasNotStarted = competitionStatus === "not_started";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="card-enhanced">
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Market Overview
              </CardTitle>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {hasNotStarted ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Competition has not started yet</p>
                <p className="text-sm text-muted-foreground mt-2">Market data will be available once the competition begins</p>
              </div>
            ) : (
              <>
                {/* Top Gainers & Losers */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-profit" />
                      Top Gainers
                    </h3>
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
                          <div className="text-xs text-muted-foreground truncate">{asset.name}</div>
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
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-loss" />
                      Top Losers
                    </h3>
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
                          <div className="text-xs text-muted-foreground truncate">{asset.name}</div>
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
                  </div>
                </div>

                {/* Sector Performance */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Sector Performance
                  </h3>
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
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default CollapsibleMarketOverview;
