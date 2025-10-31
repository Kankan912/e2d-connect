import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Users, DollarSign, PiggyBank, Receipt, Download } from "lucide-react";
import { LineChart, Line, PieChart, Pie, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { exportToPDF } from "@/lib/pdfExport";
import { exportToExcel } from "@/lib/excelUtils";

interface AnalyticsData {
  kpis: {
    totalCotisations: number;
    totalEpargnes: number;
    totalPrets: number;
    membresActifs: number;
    tendanceCotisations: number;
    tendanceEpargnes: number;
    tendancePrets: number;
    tendanceMembres: number;
  };
  evolutionMensuelle: Array<{
    mois: string;
    cotisations: number;
    epargnes: number;
    prets: number;
    aides: number;
  }>;
  repartitionCotisations: Array<{
    name: string;
    value: number;
  }>;
  fluxCumules: Array<{
    mois: string;
    entrees: number;
    sorties: number;
  }>;
  topContributeurs: Array<{
    nom: string;
    prenom: string;
    total: number;
    cotisations: number;
    epargnes: number;
  }>;
  objectifs: Array<{
    nom: string;
    cible: number;
    actuel: number;
    progression: number;
    atteint: boolean;
  }>;
}

export function AnalyticsFinancieres() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [periode, setPeriode] = useState<string>("annee");
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  useEffect(() => {
    loadAnalytics();
  }, [periode, dateDebut, dateFin]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculer les dates selon la période
      const now = new Date();
      let startDate = new Date();
      let endDate = now;

      if (periode === "personnalise" && dateDebut && dateFin) {
        startDate = new Date(dateDebut);
        endDate = new Date(dateFin);
      } else {
        switch (periode) {
          case "mois":
            startDate.setMonth(now.getMonth() - 1);
            break;
          case "trimestre":
            startDate.setMonth(now.getMonth() - 3);
            break;
          case "semestre":
            startDate.setMonth(now.getMonth() - 6);
            break;
          case "annee":
          default:
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
      }

      // Récupérer les données
      const [cotisationsRes, epargnesRes, pretsRes, aidesRes, membresRes, typesRes] = await Promise.all([
        supabase.from('cotisations').select('*').gte('date_paiement', startDate.toISOString()).lte('date_paiement', endDate.toISOString()),
        supabase.from('epargnes').select('*').gte('date_depot', startDate.toISOString()).lte('date_depot', endDate.toISOString()),
        supabase.from('prets').select('*').gte('date_pret', startDate.toISOString()).lte('date_pret', endDate.toISOString()),
        supabase.from('aides').select('*').gte('date_allocation', startDate.toISOString()).lte('date_allocation', endDate.toISOString()),
        supabase.from('membres').select('id, nom, prenom, statut'),
        supabase.from('cotisations_types').select('*')
      ]);

      const cotisations = cotisationsRes.data || [];
      const epargnes = epargnesRes.data || [];
      const prets = pretsRes.data || [];
      const aides = aidesRes.data || [];
      const membres = membresRes.data || [];
      const types = typesRes.data || [];

      // Calculer les KPIs
      const totalCotisations = cotisations.reduce((sum, c) => sum + Number(c.montant), 0);
      const totalEpargnes = epargnes.reduce((sum, e) => sum + Number(e.montant), 0);
      const totalPrets = prets.reduce((sum, p) => sum + Number(p.montant), 0);
      const membresActifs = membres.filter(m => m.statut === 'actif').length;

      // Calculer les tendances (comparaison avec période précédente)
      const midDate = new Date((startDate.getTime() + endDate.getTime()) / 2);
      const cotisationsPeriode1 = cotisations.filter(c => new Date(c.date_paiement) < midDate);
      const cotisationsPeriode2 = cotisations.filter(c => new Date(c.date_paiement) >= midDate);
      const tendanceCotisations = cotisationsPeriode1.length > 0 
        ? ((cotisationsPeriode2.length - cotisationsPeriode1.length) / cotisationsPeriode1.length) * 100 
        : 0;

      const epargnesPeriode1 = epargnes.filter(e => new Date(e.date_depot) < midDate);
      const epargnesPeriode2 = epargnes.filter(e => new Date(e.date_depot) >= midDate);
      const tendanceEpargnes = epargnesPeriode1.length > 0
        ? ((epargnesPeriode2.length - epargnesPeriode1.length) / epargnesPeriode1.length) * 100
        : 0;

      const pretsPeriode1 = prets.filter(p => new Date(p.date_pret) < midDate);
      const pretsPeriode2 = prets.filter(p => new Date(p.date_pret) >= midDate);
      const tendancePrets = pretsPeriode1.length > 0
        ? ((pretsPeriode2.length - pretsPeriode1.length) / pretsPeriode1.length) * 100
        : 0;

      // Évolution mensuelle
      const moisMap = new Map<string, any>();
      const mois12 = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        mois12.push({ key, label });
        moisMap.set(key, { mois: label, cotisations: 0, epargnes: 0, prets: 0, aides: 0 });
      }

      cotisations.forEach(c => {
        const key = c.date_paiement.substring(0, 7);
        if (moisMap.has(key)) {
          moisMap.get(key).cotisations += Number(c.montant);
        }
      });

      epargnes.forEach(e => {
        const key = e.date_depot.substring(0, 7);
        if (moisMap.has(key)) {
          moisMap.get(key).epargnes += Number(e.montant);
        }
      });

      prets.forEach(p => {
        const key = p.date_pret.substring(0, 7);
        if (moisMap.has(key)) {
          moisMap.get(key).prets += Number(p.montant);
        }
      });

      aides.forEach(a => {
        const key = a.date_allocation.substring(0, 7);
        if (moisMap.has(key)) {
          moisMap.get(key).aides += Number(a.montant);
        }
      });

      const evolutionMensuelle = Array.from(moisMap.values());

      // Répartition des cotisations par type
      const repartitionMap = new Map<string, number>();
      cotisations.forEach(c => {
        const type = types.find(t => t.id === c.type_cotisation_id);
        const nom = type?.nom || 'Non spécifié';
        repartitionMap.set(nom, (repartitionMap.get(nom) || 0) + Number(c.montant));
      });
      const repartitionCotisations = Array.from(repartitionMap.entries()).map(([name, value]) => ({ name, value }));

      // Flux cumulés
      const fluxCumules = evolutionMensuelle.map(m => ({
        mois: m.mois,
        entrees: m.cotisations + m.epargnes,
        sorties: m.prets + m.aides
      }));

      // Top contributeurs
      const membresContrib = new Map<string, any>();
      cotisations.forEach(c => {
        const membre = membres.find(m => m.id === c.membre_id);
        if (membre) {
          const key = membre.id;
          if (!membresContrib.has(key)) {
            membresContrib.set(key, {
              nom: membre.nom,
              prenom: membre.prenom,
              cotisations: 0,
              epargnes: 0,
              total: 0
            });
          }
          membresContrib.get(key).cotisations += Number(c.montant);
          membresContrib.get(key).total += Number(c.montant);
        }
      });

      epargnes.forEach(e => {
        const membre = membres.find(m => m.id === e.membre_id);
        if (membre) {
          const key = membre.id;
          if (!membresContrib.has(key)) {
            membresContrib.set(key, {
              nom: membre.nom,
              prenom: membre.prenom,
              cotisations: 0,
              epargnes: 0,
              total: 0
            });
          }
          membresContrib.get(key).epargnes += Number(e.montant);
          membresContrib.get(key).total += Number(e.montant);
        }
      });

      const topContributeurs = Array.from(membresContrib.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Objectifs
      const objectifCotisations = 12000000; // 12M FCFA
      const objectifEpargnes = 8000000; // 8M FCFA
      const objectifTresorerie = 5000000; // 5M FCFA
      
      const tresorerieActuelle = totalCotisations + totalEpargnes - totalPrets - aides.reduce((sum, a) => sum + Number(a.montant), 0);

      const objectifs = [
        {
          nom: "Cotisations annuelles",
          cible: objectifCotisations,
          actuel: totalCotisations,
          progression: Math.min((totalCotisations / objectifCotisations) * 100, 100),
          atteint: totalCotisations >= objectifCotisations
        },
        {
          nom: "Épargnes annuelles",
          cible: objectifEpargnes,
          actuel: totalEpargnes,
          progression: Math.min((totalEpargnes / objectifEpargnes) * 100, 100),
          atteint: totalEpargnes >= objectifEpargnes
        },
        {
          nom: "Trésorerie disponible",
          cible: objectifTresorerie,
          actuel: tresorerieActuelle,
          progression: Math.min((tresorerieActuelle / objectifTresorerie) * 100, 100),
          atteint: tresorerieActuelle >= objectifTresorerie
        }
      ];

      setData({
        kpis: {
          totalCotisations,
          totalEpargnes,
          totalPrets,
          membresActifs,
          tendanceCotisations,
          tendanceEpargnes,
          tendancePrets,
          tendanceMembres: 0
        },
        evolutionMensuelle,
        repartitionCotisations,
        fluxCumules,
        topContributeurs,
        objectifs
      });

    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'pdf' | 'excel') => {
    if (!data) return;

    if (format === 'pdf') {
      exportToPDF({
        title: 'Rapport Analytics Financières',
        filename: `analytics-financieres-${new Date().toISOString().split('T')[0]}.pdf`,
        columns: [
          { header: 'Indicateur', dataKey: 'indicateur' },
          { header: 'Valeur', dataKey: 'valeur' },
          { header: 'Tendance', dataKey: 'tendance' }
        ],
        data: [
          { indicateur: 'Cotisations totales', valeur: `${data.kpis.totalCotisations.toLocaleString()} FCFA`, tendance: `${data.kpis.tendanceCotisations.toFixed(1)}%` },
          { indicateur: 'Épargnes totales', valeur: `${data.kpis.totalEpargnes.toLocaleString()} FCFA`, tendance: `${data.kpis.tendanceEpargnes.toFixed(1)}%` },
          { indicateur: 'Prêts totaux', valeur: `${data.kpis.totalPrets.toLocaleString()} FCFA`, tendance: `${data.kpis.tendancePrets.toFixed(1)}%` },
          { indicateur: 'Membres actifs', valeur: data.kpis.membresActifs.toString(), tendance: '-' }
        ]
      });
    } else {
      exportToExcel({
        filename: `analytics-financieres-${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: 'Analytics',
        columns: [
          { header: 'Indicateur', key: 'indicateur', width: 30 },
          { header: 'Valeur', key: 'valeur', width: 20 },
          { header: 'Tendance', key: 'tendance', width: 15 }
        ],
        data: [
          { indicateur: 'Cotisations totales', valeur: data.kpis.totalCotisations, tendance: `${data.kpis.tendanceCotisations.toFixed(1)}%` },
          { indicateur: 'Épargnes totales', valeur: data.kpis.totalEpargnes, tendance: `${data.kpis.tendanceEpargnes.toFixed(1)}%` },
          { indicateur: 'Prêts totaux', valeur: data.kpis.totalPrets, tendance: `${data.kpis.tendancePrets.toFixed(1)}%` },
          { indicateur: 'Membres actifs', valeur: data.kpis.membresActifs, tendance: '-' }
        ]
      });
    }

    toast({
      title: "Export réussi",
      description: `Le fichier ${format.toUpperCase()} a été généré`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Période</label>
          <Select value={periode} onValueChange={setPeriode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Dernier mois</SelectItem>
              <SelectItem value="trimestre">Dernier trimestre</SelectItem>
              <SelectItem value="semestre">Dernier semestre</SelectItem>
              <SelectItem value="annee">Dernière année</SelectItem>
              <SelectItem value="personnalise">Personnalisée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periode === "personnalise" && (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Date début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportData('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportData('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cotisations</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalCotisations.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs mt-1">
              {data.kpis.tendanceCotisations >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              )}
              <span className={data.kpis.tendanceCotisations >= 0 ? "text-success" : "text-destructive"}>
                {Math.abs(data.kpis.tendanceCotisations).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Épargnes</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalEpargnes.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs mt-1">
              {data.kpis.tendanceEpargnes >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-success" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              )}
              <span className={data.kpis.tendanceEpargnes >= 0 ? "text-success" : "text-destructive"}>
                {Math.abs(data.kpis.tendanceEpargnes).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prêts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.totalPrets.toLocaleString()} FCFA</div>
            <div className="flex items-center text-xs mt-1">
              {data.kpis.tendancePrets >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-warning" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-success" />
              )}
              <span className={data.kpis.tendancePrets >= 0 ? "text-warning" : "text-success"}>
                {Math.abs(data.kpis.tendancePrets).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Membres actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.kpis.membresActifs}</div>
            <p className="text-xs text-muted-foreground mt-1">Total des membres actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs d'analyse */}
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
              <CardTitle>Évolution mensuelle des flux financiers</CardTitle>
              <CardDescription>Suivi des cotisations, épargnes, prêts et aides sur 12 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.evolutionMensuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                  <Legend />
                  <Line type="monotone" dataKey="cotisations" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Cotisations" />
                  <Line type="monotone" dataKey="epargnes" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Épargnes" />
                  <Line type="monotone" dataKey="prets" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Prêts" />
                  <Line type="monotone" dataKey="aides" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Aides" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repartition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des cotisations</CardTitle>
                <CardDescription>Par type de cotisation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.repartitionCotisations}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${((entry.value / data.kpis.totalCotisations) * 100).toFixed(1)}%`}
                    >
                      {data.repartitionCotisations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flux financiers cumulés</CardTitle>
                <CardDescription>Entrées vs Sorties</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.fluxCumules}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                    <Legend />
                    <Area type="monotone" dataKey="entrees" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" name="Entrées" />
                    <Area type="monotone" dataKey="sorties" stackId="2" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" name="Sorties" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 contributeurs</CardTitle>
              <CardDescription>Membres les plus actifs financièrement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.topContributeurs} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nom" type="category" width={100} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} FCFA`} />
                  <Legend />
                  <Bar dataKey="cotisations" fill="hsl(var(--chart-1))" name="Cotisations" />
                  <Bar dataKey="epargnes" fill="hsl(var(--chart-2))" name="Épargnes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objectifs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progression vers les objectifs</CardTitle>
              <CardDescription>Objectifs financiers annuels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.objectifs.map((obj, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{obj.nom}</p>
                      <p className="text-sm text-muted-foreground">
                        {obj.actuel.toLocaleString()} / {obj.cible.toLocaleString()} FCFA
                      </p>
                    </div>
                    <Badge variant={obj.atteint ? "default" : "secondary"}>
                      {obj.progression.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={obj.progression} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
