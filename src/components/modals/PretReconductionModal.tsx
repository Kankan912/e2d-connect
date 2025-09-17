import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PretReconductionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pretId: string | null;
  onSuccess: () => void;
}

interface PretDetails {
  id: string;
  montant: number;
  taux_interet: number;
  reconductions: number;
  date_pret: string;
  echeance: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PretReconductionModal({ open, onOpenChange, pretId, onSuccess }: PretReconductionModalProps) {
  const [pret, setPret] = useState<PretDetails | null>(null);
  const [nouvelleEcheance, setNouvelleEcheance] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && pretId) {
      loadPretDetails();
    }
  }, [open, pretId]);

  const loadPretDetails = async () => {
    if (!pretId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prets')
        .select(`
          *,
          membres!membre_id (nom, prenom)
        `)
        .eq('id', pretId)
        .single();

      if (error) throw error;

      setPret(data);
      
      // Calculer nouvelle échéance par défaut (2 mois après l'échéance actuelle)
      const currentEcheance = new Date(data.echeance);
      const newEcheance = new Date(currentEcheance);
      newEcheance.setMonth(newEcheance.getMonth() + 2);
      setNouvelleEcheance(newEcheance.toISOString().split('T')[0]);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du prêt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconduction = async () => {
    if (!pret || !nouvelleEcheance) return;

    const newEcheanceDate = new Date(nouvelleEcheance);
    const currentEcheanceDate = new Date(pret.echeance);

    if (newEcheanceDate <= currentEcheanceDate) {
      toast({
        title: "Erreur",
        description: "La nouvelle échéance doit être postérieure à l'échéance actuelle",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('prets')
        .update({ 
          reconductions: pret.reconductions + 1,
          echeance: nouvelleEcheance,
          statut: 'reconduit',
          updated_at: new Date().toISOString()
        })
        .eq('id', pret.id);

      if (error) throw error;

      toast({
        title: "Reconduction effectuée",
        description: `Le prêt a été reconduit avec succès. Nouvelle échéance: ${new Date(nouvelleEcheance).toLocaleDateString('fr-FR')}`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer la reconduction",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!pret) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reconduction de Prêt
          </DialogTitle>
          <DialogDescription>
            Prolonger l'échéance de ce prêt (augmente les intérêts)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations emprunteur */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prêt en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{pret.membres.prenom} {pret.membres.nom}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant initial</p>
                    <p className="font-medium">{pret.montant.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'intérêt</p>
                    <p className="font-medium">{pret.taux_interet}%</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">
                    {pret.reconductions} reconduction(s) actuelle(s)
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Échéances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Modification de l'Échéance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Échéance actuelle</p>
                    <p className="font-medium">{new Date(pret.echeance).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <Label htmlFor="nouvelle-echeance">Nouvelle échéance</Label>
                    <Input
                      id="nouvelle-echeance"
                      type="date"
                      value={nouvelleEcheance}
                      onChange={(e) => setNouvelleEcheance(e.target.value)}
                      min={new Date(pret.echeance).toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact de la reconduction */}
          <Card className="bg-warning/10 border-warning/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning-foreground">
                <DollarSign className="h-4 w-4" />
                Impact de la Reconduction
              </CardTitle>
            </CardHeader>
            <CardContent className="text-warning-foreground">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Attention:</strong> La reconduction augmentera les intérêts à payer.
                </p>
                <p className="text-sm">
                  Formule: Montant + (Montant × Taux%) × (1 + Reconductions)
                </p>
                <Separator className="bg-warning/20" />
                <div className="flex justify-between text-sm">
                  <span>Reconductions après cette opération:</span>
                  <span className="font-medium">{pret.reconductions + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleReconduction} 
              disabled={processing || !nouvelleEcheance}
              className="bg-warning hover:bg-warning/90"
            >
              {processing ? (
                "Traitement..."
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconduire le Prêt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}