import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, PieChart, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { orderExecutionEngine } from "@/services/orderExecution";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  previous_close: number;
}

interface Portfolio {
  cash_balance: number;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
}

interface Position {
  id: string;
  quantity: number;
  average_price: number;
  current_value: number;
  profit_loss: number;
  assets: Asset;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceChanges, setPriceChanges] = useState<Record<string, 'up' | 'down' | null>>({});
  const [competitionStatus, setCompetitionStatus] = useState<string>("not_started");

  useEffect(() => {
    fetchData();

    const assetsChannel = supabase
      .channel('assets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        fetchAssets();
      })
      .subscribe();

    const newsChannel = supabase
      .channel('news-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, () => {
        fetchNews();
      })
      .subscribe();

    const portfolioChannel = supabase
      .channel('portfolio-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchPortfolio();
      })
      .subscribe();

    const competitionChannel = supabase
      .channel('competition-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_rounds' }, () => {
        fetchCompetitionStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
      supabase.removeChannel(newsChannel);
      supabase.removeChannel(portfolioChannel);
      supabase.removeChannel(competitionChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchPortfolio(), fetchPositions(), fetchAssets(), fetchNews(), fetchCompetitionStatus()]);
  };

  const fetchCompetitionStatus = async () => {
    try {
      const { data } = await supabase
        .from("competition_rounds")
        .select("status")
        .eq("round_number", 1)
        .single();
      
      if (data) {
        setCompetitionStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching competition status:", error);
    }
  };

  const fetchPortfolio = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching portfolio:", error);
      return;
    }

    setPortfolio(data);
  };

  const fetchPositions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("positions")
      .select("*, assets(*)")
      .eq("user_id", session.user.id)
      .gt("quantity", 0);

    if (error) {
      console.error("Error fetching positions:", error);
      return;
    }

    setPositions(data || []);
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("is_active", true)
      .order("symbol");

    if (error) {
      console.error("Error fetching assets:", error);
      return;
    }

    // Track price changes for animations
    if (data) {
      setAssets(prevAssets => {
        const newPriceChanges: Record<string, 'up' | 'down' | null> = {};
        data.forEach(asset => {
          const prevAsset = prevAssets.find(a => a.id === asset.id);
          if (prevAsset && prevAsset.current_price !== asset.current_price) {
            newPriceChanges[asset.id] = asset.current_price > prevAsset.current_price ? 'up' : 'down';
            // Clear animation after 1 second
            setTimeout(() => {
              setPriceChanges(prev => ({ ...prev, [asset.id]: null }));
            }, 1000);
          }
        });
        setPriceChanges(prev => ({ ...prev, ...newPriceChanges }));
        return data;
      });
    }
  };

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching news:", error);
      return;
    }

    setNews(data || []);
  };

  const handlePlaceOrder = async (isBuy: boolean) => {
    if (!selectedAsset || !quantity) {
      toast.error("Please select an asset and enter quantity");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const asset = assets.find(a => a.id === selectedAsset);
      if (!asset) throw new Error("Asset not found");

      const qty = parseFloat(quantity);
      const price = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : null;
      const stopPrice = orderType === "stop_loss" && limitPrice ? parseFloat(limitPrice) : null;

      // Execute order using the order execution engine
      const result = await orderExecutionEngine.executeOrder(
        session.user.id,
        selectedAsset,
        orderType as "market" | "limit" | "stop_loss",
        qty,
        price,
        stopPrice,
        isBuy
      );

      if (result.success) {
        // Create order record for history
        await supabase.from("orders").insert([{
          user_id: session.user.id,
          asset_id: selectedAsset,
          order_type: orderType as "market" | "limit" | "stop_loss",
          quantity: qty,
          price: price,
          stop_price: stopPrice,
          is_buy: isBuy,
          status: "executed" as "executed",
          executed_price: result.executedPrice,
          executed_at: result.executedAt,
        }]);

        toast.success(`${isBuy ? "Buy" : "Sell"} order executed successfully!`);
        setQuantity("");
        setLimitPrice("");
        fetchData();
      } else {
        console.error('Order execution failed:', result.message);
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const getPriceChange = (current: number, previous: number | null) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Competition Status Banner */}
        {competitionStatus !== "active" && (
          <Card className={`card-enhanced ${competitionStatus === "not_started" ? "glow-danger" : "glow-primary"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <h3 className="font-semibold">
                    Competition {competitionStatus === "not_started" ? "Not Started" : 
                                competitionStatus === "paused" ? "Paused" : 
                                competitionStatus === "completed" ? "Completed" : "Inactive"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {competitionStatus === "not_started" ? "The competition has not been started yet. Please wait for the admin to begin." :
                     competitionStatus === "paused" ? "The competition is currently paused. Trading is disabled." :
                     competitionStatus === "completed" ? "The competition has ended. Thank you for participating!" :
                     "Trading is currently disabled."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <PieChart className="h-4 w-4 text-primary pulse-live" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-fade-in">₹{portfolio?.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cash Balance</CardTitle>
              <Wallet className="h-4 w-4 text-primary pulse-live" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-fade-in">₹{portfolio?.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>

          <Card className={`card-enhanced ${portfolio && portfolio.profit_loss >= 0 ? 'glow-success' : 'glow-danger'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit/Loss</CardTitle>
              {portfolio && portfolio.profit_loss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-profit pulse-live" />
              ) : (
                <TrendingDown className="h-4 w-4 text-loss pulse-live" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold animate-fade-in ${portfolio && portfolio.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                ₹{portfolio?.profit_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card className={`card-enhanced ${portfolio && portfolio.profit_loss_percentage >= 0 ? 'glow-success' : 'glow-danger'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Return %</CardTitle>
              {portfolio && portfolio.profit_loss_percentage >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-profit pulse-live" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-loss pulse-live" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold animate-fade-in ${portfolio && portfolio.profit_loss_percentage >= 0 ? 'text-profit' : 'text-loss'}`}>
                {portfolio?.profit_loss_percentage.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Trading Panel */}
          <Card className="lg:col-span-2 card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Place Order
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Asset</Label>
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue placeholder="Choose an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.symbol} - ₹{asset.current_price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="input-enhanced">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="limit">Limit</SelectItem>
                      <SelectItem value="stop_loss">Stop Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0"
                    step="0.01"
                    className="input-enhanced"
                  />
                </div>
              </div>

              {orderType === "limit" && (
                <div className="space-y-2">
                  <Label>Limit Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className="input-enhanced"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  className="flex-1 btn-buy" 
                  onClick={() => handlePlaceOrder(true)}
                  disabled={loading || competitionStatus !== "active"}
                >
                  {loading ? "Processing..." : "Buy"}
                </Button>
                <Button 
                  className="flex-1 btn-sell" 
                  onClick={() => handlePlaceOrder(false)}
                  disabled={loading || competitionStatus !== "active"}
                >
                  {loading ? "Processing..." : "Sell"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* News Feed */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Market News
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {news.length === 0 ? (
                <p className="text-sm text-muted-foreground">No news updates yet</p>
              ) : (
                news.map((item, index) => (
                  <div key={item.id} className={`border-b border-border pb-3 last:border-0 animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-primary mt-1 pulse-live" />
                      <div>
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                        {item.category && (
                          <Badge variant="secondary" className="mt-2 text-xs">{item.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Positions */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Your Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No positions yet. Start trading!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium">Symbol</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Quantity</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Avg Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Current</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{position.assets.symbol}</p>
                            <p className="text-xs text-muted-foreground">{position.assets.name}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{position.quantity}</td>
                        <td className="text-right py-3 px-2">₹{position.average_price.toFixed(2)}</td>
                        <td className="text-right py-3 px-2">₹{position.assets.current_price.toFixed(2)}</td>
                        <td className={`text-right py-3 px-2 font-medium ${position.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                          ₹{position.profit_loss.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Overview */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset, index) => {
                const change = getPriceChange(asset.current_price, asset.previous_close);
                const priceChange = priceChanges[asset.id];
                return (
                  <div 
                    key={asset.id} 
                    className={`border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in ${
                      priceChange === 'up' ? 'price-up' : priceChange === 'down' ? 'price-down' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{asset.symbol}</h4>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                      <Badge 
                        variant={change >= 0 ? "default" : "destructive"} 
                        className={`${change >= 0 ? "badge-executed" : "bg-gradient-to-r from-loss to-loss/80 text-white"} transition-all duration-300`}
                      >
                        {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">{asset.current_price.toFixed(2)}</p>
                      {asset.previous_close && (
                        <p className="text-xs text-muted-foreground">Prev: ₹{asset.previous_close.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
