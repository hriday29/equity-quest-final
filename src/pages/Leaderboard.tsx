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
    team_code: string | null;
  };
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [teamRankings, setTeamRankings] = useState<Array<{
    teamName: string;
    totalValue: number;
    avgProfitLoss: number;
    memberCount: number;
    members: LeaderboardEntry[];
  }>>([]);

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

    const { data, error} = await supabase
      .from("portfolios")
      .select(`
        *,
        profiles (
          full_name,
          team_code
        )
      `)
      .order("total_value", { ascending: false });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return;
    }

    setLeaderboard(data || []);
    
    // Group by teams
    const teamMap = new Map<string, {
      totalValue: number;
      avgProfitLoss: number;
      memberCount: number;
      members: LeaderboardEntry[];
    }>();

    data?.forEach(entry => {
      const teamName = entry.profiles.team_code || `Individual - ${entry.profiles.full_name}`;
      
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, {
          totalValue: 0,
          avgProfitLoss: 0,
          memberCount: 0,
          members: []
        });
      }
      
      const team = teamMap.get(teamName)!;
      team.totalValue += entry.total_value;
      team.avgProfitLoss += entry.profit_loss_percentage;
      team.memberCount += 1;
      team.members.push(entry);
    });

    const rankings = Array.from(teamMap.entries()).map(([teamName, data]) => ({
      teamName,
      totalValue: data.totalValue,
      avgProfitLoss: data.avgProfitLoss / data.memberCount,
      memberCount: data.memberCount,
      members: data.members.sort((a, b) => b.total_value - a.total_value)
    })).sort((a, b) => b.totalValue - a.totalValue);

    setTeamRankings(rankings);
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
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Team Leaderboard
          </h1>
          <p className="text-muted-foreground">Competition rankings by team performance</p>
        </div>

        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary pulse-live" />
              Team Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamRankings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No participants yet</p>
            ) : (
              <div className="space-y-4">
                {teamRankings.map((team, index) => {
                  const rank = index + 1;
                  const isCurrentUserTeam = team.members.some(m => m.user_id === currentUserId);

                  return (
                    <div
                      key={team.teamName}
                      className={`rounded-lg border transition-all duration-300 animate-fade-in ${
                        isCurrentUserTeam
                          ? "border-primary bg-primary/5 glow-primary"
                          : "border-border hover:border-primary/50 hover:shadow-lg"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-16">
                            {getRankIcon(rank)}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{team.teamName}</h3>
                              {isCurrentUserTeam && (
                                <Badge className="badge-executed">Your Team</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold animate-fade-in">
                              ₹{team.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {team.avgProfitLoss >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-profit pulse-live" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-loss pulse-live" />
                              )}
                              <span className={`text-sm font-medium ${team.avgProfitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {team.avgProfitLoss >= 0 ? "+" : ""}
                                {team.avgProfitLoss.toFixed(2)}% avg
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Team Members */}
                        {team.memberCount > 1 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Team Members</h4>
                            <div className="grid gap-2">
                              {team.members.map(member => (
                                <div 
                                  key={member.id}
                                  className={`flex items-center justify-between p-2 rounded-md ${
                                    member.user_id === currentUserId ? 'bg-primary/10' : 'bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{member.profiles.full_name}</span>
                                    {member.user_id === currentUserId && (
                                      <Badge variant="outline" className="text-xs">You</Badge>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      ₹{member.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className={`text-xs ${member.profit_loss_percentage >= 0 ? 'text-profit' : 'text-loss'}`}>
                                      {member.profit_loss_percentage >= 0 ? "+" : ""}
                                      {member.profit_loss_percentage.toFixed(2)}%
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
