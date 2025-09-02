import { useEffect, useState } from "react";
import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MembreEligibilite {
  id: string;
  nom: string;
  prenom: string;
  eligible: boolean;
  cotisationsRatio: number;
  presencesRatio: number;
  sanctionsActive: boolean;
  details: string[];
}

export default function EligibiliteGala() {
  const [membres, setMembres] = useState<MembreEligibilite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateEligibility();
  }, []);

  const calculateEligibility = async () => {
    try {
      // Récupérer tous les membres actifs
      const { data: membresData, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, est_membre_e2d, est_adherent_phoenix')
        .eq('statut', 'actif');

      if (error) throw error;

      const eligibilityPromises = (membresData || []).map(async (membre) => {
        const [cotisations, presences, sanctions] = await Promise.all([
          // Cotisations payées cette année
          supabase
            .from('cotisations')
            .select('montant')
            .eq('membre_id', membre.id)
            .gte('date_paiement', new Date().getFullYear() + '-01-01'),
          
          // Présences (E2D ou Phoenix selon appartenance)
          membre.est_membre_e2d 
            ? supabase
                .from('sport_e2d_presences')
                .select('present')
                .eq('membre_id', membre.id)
                .gte('date_seance', new Date().getFullYear() + '-01-01')
            : supabase
                .from('phoenix_presences')
                .select('present')
                .eq('adherent_id', membre.id) // Attention: besoin de jointure avec phoenix_adherents
                .gte('date_entrainement', new Date().getFullYear() + '-01-01'),
          
          // Sanctions actives
          supabase
            .from('sanctions')
            .select('statut, montant')
            .eq('membre_id', membre.id)
            .eq('statut', 'impaye')
        ]);

        // Calcul des ratios (approximation)
        const totalCotisationsAttendu = 100000; // Valeur par défaut
        const totalCotisationsPaye = (cotisations.data || []).reduce((sum, c) => sum + (c.montant || 0), 0);
        const cotisationsRatio = Math.min((totalCotisationsPaye / totalCotisationsAttendu) * 100, 100);

        const totalPresences = presences.data?.length || 0;
        const presencesPresent = (presences.data || []).filter(p => p.present).length;
        const presencesRatio = totalPresences > 0 ? (presencesPresent / totalPresences) * 100 : 0;

        const sanctionsActive = (sanctions.data || []).length > 0;

        // Règles d'éligibilité
        const cotisationsOK = cotisationsRatio >= 80;
        const presencesOK = presencesRatio >= 60;
        const sanctionsOK = !sanctionsActive;
        
        const eligible = cotisationsOK && presencesOK && sanctionsOK;

        const details = [];
        if (!cotisationsOK) details.push(`Cotisations: ${cotisationsRatio.toFixed(1)}% (minimum 80%)`);
        if (!presencesOK) details.push(`Présences: ${presencesRatio.toFixed(1)}% (minimum 60%)`);
        if (!sanctionsOK) details.push(`Sanctions impayées`);

        return {
          id: membre.id,
          nom: membre.nom,
          prenom: membre.prenom,
          eligible,
          cotisationsRatio,
          presencesRatio,
          sanctionsActive,
          details
        };
      });

      const eligibilityResults = await Promise.all(eligibilityPromises);
      setMembres(eligibilityResults);
    } catch (error) {
      console.error('Erreur lors du calcul de l\'éligibilité:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader title="Éligibilité Match de Gala" subtitle="Règles d'éligibilité basées sur cotisations et présences" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eligibles = membres.filter(m => m.eligible);
  const nonEligibles = membres.filter(m => !m.eligible);
  return (
    <div className="space-y-6">
      <LogoHeader title="Éligibilité Match de Gala" subtitle="Règles d'éligibilité basées sur cotisations et présences" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{eligibles.length}</div>
            <div className="text-sm text-muted-foreground">Éligibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{nonEligibles.length}</div>
            <div className="text-sm text-muted-foreground">Non éligibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{membres.length}</div>
            <div className="text-sm text-muted-foreground">Total membres</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Règles d'éligibilité</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>À jour d'au moins 80% des cotisations de l'exercice en cours</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Présence à au moins 60% des entraînements</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Aucune sanction majeure impayée</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {membres.map((membre) => (
              <div key={membre.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">
                    {membre.prenom} {membre.nom}
                  </h3>
                  {membre.eligible ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Éligible
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Non éligible
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cotisations</span>
                      <span>{membre.cotisationsRatio.toFixed(1)}%</span>
                    </div>
                    <Progress value={membre.cotisationsRatio} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Présences</span>
                      <span>{membre.presencesRatio.toFixed(1)}%</span>
                    </div>
                    <Progress value={membre.presencesRatio} className="h-2" />
                  </div>
                </div>

                {membre.sanctionsActive && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Sanctions impayées</span>
                  </div>
                )}

                {membre.details.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Détails:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {membre.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {membres.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                Aucun membre trouvé
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}