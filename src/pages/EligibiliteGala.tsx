import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EligibiliteGala() {
  return (
    <div className="space-y-6">
      <LogoHeader title="Éligibilité Match de Gala" subtitle="Règles d'éligibilité basées sur cotisations et présences" />

      <Card>
        <CardHeader>
          <CardTitle>Règles (exemple)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• À jour de 80% des cotisations de l'exercice en cours.</p>
          <p>• Présence à au moins 60% des entraînements.</p>
          <p>• Aucune sanction majeure en cours.</p>
          <p className="mt-2">L'implémentation détaillée (calcul automatique) sera ajoutée ensuite.</p>
        </CardContent>
      </Card>
    </div>
  );
}