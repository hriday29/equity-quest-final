import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, BarChart3, Crown, Target, RefreshCw, Users } from "lucide-react";
import { portfolioScoringEngine, PortfolioMetrics, CompetitionResults } from "@/services/portfolioScoring";

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
  const [competitionResults, setCompetitionResults] = useState<CompetitionResults | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("final-scores");

  useEffect(() => {
    fetchCompetitionResults();

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, () => {
        fetchCompetitionResults();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompetitionResults = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      // Update portfolio snapshots first
      await portfolioScoringEngine.updateAllPortfolioMetrics();
      
      // Get comprehensive competition results
      const results = await portfolioScoringEngine.getCompetitionResults();
      setCompetitionResults(results);
    } catch (error) {
      console.error("Error fetching competition results:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async () => {
    await fetchCompetitionResults();
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const formatScore = (score: number) => {
    return score.toFixed(2);
  };

  const formatSortinoRatio = (ratio: number) => {
    return ratio.toFixed(3);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Competition Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Final scores calculated using: 70% Portfolio P&L + 30% Sortino Ratio
            </p>
          </div>
          <Button onClick={refreshResults} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {competitionResults && (
          <>
            {/* Winner Announcement */}
            {competitionResults.winner && (
              <Card className="card-enhanced border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <Crown className="h-6 w-6" />
                    🏆 Competition Winner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-yellow-800">
                        {competitionResults.winner.teamCode || "Individual Participant"}
                      </h3>
                      <p className="text-yellow-700">
                        Final Score: {formatScore(competitionResults.winner.finalScore)} | 
                        Sortino Ratio: {formatSortinoRatio(competitionResults.winner.sortinoRatio)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-yellow-800">
                        ₹{competitionResults.winner.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-lg font-medium ${competitionResults.winner.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {competitionResults.winner.profitLossPercentage >= 0 ? '+' : ''}
                        {competitionResults.winner.profitLossPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Competition Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="card-enhanced">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Participants</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{competitionResults.totalParticipants}</div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Average Return</span>
                  </div>
                  <div className={`text-2xl font-bold mt-1 ${competitionResults.averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {competitionResults.averageReturn >= 0 ? '+' : ''}{competitionResults.averageReturn.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="card-enhanced">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Competition Status</span>
                  </div>
                  <div className="text-2xl font-bold mt-1 text-primary">Active</div>
                </CardContent>
              </Card>
            </div>

            {/* Leaderboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="final-scores">Final Scores</TabsTrigger>
                <TabsTrigger value="sortino-ratios">Sortino Ratios</TabsTrigger>
                <TabsTrigger value="portfolio-values">Portfolio Values</TabsTrigger>
              </TabsList>

              <TabsContent value="final-scores">
                <Card className="card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Final Scores (70% P&L + 30% Sortino Ratio)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitionResults.participants.map((participant, index) => {
                        const isCurrentUser = participant.userId === currentUserId;
                        
                        return (
                          <div
                            key={participant.userId}
                            className={`rounded-lg border transition-all duration-300 animate-fade-in ${
                              isCurrentUser
                                ? "border-primary bg-primary/5 glow-primary"
                                : "border-border hover:border-primary/50 hover:shadow-lg"
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-16">
                                  {getRankIcon(participant.rank)}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">
                                      {participant.teamCode || "Individual Participant"}
                                    </h3>
                                    {isCurrentUser && (
                                      <Badge className="badge-executed">You</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Final Score: {formatScore(participant.finalScore)}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-2xl font-bold">
                                    ₹{participant.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    {participant.profitLossPercentage >= 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`text-sm font-medium ${participant.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {participant.profitLossPercentage >= 0 ? "+" : ""}
                                      {participant.profitLossPercentage.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Score Breakdown */}
                              <div className="mt-4 pt-4 border-t border-border">
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">P&L Component</p>
                                    <p className="text-lg font-semibold">
                                      {(participant.profitLossPercentage + 50) * 0.7}%
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Sortino Component</p>
                                    <p className="text-lg font-semibold">
                                      {participant.sortinoRatio * 0.3}%
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-sm text-muted-foreground">Sortino Ratio</p>
                                    <p className="text-lg font-semibold text-blue-600">
                                      {formatSortinoRatio(participant.sortinoRatio)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sortino-ratios">
                <Card className="card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Sortino Ratio Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitionResults.participants
                        .sort((a, b) => b.sortinoRatio - a.sortinoRatio)
                        .map((participant, index) => {
                          const isCurrentUser = participant.userId === currentUserId;
                          
                          return (
                            <div
                              key={participant.userId}
                              className={`rounded-lg border transition-all duration-300 animate-fade-in ${
                                isCurrentUser
                                  ? "border-primary bg-primary/5 glow-primary"
                                  : "border-border hover:border-primary/50 hover:shadow-lg"
                              }`}
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-16">
                                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-lg">
                                        {participant.teamCode || "Individual Participant"}
                                      </h3>
                                      {isCurrentUser && (
                                        <Badge className="badge-executed">You</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Risk-adjusted return measure
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-3xl font-bold text-blue-600">
                                      {formatSortinoRatio(participant.sortinoRatio)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Sortino Ratio
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio-values">
                <Card className="card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Portfolio Value Rankings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {competitionResults.participants
                        .sort((a, b) => b.totalValue - a.totalValue)
                        .map((participant, index) => {
                          const isCurrentUser = participant.userId === currentUserId;
                          
                          return (
                            <div
                              key={participant.userId}
                              className={`rounded-lg border transition-all duration-300 animate-fade-in ${
                                isCurrentUser
                                  ? "border-primary bg-primary/5 glow-primary"
                                  : "border-border hover:border-primary/50 hover:shadow-lg"
                              }`}
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <div className="p-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center justify-center w-16">
                                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-bold text-lg">
                                        {participant.teamCode || "Individual Participant"}
                                      </h3>
                                      {isCurrentUser && (
                                        <Badge className="badge-executed">You</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Total portfolio value
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-3xl font-bold">
                                      ₹{participant.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                      {participant.profitLossPercentage >= 0 ? (
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                      )}
                                      <span className={`text-sm font-medium ${participant.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {participant.profitLossPercentage >= 0 ? "+" : ""}
                                        {participant.profitLossPercentage.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
