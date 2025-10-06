import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

const CompetitionStatusCard = () => {
  const [status, setStatus] = useState<string>("not_started");

  useEffect(() => {
    fetchStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('competition-status')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'competition_rounds' 
      }, () => {
        fetchStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('competition_rounds')
      .select('status')
      .order('round_number', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setStatus(data.status);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'active':
        return { text: 'Live', color: 'text-profit' };
      case 'paused':
        return { text: 'Paused', color: 'text-warning' };
      case 'completed':
        return { text: 'Ended', color: 'text-muted-foreground' };
      default:
        return { text: 'Not Started', color: 'text-muted-foreground' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card className="card-enhanced">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Competition Status</span>
        </div>
        <div className={`text-2xl font-bold mt-1 ${statusDisplay.color}`}>
          {statusDisplay.text}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitionStatusCard;
