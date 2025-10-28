import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Download, Trophy, Target, AlertCircle, Award } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExportService } from '@/lib/exportService';

interface PhoenixStats {
  annee: number;
  exercice_id: string;
  total_matchs_jaune: number;
  total_matchs_rouge: number;
  victoires_jaune: number;
  victoires_rouge: number;
  matchs_nuls: number;
  buts_jaune: number;
  buts_rouge: number;
  cartons_jaunes_jaune: number;
  cartons_jaunes_rouge: number;
  cartons_rouges_jaune: number;
  cartons_rouges_rouge: number;
}

export default function PhoenixDashboardAnnuel() {
  const [exercices, setExercices] = useState<any[]>([]);
  const [selectedExercice, setSelectedExercice] = useState<string>('');
  const [stats, setStats] = useState<PhoenixStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercices();
  }, []);

  useEffect(() => {
    if (selectedExercice) {
      loadStats(selectedExercice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExercice]);

  const loadExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
      
      // Sélectionner l'exercice actif par défaut
      const actif = data?.find((ex) => ex.statut === 'actif');
      if (actif) {
        setSelectedExercice(actif.id);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des exercices');
      console.error(error);
    }
  };

  const loadStats = async (exerciceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('phoenix_statistiques_annuelles')
        .select('*')
        .eq('exercice_id', exerciceId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Calculer les stats à partir des entraînements
        await calculateStats(exerciceId);
      } else {
        setStats(data);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des statistiques');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async (exerciceId: string) => {
    try {
      // Récupérer l'année de l'exercice
      const { data: exercice } = await supabase
        .from('exercices')
        .select('date_debut')
        .eq('id', exerciceId)
        .single();

      if (!exercice) return;
      const annee = new Date(exercice.date_debut).getFullYear();

      // Récupérer tous les entraînements de type jaune_rouge pour cet exercice
      const entrainementsResult = await (supabase as any)
        .from('phoenix_entrainements_internes')
        .select('*')
        .eq('type_entrainement', 'jaune_rouge')
        .gte('date_entrainement', exercice.date_debut);
      
      const entrainements = entrainementsResult.data;

      // Calculer les statistiques
      const statsCalculees: PhoenixStats = {
        annee,
        exercice_id: exerciceId,
        total_matchs_jaune: entrainements?.length || 0,
        total_matchs_rouge: entrainements?.length || 0,
        victoires_jaune: 0,
        victoires_rouge: 0,
        matchs_nuls: 0,
        buts_jaune: 0,
        buts_rouge: 0,
        cartons_jaunes_jaune: 0,
        cartons_jaunes_rouge: 0,
        cartons_rouges_jaune: 0,
        cartons_rouges_rouge: 0,
      };

      entrainements?.forEach((match) => {
        const scoreJaune = match.score_jaune || 0;
        const scoreRouge = match.score_rouge || 0;

        if (scoreJaune > scoreRouge) statsCalculees.victoires_jaune++;
        else if (scoreRouge > scoreJaune) statsCalculees.victoires_rouge++;
        else statsCalculees.matchs_nuls++;

        statsCalculees.buts_jaune += scoreJaune;
        statsCalculees.buts_rouge += scoreRouge;
      });

      setStats(statsCalculees);

      // Sauvegarder dans la base
      await supabase.from('phoenix_statistiques_annuelles').upsert(statsCalculees);
    } catch (error: any) {
      console.error('Erreur calcul stats:', error);
    }
  };

  const handleExport = async () => {
    if (!stats) return;

    const exerciceNom = exercices.find((ex) => ex.id === selectedExercice)?.nom || '';

    const exportData = [
      { categorie: 'Équipe Jaune', matchs: stats.total_matchs_jaune, victoires: stats.victoires_jaune, buts: stats.buts_jaune, cartonsJaunes: stats.cartons_jaunes_jaune, cartonsRouges: stats.cartons_rouges_jaune },
      { categorie: 'Équipe Rouge', matchs: stats.total_matchs_rouge, victoires: stats.victoires_rouge, buts: stats.buts_rouge, cartonsJaunes: stats.cartons_jaunes_rouge, cartonsRouges: stats.cartons_rouges_rouge },
      { categorie: 'Matchs Nuls', matchs: stats.matchs_nuls, victoires: '-', buts: '-', cartonsJaunes: '-', cartonsRouges: '-' },
    ];

    try {
      await ExportService.export({
        format: 'pdf',
        title: `Dashboard Phoenix Annuel - ${exerciceNom}`,
        data: exportData,
        columns: [
          { header: 'Catégorie', dataKey: 'categorie' },
          { header: 'Matchs', dataKey: 'matchs' },
          { header: 'Victoires', dataKey: 'victoires' },
          { header: 'Buts', dataKey: 'buts' },
          { header: 'Cartons Jaunes', dataKey: 'cartonsJaunes' },
          { header: 'Cartons Rouges', dataKey: 'cartonsRouges' },
        ],
        metadata: {
          periode: exerciceNom,
          dateGeneration: new Date(),
        },
        stats: [
          { label: 'Total Matchs', value: stats.total_matchs_jaune },
          { label: 'Victoires Jaune', value: stats.victoires_jaune },
          { label: 'Victoires Rouge', value: stats.victoires_rouge },
          { label: 'Matchs Nuls', value: stats.matchs_nuls },
        ],
      });
      toast.success('Export PDF généré avec succès');
    } catch (error) {
      toast.error("Erreur lors de l'export");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const victoiresData = stats ? [
    { name: 'Jaune', victoires: stats.victoires_jaune },
    { name: 'Rouge', victoires: stats.victoires_rouge },
    { name: 'Nuls', victoires: stats.matchs_nuls },
  ] : [];

  const butsData = stats ? [
    { name: 'Jaune', buts: stats.buts_jaune },
    { name: 'Rouge', buts: stats.buts_rouge },
  ] : [];

  const cartonsData = stats ? [
    { name: 'Jaunes Jaune', value: stats.cartons_jaunes_jaune },
    { name: 'Jaunes Rouge', value: stats.cartons_jaunes_rouge },
    { name: 'Rouges Jaune', value: stats.cartons_rouges_jaune },
    { name: 'Rouges Rouge', value: stats.cartons_rouges_rouge },
  ] : [];

  const COLORS = ['#FFEB3B', '#F44336', '#9E9E9E', '#FF9800'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedExercice} onValueChange={setSelectedExercice}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Sélectionner un exercice" />
            </SelectTrigger>
            <SelectContent>
              {exercices.map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.nom} {ex.statut === 'actif' && '(Actif)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExport} disabled={!stats}>
          <Download className="mr-2 h-4 w-4" />
          Exporter PDF
        </Button>
      </div>

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_matchs_jaune}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Victoires Jaune</CardTitle>
                <Award className="h-4 w-4" style={{ color: '#FFEB3B' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.victoires_jaune}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Victoires Rouge</CardTitle>
                <Award className="h-4 w-4" style={{ color: '#F44336' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.victoires_rouge}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matchs Nuls</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.matchs_nuls}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Victoires</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={victoiresData}>
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

            <Card>
              <CardHeader>
                <CardTitle>Buts Marqués</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={butsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="buts" stroke="#1e40af" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Répartition des Cartons</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cartonsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {cartonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tableau Comparatif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Statistique</th>
                      <th className="text-center p-2">Équipe Jaune</th>
                      <th className="text-center p-2">Équipe Rouge</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Total Matchs</td>
                      <td className="text-center p-2">{stats.total_matchs_jaune}</td>
                      <td className="text-center p-2">{stats.total_matchs_rouge}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Victoires</td>
                      <td className="text-center p-2 font-bold">{stats.victoires_jaune}</td>
                      <td className="text-center p-2 font-bold">{stats.victoires_rouge}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Buts Marqués</td>
                      <td className="text-center p-2">{stats.buts_jaune}</td>
                      <td className="text-center p-2">{stats.buts_rouge}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Cartons Jaunes</td>
                      <td className="text-center p-2">{stats.cartons_jaunes_jaune}</td>
                      <td className="text-center p-2">{stats.cartons_jaunes_rouge}</td>
                    </tr>
                    <tr>
                      <td className="p-2">Cartons Rouges</td>
                      <td className="text-center p-2">{stats.cartons_rouges_jaune}</td>
                      <td className="text-center p-2">{stats.cartons_rouges_rouge}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!stats && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune statistique disponible pour cet exercice</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
