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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-6 rounded-full">
            <TrendingUp className="h-20 w-20 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">Equity Quest</h1>
        <p className="text-xl text-muted-foreground mb-8">Mock Stock Trading Competition Platform</p>
        <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
