import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const paymentSchema = z.object({
  montant_paye: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  date_paiement: z.string().min(1, "La date est requise"),
  mode_paiement: z.enum(['espece', 'depot_electronique', 'cheque']).default('espece'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentSanctionFormProps {
  sanctionId: string;
  montantTotal: number;
  montantPaye?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentSanctionForm({ 
  sanctionId, 
  montantTotal, 
  montantPaye = 0,
  onSuccess, 
  onCancel 
}: PaymentSanctionFormProps) {
  const { toast } = useToast();
  const montantRestant = montantTotal - montantPaye;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant_paye: montantRestant,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const nouveauMontantPaye = montantPaye + data.montant_paye;
      let nouveauStatut = 'partiel';
      
      if (nouveauMontantPaye >= montantTotal) {
        nouveauStatut = 'paye';
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = 'partiel';
      } else {
        nouveauStatut = 'impaye';
      }

      const nouvellesNotes = data.notes ? 
        `Paiement de ${data.montant_paye} FCFA le ${data.date_paiement} (${data.mode_paiement}) - ${data.notes}` : 
        `Paiement de ${data.montant_paye} FCFA le ${data.date_paiement} (${data.mode_paiement})`;

      const { error } = await supabase
        .from('sanctions')
        .update({ 
          statut: nouveauStatut,
          montant_paye: nouveauMontantPaye,
          motif: nouvellesNotes
        })
        .eq('id', sanctionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: nouveauStatut === 'paye' ? 
          "Paiement complet enregistré avec succès" : 
          "Paiement partiel enregistré avec succès",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur paiement sanction:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un paiement</CardTitle>
        {montantPaye > 0 && (
          <div className="text-sm text-muted-foreground">
            Déjà payé: {montantPaye.toLocaleString()} FCFA | 
            Reste à payer: {montantRestant.toLocaleString()} FCFA
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant_paye">Montant payé (FCFA) *</Label>
              <Input
                id="montant_paye"
                type="number"
                step="0.01"
                {...form.register('montant_paye', { valueAsNumber: true })}
              />
              {form.formState.errors.montant_paye && (
                <p className="text-sm text-red-500">{form.formState.errors.montant_paye.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date de paiement *</Label>
              <Input
                id="date_paiement"
                type="date"
                {...form.register('date_paiement')}
              />
              {form.formState.errors.date_paiement && (
                <p className="text-sm text-red-500">{form.formState.errors.date_paiement.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mode_paiement">Mode de paiement</Label>
            <Select 
              value={form.watch('mode_paiement')} 
              onValueChange={(value) => form.setValue('mode_paiement', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le mode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="espece">Espèces</SelectItem>
                <SelectItem value="depot_electronique">Dépôt électronique</SelectItem>
                <SelectItem value="cheque">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Input
              id="notes"
              placeholder="Informations complémentaires..."
              {...form.register('notes')}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Enregistrer le paiement
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}