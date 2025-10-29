import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Alerte {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  titre: string;
  description: string;
  severite: 'critique' | 'importante' | 'normale';
  montant?: number;
  pourcentage?: number;
  action?: string;
}

export const AlertesBudgetaires = () => {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    analyserBudget();
  }, []);

  const analyserBudget = async () => {
    try {
      setLoading(true);
      const alertesDetectees: Alerte[] = [];
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      const debutMoisDernier = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const finMoisDernier = new Date(now.getFullYear(), now.getMonth(), 0);

      // 1. Analyser les cotisations
      const { data: cotisationsMois } = await supabase
        .from('cotisations')
        .select('montant')
        .gte('date_paiement', debutMois.toISOString());
      
      const { data: cotisationsMoisDernier } = await supabase
        .from('cotisations')
        .select('montant')
        .gte('date_paiement', debutMoisDernier.toISOString())
        .lte('date_paiement', finMoisDernier.toISOString());

      const totalCotisationsMois = cotisationsMois?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;
      const totalCotisationsMoisDernier = cotisationsMoisDernier?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;

      if (totalCotisationsMoisDernier > 0) {
        const baisseCotisations = ((totalCotisationsMois - totalCotisationsMoisDernier) / totalCotisationsMoisDernier) * 100;
        
        if (baisseCotisations < -20) {
          alertesDetectees.push({
            id: 'baisse-cotisations',
            type: 'error',
            titre: 'Baisse critique des cotisations',
            description: `Les cotisations ont chuté de ${Math.abs(baisseCotisations).toFixed(1)}% ce mois-ci par rapport au mois dernier.`,
            severite: 'critique',
            pourcentage: baisseCotisations,
            action: 'Contacter les membres en retard'
          });
        } else if (baisseCotisations < -10) {
          alertesDetectees.push({
            id: 'baisse-cotisations',
            type: 'warning',
            titre: 'Baisse des cotisations détectée',
            description: `Les cotisations ont diminué de ${Math.abs(baisseCotisations).toFixed(1)}% ce mois-ci.`,
            severite: 'importante',
            pourcentage: baisseCotisations
          });
        } else if (baisseCotisations > 15) {
          alertesDetectees.push({
            id: 'hausse-cotisations',
            type: 'success',
            titre: 'Excellente performance',
            description: `Les cotisations ont augmenté de ${baisseCotisations.toFixed(1)}% ce mois-ci !`,
            severite: 'normale',
            pourcentage: baisseCotisations
          });
        }
      }

      // 2. Analyser les prêts en retard
      const { data: pretsEnRetard } = await supabase
        .from('prets')
        .select('montant, montant_paye, echeance')
        .lt('echeance', now.toISOString())
        .neq('statut', 'rembourse');

      if (pretsEnRetard && pretsEnRetard.length > 0) {
        const montantTotal = pretsEnRetard.reduce((sum, p) => sum + (Number(p.montant) - Number(p.montant_paye)), 0);
        alertesDetectees.push({
          id: 'prets-retard',
          type: 'error',
          titre: `${pretsEnRetard.length} prêt(s) en retard`,
          description: `Montant total en souffrance: ${montantTotal.toLocaleString()} FCFA`,
          severite: 'critique',
          montant: montantTotal,
          action: 'Relancer les débiteurs'
        });
      }

      // 3. Analyser les sanctions impayées
      const { data: sanctionsImpayees } = await supabase
        .from('sanctions')
        .select('montant, montant_paye')
        .or('statut.eq.impaye,statut.eq.partiel');

      if (sanctionsImpayees && sanctionsImpayees.length > 0) {
        const montantTotal = sanctionsImpayees.reduce((sum, s) => sum + (Number(s.montant) - Number(s.montant_paye || 0)), 0);
        if (montantTotal > 50000) {
          alertesDetectees.push({
            id: 'sanctions-impayees',
            type: 'warning',
            titre: 'Sanctions impayées importantes',
            description: `${sanctionsImpayees.length} sanction(s) non réglée(s) pour un total de ${montantTotal.toLocaleString()} FCFA`,
            severite: 'importante',
            montant: montantTotal
          });
        }
      }

      // 4. Analyser le ratio épargnes/prêts
      const { data: epargnes } = await supabase
        .from('epargnes')
        .select('montant')
        .eq('statut', 'actif');

      const { data: prets } = await supabase
        .from('prets')
        .select('montant, montant_paye')
        .neq('statut', 'rembourse');

      const totalEpargnes = epargnes?.reduce((sum, e) => sum + Number(e.montant), 0) || 0;
      const totalPretsActifs = prets?.reduce((sum, p) => sum + (Number(p.montant) - Number(p.montant_paye)), 0) || 0;

      if (totalEpargnes > 0) {
        const ratioPrets = (totalPretsActifs / totalEpargnes) * 100;
        
        if (ratioPrets > 80) {
          alertesDetectees.push({
            id: 'ratio-prets-eleve',
            type: 'warning',
            titre: 'Ratio prêts/épargnes élevé',
            description: `Les prêts actifs représentent ${ratioPrets.toFixed(1)}% des épargnes. Risque de liquidité.`,
            severite: 'importante',
            pourcentage: ratioPrets,
            action: 'Limiter les nouveaux prêts'
          });
        }
      }

      // 5. Vérifier la trésorerie disponible
      const tresorerieDisponible = totalEpargnes - totalPretsActifs;
      const { data: membres } = await supabase
        .from('membres')
        .select('id')
        .eq('statut', 'actif');

      const membresActifs = membres?.length || 0;
      const tresorerieParMembre = membresActifs > 0 ? tresorerieDisponible / membresActifs : 0;

      if (tresorerieParMembre < 20000) {
        alertesDetectees.push({
          id: 'tresorerie-faible',
          type: 'warning',
          titre: 'Trésorerie disponible faible',
          description: `Seulement ${tresorerieParMembre.toLocaleString()} FCFA disponible par membre actif.`,
          severite: 'importante',
          montant: tresorerieDisponible
        });
      }

      // 6. Analyser la tendance des dépenses (aides)
      const { data: aidesMois } = await supabase
        .from('aides')
        .select('montant')
        .gte('date_allocation', debutMois.toISOString());

      const { data: aidesMoisDernier } = await supabase
        .from('aides')
        .select('montant')
        .gte('date_allocation', debutMoisDernier.toISOString())
        .lte('date_allocation', finMoisDernier.toISOString());

      const totalAidesMois = aidesMois?.reduce((sum, a) => sum + Number(a.montant), 0) || 0;
      const totalAidesMoisDernier = aidesMoisDernier?.reduce((sum, a) => sum + Number(a.montant), 0) || 0;

      if (totalAidesMoisDernier > 0) {
        const hausseAides = ((totalAidesMois - totalAidesMoisDernier) / totalAidesMoisDernier) * 100;
        
        if (hausseAides > 50) {
          alertesDetectees.push({
            id: 'hausse-aides',
            type: 'warning',
            titre: 'Augmentation des aides',
            description: `Les aides ont augmenté de ${hausseAides.toFixed(1)}% ce mois-ci. Budget à surveiller.`,
            severite: 'normale',
            pourcentage: hausseAides
          });
        }
      }

      // Si aucune alerte, ajouter un message positif
      if (alertesDetectees.length === 0) {
        alertesDetectees.push({
          id: 'situation-saine',
          type: 'success',
          titre: 'Situation financière saine',
          description: 'Aucune alerte détectée. La gestion financière est conforme aux objectifs.',
          severite: 'normale'
        });
      }

      setAlertes(alertesDetectees);
    } catch (error) {
      console.error('Erreur analyse budget:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser les alertes budgétaires.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIconeAlerte = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getSeveriteBadge = (severite: string) => {
    switch (severite) {
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>;
      case 'importante':
        return <Badge variant="default" className="bg-warning text-warning-foreground">Importante</Badge>;
      default:
        return <Badge variant="secondary">Normale</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes Budgétaires</CardTitle>
          <CardDescription>Analyse en cours...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes Budgétaires
            </CardTitle>
            <CardDescription>Notifications et recommandations financières</CardDescription>
          </div>
          <Button onClick={analyserBudget} variant="outline" size="sm">
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alertes.map((alerte) => (
            <Alert key={alerte.id} variant={alerte.type === 'error' ? 'destructive' : 'default'}>
              <div className="flex items-start gap-3">
                {getIconeAlerte(alerte.type)}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <AlertTitle>{alerte.titre}</AlertTitle>
                    {getSeveriteBadge(alerte.severite)}
                  </div>
                  <AlertDescription className="text-sm">
                    {alerte.description}
                  </AlertDescription>
                  {alerte.action && (
                    <div className="pt-2">
                      <Badge variant="outline" className="text-xs">
                        → {alerte.action}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
