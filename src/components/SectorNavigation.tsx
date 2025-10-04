import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Building2, Zap, DollarSign, Activity } from "lucide-react";
import { sectors } from "@/data/nifty50Assets";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
  sector: string;
  asset_type: 'stock' | 'commodity' | 'index';
}

interface SectorData {
  sector: string;
  assets: Asset[];
  totalValue: number;
  avgChange: number;
  topGainer?: Asset;
  topLoser?: Asset;
}

interface SectorNavigationProps {
  onAssetSelect: (asset: Asset) => void;
  selectedAsset?: Asset;
}

const SectorNavigation = ({ onAssetSelect, selectedAsset }: SectorNavigationProps) => {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => {
    fetchSectorData();
  }, []);

  const fetchSectorData = async () => {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('is_active', true)
        .order('symbol');

      if (error) throw error;

      // Group assets by sector
      const sectorMap = new Map<string, Asset[]>();
      assets?.forEach(asset => {
        if (asset.sector) {
          if (!sectorMap.has(asset.sector)) {
            sectorMap.set(asset.sector, []);
          }
          sectorMap.get(asset.sector)!.push(asset);
        }
      });

      // Calculate sector statistics
      const sectorStats: SectorData[] = Array.from(sectorMap.entries()).map(([sector, assets]) => {
        const totalValue = assets.reduce((sum, asset) => sum + asset.current_price, 0);
        const avgChange = assets.reduce((sum, asset) => {
          const change = ((asset.current_price - asset.previous_close) / asset.previous_close) * 100;
          return sum + change;
        }, 0) / assets.length;

        const sortedByChange = [...assets].sort((a, b) => {
          const changeA = ((a.current_price - a.previous_close) / a.previous_close) * 100;
          const changeB = ((b.current_price - b.previous_close) / b.previous_close) * 100;
          return changeB - changeA;
        });

        return {
          sector,
          assets,
          totalValue,
          avgChange,
          topGainer: sortedByChange[0],
          topLoser: sortedByChange[sortedByChange.length - 1]
        };
      });

      // Sort sectors by total value
      sectorStats.sort((a, b) => b.totalValue - a.totalValue);
      setSectorData(sectorStats);
    } catch (error) {
      console.error('Error fetching sector data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case 'Banking':
      case 'Financial Services':
        return <DollarSign className="h-4 w-4" />;
      case 'IT':
        return <Zap className="h-4 w-4" />;
      case 'Oil & Gas':
      case 'Power':
        return <Activity className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getSectorColor = (sector: string) => {
    switch (sector) {
      case 'Banking':
      case 'Financial Services':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'IT':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'Oil & Gas':
      case 'Power':
        return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'FMCG':
        return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'Pharmaceuticals':
        return 'bg-pink-500/10 text-pink-600 border-pink-200';
      case 'Automobile':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'Commodities':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="card-enhanced">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sector Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Sector Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sectorData.map((sector) => (
            <div key={sector.sector} className="space-y-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 p-2 h-auto ${getSectorColor(sector.sector)} hover:opacity-80 transition-opacity`}
                  onClick={() => setSelectedSector(selectedSector === sector.sector ? null : sector.sector)}
                >
                  {getSectorIcon(sector.sector)}
                  <span className="font-medium">{sector.sector}</span>
                  <Badge variant="secondary" className="ml-2">
                    {sector.assets.length}
                  </Badge>
                </Button>
                <div className="flex items-center gap-2">
                  {sector.avgChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${sector.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                  </span>
                </div>
              </div>

              {selectedSector === sector.sector && (
                <div className="ml-4 space-y-2 border-l-2 border-border pl-4">
                  {sector.assets.map((asset) => {
                    const change = ((asset.current_price - asset.previous_close) / asset.previous_close) * 100;
                    const isSelected = selectedAsset?.id === asset.id;
                    
                    return (
                      <Button
                        key={asset.id}
                        variant="ghost"
                        className={`w-full justify-between p-2 h-auto hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                        onClick={() => onAssetSelect(asset)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{asset.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            {asset.asset_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            ₹{asset.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorNavigation;
