import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion, useAnimation } from "framer-motion";
import { ArrowRight, BrainCircuit, ShieldCheck, Trophy, Layers } from "lucide-react";

// This is a placeholder for a dynamic, animated chart.
// For a real implementation, you could use a library like Recharts or D3
// to create a live, animated SVG chart here.
const HeroBackgroundChart = () => (
  <div className="absolute inset-0 z-0 opacity-15">
    <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-28.5 492.833C100.167 404.167 334.3 260.5 504 363C673.7 465.5 726.5 639.5 901.5 650C1076.5 660.5 1205 492.833 1302 429.5C1399 366.167 1494 341.333 1539 332.5" stroke="url(#paint0_linear_10_2)" strokeWidth="8" />
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
    <div className="bg-black text-neutral-200 antialiased">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl font-bold">
            <Layers className="text-primary h-6 w-6" />
            Equity Quest
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
        <section className="relative h-screen flex items-center justify-center text-center overflow-hidden pt-16">
          <HeroBackgroundChart />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black"></div>
          <div className="relative z-10 container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                The Architect is Human.
              </h1>
              <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-neutral-300 leading-relaxed">
                This is not a simulation against an algorithm. It's a high-stakes gauntlet against a live, human market-maker. Your intellect, your strategy, your nerve—tested in real-time.
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
          </div>
        </section>

        {/* --- Features Section --- */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">An Institutional-Grade Arsenal</h2>
              <p className="mt-4 text-lg text-neutral-400">
                Wield the tools of a professional. Compete on a platform built for elite performance.
              </p>
            </div>
            <div className="mt-20 grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BrainCircuit className="w-6 h-6 text-primary" />}
                title="Human-Driven Volatility"
                text="The market moves when the Organizer makes it move. React to manufactured shocks, insider tips, and narrative-driven events."
                delay={0.1}
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-primary" />}
                title="Advanced Risk Protocols"
                text="Utilize market, limit, and stop-loss orders. Your portfolio is monitored with institutional-grade margin and exposure limits."
                delay={0.2}
              />
              <FeatureCard
                icon={<Trophy className="w-6 h-6 text-primary" />}
                title="Performance Analytics"
                text="It's not just about profit. A weighted scoring system featuring the Sortino Ratio measures your risk-adjusted return."
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24">
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
                The competition is waiting. The market is listening. Your legacy starts now.
              </p>
              <div className="mt-10">
                <Button size="lg" onClick={() => navigate("/auth")} className="group text-lg px-8 py-7 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Enter the Arena
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Equity Quest. All Rights Reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
