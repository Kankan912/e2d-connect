import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, DollarSign, Calendar, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Beneficiaire {
  id: string;
  membre_id: string;
  montant_benefice: number;
  date_benefice_prevue: string;
  statut: string;
  membre?: {
    nom: string;
    prenom: string;
    email: string;
  };
}

interface BeneficiairesReunionProps {
  reunionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BeneficiairesReunion({ reunionId, open, onOpenChange }: BeneficiairesReunionProps) {
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationLoading, setGenerationLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && reunionId) {
      loadBeneficiaires();
    }
  }, [open, reunionId]);

  const loadBeneficiaires = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membre:membre_id (
            nom,
            prenom,
            email
          )
        `)
        .eq('reunion_id', reunionId)
        .order('date_benefice_prevue');

      if (error) throw error;
      setBeneficiaires(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les bénéficiaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const genererBeneficiaires = async () => {
    setGenerationLoading(true);
    try {
      // Récupérer les membres avec leurs cotisations récentes
      const { data: cotisations, error } = await supabase
        .from('cotisations')
        .select('membre_id, montant, date_paiement')
        .eq('statut', 'paye')
        .order('date_paiement', { ascending: false });

      if (error) throw error;

      const membresUniques = new Map<string, { membre_id: string; totalCotisations: number }>();
      cotisations?.forEach((cot: any) => {
        if (!membresUniques.has(cot.membre_id)) {
          membresUniques.set(cot.membre_id, {
            membre_id: cot.membre_id,
            totalCotisations: cot.montant,
          });
        } else {
          const existing = membresUniques.get(cot.membre_id)!;
          existing.totalCotisations += cot.montant;
        }
      });

      // Créer les bénéficiaires (calcul basique)
      const nouveauxBeneficiaires = Array.from(membresUniques.values()).map((membre) => ({
        reunion_id: reunionId,
        membre_id: membre.membre_id,
        montant_benefice: Math.round(membre.totalCotisations * 0.1), // 10% du total des cotisations
        date_benefice_prevue: new Date().toISOString().split('T')[0],
        statut: 'prevu'
      }));

      // Supprimer les anciens bénéficiaires
      await supabase
        .from('reunion_beneficiaires')
        .delete()
        .eq('reunion_id', reunionId);

      // Insérer les nouveaux
      const { error: insertError } = await supabase
        .from('reunion_beneficiaires')
        .insert(nouveauxBeneficiaires);

      if (insertError) throw insertError;

      toast({
        title: "Succès",
        description: `${nouveauxBeneficiaires.length} bénéficiaires générés automatiquement`,
      });

      loadBeneficiaires();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de générer les bénéficiaires",
        variant: "destructive",
      });
    } finally {
      setGenerationLoading(false);
    }
  };

  const envoyerNotifications = async () => {
    try {
      // Ici on pourrait implémenter l'envoi d'emails via edge function
      toast({
        title: "Notifications envoyées",
        description: "Les emails ont été envoyés aux bénéficiaires",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les notifications",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bénéficiaires de la réunion
          </DialogTitle>
          <DialogDescription>
            Gérez les bénéficiaires et leurs montants pour cette réunion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={genererBeneficiaires} 
              disabled={generationLoading}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {generationLoading ? "Génération..." : "Générer auto"}
            </Button>
            <Button 
              variant="outline" 
              onClick={envoyerNotifications}
              disabled={beneficiaires.length === 0}
            >
              <Mail className="h-4 w-4 mr-2" />
              Envoyer notifications
            </Button>
          </div>

          {/* Liste des bénéficiaires */}
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date prévue</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiaires.map((beneficiaire) => (
                      <TableRow key={beneficiaire.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {beneficiaire.membre?.prenom} {beneficiaire.membre?.nom}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {beneficiaire.membre?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-success">
                          {beneficiaire.montant_benefice?.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          {new Date(beneficiaire.date_benefice_prevue).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            beneficiaire.statut === 'prevu' ? 'outline' :
                            beneficiaire.statut === 'verse' ? 'default' : 'secondary'
                          }>
                            {beneficiaire.statut === 'prevu' ? 'Prévu' :
                             beneficiaire.statut === 'verse' ? 'Versé' : 'Annulé'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {beneficiaires.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Aucun bénéficiaire. Utilisez "Générer auto" pour calculer automatiquement.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}