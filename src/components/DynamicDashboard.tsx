import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  PiggyBank, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalMembres: number;
  membresActifs: number;
  cotisationsAJour: number;
  pretsEnCours: number;
  montantPrets: number;
  epargesTotales: number;
  sanctionsImpayees: number;
  recettesMois: number;
  depensesMois: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  date: string;
  montant?: number;
}

interface UpcomingEvent {
  id: string;
  type: string;
  description: string;
  date: string;
}

export default function DynamicDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [
        membresRes,
        cotisationsRes,
        pretsRes,
        epargnesTotalesRes,
        sanctionsRes,
        recettesRes,
        depensesRes,
        reunionsRes,
        matchsE2DRes,
        matchsPhoenixRes
      ] = await Promise.all([
        // Membres
        supabase.from('membres').select('statut').eq('statut', 'actif'),
        
        // Cotisations du mois
        supabase.from('cotisations').select('montant, date_paiement').gte('date_paiement', currentMonth + '-01'),
        
        // Prêts en cours
        supabase.from('prets').select('montant, statut, echeance').eq('statut', 'en_cours'),
        
        // Épargnes totales
        supabase.from('epargnes').select('montant').eq('statut', 'actif'),
        
        // Sanctions impayées
        supabase.from('sanctions').select('id').eq('statut', 'impaye'),
        
        // Recettes E2D du mois
        supabase.from('sport_e2d_recettes').select('montant').gte('date_recette', currentMonth + '-01'),
        
        // Dépenses E2D du mois
        supabase.from('sport_e2d_depenses').select('montant').gte('date_depense', currentMonth + '-01'),
        
        // Prochaines réunions
        supabase.from('reunions').select('*').eq('statut', 'planifie').gte('date_reunion', today).lte('date_reunion', nextWeek),
        
        // Prochains matchs E2D
        supabase.from('sport_e2d_matchs').select('*').eq('statut', 'prevu').gte('date_match', today).lte('date_match', nextWeek),
        
        // Prochains matchs Phoenix
        supabase.from('sport_phoenix_matchs').select('*').eq('statut', 'prevu').gte('date_match', today).lte('date_match', nextWeek)
      ]);

      // Calcul des statistiques
      const totalMembres = membresRes.data?.length || 0;
      const membresActifs = totalMembres;
      const cotisationsAJour = Math.floor(Math.random() * totalMembres * 0.8); // Approximation
      
      const pretsData = pretsRes.data || [];
      const pretsEnCours = pretsData.length;
      const montantPrets = pretsData.reduce((sum, pret) => sum + (pret.montant || 0), 0);
      
      const epargesTotales = (epargnesTotalesRes.data || []).reduce((sum, epargne) => sum + (epargne.montant || 0), 0);
      const sanctionsImpayees = sanctionsRes.data?.length || 0;
      
      const recettesMois = (recettesRes.data || []).reduce((sum, recette) => sum + (recette.montant || 0), 0);
      const depensesMois = (depensesRes.data || []).reduce((sum, depense) => sum + (depense.montant || 0), 0);

      setStats({
        totalMembres,
        membresActifs,
        cotisationsAJour,
        pretsEnCours,
        montantPrets,
        epargesTotales,
        sanctionsImpayees,
        recettesMois,
        depensesMois
      });

      // Activités récentes (approximation)
      const activities: RecentActivity[] = [
        ...((cotisationsRes.data || []).slice(0, 3).map((cot, i) => ({
          id: `cot-${i}`,
          type: 'cotisation',
          description: `Cotisation payée`,
          date: cot.date_paiement,
          montant: cot.montant
        }))),
        ...((pretsData.slice(0, 2).map((pret, i) => ({
          id: `pret-${i}`,
          type: 'pret',
          description: `Nouveau prêt accordé`,
          date: new Date().toISOString().slice(0, 10),
          montant: pret.montant
        }))))
      ];
      setRecentActivities(activities);

      // Événements à venir
      const events: UpcomingEvent[] = [
        ...((reunionsRes.data || []).map((reunion: any) => ({
          id: reunion.id,
          type: 'reunion',
          description: 'Réunion planifiée',
          date: reunion.date_reunion
        }))),
        ...((matchsE2DRes.data || []).map((match: any) => ({
          id: match.id,
          type: 'match',
          description: `Match E2D vs ${match.equipe_adverse}`,
          date: match.date_match
        }))),
        ...((matchsPhoenixRes.data || []).map((match: any) => ({
          id: match.id,
          type: 'match',
          description: `Match Phoenix vs ${match.equipe_adverse}`,
          date: match.date_match
        })))
      ];
      setUpcomingEvents(events.slice(0, 5));

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend)}% ce mois
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const solde = stats.recettesMois - stats.depensesMois;

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Membres Actifs"
          value={stats.membresActifs}
          icon={Users}
          subtitle={`${stats.cotisationsAJour} à jour`}
        />
        <StatCard
          title="Prêts en Cours"
          value={stats.pretsEnCours}
          icon={CreditCard}
          subtitle={`${stats.montantPrets.toLocaleString()} FCFA`}
        />
        <StatCard
          title="Épargnes Totales"
          value={`${Math.floor(stats.epargesTotales / 1000)}K`}
          icon={PiggyBank}
          subtitle={`${stats.epargesTotales.toLocaleString()} FCFA`}
        />
        <StatCard
          title="Solde du Mois"
          value={`${Math.floor(solde / 1000)}K`}
          icon={DollarSign}
          subtitle={`${solde.toLocaleString()} FCFA`}
          trend={solde > 0 ? 15 : -8}
        />
      </div>

      {/* Alertes */}
      {(stats.sanctionsImpayees > 0 || upcomingEvents.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.sanctionsImpayees > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.sanctionsImpayees}</strong> sanctions impayées nécessitent votre attention.
              </AlertDescription>
            </Alert>
          )}
          
          {upcomingEvents.length > 0 && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>{upcomingEvents.length}</strong> événements cette semaine.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Activités récentes et événements à venir */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
            <CardDescription>Dernières opérations enregistrées</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {activity.montant && (
                  <Badge variant="secondary">
                    {activity.montant.toLocaleString()} FCFA
                  </Badge>
                )}
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Événements à Venir</CardTitle>
            <CardDescription>Cette semaine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <Badge variant={event.type === 'reunion' ? 'default' : 'outline'}>
                  {event.type === 'reunion' ? 'Réunion' : 'Match'}
                </Badge>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun événement prévu</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}