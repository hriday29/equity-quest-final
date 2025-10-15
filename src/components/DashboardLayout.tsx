import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, TrendingUp, LayoutDashboard, Settings, Users, MessageSquare, Trophy, History, BarChart3, UserPlus, Menu } from "lucide-react";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        setUserName(profile?.full_name || "User");

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        const userRoles = roles?.map(r => r.role) || [];
        setIsAdmin(userRoles.includes("admin") || userRoles.includes("owner"));
      }
    };

    checkRole();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/market", label: "Market Analysis", icon: BarChart3 },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/teams", label: "Teams", icon: UserPlus },
    { path: "/messages", label: "Messages", icon: MessageSquare },
    { path: "/transactions", label: "History", icon: History },
  ];

  if (isAdmin) {
    navItems.push({ path: "/admin", label: "Admin Panel", icon: Settings });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img
                src="/equity-quest-logo.png"
                alt="Equity Quest Logo"
                className="h-10 w-10 object-contain" // adjust size as needed
              />
              <div>
                <h1 className="text-xl font-bold text-foreground">Equity Quest</h1>
                <p className="text-xs text-foreground/80">Trading Platform</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button 
                      variant={isActive ? "secondary" : "ghost"} 
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-foreground/80">{isAdmin ? "Admin" : "Participant"}</p>
              </div>
              
              {isMobile ? (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center gap-2 pb-4 border-b">
                        <img
                          src="/equity-quest-logo.png"
                          alt="Equity Quest Logo"
                          className="h-8 w-8 object-contain"
                        />
                        <div>
                          <h2 className="text-lg font-bold text-foreground">Equity Quest</h2>
                          <p className="text-sm text-foreground/80">{userName}</p>
                        </div>
                      </div>
                      
                      <nav className="flex flex-col space-y-2">
                        {navItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <Link 
                              key={item.path} 
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Button 
                                variant={isActive ? "secondary" : "ghost"} 
                                className="w-full justify-start gap-3"
                              >
                                <Icon className="h-4 w-4" />
                                {item.label}
                              </Button>
                            </Link>
                          );
                        })}
                      </nav>
                      
                      <div className="pt-4 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start gap-3 text-foreground hover:text-foreground"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button variant="outline" size="icon" className="text-foreground hover:text-foreground" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
