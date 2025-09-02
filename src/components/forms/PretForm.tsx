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

const pretSchema = z.object({
  membre_id: z.string().min(1, "Le membre est requis"),
  montant: z.number().min(1, "Le montant doit être positif"),
  date_pret: z.string().min(1, "La date du prêt est requise"),
  echeance: z.string().min(1, "L'échéance est requise"),
  taux_interet: z.number().min(0).default(0),
  avaliste_id: z.string().optional(),
  notes: z.string().optional(),
  statut: z.enum(['en_cours', 'rembourse', 'en_retard', 'annule']).default('en_cours'),
});

type PretFormData = z.infer<typeof pretSchema>;

interface PretFormProps {
  onSuccess?: () => void;
  initialData?: Partial<PretFormData> & { id?: string };
}

export default function PretForm({ onSuccess, initialData }: PretFormProps) {
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

  const form = useForm<PretFormData>({
    resolver: zodResolver(pretSchema),
    defaultValues: {
      membre_id: initialData?.membre_id || '',
      montant: initialData?.montant || 0,
      date_pret: initialData?.date_pret || new Date().toISOString().split('T')[0],
      echeance: initialData?.echeance || '',
      taux_interet: initialData?.taux_interet || 0,
      avaliste_id: initialData?.avaliste_id || '',
      notes: initialData?.notes || '',
      statut: initialData?.statut || 'en_cours',
    },
  });

  const onSubmit = async (data: PretFormData) => {
    console.log('💰 Soumission prêt:', data);
    
    // Validation des dates
    const datePret = new Date(data.date_pret);
    const echeance = new Date(data.echeance);
    
    if (echeance <= datePret) {
      toast({
        title: "Erreur de validation",
        description: "L'échéance doit être postérieure à la date du prêt",
        variant: "destructive",
      });
      return;
    }

    const operation = async () => {
      const payload = {
        ...data,
        avaliste_id: data.avaliste_id || null, // Convertir chaîne vide en null
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('prets')
          .update(payload)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prets')
          .insert([payload]);
        if (error) throw error;
      }
    };

    try {
      await withEnsureAdmin(operation);
      
      console.log('✅ Prêt sauvegardé');
      toast({
        title: "Succès",
        description: initialData?.id ? "Prêt mis à jour" : "Prêt créé avec succès",
      });
      
      // Invalider les queries pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Erreur prêt:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le prêt",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Modifier' : 'Nouveau'} Prêt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre_id">Bénéficiaire *</Label>
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
              <Label htmlFor="taux_interet">Taux d'intérêt (%)</Label>
              <Input
                id="taux_interet"
                type="number"
                step="0.01"
                min="0"
                {...form.register('taux_interet', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_pret">Date du prêt *</Label>
              <Input
                id="date_pret"
                type="date"
                {...form.register('date_pret')}
              />
              {form.formState.errors.date_pret && (
                <p className="text-sm text-red-500">{form.formState.errors.date_pret.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="echeance">Échéance *</Label>
              <Input
                id="echeance"
                type="date"
                {...form.register('echeance')}
              />
              {form.formState.errors.echeance && (
                <p className="text-sm text-red-500">{form.formState.errors.echeance.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avaliste_id">Avaliste (optionnel)</Label>
            <Select 
              value={form.watch('avaliste_id') || ''} 
              onValueChange={(value) => form.setValue('avaliste_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un avaliste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun avaliste</SelectItem>
                {membres?.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.prenom} {membre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="rembourse">Remboursé</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
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
            {form.formState.isSubmitting ? 'Enregistrement...' : (initialData?.id ? 'Mettre à jour' : 'Créer le prêt')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
