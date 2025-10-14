import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import StockDetailView from "./StockDetailView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  asset_type: 'stock' | 'commodity' | 'index';
  sector: string | null;
  week_52_high?: number;
  week_52_low?: number;
  market_cap?: number;
  pe_ratio?: number;
}

interface MarketSearchProps {
  assets: Asset[];
}

const MarketSearch = ({ assets }: MarketSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter(asset => {
    const query = searchQuery.toLowerCase();
    return (
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
  });

  const getPriceChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <>
      <Card className="card-enhanced glow-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Market Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="Search by symbol (e.g., RELIANCE) or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-enhanced"
          />
          
          {searchQuery && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No assets found matching "{searchQuery}"
                </p>
              ) : (
                filteredAssets.map((asset) => {
                  const change = getPriceChange(asset.current_price, asset.previous_close);
                  const isPositive = change >= 0;
                  
                  return (
                    <div
                      key={asset.id}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer animate-fade-in"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{asset.symbol}</div>
                          <div className="text-xs text-muted-foreground">{asset.name}</div>
                          {asset.sector && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {asset.sector}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{asset.current_price.toFixed(2)}</div>
                          <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-profit' : 'text-loss'}`}>
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            <span className="text-sm">
                              {isPositive ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Details</DialogTitle>
          </DialogHeader>
          {selectedAsset && <StockDetailView asset={selectedAsset} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketSearch;
