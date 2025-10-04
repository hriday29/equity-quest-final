import { useState } from "react";
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
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleBackToSectors = () => {
    setSelectedAsset(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Market Analysis
            </h1>
            <p className="text-muted-foreground">
              Explore sectors and analyze individual stocks with detailed charts and metrics
            </p>
          </div>
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
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">+2.4%</div>
                      <div className="text-sm text-muted-foreground">Market Gain</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">₹2.1T</div>
                      <div className="text-sm text-muted-foreground">Total Volume</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">1,247</div>
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
                    {[
                      { symbol: "TCS", name: "Tata Consultancy Services", change: "+8.5%", price: "₹3,850" },
                      { symbol: "INFY", name: "Infosys Ltd", change: "+6.2%", price: "₹1,920" },
                      { symbol: "HDFC", name: "HDFC Bank Ltd", change: "+4.8%", price: "₹1,580" },
                      { symbol: "RELIANCE", name: "Reliance Industries", change: "+3.9%", price: "₹2,650" },
                      { symbol: "BHARTI", name: "Bharti Airtel", change: "+3.2%", price: "₹850" }
                    ].map((stock, index) => (
                      <div key={stock.symbol} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
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
                          <div className="font-medium">{stock.price}</div>
                          <div className="text-sm text-green-600">{stock.change}</div>
                        </div>
                      </div>
                    ))}
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
                    {[
                      { symbol: "ADANIPORTS", name: "Adani Ports", change: "-5.2%", price: "₹1,120" },
                      { symbol: "TATASTEEL", name: "Tata Steel", change: "-4.8%", price: "₹145" },
                      { symbol: "COALINDIA", name: "Coal India", change: "-3.9%", price: "₹280" },
                      { symbol: "ONGC", name: "ONGC", change: "-3.2%", price: "₹185" },
                      { symbol: "IOC", name: "Indian Oil Corp", change: "-2.8%", price: "₹95" }
                    ].map((stock, index) => (
                      <div key={stock.symbol} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
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
                          <div className="font-medium">{stock.price}</div>
                          <div className="text-sm text-red-600">{stock.change}</div>
                        </div>
                      </div>
                    ))}
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
