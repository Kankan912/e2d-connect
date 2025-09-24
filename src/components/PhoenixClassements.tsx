import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Users, Star, Calendar, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StatistiqueJoueur {
  id: string;
  membre_id: string;
  matchs_joues: number;
  buts: number;
  passes_decisives: number;
  cartons_jaunes: number;
  cartons_rouges: number;
  arrets_gardien: number;
  note_moyenne: number;
  saison: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixClassements() {
  const { data: statistiques } = useQuery({
    queryKey: ['phoenix-statistiques-joueurs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_statistiques_joueur' as any)
        .select(`
          *,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .order('buts', { ascending: false });
      if (error) throw error;
      return data as any;
    }
  });

  const { data: matchsStats } = useQuery({
    queryKey: ['phoenix-matchs-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_matchs')
        .select('*');
      if (error) throw error;
      
      const matchsJoues = data.filter(m => m.statut === 'termine').length;
      const victoires = data.filter(m => m.score_phoenix > m.score_adverse && m.statut === 'termine').length;
      const nuls = data.filter(m => m.score_phoenix === m.score_adverse && m.statut === 'termine').length;
      const defaites = data.filter(m => m.score_phoenix < m.score_adverse && m.statut === 'termine').length;
      
      return {
        matchsJoues,
        victoires,
        nuls,
        defaites,
        pourcentageVictoires: matchsJoues > 0 ? (victoires / matchsJoues) * 100 : 0
      };
    }
  });

  const meilleurButeur = statistiques?.[0];
  const meilleurPasseur = [...(statistiques || [])].sort((a, b) => b.passes_decisives - a.passes_decisives)[0];
  const joueurLePlusRegulier = [...(statistiques || [])].sort((a, b) => b.matchs_joues - a.matchs_joues)[0];

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "primary" }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Classements et Statistiques Phoenix</h2>
        <p className="text-muted-foreground">Performances de l'équipe et des joueurs</p>
      </div>

      {/* Statistiques de l'équipe */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Matchs joués"
          value={matchsStats?.matchsJoues || 0}
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Victoires"
          value={matchsStats?.victoires || 0}
          subtitle={`${matchsStats?.pourcentageVictoires?.toFixed(1) || 0}% de réussite`}
          icon={Trophy}
          color="success"
        />
        <StatCard
          title="Nuls"
          value={matchsStats?.nuls || 0}
          icon={Target}
          color="warning"
        />
        <StatCard
          title="Défaites"
          value={matchsStats?.defaites || 0}
          icon={TrendingUp}
          color="destructive"
        />
      </div>

      {/* Joueurs remarquables */}
      <div className="grid gap-6 md:grid-cols-3">
        {meilleurButeur && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Meilleur buteur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {meilleurButeur.membres.prenom} {meilleurButeur.membres.nom}
                </p>
                <p className="text-3xl font-bold text-green-500 my-2">
                  {meilleurButeur.buts} buts
                </p>
                <p className="text-sm text-muted-foreground">
                  {meilleurButeur.matchs_joues} matchs joués
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {meilleurPasseur && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-500" />
                Meilleur passeur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {meilleurPasseur.membres.prenom} {meilleurPasseur.membres.nom}
                </p>
                <p className="text-3xl font-bold text-blue-500 my-2">
                  {meilleurPasseur.passes_decisives} passes
                </p>
                <p className="text-sm text-muted-foreground">
                  {meilleurPasseur.buts} buts également
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {joueurLePlusRegulier && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Plus régulier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {joueurLePlusRegulier.membres.prenom} {joueurLePlusRegulier.membres.nom}
                </p>
                <p className="text-3xl font-bold text-purple-500 my-2">
                  {joueurLePlusRegulier.matchs_joues} matchs
                </p>
                <p className="text-sm text-muted-foreground">
                  {joueurLePlusRegulier.buts} buts, {joueurLePlusRegulier.passes_decisives} passes
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Classement complet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classement général des joueurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistiques?.map((stat, index) => (
              <div key={stat.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {stat.membres.prenom} {stat.membres.nom}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.matchs_joues} matchs joués
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-500" />
                      {stat.buts}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-blue-500" />
                      {stat.passes_decisives}
                    </span>
                    {stat.cartons_jaunes > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-sm" />
                        {stat.cartons_jaunes}
                      </span>
                    )}
                    {stat.cartons_rouges > 0 && (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        {stat.cartons_rouges}
                      </span>
                    )}
                  </div>
                  {stat.note_moyenne && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: {stat.note_moyenne.toFixed(1)}/10
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {(!statistiques || statistiques.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Aucune statistique disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}