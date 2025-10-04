import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, Newspaper, Users, Play, Pause, Square, Clock, Zap, BarChart3, AlertTriangle, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  asset_type: 'stock' | 'commodity' | 'index';
  sector?: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  team_code: string | null;
}

interface TeamMonitoring {
  user_id: string;
  full_name: string;
  team_code: string | null;
  total_value: number;
  cash_balance: number;
  profit_loss: number;
  profit_loss_percentage: number;
  rank: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    current_value: number;
    profit_loss: number;
  }>;
}

const Admin = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [newPrice, setNewPrice] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCategory, setNewsCategory] = useState("");
  const [messageRecipient, setMessageRecipient] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [roundStatus, setRoundStatus] = useState<string>("not_started");
  const [teamMonitoring, setTeamMonitoring] = useState<TeamMonitoring[]>([]);
  const [priceChangePercentage, setPriceChangePercentage] = useState("");

  useEffect(() => {
    fetchData();

    const assetsChannel = supabase
      .channel('admin-assets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        fetchAssets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assetsChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAssets(), fetchUsers(), fetchRoundStatus(), fetchTeamMonitoring()]);
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from("assets")
      .select("*")
      .order("symbol");
    setAssets(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, team_code, email")
      .order("full_name");
    setUsers(data || []);
  };

  const fetchRoundStatus = async () => {
    const { data } = await supabase
      .from("competition_rounds")
      .select("status")
      .eq("round_number", 1)
      .single();
    
    if (data) {
      setRoundStatus(data.status);
    } else {
      // Initialize competition round if it doesn't exist
      await initializeCompetitionRound();
    }
  };

  const initializeCompetitionRound = async () => {
    try {
      const { error } = await supabase
        .from("competition_rounds")
        .insert({
          round_number: 1,
          status: "not_started",
          duration_minutes: 120 // 2 hours default
        });

      if (error) {
        console.error("Error initializing competition round:", error);
      } else {
        setRoundStatus("not_started");
        toast.success("Competition round initialized!");
        // Also initialize sample assets if they don't exist
        await initializeSampleAssets();
      }
    } catch (error) {
      console.error("Error initializing competition round:", error);
    }
  };

  const initializeSampleAssets = async () => {
    try {
      // Check if assets already exist
      const { data: existingAssets } = await supabase
        .from("assets")
        .select("id")
        .limit(1);

      if (existingAssets && existingAssets.length > 0) {
        return; // Assets already exist
      }

      // Insert sample assets
      const sampleAssets = [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd", asset_type: "stock" as const, sector: "Energy", current_price: 2500.00, previous_close: 2450.00 },
        { symbol: "TCS", name: "Tata Consultancy Services", asset_type: "stock" as const, sector: "IT", current_price: 3500.00, previous_close: 3400.00 },
        { symbol: "HDFC", name: "HDFC Bank Ltd", asset_type: "stock" as const, sector: "Banking", current_price: 1500.00, previous_close: 1480.00 },
        { symbol: "INFY", name: "Infosys Ltd", asset_type: "stock" as const, sector: "IT", current_price: 1800.00, previous_close: 1750.00 },
        { symbol: "BHARTI", name: "Bharti Airtel Ltd", asset_type: "stock" as const, sector: "Telecom", current_price: 800.00, previous_close: 820.00 },
        { symbol: "GOLD", name: "Gold", asset_type: "commodity" as const, sector: "Commodities", current_price: 55000.00, previous_close: 54500.00 },
        { symbol: "SILVER", name: "Silver", asset_type: "commodity" as const, sector: "Commodities", current_price: 75000.00, previous_close: 74000.00 },
        { symbol: "NIFTY", name: "Nifty 50", asset_type: "index" as const, sector: "Index", current_price: 19500.00, previous_close: 19200.00 }
      ];

      const { error } = await supabase
        .from("assets")
        .insert(sampleAssets);

      if (error) {
        console.error("Error initializing sample assets:", error);
      } else {
        toast.success("Sample assets initialized!");
        fetchAssets(); // Refresh the assets list
      }
    } catch (error) {
      console.error("Error initializing sample assets:", error);
    }
  };

  const fetchTeamMonitoring = async () => {
    try {
      // Get all portfolios with user info
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select(`
          *,
          profiles (
            full_name,
            team_code
          )
        `)
        .order("total_value", { ascending: false });

      if (!portfolios) return;

      // Get positions for each user
      const teamData: TeamMonitoring[] = [];
      
      for (let i = 0; i < portfolios.length; i++) {
        const portfolio = portfolios[i];
        const { data: positions } = await supabase
          .from("positions")
          .select(`
            quantity,
            current_value,
            profit_loss,
            assets (
              symbol
            )
          `)
          .eq("user_id", portfolio.user_id);

        teamData.push({
          user_id: portfolio.user_id,
          full_name: portfolio.profiles?.full_name || "Unknown",
          team_code: portfolio.profiles?.team_code || null,
          total_value: portfolio.total_value,
          cash_balance: portfolio.cash_balance,
          profit_loss: portfolio.profit_loss,
          profit_loss_percentage: portfolio.profit_loss_percentage,
          rank: i + 1,
          positions: positions?.map(p => ({
            symbol: p.assets?.symbol || "",
            quantity: p.quantity,
            current_value: p.current_value,
            profit_loss: p.profit_loss
          })) || []
        });
      }

      setTeamMonitoring(teamData);
    } catch (error) {
      console.error("Error fetching team monitoring data:", error);
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedAsset || !newPrice) {
      toast.error("Please select an asset and enter a price");
      return;
    }

    try {
      const price = parseFloat(newPrice);
      const { data: { session } } = await supabase.auth.getSession();

      // Update asset price
      const { error: assetError } = await supabase
        .from("assets")
        .update({ 
          current_price: price,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedAsset);

      if (assetError) throw assetError;

      // Log price history
      await supabase.from("price_history").insert({
        asset_id: selectedAsset,
        price: price,
        changed_by: session?.user.id,
      });

      toast.success("Price updated successfully!");
      setNewPrice("");
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || "Failed to update price");
    }
  };

  const handlePercentagePriceChange = async () => {
    if (!selectedAsset || !priceChangePercentage) {
      toast.error("Please select an asset and enter a percentage");
      return;
    }

    try {
      const percentage = parseFloat(priceChangePercentage);
      const asset = assets.find(a => a.id === selectedAsset);
      if (!asset) throw new Error("Asset not found");

      const newPrice = asset.current_price * (1 + percentage / 100);
      const { data: { session } } = await supabase.auth.getSession();

      // Update asset price
      const { error: assetError } = await supabase
        .from("assets")
        .update({ 
          current_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedAsset);

      if (assetError) throw assetError;

      // Log price history
      await supabase.from("price_history").insert({
        asset_id: selectedAsset,
        price: newPrice,
        changed_by: session?.user.id,
      });

      toast.success(`Price changed by ${percentage}% successfully!`);
      setPriceChangePercentage("");
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || "Failed to update price");
    }
  };

  const handleEventMacro = async (eventType: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      switch (eventType) {
        case 'telecom_shakeup':
          // Telecom sector shake-up: Reduce telecom stocks by 15%
          const telecomAssets = assets.filter(a => a.sector === 'Telecom');
          for (const asset of telecomAssets) {
            const newPrice = asset.current_price * 0.85;
            await supabase
              .from("assets")
              .update({ 
                current_price: newPrice,
                updated_at: new Date().toISOString()
              })
              .eq("id", asset.id);
          }
          
          // Publish news
          await supabase.from("news").insert({
            title: "Telecom Sector Shake-up",
            content: "Major regulatory changes impact telecom companies. Stock prices drop significantly across the sector.",
            category: "Market Alert",
            published_by: session?.user.id,
            is_public: true,
          });
          break;

        case 'it_whiplash':
          // IT sector whiplash: Increase IT stocks by 20%
          const itAssets = assets.filter(a => a.sector === 'IT');
          for (const asset of itAssets) {
            const newPrice = asset.current_price * 1.20;
            await supabase
              .from("assets")
              .update({ 
                current_price: newPrice,
                updated_at: new Date().toISOString()
              })
              .eq("id", asset.id);
          }
          
          // Publish news
          await supabase.from("news").insert({
            title: "IT Sector Surge",
            content: "Major tech breakthrough drives IT stocks higher. Companies report strong quarterly earnings.",
            category: "Market Alert",
            published_by: session?.user.id,
            is_public: true,
          });
          break;

        case 'black_swan':
          // Black swan event: Reduce all stocks by 25%
          for (const asset of assets) {
            const newPrice = asset.current_price * 0.75;
            await supabase
              .from("assets")
              .update({ 
                current_price: newPrice,
                updated_at: new Date().toISOString()
              })
              .eq("id", asset.id);
          }
          
          // Publish news
          await supabase.from("news").insert({
            title: "Black Swan Event",
            content: "Unexpected global event causes market-wide selloff. All sectors affected by sudden market correction.",
            category: "Market Crisis",
            published_by: session?.user.id,
            is_public: true,
          });
          break;

        default:
          throw new Error("Unknown event type");
      }

      toast.success(`${eventType.replace('_', ' ').toUpperCase()} event triggered successfully!`);
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger event");
    }
  };

  const handlePublishNews = async () => {
    if (!newsTitle || !newsContent) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.from("news").insert({
        title: newsTitle,
        content: newsContent,
        category: newsCategory || null,
        published_by: session?.user.id,
        is_public: true,
      });

      if (error) throw error;

      toast.success("News published successfully!");
      setNewsTitle("");
      setNewsContent("");
      setNewsCategory("");
    } catch (error: any) {
      toast.error(error.message || "Failed to publish news");
    }
  };

  const handleSendMessage = async () => {
    if (!messageRecipient || !messageTitle || !messageContent) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.from("messages").insert({
        recipient_id: messageRecipient,
        sender_id: session?.user.id,
        title: messageTitle,
        content: messageContent,
      });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setMessageTitle("");
      setMessageContent("");
      setMessageRecipient("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    }
  };

  const handleResetCompetition = async () => {
    try {
      // Reset the competition round to not_started
      const { error } = await supabase
        .from("competition_rounds")
        .update({ 
          status: "not_started",
          start_time: null,
          end_time: null,
          updated_at: new Date().toISOString()
        })
        .eq("round_number", 1);

      if (error) throw error;

      toast.success("Competition reset successfully! You can now start a new round.");
      fetchRoundStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to reset competition");
    }
  };

  const handleRoundControl = async (action: "start" | "pause" | "end") => {
    try {
      // First check if round exists, if not initialize it
      const { data: existingRound } = await supabase
        .from("competition_rounds")
        .select("id")
        .eq("round_number", 1)
        .single();

      if (!existingRound) {
        await initializeCompetitionRound();
      }

      let newStatus: "not_started" | "active" | "paused" | "completed";
      switch (action) {
        case "start":
          newStatus = "active";
          break;
        case "pause":
          newStatus = "paused";
          break;
        case "end":
          newStatus = "completed";
          break;
        default:
          newStatus = "not_started";
      }

      const { error } = await supabase
        .from("competition_rounds")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(action === "start" && { start_time: new Date().toISOString() }),
          ...(action === "end" && { end_time: new Date().toISOString() })
        })
        .eq("round_number", 1);

      if (error) throw error;

      toast.success(`Round ${action}ed successfully!`);
      fetchRoundStatus();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} round`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground">Manage the competition, prices, news, and communications</p>
        </div>

        {/* Round Controls */}
        <Card className="border-border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Competition Round Controls
              <Badge variant={roundStatus === "active" ? "default" : "secondary"} className="ml-auto">
                {roundStatus.toUpperCase().replace("_", " ")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleRoundControl("start")}
                disabled={roundStatus === "active" || roundStatus === "completed"}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Round
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleRoundControl("pause")}
                disabled={roundStatus !== "active"}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Round
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleRoundControl("end")}
                disabled={roundStatus === "completed"}
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                End Round
              </Button>
            </div>
            
            {roundStatus === "completed" && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-warning">Competition Completed</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  The competition has ended. Reset it to start a new round.
                </p>
                <Button 
                  onClick={handleResetCompetition}
                  className="bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reset Competition
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="prices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="prices">
              <DollarSign className="h-4 w-4 mr-2" />
              Prices
            </TabsTrigger>
            <TabsTrigger value="news">
              <Newspaper className="h-4 w-4 mr-2" />
              News
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Users className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="events">
              <Zap className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <BarChart3 className="h-4 w-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Settings className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prices">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Set Absolute Price
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
                            {asset.symbol} - {asset.name} (Current: ₹{asset.current_price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>New Price (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      step="0.01"
                      className="input-enhanced"
                    />
                  </div>

                  <Button onClick={handleUpdatePrice} className="w-full btn-buy">
                    Update Price
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Percentage Change
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
                            {asset.symbol} - {asset.name} (Current: ₹{asset.current_price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Percentage Change (%)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., -5.5 or +8"
                      value={priceChangePercentage}
                      onChange={(e) => setPriceChangePercentage(e.target.value)}
                      step="0.1"
                      className="input-enhanced"
                    />
                  </div>

                  <Button onClick={handlePercentagePriceChange} className="w-full btn-sell">
                    Apply Change
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="news">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5 text-primary" />
                  Publish Market News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Breaking: Market Update"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="input-enhanced"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category (Optional)</Label>
                  <Input
                    placeholder="e.g., Market Alert, Company News"
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="input-enhanced"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    placeholder="Enter news content..."
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button onClick={handlePublishNews} className="w-full btn-buy">
                  Publish News
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Send Private Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Select value={messageRecipient} onValueChange={setMessageRecipient}>
                    <SelectTrigger className="input-enhanced">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.team_code || "No team"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Insider Tip"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="input-enhanced"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button onClick={handleSendMessage} className="w-full btn-sell">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Event Macro Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button 
                    onClick={() => handleEventMacro('telecom_shakeup')}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span className="font-semibold">Telecom Shake-up</span>
                    <span className="text-xs opacity-90">-15% Telecom</span>
                  </Button>

                  <Button 
                    onClick={() => handleEventMacro('it_whiplash')}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span className="font-semibold">IT Whiplash</span>
                    <span className="text-xs opacity-90">+20% IT</span>
                  </Button>

                  <Button 
                    onClick={() => handleEventMacro('black_swan')}
                    className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  >
                    <AlertTriangle className="h-6 w-6" />
                    <span className="font-semibold">Black Swan</span>
                    <span className="text-xs opacity-90">-25% All</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Team Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMonitoring.map((team, index) => (
                    <div key={team.user_id} className="border border-border rounded-lg p-4 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="flex items-center justify-between mb-3">
                      <div>
                          <h3 className="font-bold text-lg">{team.full_name}</h3>
                          {team.team_code && (
                            <p className="text-sm text-muted-foreground">Team: {team.team_code}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="default" className="badge-executed">Rank #{team.rank}</Badge>
                          <p className="text-2xl font-bold mt-1">
                            ₹{team.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`text-sm ${team.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {team.profit_loss >= 0 ? '+' : ''}{team.profit_loss_percentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Cash Balance</p>
                          <p className="font-semibold">₹{team.cash_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">P&L</p>
                          <p className={`font-semibold ${team.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                            ₹{team.profit_loss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {team.positions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Current Positions</p>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {team.positions.map((position, posIndex) => (
                              <div key={posIndex} className="bg-muted/50 rounded p-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{position.symbol}</span>
                                  <span className="text-sm text-muted-foreground">{position.quantity}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-muted-foreground">Value</span>
                                  <span className="text-xs font-medium">₹{position.current_value.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground">P&L</span>
                                  <span className={`text-xs font-medium ${position.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                                    ₹{position.profit_loss.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.team_code && (
                          <p className="text-xs text-muted-foreground">Team: {user.team_code}</p>
                        )}
                      </div>
                      <Badge variant="default" className="badge-executed">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
