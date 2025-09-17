import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Target, AlertTriangle, Star, TrendingUp, Users, Award, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface MatchStats {
  id: string;
  match_id: string;
  match_type: string;
  player_name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  man_of_match: boolean;
  created_at: string;
}

interface Match {
  id: string;
  date_match: string;
  equipe_adverse: string;
  score_e2d?: number;
  score_phoenix?: number;
  statut: string;
  type: 'e2d' | 'phoenix';
}

interface PlayerPerformance {
  name: string;
  totalGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  manOfMatchCount: number;
  matchesPlayed: number;
  averageGoals: number;
  efficiency: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function StatsMatchDetaillee() {
  const [statistics, setStatistics] = useState<MatchStats[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, e2dMatches, phoenixMatches] = await Promise.all([
        supabase.from('match_statistics').select('*').order('created_at', { ascending: false }),
        supabase.from('sport_e2d_matchs').select('*').order('date_match', { ascending: false }),
        supabase.from('sport_phoenix_matchs').select('*').order('date_match', { ascending: false })
      ]);

      const allMatches: Match[] = [
        ...(e2dMatches.data || []).map(m => ({ ...m, type: 'e2d' as const })),
        ...(phoenixMatches.data || []).map(m => ({ ...m, type: 'phoenix' as const }))
      ];

      setStatistics(statsRes.data || []);
      setMatches(allMatches);
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les statistiques',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let filteredStats = statistics;
    let filteredMatches = matches;

    // Filtre par équipe
    if (selectedTeam !== 'all') {
      filteredStats = filteredStats.filter(s => s.match_type === selectedTeam);
      filteredMatches = filteredMatches.filter(m => m.type === selectedTeam);
    }

    // Filtre par période
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (selectedPeriod) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredStats = filteredStats.filter(s => new Date(s.created_at) >= startDate);
      filteredMatches = filteredMatches.filter(m => new Date(m.date_match) >= startDate);
    }

    return { stats: filteredStats, matches: filteredMatches };
  };

  const getPlayerPerformances = (): PlayerPerformance[] => {
    const { stats } = getFilteredData();
    const playerMap = new Map<string, PlayerPerformance>();

    stats.forEach(stat => {
      if (!playerMap.has(stat.player_name)) {
        playerMap.set(stat.player_name, {
          name: stat.player_name,
          totalGoals: 0,
          totalAssists: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          manOfMatchCount: 0,
          matchesPlayed: 0,
          averageGoals: 0,
          efficiency: 0
        });
      }

      const player = playerMap.get(stat.player_name)!;
      player.totalGoals += stat.goals;
      player.totalAssists += stat.assists;
      player.totalYellowCards += stat.yellow_cards;
      player.totalRedCards += stat.red_cards;
      player.manOfMatchCount += stat.man_of_match ? 1 : 0;
      player.matchesPlayed += 1;
    });

    // Calculer les moyennes et l'efficacité
    return Array.from(playerMap.values()).map(player => ({
      ...player,
      averageGoals: player.matchesPlayed > 0 ? player.totalGoals / player.matchesPlayed : 0,
      efficiency: player.matchesPlayed > 0 ? 
        ((player.totalGoals + player.totalAssists) - (player.totalYellowCards + player.totalRedCards * 2)) / player.matchesPlayed : 0
    })).sort((a, b) => b.totalGoals - a.totalGoals);
  };

  const getMonthlyStats = () => {
    const { stats } = getFilteredData();
    const monthlyData = new Map<string, { goals: number; assists: number; matches: number }>();

    stats.forEach(stat => {
      const month = new Date(stat.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { goals: 0, assists: 0, matches: 0 });
      }
      const data = monthlyData.get(month)!;
      data.goals += stat.goals;
      data.assists += stat.assists;
      data.matches += 1;
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      buts: data.goals,
      passes: data.assists,
      matchs: data.matches
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const getTeamComparison = () => {
    const e2dStats = statistics.filter(s => s.match_type === 'e2d');
    const phoenixStats = statistics.filter(s => s.match_type === 'phoenix');

    return [
      {
        equipe: 'E2D',
        buts: e2dStats.reduce((sum, s) => sum + s.goals, 0),
        passes: e2dStats.reduce((sum, s) => sum + s.assists, 0),
        cartons: e2dStats.reduce((sum, s) => sum + s.yellow_cards + s.red_cards, 0),
        matchs: new Set(e2dStats.map(s => s.match_id)).size
      },
      {
        equipe: 'Phoenix',
        buts: phoenixStats.reduce((sum, s) => sum + s.goals, 0),
        passes: phoenixStats.reduce((sum, s) => sum + s.assists, 0),
        cartons: phoenixStats.reduce((sum, s) => sum + s.yellow_cards + s.red_cards, 0),
        matchs: new Set(phoenixStats.map(s => s.match_id)).size
      }
    ];
  };

  const getTopScorers = (limit = 5) => {
    return getPlayerPerformances().slice(0, limit).map(player => ({
      name: player.name,
      value: player.totalGoals
    }));
  };

  const { stats } = getFilteredData();
  const playerPerformances = getPlayerPerformances();
  const monthlyStats = getMonthlyStats();
  const teamComparison = getTeamComparison();
  const topScorers = getTopScorers();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement des statistiques détaillées...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Statistiques Détaillées"
        subtitle="Analyses graphiques et performances sportives"
      />

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Filtres d'analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Équipe</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Période</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute période</SelectItem>
                  <SelectItem value="month">Dernier mois</SelectItem>
                  <SelectItem value="3months">3 derniers mois</SelectItem>
                  <SelectItem value="year">Dernière année</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buts</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, s) => sum + s.goals, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passes décisives</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, s) => sum + s.assists, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartons</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.reduce((sum, s) => sum + s.yellow_cards + s.red_cards, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homme du Match</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.filter(s => s.man_of_match).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Joueurs actifs</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(stats.map(s => s.player_name)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de comparaison entre équipes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparaison E2D vs Phoenix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipe" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="buts" fill="#0088FE" name="Buts" />
                <Bar dataKey="passes" fill="#00C49F" name="Passes" />
                <Bar dataKey="cartons" fill="#FF8042" name="Cartons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Buteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topScorers}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topScorers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Évolution mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des Performances</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="buts" stroke="#0088FE" strokeWidth={2} name="Buts" />
              <Line type="monotone" dataKey="passes" stroke="#00C49F" strokeWidth={2} name="Passes" />
              <Line type="monotone" dataKey="matchs" stroke="#FF8042" strokeWidth={2} name="Matchs" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Classement des joueurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performances Individuelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {playerPerformances.slice(0, 10).map((player, index) => (
              <div key={player.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <span className="font-medium">{player.name}</span>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>{player.totalGoals} buts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{player.totalAssists} passes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span>{player.averageGoals.toFixed(1)} moy/match</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{player.manOfMatchCount} HdM</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{player.matchesPlayed} matchs</span>
                  </div>
                </div>
              </div>
            ))}
            
            {playerPerformances.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune statistique disponible pour les filtres sélectionnés
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}