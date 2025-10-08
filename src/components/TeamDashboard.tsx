import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Shield, Users, TrendingUp, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TeamDashboardProps {
  team: 'jaune' | 'rouge';
}

export default function TeamDashboard({ team }: TeamDashboardProps) {
  const { data: matchs } = useQuery({
    queryKey: ['team-matchs', team],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_matchs')
        .select('*')
        .ilike('equipe_adverse', `%${team}%`)
        .order('date_match', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: statistics } = useQuery({
    queryKey: ['team-statistics', team],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_statistics')
        .select(`
          *,
          membres!inner(equipe)
        `)
        .eq('membres.equipe', team);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: membres } = useQuery({
    queryKey: ['team-members', team],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('equipe_jaune_rouge', team === 'jaune' ? 'Jaune' : 'Rouge')
        .eq('est_membre_e2d', true)
        .eq('statut', 'actif');
      if (error) throw error;
      return data || [];
    }
  });

  // Calculs des statistiques
  const totalMatchs = matchs?.length || 0;
  const matchsTermines = matchs?.filter(m => m.statut === 'termine') || [];
  const victories = matchsTermines.filter(m => 
    (m.score_e2d || 0) > (m.score_adverse || 0)
  ).length;
  const defeats = matchsTermines.filter(m => 
    (m.score_e2d || 0) < (m.score_adverse || 0)
  ).length;
  const draws = matchsTermines.filter(m => 
    (m.score_e2d || 0) === (m.score_adverse || 0)
  ).length;

  const totalGoals = statistics?.reduce((sum, stat) => sum + (stat.goals || 0), 0) || 0;
  const totalCards = statistics?.reduce((sum, stat) => 
    sum + (stat.yellow_cards || 0) + (stat.red_cards || 0), 0) || 0;

  const winRate = matchsTermines.length > 0 ? (victories / matchsTermines.length) * 100 : 0;

  const teamColor = team === 'jaune' ? 'text-yellow-500' : 'text-red-500';
  const teamBgColor = team === 'jaune' ? 'bg-yellow-100 border-yellow-300' : 'bg-red-100 border-red-300';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${team === 'jaune' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        <h2 className={`text-2xl font-bold ${teamColor}`}>
          Équipe {team.charAt(0).toUpperCase() + team.slice(1)}
        </h2>
        <Badge variant="outline" className={teamBgColor}>
          {membres?.length || 0} joueurs
        </Badge>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victoires</CardTitle>
            <Trophy className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{victories}</div>
            <p className="text-xs text-muted-foreground">
              {winRate.toFixed(1)}% de réussite
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Défaites</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defeats}</div>
            <p className="text-xs text-muted-foreground">
              Sur {matchsTermines.length} matchs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuls</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{draws}</div>
            <p className="text-xs text-muted-foreground">Équilibre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buts marqués</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {matchsTermines.length > 0 ? (totalGoals / matchsTermines.length).toFixed(1) : 0} par match
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Derniers Matchs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchsTermines.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {matchsTermines.slice(0, 5).map((match) => {
                const result = (match.score_e2d || 0) > (match.score_adverse || 0) ? 'W' : 
                              (match.score_e2d || 0) < (match.score_adverse || 0) ? 'L' : 'D';
                const resultColor = result === 'W' ? 'bg-green-500' : 
                                   result === 'L' ? 'bg-red-500' : 'bg-blue-500';
                
                return (
                  <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={`${resultColor} text-white w-8 h-8 rounded-full flex items-center justify-center`}>
                        {result}
                      </Badge>
                      <div>
                        <p className="font-medium">vs {match.equipe_adverse}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(match.date_match).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {match.score_e2d} - {match.score_adverse}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Aucun match terminé
            </p>
          )}
        </CardContent>
      </Card>

      {/* Joueurs de l'équipe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Effectif de l'équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membres && membres.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {membres.map((membre) => (
                <div key={membre.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{membre.prenom} {membre.nom}</p>
                  <p className="text-sm text-muted-foreground">
                    {membre.telephone}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Aucun joueur assigné à cette équipe
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}