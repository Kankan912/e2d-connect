import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlerteCotisation {
  membre_id: string;
  membre_nom: string;
  type_cotisation: string;
  jours_retard: number;
  montant: number;
  date_limite: string;
}

export default function AlertesCotisations() {
  const [alertes, setAlertes] = useState<AlerteCotisation[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    detecterCotisationsEnRetard();
  }, []);

  const detecterCotisationsEnRetard = async () => {
    try {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 7);

      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          id,
          membre_id,
          montant,
          date_paiement,
          membres(nom, prenom),
          cotisations_types(nom)
        `)
        .eq('statut', 'en_retard')
        .lt('date_paiement', dateLimit.toISOString().split('T')[0]);

      if (error) throw error;

      const alertesFormattees: AlerteCotisation[] = (data || []).map((cot: any) => {
        const joursRetard = Math.floor(
          (new Date().getTime() - new Date(cot.date_paiement).getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          membre_id: cot.membre_id,
          membre_nom: `${cot.membres.prenom} ${cot.membres.nom}`,
          type_cotisation: cot.cotisations_types.nom,
          jours_retard: joursRetard,
          montant: cot.montant,
          date_limite: cot.date_paiement
        };
      });

      setAlertes(alertesFormattees);
    } catch (error) {
      console.error('[ALERTES] Erreur:', error);
    }
  };

  const handleDismiss = (membreId: string) => {
    setDismissed(new Set([...dismissed, membreId]));
  };

  const alertesVisibles = alertes.filter(a => !dismissed.has(a.membre_id));

  if (alertesVisibles.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alertesVisibles.map((alerte, idx) => (
        <Alert key={idx} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Cotisation en retard - {alerte.membre_nom}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDismiss(alerte.membre_id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{alerte.type_cotisation}</Badge>
              <span className="text-sm">
                {alerte.montant.toLocaleString()} FCFA - 
                <strong className="ml-1">{alerte.jours_retard} jours de retard</strong>
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Date limite : {new Date(alerte.date_limite).toLocaleDateString('fr-FR')}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
