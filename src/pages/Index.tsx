import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Trophy, Layers, LineChart, TrendingUp, Newspaper } from "lucide-react";

// --- Animated Stock Ticker (Task 1 Update) ---
const StockTicker = () => {
  // Added more stocks to make the ticker feel more populated
  const stocks = [
    { symbol: "NIFTY", price: "23,845.75", change: "+0.87%" },
    { symbol: "RELIANCE", price: "2,745.60", change: "-0.42%" },
    { symbol: "TCS", price: "3,815.20", change: "+1.12%" },
    { symbol: "HDFC BANK", price: "1,715.30", change: "+0.23%" },
    { symbol: "INFY", price: "1,625.80", change: "-0.15%" },
    { symbol: "ICICI BANK", price: "1,150.90", change: "+1.55%" },
    { symbol: "SBIN", price: "725.40", change: "+0.78%" },
    { symbol: "HINDUNILVR", price: "2,550.00", change: "-0.05%" },
    { symbol: "BHARTIARTL", price: "1,050.25", change: "+2.10%" },
    { symbol: "ITC", price: "435.80", change: "-0.30%" },
  ];

  return (
    // Changed `absolute` to `fixed` to make the ticker stick to the bottom during scroll
    <div className="fixed bottom-0 left-0 right-0 overflow-hidden border-t border-white/10 bg-black/40 backdrop-blur-sm z-20">
      <motion.div
        animate={{ x: ["0%", "-100%"] }}
        // Increased duration for a smoother scroll with more items
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="flex gap-12 py-3 px-6 whitespace-nowrap text-sm text-neutral-300"
      >
        {[...stocks, ...stocks].map((s, i) => (
          <div key={i} className="flex gap-3 items-center">
            <span className="font-semibold text-white/90">{s.symbol}</span>
            <span>{s.price}</span>
            <span className={`${s.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
              {s.change}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// --- Background SVG chart ---
const HeroBackgroundChart = () => (
  <div className="absolute inset-0 z-0 opacity-15">
    <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M-28.5 492.833C100.167 404.167 334.3 260.5 504 363C673.7 465.5 726.5 639.5 901.5 650C1076.5 660.5 1205 492.833 1302 429.5C1399 366.167 1494 341.333 1539 332.5"
        stroke="url(#paint0_linear_10_2)"
        strokeWidth="8"
      />
      <defs>
        <linearGradient id="paint0_linear_10_2" x1="504" y1="233" x2="1076.5" y2="799.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const FeatureCard = ({ icon, title, text, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    viewport={{ once: true }}
    className="relative p-8 overflow-hidden bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
  >
    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
    <div className="relative z-10">
      <div className="flex items-center justify-center w-12 h-12 mb-6 bg-gradient-to-br from-primary/30 to-primary/20 rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-neutral-50 mb-2">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{text}</p>
    </div>
  </motion.div>
);

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  return (
    <div className="bg-black text-neutral-200 antialiased relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold">
            <img
              src="/equity-quest-logo.png"
              alt="Equity Quest Logo"
              className="h-8 w-auto"
            />
            <span>Equity Quest</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button onClick={() => navigate("/auth")} className="group bg-primary hover:bg-primary/90 text-primary-foreground">
              Enter the Arena <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </header>

  <main>
        {/* --- Hero Section --- */}
        <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-16">
          <HeroBackgroundChart />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black"></div>

          <div className="relative z-10 container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.1] pb-10 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                Equity Quest
              </h1>
              <p className="mt-2 text-xl text-primary/80 font-semibold tracking-wide">
                The Apex Investors’ Gauntlet
              </p>
              <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-neutral-300 leading-relaxed">
                Enter a high-stakes arena where strategy meets volatility. Outthink, outtrade, and outperform, the market is your battleground.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={() => navigate("/auth")} className="group text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Accept the Challenge <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-white/20 hover:bg-white/5">
                  Learn More
                </Button>
              </div>
            </motion.div>

            {/* Mini Stats Row (Task 2 Update) */}
            <motion.div
              // Added background, blur, border, and padding to create a styled container
              className="mt-20 max-w-4xl mx-auto bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl p-8 grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4 text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div>
                <p className="text-3xl font-bold text-primary">₹5,00,000</p>
                <p className="text-neutral-400">Starting Capital</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-neutral-400">Tradable Assets</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">3</p>
                <p className="text-neutral-400">Rounds of Chaos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">Live</p>
                <p className="text-neutral-400">Market Feeds</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- Feature Section --- */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">An Institutional-Grade Arsenal</h2>
              <p className="mt-4 text-lg text-neutral-400">
                Built for those who trade not for luck — but for legacy.
              </p>
            </div>
            <div className="mt-20 grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<LineChart className="w-6 h-6 text-primary" />}
                title="Real-Time Price Action"
                text="React to market fluctuations as prices shift dynamically — powered by live data and simulated volatility."
                delay={0.1}
              />
              <FeatureCard
                icon={<BrainCircuit className="w-6 h-6 text-primary" />}
                title="Human-Driven Volatility"
                text="The market moves when the Organizer makes it move. Expect the unexpected — narrative-driven shocks await."
                delay={0.2}
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-primary" />}
                title="Risk & Margin Protocols"
                text="Utilize market, limit, and stop-loss orders with institutional-grade exposure controls and margin alerts."
                delay={0.3}
              />
              <FeatureCard
                icon={<Newspaper className="w-6 h-6 text-primary" />}
                title="Dynamic News Flow"
                text="Market-altering headlines and sudden announcements — each capable of shifting fortunes in seconds."
                delay={0.4}
              />
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6 text-primary" />}
                title="Performance Analytics"
                text="Track risk-adjusted returns using the Sortino Ratio. Your score reflects precision, not just profit."
                delay={0.5}
              />
              <FeatureCard
                icon={<Trophy className="w-6 h-6 text-primary" />}
                title="Compete for Glory"
                text="Climb the leaderboard, outsmart the crowd, and prove your Alpha. Only one walks away with the crown."
                delay={0.6}
              />
            </div>
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 bg-gradient-to-b from-black to-neutral-900">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                Prove Your Alpha.
              </h2>
              <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto">
                The market listens only to those who dominate it. Step forward, trade with precision, and carve your legend.
              </p>
              <div className="mt-10">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="group text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  Enter the Arena
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
  <footer className="border-t border-white/10 mt-20 pb-32 md:pb-32"> 
      {/* Added bottom padding to prevent overlap with fixed ticker on mobile */}
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Equity Quest. All Rights Reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>

      {/* This is the fixed stock ticker component */}
      <StockTicker />
    </div>
  );
};

export default Index;