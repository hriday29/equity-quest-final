import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, Filter, Download } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_type: 'market' | 'limit' | 'stop_loss';
  quantity: number;
  price: number | null;
  stop_price: number | null;
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  executed_price: number | null;
  executed_at: string | null;
  is_buy: boolean;
  created_at: string;
  assets: {
    symbol: string;
    name: string;
    current_price: number;
  };
}

const TransactionHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          assets (
            symbol,
            name,
            current_price
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to fetch transaction history");
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch transaction history");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.assets.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.assets.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.order_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return <Badge className="badge-executed">Executed</Badge>;
      case 'pending':
        return <Badge className="badge-pending">Pending</Badge>;
      case 'cancelled':
        return <Badge className="badge-cancelled">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrderTypeBadge = (orderType: string) => {
    switch (orderType) {
      case 'market':
        return <Badge variant="outline">Market</Badge>;
      case 'limit':
        return <Badge variant="outline">Limit</Badge>;
      case 'stop_loss':
        return <Badge variant="outline">Stop Loss</Badge>;
      default:
        return <Badge variant="outline">{orderType}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Symbol', 'Type', 'Side', 'Quantity', 'Price', 'Executed Price', 'Status', 'P&L'],
      ...filteredOrders.map(order => [
        formatDate(order.created_at),
        order.assets.symbol,
        order.order_type,
        order.is_buy ? 'Buy' : 'Sell',
        order.quantity.toString(),
        order.price ? formatCurrency(order.price) : 'Market',
        order.executed_price ? formatCurrency(order.executed_price) : '-',
        order.status,
        order.executed_price ? 
          (order.is_buy ? 
            (order.assets.current_price - order.executed_price) * order.quantity :
            (order.executed_price - order.assets.current_price) * order.quantity
          ).toFixed(2) : '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-8 w-64"></div>
          <div className="skeleton h-96 w-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
              <History className="h-8 w-8 text-primary" />
              Transaction History
            </h1>
            <p className="text-muted-foreground">View all your trading activity and order history</p>
          </div>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by symbol or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-enhanced"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="executed">Executed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Order Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="input-enhanced">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop_loss">Stop Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle>
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                      <th className="text-left py-3 px-2 text-sm font-medium">Symbol</th>
                      <th className="text-left py-3 px-2 text-sm font-medium">Type</th>
                      <th className="text-left py-3 px-2 text-sm font-medium">Side</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Quantity</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Price</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Executed</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Status</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => {
                      const currentPnl = order.executed_price ? 
                        (order.is_buy ? 
                          (order.assets.current_price - order.executed_price) * order.quantity :
                          (order.executed_price - order.assets.current_price) * order.quantity
                        ) : 0;

                      return (
                        <tr 
                          key={order.id} 
                          className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <td className="py-3 px-2 text-sm">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{order.assets.symbol}</p>
                              <p className="text-xs text-muted-foreground">{order.assets.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            {getOrderTypeBadge(order.order_type)}
                          </td>
                          <td className="py-3 px-2">
                            <Badge className={order.is_buy ? "btn-buy" : "btn-sell"}>
                              {order.is_buy ? "Buy" : "Sell"}
                            </Badge>
                          </td>
                          <td className="text-right py-3 px-2">{order.quantity}</td>
                          <td className="text-right py-3 px-2">
                            {order.price ? formatCurrency(order.price) : "Market"}
                          </td>
                          <td className="text-right py-3 px-2">
                            {order.executed_price ? formatCurrency(order.executed_price) : "-"}
                          </td>
                          <td className="text-center py-3 px-2">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className={`text-right py-3 px-2 font-medium ${
                            currentPnl >= 0 ? 'text-profit' : 'text-loss'
                          }`}>
                            {order.executed_price ? formatCurrency(currentPnl) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;
