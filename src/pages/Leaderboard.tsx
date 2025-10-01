import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  profiles: {
    full_name: string;
    team_name: string | null;
  };
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setCurrentUserId(session.user.id);
    }

    const { data, error } = await supabase
      .from("portfolios")
      .select(`
        *,
        profiles (
          full_name,
          team_name
        )
      `)
      .order("total_value", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return;
    }

    setLeaderboard(data || []);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Real-time rankings of all participants</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Competition Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No participants yet</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const isCurrentUser = entry.user_id === currentUserId;

                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isCurrentUser
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(rank)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{entry.profiles.full_name}</h3>
                          {isCurrentUser && (
                            <Badge variant="secondary">You</Badge>
                          )}
                        </div>
                        {entry.profiles.team_name && (
                          <p className="text-sm text-muted-foreground">{entry.profiles.team_name}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-bold">
                          ₹{entry.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {entry.profit_loss >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-profit" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-loss" />
                          )}
                          <span className={`text-sm font-medium ${entry.profit_loss >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {entry.profit_loss >= 0 ? "+" : ""}
                            {entry.profit_loss_percentage.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
