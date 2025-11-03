import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, DollarSign, Calculator, PiggyBank, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';
import { ExportService } from '@/lib/exportService';

interface EpargnantData {
  membre_id: string;
  membre_nom: string;
  membre_prenom: string;
  total_epargne: number;
  pourcentage: number;
  gains_estimes: number;
}

interface Exercice {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: string;
}

interface EpargneWithMembre {
  montant: number;
  membre_id: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

interface Reunion {
  id: string;
  date_reunion: string;
  statut: string;
  type_reunion: string;
}

export default function EpargnantsBenefices() {
  const [epargnants, setEpargnants] = useState<EpargnantData[]>([]);
  const [totalInteretsPrets, setTotalInteretsPrets] = useState(0);
  const [totalEpargnes, setTotalEpargnes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [selectedExercice, setSelectedExercice] = useState<string>('all');
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [selectedReunion, setSelectedReunion] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadExercices();
  }, []);

  useEffect(() => {
    if (exercices.length > 0 || selectedExercice === 'all') {
      loadEpargnantsBenefices();
    }
  }, [selectedExercice, exercices]);

  // Charger les réunions quand l'exercice change
  useEffect(() => {
    if (exercices.length > 0) {
      setSelectedReunion('all');
      loadReunions();
    }
  }, [selectedExercice, exercices]);

  // Recharger les bénéfices quand la réunion change
  useEffect(() => {
    if (exercices.length > 0 || selectedExercice === 'all') {
      loadEpargnantsBenefices();
    }
  }, [selectedReunion]);

  const loadExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Erreur chargement exercices: " + errorMessage,
        variant: "destructive"
      });
    }
  };

  const loadReunions = async () => {
    try {
      let reunionsQuery = supabase
        .from('reunions')
        .select('id, date_reunion, statut, type_reunion')
        .order('date_reunion', { ascending: false });

      // Filtrer par exercice si sélectionné
      if (selectedExercice && selectedExercice !== 'all') {
        const exercice = exercices.find(ex => ex.id === selectedExercice);
        if (exercice) {
          reunionsQuery = reunionsQuery
            .gte('date_reunion', exercice.date_debut)
            .lte('date_reunion', exercice.date_fin);
        }
      }

      const { data, error } = await reunionsQuery;

      if (error) throw error;
      setReunions(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Erreur chargement réunions: " + errorMessage,
        variant: "destructive"
      });
    }
  };

  const loadEpargnantsBenefices = async () => {
    try {
      // 1. Calculer le total des épargnes actives
      let epargnesQuery = supabase
        .from('epargnes')
        .select('montant, membre_id, membres!inner(nom, prenom)')
        .eq('statut', 'actif');

      if (selectedExercice && selectedExercice !== 'all') {
        epargnesQuery = epargnesQuery.eq('exercice_id', selectedExercice);
      }

      // Filtrer par réunion si sélectionné
      if (selectedReunion && selectedReunion !== 'all') {
        epargnesQuery = epargnesQuery.eq('reunion_id', selectedReunion);
      }

      const { data: epargnesData, error: epargnesError } = await epargnesQuery;

      console.log('🔍 Exercice sélectionné:', selectedExercice);
      console.log('🔍 Réunion sélectionnée:', selectedReunion);
      console.log('📊 Épargnes récupérées:', epargnesData?.length || 0);

      if (epargnesError) throw epargnesError;

      // 2. Calculer le total des intérêts des prêts - filtrer par exercice si applicable
      let pretsQuery = supabase
        .from('prets')
        .select('montant, taux_interet, reconductions, date_pret')
        .in('statut', ['en_cours', 'reconduit']);

      // Si un exercice est sélectionné, filtrer les prêts par date
      if (selectedExercice && selectedExercice !== 'all') {
        const exercice = exercices.find(ex => ex.id === selectedExercice);
        if (exercice) {
          pretsQuery = pretsQuery
            .gte('date_pret', exercice.date_debut)
            .lte('date_pret', exercice.date_fin);
        }
      }

      const { data: pretsData, error: pretsError } = await pretsQuery;

      console.log('💰 Prêts récupérés:', pretsData?.length || 0);

      if (pretsError) throw pretsError;

      // Calculer total intérêts des prêts
      const interetsTotal = pretsData?.reduce((sum, pret) => {
        const interet = pret.montant * (pret.taux_interet / 100) * (1 + (pret.reconductions || 0));
        return sum + interet;
      }, 0) || 0;

      setTotalInteretsPrets(interetsTotal);

      // 3. Grouper les épargnes par membre
      const epargnantesMap = new Map<string, {
        nom: string;
        prenom: string;
        total: number;
      }>();

      epargnesData?.forEach((epargne: EpargneWithMembre) => {
        const membre = epargnantesMap.get(epargne.membre_id) || {
          nom: epargne.membres.nom,
          prenom: epargne.membres.prenom,
          total: 0
        };
        membre.total += Number(epargne.montant);
        epargnantesMap.set(epargne.membre_id, membre);
      });

      const totalEpargne = Array.from(epargnantesMap.values()).reduce((sum, e) => sum + e.total, 0);
      setTotalEpargnes(totalEpargne);

      // 4. Calculer les gains pour chaque épargnant au prorata
      const epargnantsList: EpargnantData[] = Array.from(epargnantesMap.entries()).map(([membreId, data]) => {
        const pourcentage = totalEpargne > 0 ? (data.total / totalEpargne) * 100 : 0;
        const gainsEstimes = totalEpargne > 0 ? (data.total / totalEpargne) * interetsTotal : 0;

        return {
          membre_id: membreId,
          membre_nom: data.nom,
          membre_prenom: data.prenom,
          total_epargne: data.total,
          pourcentage: pourcentage,
          gains_estimes: gainsEstimes
        };
      });

      // Trier par montant épargné décroissant
      epargnantsList.sort((a, b) => b.total_epargne - a.total_epargne);

      setEpargnants(epargnantsList);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de charger les données: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleExport = async () => {
    try {
      await ExportService.export({
        format: 'pdf',
        title: 'Épargnants - Bénéfices Attendus',
        data: epargnants.map(e => ({
          Épargnant: `${e.membre_prenom} ${e.membre_nom}`,
          'Montant épargné': `${e.total_epargne.toLocaleString()} FCFA`,
          'Part (%)': `${e.pourcentage.toFixed(2)}%`,
          'Gains estimés': `${e.gains_estimes.toLocaleString()} FCFA`,
          'Total attendu': `${(e.total_epargne + e.gains_estimes).toLocaleString()} FCFA`
        })),
        columns: [
          { header: 'Épargnant', dataKey: 'Épargnant' },
          { header: 'Montant épargné', dataKey: 'Montant épargné' },
          { header: 'Part (%)', dataKey: 'Part (%)' },
          { header: 'Gains estimés', dataKey: 'Gains estimés' },
          { header: 'Total attendu', dataKey: 'Total attendu' }
        ],
        metadata: {
          author: 'E2D',
          dateGeneration: new Date(),
          periode: selectedReunion !== 'all'
            ? reunions.find(r => r.id === selectedReunion)?.date_reunion 
              ? `Réunion du ${new Date(reunions.find(r => r.id === selectedReunion)!.date_reunion).toLocaleDateString('fr-FR')}`
              : 'Toutes réunions'
            : selectedExercice !== 'all' 
              ? exercices.find(e => e.id === selectedExercice)?.nom || 'Tous exercices'
              : 'Tous exercices',
          association: 'Association E2D'
        },
        stats: [
          { label: 'Total épargnes', value: `${totalEpargnes.toLocaleString()} FCFA` },
          { label: 'Total intérêts', value: `${totalInteretsPrets.toLocaleString()} FCFA` },
          { label: 'Nombre épargnants', value: epargnants.length.toString() },
          { label: 'Montant moyen', value: `${Math.round(totalEpargnes / epargnants.length).toLocaleString()} FCFA` }
        ]
      });

      toast({
        title: "Succès",
        description: "Export PDF généré avec succès",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Erreur export PDF: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <LogoHeader 
          title="Épargnants - Bénéfices Attendus"
          subtitle="Répartition des gains au prorata des montants épargnés"
        />
        <div className="flex items-center gap-4">
          <Select value={selectedExercice} onValueChange={setSelectedExercice}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tous exercices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous exercices</SelectItem>
              {exercices.map(ex => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedReunion} onValueChange={setSelectedReunion}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Toutes réunions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes réunions</SelectItem>
              {reunions.map(reunion => (
                <SelectItem key={reunion.id} value={reunion.id}>
                  {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')} - {reunion.type_reunion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Épargnes</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEpargnes.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              Épargnes actives en circulation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intérêts des Prêts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteretsPrets.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              À distribuer aux épargnants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargnants Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{epargnants.length}</div>
            <p className="text-xs text-muted-foreground">
              Membres ayant des épargnes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Information sur le calcul */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calculator className="h-5 w-5" />
            Méthode de Calcul
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p className="text-sm">
            <strong>Principe :</strong> Les intérêts provenant des prêts sont répartis au prorata du montant épargné par chaque membre.
          </p>
          <p className="text-sm">
            <strong>Formule :</strong> Gain = (Montant épargné / Total épargnes) × Total intérêts prêts
          </p>
          <p className="text-sm">
            <strong>Distribution :</strong> Les gains sont calculés automatiquement et versés en fin d'exercice.
          </p>
        </CardContent>
      </Card>

      {/* Tableau des épargnants */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition Détaillée par Épargnant</CardTitle>
          <CardDescription>
            Liste des épargnants avec leur part respective des bénéfices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {epargnants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun épargnant actif pour le moment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Épargnant</TableHead>
                  <TableHead className="text-right">Montant épargné</TableHead>
                  <TableHead className="text-right">Part (%)</TableHead>
                  <TableHead className="text-right">Gains estimés</TableHead>
                  <TableHead className="text-right">Total attendu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epargnants.map((epargnant, index) => (
                  <TableRow key={epargnant.membre_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{epargnant.membre_prenom} {epargnant.membre_nom}</p>
                        <Badge variant="outline" className="mt-1">
                          {epargnant.pourcentage.toFixed(2)}% du total
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {epargnant.total_epargne.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {epargnant.pourcentage.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      +{epargnant.gains_estimes.toLocaleString()} FCFA
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {(epargnant.total_epargne + epargnant.gains_estimes).toLocaleString()} FCFA
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Résumé total */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total à distribuer en fin d'exercice</p>
              <p className="text-3xl font-bold text-primary">
                {(totalEpargnes + totalInteretsPrets).toLocaleString()} FCFA
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Dont gains</p>
              <p className="text-2xl font-bold text-green-600">
                +{totalInteretsPrets.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}