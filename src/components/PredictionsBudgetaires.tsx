import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Prediction {
  mois: string;
  cotisationsPredites: number;
  epargnesPredites: number;
  pretsPredits: number;
  tendance: 'hausse' | 'baisse' | 'stable';
}

interface ObjectifBudgetaire {
  type: string;
  objectif: number;
  actuel: number;
  predit: number;
  progression: number;
  atteintPrevu: boolean;
}

export const PredictionsBudgetaires = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [objectifs, setObjectifs] = useState<ObjectifBudgetaire[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    calculerPredictions();
  }, []);

  const calculerPredictions = async () => {
    try {
      setLoading(true);

      // Récupérer l'historique des 12 derniers mois
      const historique: Array<{
        mois: string;
        cotisations: number;
        epargnes: number;
        prets: number;
      }> = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const moisDebut = new Date(date.getFullYear(), date.getMonth(), 1);
        const moisFin = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const [cotisations, epargnes, prets] = await Promise.all([
          supabase.from('cotisations').select('montant').gte('date_paiement', moisDebut.toISOString()).lte('date_paiement', moisFin.toISOString()),
          supabase.from('epargnes').select('montant').gte('date_depot', moisDebut.toISOString()).lte('date_depot', moisFin.toISOString()),
          supabase.from('prets').select('montant').gte('created_at', moisDebut.toISOString()).lte('created_at', moisFin.toISOString())
        ]);

        historique.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          cotisations: cotisations.data?.reduce((sum, c) => sum + Number(c.montant), 0) || 0,
          epargnes: epargnes.data?.reduce((sum, e) => sum + Number(e.montant), 0) || 0,
          prets: prets.data?.reduce((sum, p) => sum + Number(p.montant), 0) || 0
        });
      }

      // Calcul de la moyenne mobile et tendance
      const calculerTendance = (donnees: number[]) => {
        if (donnees.length < 3) return 0;
        const derniersMois = donnees.slice(-3);
        const moyenne = derniersMois.reduce((a, b) => a + b, 0) / derniersMois.length;
        return moyenne;
      };

      const cotisationsHistorique = historique.map(h => h.cotisations);
      const epargnesmHistorique = historique.map(h => h.epargnes);
      const pretsHistorique = historique.map(h => h.prets);

      const moyenneCotisations = calculerTendance(cotisationsHistorique);
      const moyenneEpargnes = calculerTendance(epargnesmHistorique);
      const moyennePrets = calculerTendance(pretsHistorique);

      // Calcul de la croissance moyenne
      const calculerCroissance = (donnees: number[]) => {
        if (donnees.length < 2) return 0;
        const croissances = [];
        for (let i = 1; i < donnees.length; i++) {
          if (donnees[i - 1] > 0) {
            croissances.push((donnees[i] - donnees[i - 1]) / donnees[i - 1]);
          }
        }
        return croissances.length > 0 
          ? croissances.reduce((a, b) => a + b, 0) / croissances.length 
          : 0;
      };

      const croissanceCotisations = calculerCroissance(cotisationsHistorique);
      const croissanceEpargnes = calculerCroissance(epargnesmHistorique);
      const croissancePrets = calculerCroissance(pretsHistorique);

      // Prédictions pour les 3 prochains mois
      const predictionsFutures: Prediction[] = [];
      for (let i = 1; i <= 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        
        const cotisationsPredites = moyenneCotisations * (1 + croissanceCotisations * i);
        const epargnesPredites = moyenneEpargnes * (1 + croissanceEpargnes * i);
        const pretsPredits = moyennePrets * (1 + croissancePrets * i);

        const tendanceGlobale = (croissanceCotisations + croissanceEpargnes) / 2;
        
        predictionsFutures.push({
          mois: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          cotisationsPredites: Math.max(0, cotisationsPredites),
          epargnesPredites: Math.max(0, epargnesPredites),
          pretsPredits: Math.max(0, pretsPredits),
          tendance: tendanceGlobale > 0.05 ? 'hausse' : tendanceGlobale < -0.05 ? 'baisse' : 'stable'
        });
      }

      setPredictions(predictionsFutures);

      // Calcul des objectifs budgétaires
      const totalCotisationsActuel = cotisationsHistorique.reduce((a, b) => a + b, 0);
      const totalEpargnesActuel = epargnesmHistorique.reduce((a, b) => a + b, 0);
      const totalPretsActuel = pretsHistorique.reduce((a, b) => a + b, 0);

      const cotisationsPreditesFin = predictionsFutures.reduce((sum, p) => sum + p.cotisationsPredites, 0);
      const epargnesPreditesFin = predictionsFutures.reduce((sum, p) => sum + p.epargnesPredites, 0);

      const objectifsBudgetaires: ObjectifBudgetaire[] = [
        {
          type: 'Cotisations annuelles',
          objectif: 12000000,
          actuel: totalCotisationsActuel,
          predit: totalCotisationsActuel + cotisationsPreditesFin,
          progression: ((totalCotisationsActuel + cotisationsPreditesFin) / 12000000) * 100,
          atteintPrevu: (totalCotisationsActuel + cotisationsPreditesFin) >= 12000000
        },
        {
          type: 'Épargnes annuelles',
          objectif: 8000000,
          actuel: totalEpargnesActuel,
          predit: totalEpargnesActuel + epargnesPreditesFin,
          progression: ((totalEpargnesActuel + epargnesPreditesFin) / 8000000) * 100,
          atteintPrevu: (totalEpargnesActuel + epargnesPreditesFin) >= 8000000
        },
        {
          type: 'Trésorerie disponible',
          objectif: 5000000,
          actuel: totalEpargnesActuel - totalPretsActuel,
          predit: (totalEpargnesActuel + epargnesPreditesFin) - totalPretsActuel,
          progression: (((totalEpargnesActuel + epargnesPreditesFin) - totalPretsActuel) / 5000000) * 100,
          atteintPrevu: ((totalEpargnesActuel + epargnesPreditesFin) - totalPretsActuel) >= 5000000
        }
      ];

      setObjectifs(objectifsBudgetaires);

    } catch (error) {
      console.error('Erreur calcul prédictions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer les prédictions budgétaires.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prédictions Budgétaires</CardTitle>
            <CardDescription>Calcul en cours...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prédictions sur 3 mois
          </CardTitle>
          <CardDescription>Projections basées sur l'analyse des tendances passées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()} FCFA`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="cotisationsPredites" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Cotisations prédites"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="epargnesPredites" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Épargnes prédites"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="pretsPredits" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="Prêts prédits"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {predictions.map((pred, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pred.mois}</span>
                      <Badge variant={pred.tendance === 'hausse' ? 'default' : pred.tendance === 'baisse' ? 'destructive' : 'secondary'}>
                        {pred.tendance === 'hausse' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : pred.tendance === 'baisse' ? (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        ) : (
                          <Calendar className="h-3 w-3 mr-1" />
                        )}
                        {pred.tendance}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Cotisations: {pred.cotisationsPredites.toLocaleString()} FCFA</div>
                      <div>Épargnes: {pred.epargnesPredites.toLocaleString()} FCFA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs Budgétaires
          </CardTitle>
          <CardDescription>Suivi et projection d'atteinte des objectifs annuels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {objectifs.map((obj, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{obj.type}</div>
                    <div className="text-sm text-muted-foreground">
                      Actuel: {obj.actuel.toLocaleString()} FCFA | 
                      Prédit fin période: {obj.predit.toLocaleString()} FCFA
                    </div>
                  </div>
                  <Badge variant={obj.atteintPrevu ? 'default' : 'secondary'}>
                    {obj.atteintPrevu ? 'Objectif atteignable' : 'Révision nécessaire'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progression</span>
                    <span>{obj.progression.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(obj.progression, 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    Objectif: {obj.objectif.toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
