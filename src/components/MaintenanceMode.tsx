import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface MaintenanceModeProps {
  children: React.ReactNode;
}

const MaintenanceMode = ({ children }: MaintenanceModeProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkMaintenanceMode();
    checkAdminStatus();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const { data } = await supabase
        .from('competition_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (data) {
        const settings = data.setting_value as { enabled: boolean; message: string };
        setIsMaintenanceMode(settings.enabled);
        setMaintenanceMessage(settings.message || "The platform is currently undergoing maintenance.");
      }
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .in('role', ['admin', 'owner'])
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow admins to access even during maintenance
  if (isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card-enhanced p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-warning/20 blur-3xl rounded-full"></div>
                <div className="relative bg-gradient-to-br from-warning/20 to-warning/10 p-6 rounded-full border border-warning/20">
                  <AlertTriangle className="h-16 w-16 text-warning" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Maintenance Mode</h1>
              <p className="text-muted-foreground">{maintenanceMessage}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              Please check back later. We appreciate your patience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceMode;
