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
import { Settings, DollarSign, Newspaper, Users, Play, Pause, Square, Clock } from "lucide-react";
import { toast } from "sonner";

interface Asset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  team_name: string | null;
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
    await Promise.all([fetchAssets(), fetchUsers(), fetchRoundStatus()]);
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
      .select("*")
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

  const handleRoundControl = async (action: "start" | "pause" | "end") => {
    try {
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
          </CardContent>
        </Card>

        <Tabs defaultValue="prices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="activity">
              <Settings className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prices">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Update Asset Prices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
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
                  />
                </div>

                <Button onClick={handleUpdatePrice} className="w-full">
                  Update Price
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Publish Market News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Breaking: Market Update"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category (Optional)</Label>
                  <Input
                    placeholder="e.g., Market Alert, Company News"
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
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

                <Button onClick={handlePublishNews} className="w-full">
                  Publish News
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Send Private Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <Select value={messageRecipient} onValueChange={setMessageRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.team_name || "No team"})
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

                <Button onClick={handleSendMessage} className="w-full">
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.team_name && (
                          <p className="text-xs text-muted-foreground">Team: {user.team_name}</p>
                        )}
                      </div>
                      <Badge variant="secondary">Active</Badge>
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
