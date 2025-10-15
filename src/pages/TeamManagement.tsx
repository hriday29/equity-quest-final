import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Building2, 
  Crown, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface Team {
  team_code: string;
  members: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
  }>;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  rank: number;
}

interface CompetitionSettings {
  signup_paused: boolean;
  max_team_size: number;
}

const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamCode, setNewTeamCode] = useState("");
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [competitionSettings, setCompetitionSettings] = useState<CompetitionSettings>({
    signup_paused: false,
    max_team_size: 5
  });
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
    fetchCompetitionSettings();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setCurrentUser(profile);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const recalculateAllPortfolios = async () => {
    try {
      // Get all portfolios that need recalculation
      const { data: portfolios, error } = await supabase
        .from('portfolios')
        .select('user_id, cash_balance');

      if (error) throw error;

      // Recalculate each portfolio with correct initial value
      for (const portfolio of portfolios || []) {
        // Get user's positions
        const { data: positions } = await supabase
          .from('positions')
          .select('*, assets(*)')
          .eq('user_id', portfolio.user_id);

        let totalLongValue = 0;
        let totalShortValue = 0;

        if (positions && positions.length > 0) {
          positions.forEach(position => {
            const currentPrice = position.assets?.current_price || 0;
            if (position.is_short) {
              totalShortValue += position.quantity * currentPrice;
            } else {
              totalLongValue += position.quantity * currentPrice;
            }
          });
        }

        // Calculate correct portfolio values
        const totalPortfolioValue = portfolio.cash_balance + totalLongValue - totalShortValue;
        const initialValue = 500000; // Starting capital
        const profitLoss = totalPortfolioValue - initialValue;
        const profitLossPercentage = initialValue > 0 ? (profitLoss / initialValue) * 100 : 0;

        // Update portfolio with correct values
        await supabase
          .from('portfolios')
          .update({
            total_value: totalPortfolioValue,
            profit_loss: profitLoss,
            profit_loss_percentage: profitLossPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', portfolio.user_id);
      }

      console.log('All portfolios recalculated with correct values');
    } catch (error) {
      console.error('Error recalculating portfolios:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      
      // First recalculate all portfolios to ensure correct values
      await recalculateAllPortfolios();
      
      // Get all users with their team codes
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, team_code, created_at')
        .not('team_code', 'is', null)
        .order('team_code');

      if (usersError) throw usersError;

      // Get portfolio data for each user
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('user_id, total_value, profit_loss, profit_loss_percentage')
        .in('user_id', users?.map(u => u.id) || []);

      if (portfolioError) throw portfolioError;

      // Group users by team code
      const teamMap = new Map<string, Team>();
      
      users?.forEach(user => {
        if (user.team_code) {
          if (!teamMap.has(user.team_code)) {
            teamMap.set(user.team_code, {
              team_code: user.team_code,
              members: [],
              total_value: 0,
              profit_loss: 0,
              profit_loss_percentage: 0,
              rank: 0
            });
          }
          
          const portfolio = portfolios?.find(p => p.user_id === user.id);
          const team = teamMap.get(user.team_code)!;
          
          team.members.push({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.id === team.members[0]?.id ? 'leader' : 'member',
            created_at: user.created_at
          });
          
          if (portfolio) {
            team.total_value += portfolio.total_value;
            team.profit_loss += portfolio.profit_loss;
            team.profit_loss_percentage += portfolio.profit_loss_percentage;
          }
        }
      });

      // Calculate average profit loss percentage and sort by total value
      const teamList = Array.from(teamMap.values()).map(team => ({
        ...team,
        profit_loss_percentage: team.members.length > 0 ? team.profit_loss_percentage / team.members.length : 0
      })).sort((a, b) => b.total_value - a.total_value);

      // Assign ranks
      teamList.forEach((team, index) => {
        team.rank = index + 1;
      });

      setTeams(teamList);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitionSettings = async () => {
    try {
      const { data } = await supabase
        .from("competition_settings")
        .select("*");

      if (data) {
        const settings = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as any);

        setCompetitionSettings({
          signup_paused: settings.signup_paused?.value || false,
          max_team_size: settings.max_team_size?.value || 5
        });
      }
    } catch (error) {
      console.error("Error fetching competition settings:", error);
    }
  };

  const generateTeamCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setNewTeamCode(result);
  };

  const createTeam = async () => {
    if (!newTeamCode.trim()) {
      toast.error('Please enter a team code');
      return;
    }

    if (!currentUser) {
      toast.error('User not found');
      return;
    }

    try {
      // Check if team code already exists
      const { data: existingTeam } = await supabase
        .from('profiles')
        .select('team_code')
        .eq('team_code', newTeamCode.toUpperCase())
        .limit(1);

      if (existingTeam && existingTeam.length > 0) {
        toast.error('Team code already exists. Please choose a different one.');
        return;
      }

      // Update user's team code
      const { error } = await supabase
        .from('profiles')
        .update({ team_code: newTeamCode.toUpperCase() })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success(`Team "${newTeamCode.toUpperCase()}" created successfully!`);
      setNewTeamCode("");
      fetchCurrentUser();
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const joinTeam = async () => {
    if (!joinTeamCode.trim()) {
      toast.error('Please enter a team code');
      return;
    }

    if (!currentUser) {
      toast.error('User not found');
      return;
    }

    if (currentUser.team_code) {
      toast.error('You are already part of a team');
      return;
    }

    try {
      // Check if team exists and has space
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id')
        .eq('team_code', joinTeamCode.toUpperCase());

      if (!teamMembers || teamMembers.length === 0) {
        toast.error('Team code not found');
        return;
      }

      if (teamMembers.length >= competitionSettings.max_team_size) {
        toast.error(`Team is full. Maximum team size is ${competitionSettings.max_team_size}`);
        return;
      }

      // Update user's team code
      const { error } = await supabase
        .from('profiles')
        .update({ team_code: joinTeamCode.toUpperCase() })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success(`Successfully joined team "${joinTeamCode.toUpperCase()}"!`);
      setJoinTeamCode("");
      fetchCurrentUser();
      fetchTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    }
  };

  const leaveTeam = async () => {
    if (!currentUser?.team_code) {
      toast.error('You are not part of any team');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team_code: null })
        .eq('id', currentUser.id);

      if (error) throw error;

      toast.success('Successfully left the team');
      fetchCurrentUser();
      fetchTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
            <Users className="h-8 w-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Create or join teams to collaborate on portfolio management
          </p>
        </div>

        {/* Competition Status */}
        {competitionSettings.signup_paused && (
          <Card className="card-enhanced border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Signups are currently paused</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                New team creation and joining is temporarily disabled by administrators.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Current User Status */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Your Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser?.team_code ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">You are part of team:</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {currentUser.team_code}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={leaveTeam}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Leave Team
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">You are not part of any team</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Create Team */}
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Create New Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Team Code</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newTeamCode}
                            onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                            placeholder="Enter team code"
                            maxLength={6}
                            className="uppercase"
                          />
                          <Button 
                            onClick={generateTeamCode}
                            variant="outline"
                            size="sm"
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      <Button 
                        onClick={createTeam}
                        disabled={competitionSettings.signup_paused || !newTeamCode.trim()}
                        className="w-full"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Create Team
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Join Team */}
                  <Card className="border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Join Existing Team
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Team Code</Label>
                        <Input
                          value={joinTeamCode}
                          onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                          placeholder="Enter team code"
                          maxLength={6}
                          className="uppercase"
                        />
                      </div>
                      <Button 
                        onClick={joinTeam}
                        disabled={competitionSettings.signup_paused || !joinTeamCode.trim()}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Join Team
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Leaderboard */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No teams found</p>
                </div>
              ) : (
                teams.map((team, index) => (
                  <div 
                    key={team.team_code} 
                    className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md ${
                      currentUser?.team_code === team.team_code 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={index < 3 ? "default" : "secondary"}
                          className={`w-8 h-8 flex items-center justify-center p-0 ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : ''
                          }`}
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-bold text-lg">{team.team_code}</div>
                          <div className="text-sm text-muted-foreground">
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          ₹{team.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm font-medium ${
                          team.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {team.profit_loss_percentage >= 0 ? '+' : ''}{team.profit_loss_percentage.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-1">
                            {member.role === 'leader' && <Crown className="h-3 w-3 text-yellow-500" />}
                            <span className="text-sm font-medium">{member.full_name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card className="card-enhanced border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              How Teams Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Team Creation</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create a unique 6-character team code</li>
                  <li>• Share the code with your teammates</li>
                  <li>• Maximum team size: {competitionSettings.max_team_size} members</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Portfolio Management</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All team members share the same ₹5,00,000 balance</li>
                  <li>• Any member can make trades for the team</li>
                  <li>• Team performance is ranked on the leaderboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TeamManagement;
