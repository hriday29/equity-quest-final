import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/10 p-8 rounded-full border border-primary/20">
                <TrendingUp className="h-24 w-24 text-primary pulse-live" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Equity Quest
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-foreground/90">
              The Apex Investors' Gauntlet
            </p>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              India's Most Comprehensive Mock Stock Trading Competition
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="card-enhanced p-6 space-y-2">
              <div className="text-3xl font-bold text-primary">₹5,00,000</div>
              <div className="text-sm text-muted-foreground">Starting Capital</div>
            </div>
            <div className="card-enhanced p-6 space-y-2">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">NIFTY 50 Stocks</div>
            </div>
            <div className="card-enhanced p-6 space-y-2">
              <div className="text-3xl font-bold text-primary">Real-Time</div>
              <div className="text-sm text-muted-foreground">Market Updates</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="text-lg px-10 py-6 btn-primary glow-primary hover-scale"
            >
              Enter Competition
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")} 
              className="text-lg px-10 py-6 hover-scale"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-24 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-enhanced p-6 space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Advanced Trading</h3>
            <p className="text-sm text-muted-foreground">Market, Limit, and Stop-Loss orders with real-time execution</p>
          </div>

          <div className="card-enhanced p-6 space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Risk Management</h3>
            <p className="text-sm text-muted-foreground">Position limits and sector exposure controls for realistic trading</p>
          </div>

          <div className="card-enhanced p-6 space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Live Leaderboard</h3>
            <p className="text-sm text-muted-foreground">Compete with teams and track performance in real-time</p>
          </div>

          <div className="card-enhanced p-6 space-y-3 hover-scale">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Market Intelligence</h3>
            <p className="text-sm text-muted-foreground">Real-time news feed and market events affecting asset prices</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
