import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MaintenanceModeToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState("The platform is currently undergoing maintenance. Please check back later.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaintenanceMode();
  }, []);

  const fetchMaintenanceMode = async () => {
    try {
      const { data } = await supabase
        .from('competition_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (data) {
        const settings = data.setting_value as { enabled: boolean; message: string };
        setIsEnabled(settings.enabled);
        setMessage(settings.message);
      }
    } catch (error) {
      console.error('Error fetching maintenance mode:', error);
    }
  };

  const updateMaintenanceMode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('competition_settings')
        .upsert({
          setting_key: 'maintenance_mode',
          setting_value: {
            enabled: isEnabled,
            message: message
          }
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast.success(`Maintenance mode ${isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update maintenance mode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
          <p className="text-sm text-muted-foreground">
            Non-admin users will be blocked from accessing the platform
          </p>
        </div>
        <Switch
          id="maintenance-mode"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maintenance-message">Maintenance Message</Label>
        <Textarea
          id="maintenance-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Enter the message users will see..."
        />
      </div>

      <Button 
        onClick={updateMaintenanceMode} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default MaintenanceModeToggle;
