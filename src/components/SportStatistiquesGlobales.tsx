import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

type Periode = 'mois' | 'trimestre' | 'annee';

interface StatsE2D {
  totalMatchs: number;
  victoires: number;
  defaites: number;
  nuls: number;
  butsMarques: number;
  butsEncaisses: number;
}

interface StatsPhoenix {
  totalEntrainements: number;
  victoiresJaune: number;
  victoiresRouge: number;
  membresReguliers: number;
}

export default function SportStatistiquesGlobales() {
  const [periode, setPeriode] = useState<Periode>('mois');
  const [statsE2D, setStatsE2D] = useState<StatsE2D>({
    totalMatchs: 0,
    victoires: 0,
    defaites: 0,
    nuls: 0,
    butsMarques: 0,
    butsEncaisses: 0,
  });
  const [statsPhoenix, setStatsPhoenix] = useState<StatsPhoenix>({
    totalEntrainements: 0,
    victoiresJaune: 0,
    victoiresRouge: 0,
    membresReguliers: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [periode]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (periode) {
      case 'mois':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'trimestre':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'annee':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Stats E2D
      const { data: matchsE2D, error: errorE2D } = await supabase
        .from('sport_e2d_matchs')
        .select('*')
        .gte('date_match', startDate)
        .lte('date_match', endDate);

      if (errorE2D) throw errorE2D;

      const statsE2DCalculees: StatsE2D = {
        totalMatchs: matchsE2D?.length || 0,
        victoires: 0,
        defaites: 0,
        nuls: 0,
        butsMarques: 0,
        butsEncaisses: 0,
      };

      matchsE2D?.forEach((match) => {
        const scoreE2D = match.score_e2d || 0;
        const scoreAdverse = match.score_adverse || 0;

        if (scoreE2D > scoreAdverse) statsE2DCalculees.victoires++;
        else if (scoreE2D < scoreAdverse) statsE2DCalculees.defaites++;
        else statsE2DCalculees.nuls++;

        statsE2DCalculees.butsMarques += scoreE2D;
        statsE2DCalculees.butsEncaisses += scoreAdverse;
      });

      setStatsE2D(statsE2DCalculees);

      // Stats Phoenix
      const entrainementsResult = await (supabase as any)
        .from('phoenix_entrainements_internes')
        .select('*')
        .eq('type_entrainement', 'jaune_rouge')
        .gte('date_entrainement', startDate)
        .lte('date_entrainement', endDate);

      const entrainements = entrainementsResult.data;

      const statsPhoenixCalculees: StatsPhoenix = {
        totalEntrainements: entrainements?.length || 0,
        victoiresJaune: 0,
        victoiresRouge: 0,
        membresReguliers: 0,
      };

      entrainements?.forEach((match) => {
        const scoreJaune = match.score_jaune || 0;
        const scoreRouge = match.score_rouge || 0;

        if (scoreJaune > scoreRouge) statsPhoenixCalculees.victoiresJaune++;
        else if (scoreRouge > scoreJaune) statsPhoenixCalculees.victoiresRouge++;
      });

      // Calculer les membres réguliers (présence > 80%)
      const presencesResult = await (supabase as any)
        .from('phoenix_presences_entrainement')
        .select('membre_id, present')
        .in('entrainement_id', entrainements?.map((e: any) => e.id) || []);
      
      const presences = presencesResult.data;

      const presenceParMembre: { [key: string]: { total: number; present: number } } = {};
      presences?.forEach((p) => {
        if (!presenceParMembre[p.membre_id]) {
          presenceParMembre[p.membre_id] = { total: 0, present: 0 };
        }
        presenceParMembre[p.membre_id].total++;
        if (p.present) presenceParMembre[p.membre_id].present++;
      });

      statsPhoenixCalculees.membresReguliers = Object.values(presenceParMembre).filter(
        (p) => (p.present / p.total) > 0.8
      ).length;

      setStatsPhoenix(statsPhoenixCalculees);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des statistiques');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const performanceE2DData = [
    { name: 'Victoires', valeur: statsE2D.victoires },
    { name: 'Défaites', valeur: statsE2D.defaites },
    { name: 'Nuls', valeur: statsE2D.nuls },
  ];

  const comparisonPhoenixData = [
    { name: 'Jaune', victoires: statsPhoenix.victoiresJaune },
    { name: 'Rouge', victoires: statsPhoenix.victoiresRouge },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Statistiques Globales Sport</h2>
        <Select value={periode} onValueChange={(value) => setPeriode(value as Periode)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mois">Dernier Mois</SelectItem>
            <SelectItem value="trimestre">Dernier Trimestre</SelectItem>
            <SelectItem value="annee">Dernière Année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="e2d" className="space-y-4">
        <TabsList>
          <TabsTrigger value="e2d">E2D</TabsTrigger>
          <TabsTrigger value="phoenix">Phoenix</TabsTrigger>
        </TabsList>

        <TabsContent value="e2d" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsE2D.totalMatchs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buts Marqués</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsE2D.butsMarques}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buts Encaissés</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsE2D.butsEncaisses}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance E2D</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceE2DData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="valeur" stroke="#1e40af" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bilan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Victoires</span>
                  <span className="font-bold text-green-600">{statsE2D.victoires}</span>
                </div>
                <div className="flex justify-between">
                  <span>Défaites</span>
                  <span className="font-bold text-red-600">{statsE2D.defaites}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nuls</span>
                  <span className="font-bold text-gray-600">{statsE2D.nuls}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phoenix" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entraînements</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsPhoenix.totalEntrainements}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membres Réguliers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsPhoenix.membresReguliers}</div>
                <p className="text-xs text-muted-foreground mt-1">Présence &gt; 80%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bilan Jaune/Rouge</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span style={{ color: '#FFEB3B' }}>⬤</span> {statsPhoenix.victoiresJaune} vs{' '}
                  <span style={{ color: '#F44336' }}>⬤</span> {statsPhoenix.victoiresRouge}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparaison Jaune vs Rouge</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonPhoenixData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="victoires" fill="#1e40af" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
