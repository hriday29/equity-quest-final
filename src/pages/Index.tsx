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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Equity Quest</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/auth")} 
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate("/auth")} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              >
                Enter Competition
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-600/30 blur-3xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-12 rounded-full border border-blue-500/20">
                  <TrendingUp className="h-32 w-32 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                Equity Quest
              </h1>
              <p className="text-3xl md:text-4xl font-semibold text-white">
                The Apex Investors' Gauntlet
              </p>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                India's Most Comprehensive Mock Stock Trading Competition
              </p>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Test your investment acumen in a realistic market environment with institutional-grade tools and real-time market dynamics.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mt-16">
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-3 hover:border-blue-500/50 transition-all duration-300">
                <div className="text-4xl font-bold text-blue-400">₹5,00,000</div>
                <div className="text-sm text-slate-300 font-medium">Starting Capital</div>
                <div className="text-xs text-slate-400">Per participant</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-3 hover:border-purple-500/50 transition-all duration-300">
                <div className="text-4xl font-bold text-purple-400">50+</div>
                <div className="text-sm text-slate-300 font-medium">NIFTY 50 Stocks</div>
                <div className="text-xs text-slate-400">Plus commodities</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-3 hover:border-green-500/50 transition-all duration-300">
                <div className="text-4xl font-bold text-green-400">Real-Time</div>
                <div className="text-sm text-slate-300 font-medium">Market Updates</div>
                <div className="text-xs text-slate-400">Live price feeds</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 space-y-3 hover:border-orange-500/50 transition-all duration-300">
                <div className="text-4xl font-bold text-orange-400">3 Rounds</div>
                <div className="text-sm text-slate-300 font-medium">Escalating Intensity</div>
                <div className="text-xs text-slate-400">20-30 min each</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")} 
                className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Enter Competition
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")} 
                className="text-xl px-12 py-6 border-2 border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-400 rounded-xl transition-all duration-300"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-32 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Institutional-Grade Features</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Built with the same tools and constraints used by professional traders
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 space-y-4 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-blue-600/30 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="font-semibold text-xl text-white">Advanced Trading</h3>
                <p className="text-slate-400 leading-relaxed">Market, Limit, and Stop-Loss orders with real-time execution and position management</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 space-y-4 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-xl text-white">Risk Management</h3>
                <p className="text-slate-400 leading-relaxed">Position limits, sector exposure controls, and margin call systems for realistic trading</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 space-y-4 hover:border-green-500/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-green-600/30 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="font-semibold text-xl text-white">Live Leaderboard</h3>
                <p className="text-slate-400 leading-relaxed">Compete with teams and track performance with real-time rankings and analytics</p>
              </div>

              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 rounded-xl p-8 space-y-4 hover:border-orange-500/30 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-all duration-300">
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                </div>
                <h3 className="font-semibold text-xl text-white">Market Intelligence</h3>
                <p className="text-slate-400 leading-relaxed">Real-time news feed, market events, and insider information affecting asset prices</p>
              </div>
            </div>
          </div>

          {/* Competition Structure */}
          <div className="mt-32 space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Three Rounds of Escalating Intensity</h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Each round tests different aspects of your trading skills with increasing complexity and market volatility
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30 rounded-xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-400">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Fundamentals Floor</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-blue-300 font-medium">20 Minutes • No Shorting</p>
                  <p className="text-slate-300 leading-relaxed">
                    Focus on fundamental analysis with clear sector news and company-specific events. 
                    Build your foundation with solid trading principles.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 rounded-xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-400">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Fog of War</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-purple-300 font-medium">30 Minutes • Shorting Enabled</p>
                  <p className="text-slate-300 leading-relaxed">
                    Navigate conflicting information and sector rotations. Short selling is now enabled 
                    with margin requirements and complex market dynamics.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/30 rounded-xl p-8 space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-red-400">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">The Macro Meltdown</h3>
                </div>
                <div className="space-y-3">
                  <p className="text-red-300 font-medium">30 Minutes • Extreme Volatility</p>
                  <p className="text-slate-300 leading-relaxed">
                    Survive major macroeconomic shocks including the Black Swan event. 
                    Test your risk management in extreme market conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-32 text-center space-y-8">
            <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20 border border-blue-700/30 rounded-2xl p-12 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Prove Your Skills?</h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join India's most comprehensive mock trading competition and compete against the best investors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")} 
                  className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Start Trading Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm mt-32">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Equity Quest</span>
            </div>
            <p className="text-slate-400">© 2025 Equity Quest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
