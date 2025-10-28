import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Download, DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ExportService } from '@/lib/exportService';
import LogoHeader from './LogoHeader';

type Periode = 'mois' | 'trimestre' | 'annee';

interface FinancialData {
  tontine: {
    cotisations: number;
    beneficiaires: number;
    solde: number;
  };
  prets: {
    totalPretes: number;
    totalRembourse: number;
    enCours: number;
    enRetard: number;
    interets: number;
  };
  epargnes: {
    totalEpargne: number;
    interetsEstimes: number;
  };
  sanctions: {
    total: number;
    paye: number;
    impaye: number;
  };
  sport: {
    recettesE2D: number;
    depensesE2D: number;
    recettesPhoenix: number;
    depensesPhoenix: number;
  };
}

export default function RapportFinancierGlobal() {
  const [periode, setPeriode] = useState<Periode>('mois');
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return { startDate: startDate.toISOString().split('T')[0], endDate: now.toISOString().split('T')[0] };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Tontine
      const { data: cotisations } = await supabase
        .from('cotisations')
        .select('montant')
        .gte('date_paiement', startDate)
        .lte('date_paiement', endDate);

      const { data: beneficiaires } = await supabase
        .from('reunion_beneficiaires')
        .select('montant_benefice')
        .gte('date_benefice_prevue', startDate)
        .lte('date_benefice_prevue', endDate);

      // Prêts
      const { data: prets } = await supabase
        .from('prets')
        .select('montant, montant_paye, statut, taux_interet')
        .gte('date_pret', startDate)
        .lte('date_pret', endDate);

      // Épargnes
      const { data: epargnes } = await supabase
        .from('epargnes')
        .select('montant')
        .eq('statut', 'actif')
        .gte('date_depot', startDate)
        .lte('date_depot', endDate);

      // Sanctions
      const { data: sanctions } = await supabase
        .from('sanctions')
        .select('montant, montant_paye, statut')
        .gte('date_sanction', startDate)
        .lte('date_sanction', endDate);

      // Sport (simulé car tables non présentes)
      const sportData = {
        recettesE2D: 0,
        depensesE2D: 0,
        recettesPhoenix: 0,
        depensesPhoenix: 0,
      };

      const totalCotisations = cotisations?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;
      const totalBeneficiaires = beneficiaires?.reduce((sum, b) => sum + Number(b.montant_benefice), 0) || 0;

      const totalPretes = prets?.reduce((sum, p) => sum + Number(p.montant), 0) || 0;
      const totalRembourse = prets?.reduce((sum, p) => sum + Number(p.montant_paye), 0) || 0;
      const totalInterets = prets?.reduce((sum, p) => sum + (Number(p.montant) * Number(p.taux_interet) / 100), 0) || 0;
      const enCours = prets?.filter((p) => p.statut === 'en_cours').length || 0;
      const enRetard = prets?.filter((p) => p.statut === 'en_retard' || p.statut === 'retard_partiel').length || 0;

      const totalEpargne = epargnes?.reduce((sum, e) => sum + Number(e.montant), 0) || 0;

      const totalSanctions = sanctions?.reduce((sum, s) => sum + Number(s.montant), 0) || 0;
      const totalSanctionsPaye = sanctions?.reduce((sum, s) => sum + Number(s.montant_paye), 0) || 0;

      setData({
        tontine: {
          cotisations: totalCotisations,
          beneficiaires: totalBeneficiaires,
          solde: totalCotisations - totalBeneficiaires,
        },
        prets: {
          totalPretes,
          totalRembourse,
          enCours,
          enRetard,
          interets: totalInterets,
        },
        epargnes: {
          totalEpargne,
          interetsEstimes: totalInterets * 0.1, // Estimation 10% pour les épargnants
        },
        sanctions: {
          total: totalSanctions,
          paye: totalSanctionsPaye,
          impaye: totalSanctions - totalSanctionsPaye,
        },
        sport: sportData,
      });
    } catch (error: any) {
      toast.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!data) return;

    const periodeLabel = periode === 'mois' ? 'Dernier Mois' : periode === 'trimestre' ? 'Dernier Trimestre' : 'Dernière Année';

    const exportData = [
      { module: 'Tontine - Cotisations', montant: data.tontine.cotisations },
      { module: 'Tontine - Bénéficiaires', montant: -data.tontine.beneficiaires },
      { module: 'Tontine - Solde', montant: data.tontine.solde },
      { module: 'Prêts - Total Prêtés', montant: data.prets.totalPretes },
      { module: 'Prêts - Total Remboursé', montant: data.prets.totalRembourse },
      { module: 'Prêts - Intérêts', montant: data.prets.interets },
      { module: 'Épargnes - Total', montant: data.epargnes.totalEpargne },
      { module: 'Sanctions - Total', montant: data.sanctions.total },
      { module: 'Sanctions - Payé', montant: data.sanctions.paye },
    ];

    const tresorerieTotal =
      data.tontine.solde +
      data.prets.totalRembourse +
      data.epargnes.totalEpargne +
      data.sanctions.paye;

    try {
      await ExportService.export({
        format,
        title: 'Rapport Financier Global',
        data: exportData,
        columns: [
          { header: 'Module', dataKey: 'module' },
          { header: 'Montant (FCFA)', dataKey: 'montant' },
        ],
        metadata: {
          periode: periodeLabel,
          dateGeneration: new Date(),
        },
        stats: [
          { label: 'Trésorerie Totale', value: `${tresorerieTotal.toLocaleString()} FCFA` },
          { label: 'Prêts en Cours', value: data.prets.enCours },
          { label: 'Prêts en Retard', value: data.prets.enRetard },
        ],
      });
      toast.success(`Export ${format.toUpperCase()} généré avec succès`);
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

  const tresorerieTotal = data
    ? data.tontine.solde +
      data.prets.totalRembourse +
      data.epargnes.totalEpargne +
      data.sanctions.paye
    : 0;

  const repartitionData = data
    ? [
        { name: 'Tontine', value: data.tontine.solde },
        { name: 'Prêts', value: data.prets.totalRembourse },
        { name: 'Épargnes', value: data.epargnes.totalEpargne },
        { name: 'Sanctions', value: data.sanctions.paye },
      ]
    : [];

  const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'];

  return (
    <div className="space-y-6">
      <LogoHeader
        title="Rapport Financier Global"
        subtitle="Vue d'ensemble consolidée de toutes les finances"
      />

      <div className="flex items-center justify-between">
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

        <div className="flex gap-2">
          <Button onClick={() => handleExport('pdf')} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {data && (
        <>
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-2xl">Trésorerie Totale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{tresorerieTotal.toLocaleString()} FCFA</div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tontine</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.tontine.solde.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cotisations: {data.tontine.cotisations.toLocaleString()} FCFA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prêts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.prets.totalRembourse.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground mt-1">
                  En cours: {data.prets.enCours} | Retard: {data.prets.enRetard}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Épargnes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.epargnes.totalEpargne.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Intérêts estimés: {data.epargnes.interetsEstimes.toLocaleString()} FCFA
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sanctions</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.sanctions.paye.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Impayé: {data.sanctions.impaye.toLocaleString()} FCFA
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Module</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={repartitionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value.toLocaleString()} FCFA`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {repartitionData.map((entry, index) => (
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
                <CardTitle>Détail par Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Tontine</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cotisations collectées</span>
                        <span className="font-medium">{data.tontine.cotisations.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bénéficiaires versés</span>
                        <span className="font-medium text-red-600">-{data.tontine.beneficiaires.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Prêts</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total prêtés</span>
                        <span className="font-medium">{data.prets.totalPretes.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intérêts générés</span>
                        <span className="font-medium text-green-600">{data.prets.interets.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
