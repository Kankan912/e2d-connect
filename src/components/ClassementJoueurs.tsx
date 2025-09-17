import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Target, Users, Award, Star, TrendingUp, Calendar, Medal, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface PlayerStats {
  id: string;
  name: string;
  team: 'e2d' | 'phoenix';
  position?: string;
  totalGoals: number;
  totalAssists: number;
  totalYellowCards: number;
  totalRedCards: number;
  manOfMatchCount: number;
  matchesPlayed: number;
  averageGoals: number;
  averageAssists: number;
  efficiency: number;
  disciplineIndex: number;
  performanceRating: number;
}

interface LeaderboardCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  getValue: (player: PlayerStats) => number;
  format: (value: number) => string;
}

const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  {
    id: 'goals',
    name: 'Meilleurs Buteurs',
    icon: Target,
    color: 'text-green-500',
    getValue: (player) => player.totalGoals,
    format: (value) => `${value} buts`
  },
  {
    id: 'assists',
    name: 'Meilleurs Passeurs',
    icon: Users,
    color: 'text-blue-500',
    getValue: (player) => player.totalAssists,
    format: (value) => `${value} passes`
  },
  {
    id: 'efficiency',
    name: 'Efficacité',
    icon: Zap,
    color: 'text-purple-500',
    getValue: (player) => player.efficiency,
    format: (value) => `${value.toFixed(2)}`
  },
  {
    id: 'average_goals',
    name: 'Moyenne de Buts',
    icon: TrendingUp,
    color: 'text-orange-500',
    getValue: (player) => player.averageGoals,
    format: (value) => `${value.toFixed(2)}/match`
  },
  {
    id: 'man_of_match',
    name: 'Homme du Match',
    icon: Star,
    color: 'text-yellow-500',
    getValue: (player) => player.manOfMatchCount,
    format: (value) => `${value} fois`
  },
  {
    id: 'discipline',
    name: 'Discipline',
    icon: Award,
    color: 'text-emerald-500',
    getValue: (player) => player.disciplineIndex,
    format: (value) => `${value.toFixed(1)}/10`
  },
  {
    id: 'performance',
    name: 'Note Globale',
    icon: Medal,
    color: 'text-indigo-500',
    getValue: (player) => player.performanceRating,
    format: (value) => `${value.toFixed(1)}/10`
  }
];

export default function ClassementJoueurs() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('goals');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPlayerStats();
  }, [selectedPeriod]);

  const loadPlayerStats = async () => {
    try {
      // Récupérer les statistiques de match
      let statsQuery = supabase.from('match_statistics').select('*');
      
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
          case 'season':
            // Début de saison sportive (septembre)
            startDate = new Date(now.getFullYear(), 8, 1);
            if (now.getMonth() < 8) {
              startDate.setFullYear(now.getFullYear() - 1);
            }
            break;
        }
        
        statsQuery = statsQuery.gte('created_at', startDate.toISOString());
      }

      const [statsRes, membresRes] = await Promise.all([
        statsQuery,
        supabase
          .from('membres')
          .select('id, nom, prenom, est_membre_e2d, est_adherent_phoenix')
          .eq('statut', 'actif')
      ]);

      const statistics = statsRes.data || [];
      const membres = membresRes.data || [];

      // Calculer les statistiques par joueur
      const playerStatsMap = new Map<string, PlayerStats>();

      statistics.forEach(stat => {
        const membre = membres.find(m => `${m.prenom} ${m.nom}` === stat.player_name);
        const team = stat.match_type as 'e2d' | 'phoenix';
        
        if (!playerStatsMap.has(stat.player_name)) {
          playerStatsMap.set(stat.player_name, {
            id: membre?.id || stat.player_name,
            name: stat.player_name,
            team,
            position: undefined,
            totalGoals: 0,
            totalAssists: 0,
            totalYellowCards: 0,
            totalRedCards: 0,
            manOfMatchCount: 0,
            matchesPlayed: 0,
            averageGoals: 0,
            averageAssists: 0,
            efficiency: 0,
            disciplineIndex: 10,
            performanceRating: 0
          });
        }

        const player = playerStatsMap.get(stat.player_name)!;
        player.totalGoals += stat.goals;
        player.totalAssists += stat.assists;
        player.totalYellowCards += stat.yellow_cards;
        player.totalRedCards += stat.red_cards;
        player.manOfMatchCount += stat.man_of_match ? 1 : 0;
        player.matchesPlayed += 1;
      });

      // Calculer les moyennes et indices
      const playersArray = Array.from(playerStatsMap.values()).map(player => {
        const totalCards = player.totalYellowCards + (player.totalRedCards * 2);
        
        return {
          ...player,
          averageGoals: player.matchesPlayed > 0 ? player.totalGoals / player.matchesPlayed : 0,
          averageAssists: player.matchesPlayed > 0 ? player.totalAssists / player.matchesPlayed : 0,
          efficiency: player.matchesPlayed > 0 ? 
            ((player.totalGoals * 3) + (player.totalAssists * 2) - (totalCards)) / player.matchesPlayed : 0,
          disciplineIndex: Math.max(0, 10 - (totalCards * 0.5)),
          performanceRating: player.matchesPlayed > 0 ? Math.min(10,
            ((player.totalGoals * 0.4) + 
             (player.totalAssists * 0.3) + 
             (player.manOfMatchCount * 0.2) - 
             (totalCards * 0.1) + 
             (player.matchesPlayed * 0.1)) / Math.max(1, player.matchesPlayed * 0.2)
          ) : 0
        };
      });

      setPlayerStats(playersArray);
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les statistiques des joueurs',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedPlayers = () => {
    let filtered = playerStats;

    // Filtre par équipe
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(player => player.team === selectedTeam);
    }

    // Tri par catégorie sélectionnée
    const category = LEADERBOARD_CATEGORIES.find(cat => cat.id === selectedCategory)!;
    return filtered
      .filter(player => player.matchesPlayed > 0) // Seuls les joueurs ayant joué
      .sort((a, b) => category.getValue(b) - category.getValue(a))
      .slice(0, 20); // Top 20
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1er</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2e</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">🥉 3e</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const getTeamBadge = (team: string) => {
    return team === 'e2d' ? 
      <Badge className="bg-blue-500">E2D</Badge> : 
      <Badge className="bg-purple-500">Phoenix</Badge>;
  };

  const selectedCategoryData = LEADERBOARD_CATEGORIES.find(cat => cat.id === selectedCategory)!;
  const rankedPlayers = getFilteredAndSortedPlayers();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement du classement des joueurs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Classement des Joueurs"
        subtitle="Statistiques individuelles et performances"
      />

      {/* Filtres et catégories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classements et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEADERBOARD_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="season">Cette saison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Podium top 3 */}
      {rankedPlayers.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedCategoryData.icon className={`h-5 w-5 ${selectedCategoryData.color}`} />
              Podium - {selectedCategoryData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankedPlayers.slice(0, 3).map((player, index) => (
                <Card key={player.id} className={`p-4 ${index === 0 ? 'ring-2 ring-yellow-500' : ''}`}>
                  <div className="text-center space-y-3">
                    <div className="flex justify-center">
                      {getRankBadge(index + 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {getTeamBadge(player.team)}
                        {player.position && (
                          <Badge variant="outline">{player.position}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {selectedCategoryData.format(selectedCategoryData.getValue(player))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {player.matchesPlayed} matchs joués
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classement complet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <selectedCategoryData.icon className={`h-5 w-5 ${selectedCategoryData.color}`} />
            Classement Complet - {selectedCategoryData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rang</TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>{selectedCategoryData.name}</TableHead>
                <TableHead>Buts</TableHead>
                <TableHead>Passes</TableHead>
                <TableHead>Matchs</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>HdM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedPlayers.map((player, index) => (
                <TableRow key={player.id} className={index < 3 ? 'bg-muted/30' : ''}>
                  <TableCell>
                    {getRankBadge(index + 1)}
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{getTeamBadge(player.team)}</TableCell>
                  <TableCell>
                    {player.position ? (
                      <Badge variant="outline">{player.position}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    {selectedCategoryData.format(selectedCategoryData.getValue(player))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-green-500" />
                      {player.totalGoals}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      {player.totalAssists}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      {player.matchesPlayed}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        player.performanceRating >= 8 ? 'bg-green-500' :
                        player.performanceRating >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }
                    >
                      {player.performanceRating.toFixed(1)}/10
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {player.manOfMatchCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {player.manOfMatchCount}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {rankedPlayers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Aucun joueur trouvé pour les critères sélectionnés
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Joueurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankedPlayers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur Buteur</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...rankedPlayers.map(p => p.totalGoals), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rankedPlayers.find(p => p.totalGoals === Math.max(...rankedPlayers.map(p => p.totalGoals)))?.name || 'Aucun'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur Passeur</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...rankedPlayers.map(p => p.totalAssists), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rankedPlayers.find(p => p.totalAssists === Math.max(...rankedPlayers.map(p => p.totalAssists)))?.name || 'Aucun'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plus d'HdM</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...rankedPlayers.map(p => p.manOfMatchCount), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rankedPlayers.find(p => p.manOfMatchCount === Math.max(...rankedPlayers.map(p => p.manOfMatchCount)))?.name || 'Aucun'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}