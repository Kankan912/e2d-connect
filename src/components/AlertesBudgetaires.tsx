import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, TrendingDown, Clock, Wallet, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Alerte {
  type: string;
  titre: string;
  description: string;
  severite: 'critique' | 'importante' | 'informative';
  montant?: number;
  pourcentage?: number;
  action?: string;
}

export function AlertesBudgetaires() {
  const { toast } = useToast();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyserBudget();
  }, []);

  const analyserBudget = async () => {
    try {
      setLoading(true);
      const alertesDetectees: Alerte[] = [];

      // Récupérer les données des 3 derniers mois
      const date3MoisAvant = new Date();
      date3MoisAvant.setMonth(date3MoisAvant.getMonth() - 3);
      const date6MoisAvant = new Date();
      date6MoisAvant.setMonth(date6MoisAvant.getMonth() - 6);

      const [cotisations3Mois, cotisations6Mois, prets, sanctions, epargnes, membres, aides] = await Promise.all([
        supabase.from('cotisations').select('*').gte('date_paiement', date3MoisAvant.toISOString()),
        supabase.from('cotisations').select('*').gte('date_paiement', date6MoisAvant.toISOString()).lt('date_paiement', date3MoisAvant.toISOString()),
        supabase.from('prets').select('*'),
        supabase.from('sanctions').select('*'),
        supabase.from('epargnes').select('*'),
        supabase.from('membres').select('*').eq('statut', 'actif'),
        supabase.from('aides').select('*').gte('date_allocation', date3MoisAvant.toISOString())
      ]);

      // Alerte 1: Baisse des cotisations
      const totalCot3Mois = (cotisations3Mois.data || []).reduce((sum, c) => sum + Number(c.montant), 0);
      const totalCot6Mois = (cotisations6Mois.data || []).reduce((sum, c) => sum + Number(c.montant), 0);
      
      if (totalCot6Mois > 0) {
        const baisse = ((totalCot6Mois - totalCot3Mois) / totalCot6Mois) * 100;
        
        if (baisse > 20) {
          alertesDetectees.push({
            type: 'cotisations_baisse',
            titre: 'Baisse critique des cotisations',
            description: `Les cotisations ont chuté de ${baisse.toFixed(1)}% par rapport aux 3 mois précédents. Cela pourrait affecter gravement la trésorerie.`,
            severite: 'critique',
            pourcentage: baisse,
            action: 'Convoquer une réunion d\'urgence pour discuter des mesures correctives et contacter les membres inactifs.'
          });
        } else if (baisse > 10) {
          alertesDetectees.push({
            type: 'cotisations_baisse',
            titre: 'Baisse significative des cotisations',
            description: `Les cotisations ont diminué de ${baisse.toFixed(1)}% ces 3 derniers mois.`,
            severite: 'importante',
            pourcentage: baisse,
            action: 'Envoyer des rappels aux membres et analyser les causes de cette baisse.'
          });
        }
      }

      // Alerte 2: Prêts en retard
      const now = new Date();
      const pretsEnRetard = (prets.data || []).filter(p => {
        const echeance = new Date(p.echeance);
        const montantRestant = Number(p.montant_total_du) - Number(p.montant_paye);
        return echeance < now && montantRestant > 0;
      });

      const montantRetard = pretsEnRetard.reduce((sum, p) => sum + (Number(p.montant_total_du) - Number(p.montant_paye)), 0);

      if (pretsEnRetard.length > 0) {
        alertesDetectees.push({
          type: 'prets_retard',
          titre: `${pretsEnRetard.length} prêt(s) en retard de paiement`,
          description: `Un montant total de ${montantRetard.toLocaleString()} FCFA est en retard de remboursement.`,
          severite: pretsEnRetard.length > 5 ? 'critique' : 'importante',
          montant: montantRetard,
          action: 'Contacter immédiatement les emprunteurs et appliquer les pénalités prévues si nécessaire.'
        });
      }

      // Alerte 3: Sanctions impayées
      const sanctionsImpayees = (sanctions.data || []).filter(s => {
        const montantRestant = Number(s.montant) - Number(s.montant_paye);
        return montantRestant > 0;
      });

      const montantSanctions = sanctionsImpayees.reduce((sum, s) => sum + (Number(s.montant) - Number(s.montant_paye)), 0);

      if (montantSanctions > 50000) {
        alertesDetectees.push({
          type: 'sanctions_impayees',
          titre: 'Montant élevé de sanctions impayées',
          description: `${sanctionsImpayees.length} sanction(s) totalisant ${montantSanctions.toLocaleString()} FCFA sont impayées.`,
          severite: montantSanctions > 100000 ? 'critique' : 'importante',
          montant: montantSanctions,
          action: 'Renforcer le suivi des sanctions et envisager des échéanciers de paiement.'
        });
      }

      // Alerte 4: Ratio Épargnes/Prêts
      const totalEpargnes = (epargnes.data || []).reduce((sum, e) => sum + Number(e.montant), 0);
      const totalPrets = (prets.data || []).reduce((sum, p) => sum + Number(p.montant), 0);
      
      if (totalEpargnes > 0) {
        const ratio = (totalPrets / totalEpargnes) * 100;
        
        if (ratio > 80) {
          alertesDetectees.push({
            type: 'ratio_epargnes_prets',
            titre: 'Ratio Prêts/Épargnes critique',
            description: `Les prêts représentent ${ratio.toFixed(1)}% des épargnes. Le fonds de réserve est insuffisant.`,
            severite: ratio > 90 ? 'critique' : 'importante',
            pourcentage: ratio,
            action: 'Suspendre temporairement les nouveaux prêts jusqu\'à amélioration du ratio.'
          });
        }
      }

      // Alerte 5: Trésorerie disponible faible
      const totalCotisations = (cotisations3Mois.data || []).reduce((sum, c) => sum + Number(c.montant), 0);
      const totalAides = (aides.data || []).reduce((sum, a) => sum + Number(a.montant), 0);
      const tresorerie = totalCotisations + totalEpargnes - totalPrets - totalAides;
      const tresorerieParMembre = membres.data && membres.data.length > 0 ? tresorerie / membres.data.length : 0;

      if (tresorerieParMembre < 50000) {
        alertesDetectees.push({
          type: 'tresorerie_faible',
          titre: 'Trésorerie par membre faible',
          description: `La trésorerie disponible par membre est de ${tresorerieParMembre.toLocaleString()} FCFA, en dessous du seuil recommandé de 50 000 FCFA.`,
          severite: tresorerieParMembre < 30000 ? 'critique' : 'importante',
          montant: tresorerie,
          action: 'Limiter les dépenses non essentielles et augmenter les cotisations si nécessaire.'
        });
      }

      // Alerte 6: Augmentation significative des aides
      const dateAncien = new Date();
      dateAncien.setMonth(dateAncien.getMonth() - 6);
      const { data: aidesAnciennes } = await supabase
        .from('aides')
        .select('*')
        .gte('date_allocation', dateAncien.toISOString())
        .lt('date_allocation', date3MoisAvant.toISOString());

      const totalAidesAnciennes = (aidesAnciennes || []).reduce((sum, a) => sum + Number(a.montant), 0);
      
      if (totalAidesAnciennes > 0 && totalAides > totalAidesAnciennes * 1.5) {
        const augmentation = ((totalAides - totalAidesAnciennes) / totalAidesAnciennes) * 100;
        alertesDetectees.push({
          type: 'aides_augmentation',
          titre: 'Augmentation importante des aides',
          description: `Les aides ont augmenté de ${augmentation.toFixed(1)}% par rapport à la période précédente.`,
          severite: 'informative',
          montant: totalAides,
          action: 'Vérifier la conformité des aides allouées avec les critères établis.'
        });
      }

      // Alerte positive si tout va bien
      if (alertesDetectees.length === 0) {
        alertesDetectees.push({
          type: 'situation_saine',
          titre: 'Situation financière saine',
          description: 'Aucune alerte budgétaire détectée. La situation financière est stable.',
          severite: 'informative',
        });
      }

      setAlertes(alertesDetectees);

    } catch (error) {
      console.error('Erreur analyse budget:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser le budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconeAlerte = (type: string) => {
    switch (type) {
      case 'cotisations_baisse':
        return <TrendingDown className="h-5 w-5" />;
      case 'prets_retard':
        return <Clock className="h-5 w-5" />;
      case 'sanctions_impayees':
        return <AlertTriangle className="h-5 w-5" />;
      case 'ratio_epargnes_prets':
        return <Wallet className="h-5 w-5" />;
      case 'tresorerie_faible':
        return <DollarSign className="h-5 w-5" />;
      case 'aides_augmentation':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getSeveriteBadge = (severite: string) => {
    switch (severite) {
      case 'critique':
        return <Badge variant="destructive">🔴 Critique</Badge>;
      case 'importante':
        return <Badge variant="default" className="bg-warning text-warning-foreground">🟡 Importante</Badge>;
      case 'informative':
        return <Badge variant="secondary">🟢 Informative</Badge>;
      default:
        return <Badge>{severite}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes budgétaires</CardTitle>
          <CardDescription>Analyse en cours...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Alertes budgétaires</CardTitle>
            <CardDescription>Détection automatique des situations nécessitant votre attention</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={analyserBudget}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertes.map((alerte, index) => (
          <Alert key={index} variant={alerte.severite === 'critique' ? 'destructive' : 'default'}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIconeAlerte(alerte.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <AlertTitle className="mb-0">{alerte.titre}</AlertTitle>
                  {getSeveriteBadge(alerte.severite)}
                </div>
                <AlertDescription className="text-sm">
                  {alerte.description}
                  {alerte.montant && (
                    <div className="mt-1 font-semibold">
                      Montant: {alerte.montant.toLocaleString()} FCFA
                    </div>
                  )}
                  {alerte.pourcentage && (
                    <div className="mt-1 font-semibold">
                      Variation: {alerte.pourcentage.toFixed(1)}%
                    </div>
                  )}
                </AlertDescription>
                {alerte.action && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-1">💡 Action recommandée</p>
                    <p className="text-sm text-muted-foreground">{alerte.action}</p>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
