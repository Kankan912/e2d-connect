import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Trophy, TrendingUp, Users, Target, Award, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlayerPerformance {
  player_name: string;
  team: 'e2d' | 'phoenix';
  total_matches: number;
  total_goals: number;
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
  average_rating: number;
  efficiency_score: number;
  form_trend: number; // Tendance récente
}

interface TeamComparison {
  category: string;
  e2d: number;
  phoenix: number;
}

interface MonthlyTrend {
  month: string;
  e2d_goals: number;
  e2d_matches: number;
  phoenix_goals: number;
  phoenix_matches: number;
}

export default function SportAnalyticsAvancees() {
  const [playerPerformances, setPlayerPerformances] = useState<PlayerPerformance[]>([]);
  const [teamComparison, setTeamComparison] = useState<TeamComparison[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedTeam, setSelectedTeam] = useState<'all' | 'e2d' | 'phoenix'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod, selectedTeam]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Charger les statistiques des matchs
      const { data: matchStats, error: statsError } = await supabase
        .from('match_statistics')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (statsError) throw statsError;

      // Calculer les performances des joueurs
      const playerStatsMap = new Map<string, PlayerPerformance>();
      
      (matchStats || []).forEach(stat => {
        const key = stat.player_name;
        if (!playerStatsMap.has(key)) {
          playerStatsMap.set(key, {
            player_name: stat.player_name,
            team: stat.match_type as 'e2d' | 'phoenix',
            total_matches: 0,
            total_goals: 0,
            total_assists: 0,
            total_yellow_cards: 0,
            total_red_cards: 0,
            average_rating: 0,
            efficiency_score: 0,
            form_trend: 0
          });
        }

        const player = playerStatsMap.get(key)!;
        player.total_matches += 1;
        player.total_goals += stat.goals;
        player.total_assists += stat.assists;
        player.total_yellow_cards += stat.yellow_cards;
        player.total_red_cards += stat.red_cards;
      });

      // Calculer les scores d'efficacité et moyennes
      const performancesArray = Array.from(playerStatsMap.values())
        .map(player => ({
          ...player,
          average_rating: player.total_matches > 0 
            ? ((player.total_goals * 3 + player.total_assists * 2) / player.total_matches)
            : 0,
          efficiency_score: player.total_matches > 0
            ? ((player.total_goals + player.total_assists) * 10) / player.total_matches
            : 0,
          form_trend: Math.random() * 2 - 1 // Simulation de tendance (-1 à +1)
        }))
        .sort((a, b) => b.efficiency_score - a.efficiency_score);

      setPlayerPerformances(performancesArray);

      // Comparaison entre équipes
      const e2dStats = performancesArray.filter(p => p.team === 'e2d');
      const phoenixStats = performancesArray.filter(p => p.team === 'phoenix');

      const comparison: TeamComparison[] = [
        {
          category: 'Buts',
          e2d: e2dStats.reduce((sum, p) => sum + p.total_goals, 0),
          phoenix: phoenixStats.reduce((sum, p) => sum + p.total_goals, 0)
        },
        {
          category: 'Passes',
          e2d: e2dStats.reduce((sum, p) => sum + p.total_assists, 0),
          phoenix: phoenixStats.reduce((sum, p) => sum + p.total_assists, 0)
        },
        {
          category: 'Matchs',
          e2d: e2dStats.reduce((sum, p) => sum + p.total_matches, 0),
          phoenix: phoenixStats.reduce((sum, p) => sum + p.total_matches, 0)
        },
        {
          category: 'Cartons',
          e2d: e2dStats.reduce((sum, p) => sum + p.total_yellow_cards + p.total_red_cards, 0),
          phoenix: phoenixStats.reduce((sum, p) => sum + p.total_yellow_cards + p.total_red_cards, 0)
        }
      ];

      setTeamComparison(comparison);

      // Tendances mensuelles (simulées pour l'exemple)
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      const trends: MonthlyTrend[] = months.map(month => ({
        month,
        e2d_goals: Math.floor(Math.random() * 20) + 5,
        e2d_matches: Math.floor(Math.random() * 5) + 2,
        phoenix_goals: Math.floor(Math.random() * 30) + 10,
        phoenix_matches: Math.floor(Math.random() * 8) + 3
      }));

      setMonthlyTrends(trends);

    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPerformances = selectedTeam === 'all' 
    ? playerPerformances 
    : playerPerformances.filter(p => p.team === selectedTeam);

  const topPerformers = filteredPerformances.slice(0, 5);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement des analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analytics Sportives Avancées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">1 mois</SelectItem>
                  <SelectItem value="3months">3 mois</SelectItem>
                  <SelectItem value="6months">6 mois</SelectItem>
                  <SelectItem value="year">1 an</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Équipe</label>
              <Select value={selectedTeam} onValueChange={(v) => setSelectedTeam(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="e2d">E2D</SelectItem>
                  <SelectItem value="phoenix">Phoenix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="players">Joueurs</TabsTrigger>
        </TabsList>

        {/* Onglet Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 5 Buteurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Top 5 Buteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="player_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_goals" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Efficacité des joueurs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Score d'Efficacité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="player_name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="efficiency_score" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Répartition Buts/Passes */}
          <Card>
            <CardHeader>
              <CardTitle>Contribution Offensive</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="player_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_goals" fill="hsl(var(--chart-1))" name="Buts" />
                  <Bar dataKey="total_assists" fill="hsl(var(--chart-3))" name="Passes décisives" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Comparaison E2D vs Phoenix */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Comparaison E2D vs Phoenix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="e2d" fill="hsl(var(--chart-1))" name="E2D" />
                  <Bar dataKey="phoenix" fill="hsl(var(--chart-4))" name="Phoenix" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Statistiques comparatives */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamComparison.map((stat) => (
              <Card key={stat.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{stat.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-500">E2D</Badge>
                      <span className="font-bold">{stat.e2d}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-500">Phoenix</Badge>
                      <span className="font-bold">{stat.phoenix}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Tendances */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Évolution Mensuelle des Performances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="e2d_goals" stroke="hsl(var(--chart-1))" name="Buts E2D" strokeWidth={2} />
                  <Line type="monotone" dataKey="phoenix_goals" stroke="hsl(var(--chart-4))" name="Buts Phoenix" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Matchs par Mois</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="e2d_matches" fill="hsl(var(--chart-1))" name="E2D" />
                    <Bar dataKey="phoenix_matches" fill="hsl(var(--chart-4))" name="Phoenix" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Moyenne Buts/Match</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyTrends.map(t => ({
                    month: t.month,
                    e2d_avg: t.e2d_matches > 0 ? (t.e2d_goals / t.e2d_matches).toFixed(2) : 0,
                    phoenix_avg: t.phoenix_matches > 0 ? (t.phoenix_goals / t.phoenix_matches).toFixed(2) : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="e2d_avg" stroke="hsl(var(--chart-1))" name="E2D" />
                    <Line type="monotone" dataKey="phoenix_avg" stroke="hsl(var(--chart-4))" name="Phoenix" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Joueurs */}
        <TabsContent value="players" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {topPerformers.map((player) => (
              <Card key={player.player_name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{player.player_name}</CardTitle>
                    <Badge className={player.team === 'e2d' ? 'bg-blue-500' : 'bg-purple-500'}>
                      {player.team.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{player.total_goals}</div>
                      <div className="text-xs text-muted-foreground">Buts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">{player.total_assists}</div>
                      <div className="text-xs text-muted-foreground">Passes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{player.total_matches}</div>
                      <div className="text-xs text-muted-foreground">Matchs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{player.efficiency_score.toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">Efficacité</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${player.form_trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {player.form_trend > 0 ? '↗' : '↘'}
                      </div>
                      <div className="text-xs text-muted-foreground">Forme</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
