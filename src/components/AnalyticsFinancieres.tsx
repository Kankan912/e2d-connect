import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, Target, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from './LogoHeader';

interface AnalyticsData {
  totalCotisations: number;
  totalEpargnes: number;
  totalPrets: number;
  totalAides: number;
  totalSanctions: number;
  membresActifs: number;
  tendanceCotisations: number;
  tendanceEpargnes: number;
  repartitionCotisations: Array<{ name: string; value: number; color: string }>;
  evolutionMensuelle: Array<{ mois: string; cotisations: number; epargnes: number; prets: number; aides: number }>;
  performanceMembres: Array<{ membre: string; cotisations: number; epargnes: number; score: number }>;
  objectifs: Array<{ type: string; objectif: number; actuel: number; progression: number }>;
}

export const AnalyticsFinancieres: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('annee');
  const [filtreType, setFiltreType] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [periode, filtreType, dateDebut, dateFin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calcul des dates selon la période
      const now = new Date();
      let startDate = new Date();
      
      switch (periode) {
        case 'mois':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'trimestre':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'semestre':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case 'annee':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'personnalise':
          if (dateDebut && dateFin) {
            startDate = new Date(dateDebut);
          }
          break;
      }

      const dateFilter = periode === 'personnalise' && dateDebut && dateFin
        ? `and created_at >= '${dateDebut}' and created_at <= '${dateFin}'`
        : `and created_at >= '${startDate.toISOString()}'`;

      // Récupération des données de base
      const [cotisationsRes, epargnessRes, pretsRes, aidesRes, sanctionsRes, membresRes] = await Promise.all([
        supabase.from('cotisations').select('montant, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('epargnes').select('montant, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('prets').select('montant, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('aides').select('montant, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('sanctions').select('montant, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('membres').select('id, statut').eq('statut', 'actif')
      ]);

      // Calculs des totaux
      const totalCotisations = cotisationsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalEpargnes = epargnessRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalPrets = pretsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalAides = aidesRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const totalSanctions = sanctionsRes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const membresActifs = membresRes.data?.length || 0;

      // Calcul des tendances (comparaison avec période précédente)
      const previousStartDate = new Date(startDate);
      const periodDiff = now.getTime() - startDate.getTime();
      previousStartDate.setTime(startDate.getTime() - periodDiff);

      const [prevCotisations, prevEpargnes] = await Promise.all([
        supabase.from('cotisations').select('montant').gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString()),
        supabase.from('epargnes').select('montant').gte('created_at', previousStartDate.toISOString()).lt('created_at', startDate.toISOString())
      ]);

      const prevTotalCotisations = prevCotisations.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;
      const prevTotalEpargnes = prevEpargnes.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0;

      const tendanceCotisations = prevTotalCotisations > 0 
        ? ((totalCotisations - prevTotalCotisations) / prevTotalCotisations) * 100 
        : 0;
      const tendanceEpargnes = prevTotalEpargnes > 0 
        ? ((totalEpargnes - prevTotalEpargnes) / prevTotalEpargnes) * 100 
        : 0;

      // Répartition des cotisations par type
      const { data: typesCotisations } = await supabase
        .from('cotisations')
        .select(`
          montant,
          cotisations_types(nom)
        `)
        .gte('created_at', startDate.toISOString());

      const repartitionMap = new Map();
      typesCotisations?.forEach(cotisation => {
        const typeName = cotisation.cotisations_types?.nom || 'Autre';
        repartitionMap.set(typeName, (repartitionMap.get(typeName) || 0) + Number(cotisation.montant));
      });

      const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];
      const repartitionCotisations = Array.from(repartitionMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));

      // Évolution mensuelle
      const evolutionMensuelle = [];
      for (let i = 11; i >= 0; i--) {
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

        evolutionMensuelle.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          cotisations: cotisationsMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0,
          epargnes: epargnesmois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0,
          prets: pretsMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0,
          aides: aidesMois.data?.reduce((sum, item) => sum + Number(item.montant), 0) || 0
        });
      }

      // Performance des membres (top contributeurs)
      const { data: membresPerformance } = await supabase
        .from('cotisations')
        .select(`
          montant,
          membres(nom, prenom)
        `)
        .gte('created_at', startDate.toISOString());

      const { data: epargnesmembres } = await supabase
        .from('epargnes')
        .select(`
          montant,
          membres(nom, prenom)
        `)
        .gte('created_at', startDate.toISOString());

      const performanceMap = new Map();
      membresPerformance?.forEach(cotisation => {
        if (cotisation.membres) {
          const membreName = `${cotisation.membres.prenom} ${cotisation.membres.nom}`;
          const current = performanceMap.get(membreName) || { cotisations: 0, epargnes: 0 };
          current.cotisations += Number(cotisation.montant);
          performanceMap.set(membreName, current);
        }
      });

      epargnesmembres?.forEach(epargne => {
        if (epargne.membres) {
          const membreName = `${epargne.membres.prenom} ${epargne.membres.nom}`;
          const current = performanceMap.get(membreName) || { cotisations: 0, epargnes: 0 };
          current.epargnes += Number(epargne.montant);
          performanceMap.set(membreName, current);
        }
      });

      const performanceMembres = Array.from(performanceMap.entries())
        .map(([membre, data]) => ({
          membre,
          cotisations: data.cotisations,
          epargnes: data.epargnes,
          score: data.cotisations + data.epargnes
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      // Objectifs fictifs (à adapter selon vos besoins)
      const objectifs = [
        {
          type: 'Cotisations annuelles',
          objectif: 1000000,
          actuel: totalCotisations,
          progression: (totalCotisations / 1000000) * 100
        },
        {
          type: 'Épargnes annuelles',
          objectif: 500000,
          actuel: totalEpargnes,
          progression: (totalEpargnes / 500000) * 100
        },
        {
          type: 'Membres actifs',
          objectif: 100,
          actuel: membresActifs,
          progression: (membresActifs / 100) * 100
        }
      ];

      setData({
        totalCotisations,
        totalEpargnes,
        totalPrets,
        totalAides,
        totalSanctions,
        membresActifs,
        tendanceCotisations,
        tendanceEpargnes,
        repartitionCotisations,
        evolutionMensuelle,
        performanceMembres,
        objectifs
      });

    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données analytiques.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Implémentation de l'export des données
    toast({
      title: "Export en cours",
      description: "Les données sont en cours d'export...",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <LogoHeader title="Analytics Financières" subtitle="Tableau de bord analytique" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
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
      <LogoHeader title="Analytics Financières" subtitle="Tableau de bord analytique et reporting avancé" />
      
      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="periode">Période</Label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mois">Dernier mois</SelectItem>
                  <SelectItem value="trimestre">Dernier trimestre</SelectItem>
                  <SelectItem value="semestre">Dernier semestre</SelectItem>
                  <SelectItem value="annee">Dernière année</SelectItem>
                  <SelectItem value="personnalise">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {periode === 'personnalise' && (
              <>
                <div>
                  <Label htmlFor="dateDebut">Date début</Label>
                  <Input
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dateFin">Date fin</Label>
                  <Input
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="filtreType">Type de données</Label>
              <Select value={filtreType} onValueChange={setFiltreType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes</SelectItem>
                  <SelectItem value="cotisations">Cotisations</SelectItem>
                  <SelectItem value="epargnes">Épargnes</SelectItem>
                  <SelectItem value="prets">Prêts</SelectItem>
                  <SelectItem value="aides">Aides</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={exportData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cotisations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCotisations.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.tendanceCotisations >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              {Math.abs(data.tendanceCotisations).toFixed(1)}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Épargnes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEpargnes.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.tendanceEpargnes >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              {Math.abs(data.tendanceEpargnes).toFixed(1)}% vs période précédente
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêts Accordés</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPrets.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">Montant total des prêts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.membresActifs}</div>
            <p className="text-xs text-muted-foreground">Membres avec statut actif</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="repartition">Répartition</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="objectifs">Objectifs</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution Mensuelle des Flux Financiers</CardTitle>
              <CardDescription>Tendances des cotisations, épargnes, prêts et aides sur 12 mois</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                  <Legend />
                  <Line type="monotone" dataKey="cotisations" stroke="hsl(var(--primary))" strokeWidth={2} name="Cotisations" />
                  <Line type="monotone" dataKey="epargnes" stroke="hsl(var(--secondary))" strokeWidth={2} name="Épargnes" />
                  <Line type="monotone" dataKey="prets" stroke="hsl(var(--accent))" strokeWidth={2} name="Prêts" />
                  <Line type="monotone" dataKey="aides" stroke="hsl(var(--destructive))" strokeWidth={2} name="Aides" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repartition" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Cotisations par Type</CardTitle>
                <CardDescription>Distribution des montants collectés</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.repartitionCotisations}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.repartitionCotisations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flux Financiers Cumulés</CardTitle>
                <CardDescription>Vue d'ensemble des mouvements financiers</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.evolutionMensuelle}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} FCFA`} />
                    <Area type="monotone" dataKey="cotisations" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="epargnes" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Contributeurs</CardTitle>
              <CardDescription>Classement des membres les plus actifs financièrement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performanceMembres.map((membre, index) => (
                  <div key={membre.membre} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{membre.membre}</p>
                        <p className="text-sm text-muted-foreground">
                          Cotisations: {membre.cotisations.toLocaleString()} FCFA | 
                          Épargnes: {membre.epargnes.toLocaleString()} FCFA
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{membre.score.toLocaleString()} FCFA</p>
                      <p className="text-sm text-muted-foreground">Score total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objectifs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.objectifs.map((objectif, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-sm">{objectif.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Actuel: {objectif.actuel.toLocaleString()}</span>
                    <span>Objectif: {objectif.objectif.toLocaleString()}</span>
                  </div>
                  <Progress value={Math.min(objectif.progression, 100)} className="h-2" />
                  <div className="text-center">
                    <Badge variant={objectif.progression >= 100 ? "default" : objectif.progression >= 75 ? "secondary" : "outline"}>
                      {objectif.progression.toFixed(1)}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};