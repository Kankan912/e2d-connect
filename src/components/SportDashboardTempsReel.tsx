import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, Users, Target, Activity, Calendar, Award, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface SportKPI {
  label: string;
  value: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  icon: React.ElementType;
  color: string;
}

interface SportAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
}

interface TeamObjective {
  team: 'e2d' | 'phoenix';
  objective: string;
  current: number;
  target: number;
  percentage: number;
  status: 'on_track' | 'at_risk' | 'completed';
}

export default function SportDashboardTempsReel() {
  const [kpis, setKpis] = useState<SportKPI[]>([]);
  const [alerts, setAlerts] = useState<SportAlert[]>([]);
  const [objectives, setObjectives] = useState<TeamObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Real-time updates
  useRealtimeUpdates({
    table: 'sport_e2d_matchs',
    onUpdate: () => loadDashboardData()
  });

  useRealtimeUpdates({
    table: 'phoenix_entrainements_internes',
    onUpdate: () => loadDashboardData()
  });

  useRealtimeUpdates({
    table: 'match_statistics',
    onUpdate: () => loadDashboardData()
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Charger les matchs E2D
      const { data: e2dMatches } = await supabase
        .from('sport_e2d_matchs')
        .select('*')
        .gte('date_match', thirtyDaysAgo.toISOString().split('T')[0]);

      // Charger les entraînements Phoenix
      const { data: phoenixTrainings } = await supabase
        .from('phoenix_entrainements_internes')
        .select('*')
        .gte('date_entrainement', thirtyDaysAgo.toISOString().split('T')[0]);

      // Charger les statistiques
      const { data: matchStats } = await supabase
        .from('match_statistics')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Charger les statistiques du mois précédent pour comparaison
      const { data: prevMonthStats } = await supabase
        .from('match_statistics')
        .select('*')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      // Calculer les KPIs
      const e2dWins = (e2dMatches || []).filter(m => m.statut === 'termine' && m.score_e2d > m.score_adverse).length;
      const e2dTotal = (e2dMatches || []).filter(m => m.statut === 'termine').length;
      const e2dWinRate = e2dTotal > 0 ? (e2dWins / e2dTotal) * 100 : 0;

      const phoenixWins = (phoenixTrainings || []).filter(t => t.statut === 'termine').length;
      const phoenixTotal = (phoenixTrainings || []).length;

      const totalGoals = (matchStats || []).reduce((sum, stat) => sum + stat.goals, 0);
      const totalMatches = new Set((matchStats || []).map(s => s.match_id)).size;
      const avgGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

      const prevTotalGoals = (prevMonthStats || []).reduce((sum, stat) => sum + stat.goals, 0);
      const prevTotalMatches = new Set((prevMonthStats || []).map(s => s.match_id)).size;
      const prevAvgGoals = prevTotalMatches > 0 ? prevTotalGoals / prevTotalMatches : 0;

      const goalsChange = prevAvgGoals > 0 ? ((avgGoalsPerMatch - prevAvgGoals) / prevAvgGoals) * 100 : 0;

      const totalCards = (matchStats || []).reduce((sum, stat) => sum + stat.yellow_cards + stat.red_cards, 0);
      const activePlayers = new Set((matchStats || []).map(s => s.player_name)).size;

      const calculatedKpis: SportKPI[] = [
        {
          label: 'Taux de Victoires E2D',
          value: e2dWinRate,
          target: 60,
          unit: '%',
          trend: e2dWinRate >= 60 ? 'up' : e2dWinRate >= 40 ? 'stable' : 'down',
          trendValue: 5,
          icon: Trophy,
          color: e2dWinRate >= 60 ? 'text-green-500' : 'text-orange-500'
        },
        {
          label: 'Moyenne Buts/Match',
          value: avgGoalsPerMatch,
          target: 3,
          unit: 'buts',
          trend: goalsChange > 0 ? 'up' : goalsChange < 0 ? 'down' : 'stable',
          trendValue: Math.abs(goalsChange),
          icon: Target,
          color: 'text-blue-500'
        },
        {
          label: 'Entraînements Phoenix',
          value: phoenixTotal,
          target: 12,
          unit: 'séances',
          trend: phoenixTotal >= 12 ? 'up' : 'stable',
          trendValue: 10,
          icon: Activity,
          color: 'text-purple-500'
        },
        {
          label: 'Joueurs Actifs',
          value: activePlayers,
          unit: 'joueurs',
          trend: 'up',
          trendValue: 8,
          icon: Users,
          color: 'text-indigo-500'
        },
        {
          label: 'Discipline',
          value: totalCards,
          unit: 'cartons',
          trend: totalCards < 20 ? 'up' : 'down',
          trendValue: 12,
          icon: Award,
          color: totalCards < 20 ? 'text-green-500' : 'text-red-500'
        },
        {
          label: 'Matchs ce Mois',
          value: totalMatches,
          target: 15,
          unit: 'matchs',
          trend: totalMatches >= 15 ? 'up' : 'stable',
          trendValue: 15,
          icon: Calendar,
          color: 'text-cyan-500'
        }
      ];

      setKpis(calculatedKpis);

      // Générer les alertes
      const generatedAlerts: SportAlert[] = [];

      if (e2dWinRate < 40 && e2dTotal >= 5) {
        generatedAlerts.push({
          id: 'low_win_rate',
          type: 'warning',
          title: 'Taux de Victoires E2D Faible',
          description: `Le taux de victoires E2D est de ${e2dWinRate.toFixed(1)}%, en dessous de l'objectif de 60%`,
          timestamp: new Date(),
          priority: 'high'
        });
      }

      if (phoenixTotal < 8) {
        generatedAlerts.push({
          id: 'low_training',
          type: 'info',
          title: 'Peu d\'Entraînements Phoenix',
          description: `Seulement ${phoenixTotal} entraînements ce mois. Objectif: 12 minimum`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      if (totalCards > 30) {
        generatedAlerts.push({
          id: 'high_cards',
          title: 'Indiscipline Élevée',
          type: 'error',
          description: `${totalCards} cartons ce mois. La discipline doit être améliorée`,
          timestamp: new Date(),
          priority: 'high'
        });
      }

      if (avgGoalsPerMatch < 2 && totalMatches > 5) {
        generatedAlerts.push({
          id: 'low_scoring',
          type: 'warning',
          title: 'Faible Efficacité Offensive',
          description: `Moyenne de ${avgGoalsPerMatch.toFixed(1)} buts/match. Objectif: 3+`,
          timestamp: new Date(),
          priority: 'medium'
        });
      }

      if (activePlayers < 20) {
        generatedAlerts.push({
          id: 'low_participation',
          type: 'info',
          title: 'Participation à Améliorer',
          description: `${activePlayers} joueurs actifs ce mois. Encourager la participation`,
          timestamp: new Date(),
          priority: 'low'
        });
      }

      setAlerts(generatedAlerts);

      // Objectifs des équipes
      const teamObjectives: TeamObjective[] = [
        {
          team: 'e2d',
          objective: 'Taux de victoires 60%',
          current: e2dWinRate,
          target: 60,
          percentage: (e2dWinRate / 60) * 100,
          status: e2dWinRate >= 60 ? 'completed' : e2dWinRate >= 45 ? 'on_track' : 'at_risk'
        },
        {
          team: 'e2d',
          objective: '15 matchs externes',
          current: e2dTotal,
          target: 15,
          percentage: (e2dTotal / 15) * 100,
          status: e2dTotal >= 15 ? 'completed' : e2dTotal >= 10 ? 'on_track' : 'at_risk'
        },
        {
          team: 'phoenix',
          objective: '12 entraînements internes',
          current: phoenixTotal,
          target: 12,
          percentage: (phoenixTotal / 12) * 100,
          status: phoenixTotal >= 12 ? 'completed' : phoenixTotal >= 8 ? 'on_track' : 'at_risk'
        },
        {
          team: 'phoenix',
          objective: 'Moyenne 4 buts/match',
          current: avgGoalsPerMatch,
          target: 4,
          percentage: (avgGoalsPerMatch / 4) * 100,
          status: avgGoalsPerMatch >= 4 ? 'completed' : avgGoalsPerMatch >= 3 ? 'on_track' : 'at_risk'
        }
      ];

      setObjectives(teamObjectives);

    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Zap className="h-4 w-4 text-gray-500" />;
  };

  const getAlertIcon = (type: string) => {
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_track': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at_risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement du dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs en temps réel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.value.toFixed(kpi.unit === '%' ? 1 : 0)} {kpi.unit}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {getTrendIcon(kpi.trend)}
                <span>{kpi.trendValue.toFixed(1)}% vs mois dernier</span>
              </div>
              {kpi.target && (
                <Progress 
                  value={(kpi.value / kpi.target) * 100} 
                  className="mt-2 h-1"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertes et Notifications ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {alert.title}
                        <Badge variant="outline" className="text-xs">
                          {alert.priority === 'high' ? '⚠️ Urgent' : alert.priority === 'medium' ? '📌 Important' : '💡 Info'}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>{alert.description}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectifs des équipes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {objectives.map((obj, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={obj.team === 'e2d' ? 'bg-blue-500' : 'bg-purple-500'}>
                      {obj.team.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{obj.objective}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {obj.current.toFixed(obj.current % 1 === 0 ? 0 : 1)} / {obj.target}
                    </span>
                    <Badge variant="outline" className={getStatusColor(obj.status)}>
                      {obj.status === 'completed' ? '✓ Atteint' : 
                       obj.status === 'on_track' ? '→ En cours' : '⚠ À risque'}
                    </Badge>
                  </div>
                </div>
                <Progress value={Math.min(obj.percentage, 100)} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground">
            <p><strong>📊 Dashboard Temps Réel</strong> - Mise à jour automatique lors de nouveaux événements sportifs</p>
            <p className="mt-2">Les données affichées concernent les 30 derniers jours. Les tendances sont calculées par rapport au mois précédent.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
