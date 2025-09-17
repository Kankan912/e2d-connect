import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEnsureAdmin } from '@/hooks/useEnsureAdmin';

const cotisationSchema = z.object({
  membre_id: z.string().min(1, "Le membre est requis"),
  type_cotisation_id: z.string().min(1, "Le type de cotisation est requis"),
  montant: z.number().min(0, "Le montant doit être positif"),
  date_paiement: z.string().optional(),
  statut: z.enum(['en_attente', 'payee', 'en_retard', 'exoneree']).default('en_attente'),
  notes: z.string().optional(),
});

type CotisationFormData = z.infer<typeof cotisationSchema>;

interface CotisationFormProps {
  onSuccess?: () => void;
  initialData?: Partial<CotisationFormData> & { id?: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CotisationForm({ onSuccess, initialData }: CotisationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { withEnsureAdmin } = useEnsureAdmin();

  const { data: membres } = useQuery({
    queryKey: ['membres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  const { data: typesCotisations } = useQuery({
    queryKey: ['cotisations-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<CotisationFormData>({
    resolver: zodResolver(cotisationSchema),
    defaultValues: {
      membre_id: initialData?.membre_id || '',
      type_cotisation_id: initialData?.type_cotisation_id || '',
      montant: initialData?.montant || 0,
      date_paiement: initialData?.date_paiement || '',
      statut: initialData?.statut || 'en_attente',
      notes: initialData?.notes || '',
    },
  });

  const selectedType = typesCotisations?.find(t => t.id === form.watch('type_cotisation_id'));

  // Auto-remplir le montant par défaut si un type est sélectionné
  React.useEffect(() => {
    if (selectedType && selectedType.montant_defaut && !initialData?.id) {
      form.setValue('montant', selectedType.montant_defaut);
    }
  }, [selectedType, form, initialData?.id]);

  const onSubmit = async (data: CotisationFormData) => {
    const operation = async () => {
      const payload = {
        ...data,
        date_paiement: data.date_paiement || null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('cotisations')
          .update(payload as any)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cotisations')
          .insert([payload as any]);
        if (error) throw error;
      }
    };

    try {
      await withEnsureAdmin(operation);
      
      toast({
        title: "Succès",
        description: initialData?.id ? "Cotisation mise à jour" : "Cotisation enregistrée avec succès",
      });
      
      // Invalider les queries pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Erreur cotisation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la cotisation",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Modifier' : 'Nouvelle'} Cotisation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre_id">Membre *</Label>
            <Select 
              value={form.watch('membre_id')} 
              onValueChange={(value) => form.setValue('membre_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {membres?.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.prenom} {membre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.membre_id && (
              <p className="text-sm text-red-500">{form.formState.errors.membre_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type_cotisation_id">Type de cotisation *</Label>
            <Select 
              value={form.watch('type_cotisation_id')} 
              onValueChange={(value) => form.setValue('type_cotisation_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typesCotisations?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.nom} {type.montant_defaut && `(${type.montant_defaut}€)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type_cotisation_id && (
              <p className="text-sm text-red-500">{form.formState.errors.type_cotisation_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (€) *</Label>
              <Input
                id="montant"
                type="number"
                step="0.01"
                min="0"
                {...form.register('montant', { valueAsNumber: true })}
              />
              {form.formState.errors.montant && (
                <p className="text-sm text-red-500">{form.formState.errors.montant.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date de paiement</Label>
              <Input
                id="date_paiement"
                type="date"
                {...form.register('date_paiement')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select 
              value={form.watch('statut')} 
              onValueChange={(value) => form.setValue('statut', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
                <SelectItem value="exoneree">Exonérée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Enregistrement...' : (initialData?.id ? 'Mettre à jour' : 'Enregistrer la cotisation')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
