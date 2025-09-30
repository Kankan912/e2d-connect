import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, DollarSign, Calculator, PiggyBank } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface EpargnantData {
  membre_id: string;
  membre_nom: string;
  membre_prenom: string;
  total_epargne: number;
  pourcentage: number;
  gains_estimes: number;
}

export default function EpargnantsBenefices() {
  const [epargnants, setEpargnants] = useState<EpargnantData[]>([]);
  const [totalInteretsPrets, setTotalInteretsPrets] = useState(0);
  const [totalEpargnes, setTotalEpargnes] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEpargnantsBenefices();
  }, []);

  const loadEpargnantsBenefices = async () => {
    try {
      // 1. Calculer le total des épargnes actives
      const { data: epargnesData, error: epargnesError } = await supabase
        .from('epargnes')
        .select('montant, membre_id, membres!membre_id(nom, prenom)')
        .eq('statut', 'actif');

      if (epargnesError) throw epargnesError;

      // 2. Calculer le total des intérêts des prêts
      const { data: pretsData, error: pretsError } = await supabase
        .from('prets')
        .select('montant, taux_interet, reconductions')
        .in('statut', ['en_cours', 'reconduit']);

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

      epargnesData?.forEach((epargne: any) => {
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

    } catch (error: any) {
      console.error('Erreur chargement bénéfices:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des épargnants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <LogoHeader 
        title="Épargnants - Bénéfices Attendus"
        subtitle="Répartition des gains au prorata des montants épargnés"
      />

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