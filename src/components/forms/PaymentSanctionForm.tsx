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
  mode_paiement: z.enum(['espece', 'virement', 'cheque']).default('espece'),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentSanctionFormProps {
  sanctionId: string;
  montantTotal: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentSanctionForm({ 
  sanctionId, 
  montantTotal, 
  onSuccess, 
  onCancel 
}: PaymentSanctionFormProps) {
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      montant_paye: montantTotal,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      notes: '',
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    try {
      // Mettre à jour le statut de la sanction
      const { error } = await supabase
        .from('sanctions')
        .update({ 
          statut: 'paye',
          // Ajouter les informations de paiement dans les notes
          motif: data.notes ? `${data.notes} - Payé le ${data.date_paiement} (${data.mode_paiement})` : `Payé le ${data.date_paiement} (${data.mode_paiement})`
        })
        .eq('id', sanctionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement enregistré avec succès",
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
                <SelectItem value="virement">Virement</SelectItem>
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