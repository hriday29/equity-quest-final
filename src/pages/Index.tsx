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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/10 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      
      {/* Hero Section */}
      <div className="container relative mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto text-center space-y-12 animate-fade-in">
          {/* Logo with Enhanced Glow */}
          <div className="flex justify-center mb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full group-hover:bg-primary/40 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-2xl animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-primary/10 via-background/50 to-primary/5 p-12 rounded-full border-2 border-primary/30 shadow-2xl shadow-primary/20 group-hover:border-primary/50 transition-all duration-300">
                <TrendingUp className="h-32 w-32 text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
              </div>
            </div>
          </div>
          
          {/* Title Section with Enhanced Typography */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-7xl md:text-8xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent drop-shadow-2xl">
                  Equity Quest
                </span>
              </h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              The Apex Investors' <span className="text-primary">Gauntlet</span>
            </p>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              India's premier institutional-grade mock trading competition. 
              Experience real market dynamics with sophisticated analytics and real-time execution.
            </p>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="group card-enhanced p-8 space-y-3 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-5xl font-black text-primary">₹5L</div>
                <div className="text-sm font-medium text-muted-foreground mt-2">Initial Capital</div>
                <div className="text-xs text-muted-foreground/60">Per Participant</div>
              </div>
            </div>
            <div className="group card-enhanced p-8 space-y-3 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-5xl font-black text-primary">50+</div>
                <div className="text-sm font-medium text-muted-foreground mt-2">NIFTY 50 Assets</div>
                <div className="text-xs text-muted-foreground/60">Blue-Chip Stocks</div>
              </div>
            </div>
            <div className="group card-enhanced p-8 space-y-3 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-5xl font-black text-primary">Live</div>
                <div className="text-sm font-medium text-muted-foreground mt-2">Market Data</div>
                <div className="text-xs text-muted-foreground/60">Real-Time Updates</div>
              </div>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")} 
              className="group relative text-lg px-12 py-7 font-semibold overflow-hidden hover-scale"
            >
              <span className="relative z-10">Enter Competition</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary group-hover:scale-110 transition-transform"></div>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")} 
              className="text-lg px-12 py-7 font-semibold border-2 hover:bg-primary/5 hover-scale"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section with Enhanced Design */}
        <div className="relative max-w-7xl mx-auto mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Enterprise-Grade Features
              </span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Professional trading tools for serious competitors
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group card-enhanced p-8 space-y-4 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Advanced Orders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Execute sophisticated trading strategies with market, limit, and stop-loss orders
                </p>
              </div>
            </div>

            <div className="group card-enhanced p-8 space-y-4 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Risk Analytics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monitor position limits, margin requirements, and sector exposure in real-time
                </p>
              </div>
            </div>

            <div className="group card-enhanced p-8 space-y-4 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Live Rankings</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Track your performance against competitors with dynamic leaderboards
                </p>
              </div>
            </div>

            <div className="group card-enhanced p-8 space-y-4 hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">Market Intelligence</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stay informed with real-time news, events, and market-moving announcements
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
