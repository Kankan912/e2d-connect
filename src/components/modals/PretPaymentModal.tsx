import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PretPaymentModalProps {
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
  avaliste?: {
    nom: string;
    prenom: string;
  };
}

export default function PretPaymentModal({ open, onOpenChange, pretId, onSuccess }: PretPaymentModalProps) {
  const [pret, setPret] = useState<PretDetails | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
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
          membres!membre_id (nom, prenom),
          avaliste:membres!avaliste_id (nom, prenom)
        `)
        .eq('id', pretId)
        .single();

      if (error) throw error;

      setPret(data);

      // Calculer le montant total avec intérêts
      const { data: calculatedAmount, error: calcError } = await supabase
        .rpc('calculate_total_pret_amount', {
          montant_initial: data.montant,
          taux_interet: data.taux_interet,
          reconductions: data.reconductions
        });

      if (calcError) throw calcError;
      setTotalAmount(calculatedAmount);

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

  const handlePayment = async () => {
    if (!pret) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('prets')
        .update({ 
          statut: 'rembourse',
          updated_at: new Date().toISOString()
        })
        .eq('id', pret.id);

      if (error) throw error;

      toast({
        title: "Paiement confirmé",
        description: "Le prêt a été marqué comme remboursé",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le paiement",
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

  const interets = totalAmount - pret.montant;
  const isOverdue = new Date(pret.echeance) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Confirmation de Paiement
          </DialogTitle>
          <DialogDescription>
            Confirmez le remboursement total de ce prêt
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations emprunteur */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emprunteur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{pret.membres.prenom} {pret.membres.nom}</p>
                {pret.avaliste && (
                  <p className="text-sm text-muted-foreground">
                    Avaliste: {pret.avaliste.prenom} {pret.avaliste.nom}
                  </p>
                )}
                <div className="flex gap-2">
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? "En retard" : "En cours"}
                  </Badge>
                  {pret.reconductions > 0 && (
                    <Badge variant="outline">
                      {pret.reconductions} reconduction(s)
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calcul des intérêts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Détail du Calcul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Montant initial:</span>
                  <span className="font-medium">{pret.montant.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux d'intérêt:</span>
                  <span className="font-medium">{pret.taux_interet}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconductions:</span>
                  <span className="font-medium">{pret.reconductions}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Intérêts calculés:</span>
                  <span className="font-medium text-warning">{interets.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Montant total à rembourser:</span>
                  <span className="font-bold text-primary">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Période du prêt */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date du prêt</p>
                  <p className="font-medium">{new Date(pret.date_pret).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Échéance</p>
                  <p className="font-medium">{new Date(pret.echeance).toLocaleDateString('fr-FR')}</p>
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
              onClick={handlePayment} 
              disabled={processing}
              className="bg-success hover:bg-success/90"
            >
              {processing ? (
                "Traitement..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer le Remboursement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}