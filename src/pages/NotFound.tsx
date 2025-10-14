import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-md animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-loss/20 blur-3xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-loss/20 to-loss/10 p-6 rounded-full border border-loss/20">
              <AlertCircle className="h-20 w-20 text-loss" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate("/")} 
          className="mt-6 btn-primary hover-scale"
        >
          <Home className="h-4 w-4 mr-2" />
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
