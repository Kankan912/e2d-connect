import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  montant_paye: z.number().min(1, "Le montant doit être supérieur à 0"),
  date_paiement: z.string().min(1, "La date est requise"),
  mode_paiement: z.string().min(1, "Le mode de paiement est requis"),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PretPaymentPartielFormProps {
  pretId: string;
  montantTotal: number;
  montantPaye: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PretPaymentPartielForm({
  pretId,
  montantTotal,
  montantPaye,
  onSuccess,
  onCancel
}: PretPaymentPartielFormProps) {
  const { toast } = useToast();
  const montantRestant = montantTotal - montantPaye;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
    }
  });

  const montantPayeValue = watch('montant_paye') || 0;

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Ajouter le paiement
      const { error: paymentError } = await supabase
        .from('prets_paiements')
        .insert({
          pret_id: pretId,
          montant_paye: data.montant_paye,
          date_paiement: data.date_paiement,
          mode_paiement: data.mode_paiement,
          notes: data.notes,
        });

      if (paymentError) throw paymentError;

      // Mettre à jour le statut du prêt si nécessaire
      const nouveauMontantPaye = montantPaye + data.montant_paye;
      let nouveauStatut = 'en_cours';
      
      if (nouveauMontantPaye >= montantTotal) {
        nouveauStatut = 'rembourse';
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'partiel';
      }

      const { error: updateError } = await supabase
        .from('prets')
        .update({ 
          statut: nouveauStatut,
          montant_paye: nouveauMontantPaye 
        })
        .eq('id', pretId);

      if (updateError) throw updateError;

      toast({
        title: "Paiement enregistré",
        description: "Le paiement partiel a été enregistré avec succès",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Paiement Partiel du Prêt</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Montant total: {montantTotal.toLocaleString()} FCFA</p>
          <p>Déjà payé: {montantPaye.toLocaleString()} FCFA</p>
          <p>Restant dû: {montantRestant.toLocaleString()} FCFA</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="montant_paye">Montant à payer (FCFA)</Label>
            <Input
              id="montant_paye"
              type="number"
              max={montantRestant}
              placeholder="Entrez le montant"
              {...register('montant_paye', { valueAsNumber: true })}
            />
            {errors.montant_paye && (
              <p className="text-sm text-destructive mt-1">
                {errors.montant_paye.message}
              </p>
            )}
            {montantPayeValue > montantRestant && (
              <p className="text-sm text-destructive mt-1">
                Le montant ne peut pas dépasser le restant dû
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date_paiement">Date de paiement</Label>
            <Input
              id="date_paiement"
              type="date"
              {...register('date_paiement')}
            />
            {errors.date_paiement && (
              <p className="text-sm text-destructive mt-1">
                {errors.date_paiement.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="mode_paiement">Mode de paiement</Label>
            <Select onValueChange={(value) => setValue('mode_paiement', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="especes">Espèces</SelectItem>
                <SelectItem value="virement">Virement</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            {errors.mode_paiement && (
              <p className="text-sm text-destructive mt-1">
                {errors.mode_paiement.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              placeholder="Notes sur le paiement"
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || montantPayeValue > montantRestant}
              className="flex-1"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}