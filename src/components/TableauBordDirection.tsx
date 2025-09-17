import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle, 
  Calendar, Target, Award, Activity, Bell, CheckCircle2,
  XCircle, Clock, Euro, UserCheck, UserX 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from './LogoHeader';

interface DashboardData {
  // KPIs financiers
  totalTresorerie: number;
  evolutionTresorerie: number;
  totalCotisations: number;
  totalEpargnes: number;
  totalPrets: number;
  totalAides: number;
  soldeTresorerie: number;
  
  // KPIs membres
  totalMembres: number;
  membresActifs: number;
  nouveauxMembres: number;
  tauxActivite: number;
  
  // KPIs activités
  reunionsPlaniifiees: number;
  reunionsTerminees: number;
  matchsPrevus: number;
  matchsJoues: number;
  
  // Alertes et notifications
  alertes: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    count?: number;
  }>;
  
  // Données graphiques
  evolutionMensuelle: Array<{
    mois: string;
    entrees: number;
    sorties: number;
    solde: number;
  }>;
  
  repartitionDepenses: Array<{
    categorie: string;
    montant: number;
    pourcentage: number;
    color: string;
  }>;
  
  performanceEquipes: Array<{
    equipe: string;
    matchsJoues: number;
    victoires: number;
    defaites: number;
    nuls: number;
    pourcentageVictoires: number;
  }>;
  
  activiteRecente: Array<{
    date: string;
    type: string;
    description: string;
    montant?: number;
    membre?: string;
  }>;
}

export const TableauBordDirection: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    // Actualisation automatique toutes les 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Données financières
      const [
        cotisationsRes, epargnessRes, pretsRes, aidesRes, sanctionsRes,
        cotisationsLastMonthRes, epargnessLastMonthRes,
        membresRes, nouveauxMembresRes,
        reunionsRes, matchsE2DRes, matchsPhoenixRes
      ] = await Promise.all([
        // Données financières actuelles
        supabase.from('cotisations').select('montant, created_at').gte('created_at', startOfYear.toISOString()),
        supabase.from('epargnes').select('montant, created_at').gte('created_at', startOfYear.toISOString()),
        supabase.from('prets').select('montant, statut, created_at').gte('created_at', startOfYear.toISOString()),
        supabase.from('aides').select('montant, created_at').gte('created_at', startOfYear.toISOString()),
        supabase.from('sanctions').select('montant, created_at').gte('created_at', startOfYear.toISOString()),
        
        // Données du mois précédent pour comparaison
        supabase.from('cotisations').select('montant').gte('created_at', lastMonth.toISOString()).lte('created_at', endLastMonth.toISOString()),
        supabase.from('epargnes').select('montant').gte('created_at', lastMonth.toISOString()).lte('created_at', endLastMonth.toISOString()),
        
        // Données membres
        supabase.from('membres').select('id, statut, created_at'),
        supabase.from('membres').select('id').gte('created_at', startOfMonth.toISOString()),
        
        // Données activités
        supabase.from('reunions').select('id, statut, date_reunion'),
        supabase.from('sport_e2d_matchs').select('id, statut, date_match, score_e2d, score_adverse'),
        supabase.from('sport_phoenix_matchs').select('id, statut, date_match, score_phoenix, score_adverse')
      ]);

      // Calculs financiers
      const totalCotisations = cotisationsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalEpargnes = epargnessRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalPrets = pretsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalAides = aidesRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalSanctions = sanctionsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      
      const totalEntrees = totalCotisations + totalEpargnes + totalSanctions;
      const totalSorties = totalPrets + totalAides;
      const soldeTresorerie = totalEntrees - totalSorties;

      // Évolution trésorerie
      const lastMonthCotisations = cotisationsLastMonthRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const lastMonthEpargnes = epargnessLastMonthRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const lastMonthTotal = lastMonthCotisations + lastMonthEpargnes;
      const currentMonthTotal = totalCotisations + totalEpargnes; // Simplification pour l'exemple
      const evolutionTresorerie = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      // Données membres
      const totalMembres = membresRes.data?.length || 0;
      const membresActifs = membresRes.data?.filter(m => m.statut === 'actif').length || 0;
      const nouveauxMembres = nouveauxMembresRes.data?.length || 0;
      const tauxActivite = totalMembres > 0 ? (membresActifs / totalMembres) * 100 : 0;

      // Données activités
      const reunionsPlaniifiees = reunionsRes.data?.filter(r => r.statut === 'planifie').length || 0;
      const reunionsTerminees = reunionsRes.data?.filter(r => r.statut === 'termine').length || 0;
      
      const allMatches = [...(matchsE2DRes.data || []), ...(matchsPhoenixRes.data || [])];
      const matchsPrevus = allMatches.filter(m => m.statut === 'prevu').length;
      const matchsJoues = allMatches.filter(m => m.statut === 'termine').length;

      // Génération des alertes
      const alertes = [];
      
      // Alertes financières
      if (soldeTresorerie < 100000) {
        alertes.push({
          type: 'warning' as const,
          message: 'Trésorerie faible - Attention aux liquidités'
        });
      }
      
      // Alertes membres
      const membresInactifs = totalMembres - membresActifs;
      if (membresInactifs > totalMembres * 0.2) {
        alertes.push({
          type: 'warning' as const,
          message: `${membresInactifs} membres inactifs`,
          count: membresInactifs
        });
      }
      
      // Alertes prêts en retard (simulation)
      const pretsEnCours = pretsRes.data?.filter(p => p.statut === 'en_cours').length || 0;
      if (pretsEnCours > 5) {
        alertes.push({
          type: 'info' as const,
          message: `${pretsEnCours} prêts en cours de remboursement`,
          count: pretsEnCours
        });
      }

      // Évolution mensuelle sur 6 mois
      const evolutionMensuelle = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1);
        const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const [cotisationsMois, epargnesmois, pretsMois, aidesMois] = await Promise.all([
          supabase.from('cotisations').select('montant').gte('created_at', moisDebut.toISOString()).lte('created_at', moisFin.toISOString()),
          supabase.from('epargnes').select('montant').gte('created_at', moisDebut.toISOString()).lte('created_at', moisFin.toISOString()),
          supabase.from('prets').select('montant').gte('created_at', moisDebut.toISOString()).lte('created_at', moisFin.toISOString()),
          supabase.from('aides').select('montant').gte('created_at', moisDebut.toISOString()).lte('created_at', moisFin.toISOString())
        ]);

        const entrees = (cotisationsMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0) +
                       (epargnesmois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0);
        const sorties = (pretsMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0) +
                       (aidesMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0);

        evolutionMensuelle.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
          entrees,
          sorties,
          solde: entrees - sorties
        });
      }

      // Répartition des dépenses
      const repartitionDepenses = [
        {
          categorie: 'Prêts',
          montant: totalPrets,
          pourcentage: totalSorties > 0 ? (totalPrets / totalSorties) * 100 : 0,
          color: 'hsl(var(--primary))'
        },
        {
          categorie: 'Aides',
          montant: totalAides,
          pourcentage: totalSorties > 0 ? (totalAides / totalSorties) * 100 : 0,
          color: 'hsl(var(--secondary))'
        }
      ];

      // Performance des équipes (exemple)
      const performanceEquipes = [
        {
          equipe: 'E2D',
          matchsJoues: matchsE2DRes.data?.filter(m => m.statut === 'termine').length || 0,
          victoires: matchsE2DRes.data?.filter(m => m.statut === 'termine' && (m.score_e2d || 0) > (m.score_adverse || 0)).length || 0,
          defaites: matchsE2DRes.data?.filter(m => m.statut === 'termine' && (m.score_e2d || 0) < (m.score_adverse || 0)).length || 0,
          nuls: matchsE2DRes.data?.filter(m => m.statut === 'termine' && (m.score_e2d || 0) === (m.score_adverse || 0)).length || 0,
          pourcentageVictoires: 0
        },
        {
          equipe: 'Phoenix',
          matchsJoues: matchsPhoenixRes.data?.filter(m => m.statut === 'termine').length || 0,
          victoires: matchsPhoenixRes.data?.filter(m => m.statut === 'termine' && (m.score_phoenix || 0) > (m.score_adverse || 0)).length || 0,
          defaites: matchsPhoenixRes.data?.filter(m => m.statut === 'termine' && (m.score_phoenix || 0) < (m.score_adverse || 0)).length || 0,
          nuls: matchsPhoenixRes.data?.filter(m => m.statut === 'termine' && (m.score_phoenix || 0) === (m.score_adverse || 0)).length || 0,
          pourcentageVictoires: 0
        }
      ];

      // Calcul pourcentage victoires
      performanceEquipes.forEach(equipe => {
        equipe.pourcentageVictoires = equipe.matchsJoues > 0 ? (equipe.victoires / equipe.matchsJoues) * 100 : 0;
      });

      // Activité récente (simulation - à adapter selon vos besoins)
      const activiteRecente = [
        {
          date: new Date().toISOString(),
          type: 'cotisation',
          description: 'Nouvelles cotisations enregistrées',
          montant: 25000
        },
        {
          date: new Date(Date.now() - 86400000).toISOString(),
          type: 'reunion',
          description: 'Réunion mensuelle organisée'
        },
        {
          date: new Date(Date.now() - 172800000).toISOString(),
          type: 'match',
          description: 'Match E2D vs Adversaire'
        }
      ];

      setData({
        totalTresorerie: totalEntrees,
        evolutionTresorerie,
        totalCotisations,
        totalEpargnes,
        totalPrets,
        totalAides,
        soldeTresorerie,
        totalMembres,
        membresActifs,
        nouveauxMembres,
        tauxActivite,
        reunionsPlaniifiees,
        reunionsTerminees,
        matchsPrevus,
        matchsJoues,
        alertes,
        evolutionMensuelle,
        repartitionDepenses,
        performanceEquipes,
        activiteRecente
      });

    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LogoHeader title="Tableau de Bord Direction" subtitle="Vue d'ensemble et pilotage" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <LogoHeader title="Tableau de Bord Direction" subtitle="Vue d'ensemble et pilotage stratégique" />
        <Button onClick={loadDashboardData} disabled={refreshing}>
          <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Alertes importantes */}
      {data.alertes.length > 0 && (
        <div className="space-y-2">
          {data.alertes.map((alerte, index) => (
            <Alert key={index} variant={alerte.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>{alerte.message}</span>
                {alerte.count && <Badge variant="outline">{alerte.count}</Badge>}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* KPIs Financiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trésorerie Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTresorerie.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.evolutionTresorerie >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              {Math.abs(data.evolutionTresorerie).toFixed(1)}% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Net</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.soldeTresorerie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.soldeTresorerie.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">Entrées - Sorties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.membresActifs}/{data.totalMembres}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Progress value={data.tauxActivite} className="w-16 h-2 mr-2" />
              {data.tauxActivite.toFixed(0)}% d'activité
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Membres</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.nouveauxMembres}</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les différentes vues */}
      <Tabs defaultValue="synthese" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="financier">Financier</TabsTrigger>
          <TabsTrigger value="activites">Activités</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="synthese" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution de la Trésorerie</CardTitle>
                <CardDescription>Entrées vs Sorties sur 6 mois</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.evolutionMensuelle}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                    <Legend />
                    <Bar dataKey="entrees" fill="hsl(var(--primary))" name="Entrées" />
                    <Bar dataKey="sorties" fill="hsl(var(--destructive))" name="Sorties" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Dépenses</CardTitle>
                <CardDescription>Distribution des sorties de trésorerie</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.repartitionDepenses}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ categorie, pourcentage }) => `${categorie} ${pourcentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="montant"
                    >
                      {data.repartitionDepenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Dernières actions importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.activiteRecente.map((activite, index) => (
                  <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {activite.type === 'cotisation' && <DollarSign className="h-4 w-4" />}
                        {activite.type === 'reunion' && <Calendar className="h-4 w-4" />}
                        {activite.type === 'match' && <Activity className="h-4 w-4" />}
                      </div>
                      
                      <div>
                        <p className="font-medium">{activite.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activite.date).toLocaleDateString('fr-FR')}
                          {activite.membre && ` • ${activite.membre}`}
                        </p>
                      </div>
                    </div>
                    
                    {activite.montant && (
                      <Badge variant="outline">
                        {activite.montant.toLocaleString()} FCFA
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financier" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cotisations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.totalCotisations.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">Total collecté</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Épargnes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {data.totalEpargnes.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">Total épargné</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prêts Accordés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {data.totalPrets.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">En circulation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aides Distribuées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {data.totalAides.toLocaleString()} FCFA
                </div>
                <p className="text-xs text-muted-foreground">Total versé</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Solde de Trésorerie</CardTitle>
              <CardDescription>Évolution du solde net mensuel</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                  <Line 
                    type="monotone" 
                    dataKey="solde" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Solde"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activites" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réunions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.reunionsTerminees}/{data.reunionsPlaniifiees + data.reunionsTerminees}</div>
                <p className="text-xs text-muted-foreground">Terminées/Prévues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matchs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.matchsJoues}/{data.matchsPrevus + data.matchsJoues}</div>
                <p className="text-xs text-muted-foreground">Joués/Prévus</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux Participation</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.tauxActivite.toFixed(0)}%</div>
                <Progress value={data.tauxActivite} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Croissance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{data.nouveauxMembres}</div>
                <p className="text-xs text-muted-foreground">Nouveaux membres</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.performanceEquipes.map((equipe) => (
              <Card key={equipe.equipe}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Équipe {equipe.equipe}</span>
                    <Badge variant={equipe.pourcentageVictoires >= 50 ? "default" : "secondary"}>
                      {equipe.pourcentageVictoires.toFixed(0)}% victoires
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{equipe.matchsJoues}</p>
                      <p className="text-xs text-muted-foreground">Matchs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{equipe.victoires}</p>
                      <p className="text-xs text-muted-foreground">Victoires</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-600">{equipe.nuls}</p>
                      <p className="text-xs text-muted-foreground">Nuls</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{equipe.defaites}</p>
                      <p className="text-xs text-muted-foreground">Défaites</p>
                    </div>
                  </div>
                  <Progress value={equipe.pourcentageVictoires} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TableauBordDirection;