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
import { useQueryClient } from '@tanstack/react-query';
import { useEnsureAdmin } from '@/hooks/useEnsureAdmin';

const reunionSchema = z.object({
  date_reunion: z.string().min(1, "La date est requise"),
  lieu_membre_id: z.string().optional(),
  lieu_description: z.string().optional(),
  ordre_du_jour: z.string().optional(),
  statut: z.enum(['planifiee', 'en_cours', 'terminee', 'reportee', 'annulee']).default('planifiee'),
});

type ReunionFormData = z.infer<typeof reunionSchema>;

interface ReunionFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ReunionFormData> & { id?: string };
}

export default function ReunionForm({ onSuccess, initialData }: ReunionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { withEnsureAdmin } = useEnsureAdmin();

  const form = useForm<ReunionFormData>({
    resolver: zodResolver(reunionSchema),
    defaultValues: {
      date_reunion: initialData?.date_reunion || '',
      lieu_membre_id: initialData?.lieu_membre_id || '',
      lieu_description: initialData?.lieu_description || '',
      ordre_du_jour: initialData?.ordre_du_jour || '',
      statut: initialData?.statut || 'planifiee',
    },
  });

  const onSubmit = async (data: ReunionFormData) => {
    console.log('📝 Soumission réunion:', data);
    
    const operation = async () => {
      if (initialData?.id) {
        const { error } = await supabase
          .from('reunions')
          .update(data)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reunions')
          .insert([data]);
        if (error) throw error;
      }
    };

    try {
      await withEnsureAdmin(operation);
      
      console.log('✅ Réunion sauvegardée');
      toast({
        title: "Succès",
        description: initialData?.id ? "Réunion mise à jour" : "Réunion créée avec succès",
      });
      
      // Invalider les queries pour rafraîchir
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Erreur réunion:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la réunion",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? 'Modifier' : 'Nouvelle'} Réunion</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date_reunion">Date de la réunion *</Label>
            <Input
              id="date_reunion"
              type="date"
              {...form.register('date_reunion')}
            />
            {form.formState.errors.date_reunion && (
              <p className="text-sm text-red-500">{form.formState.errors.date_reunion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lieu_description">Lieu</Label>
            <Input
              id="lieu_description"
              placeholder="Ex: Salle communale, Domicile..."
              {...form.register('lieu_description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordre_du_jour">Ordre du jour</Label>
            <Textarea
              id="ordre_du_jour"
              placeholder="Points à l'ordre du jour..."
              rows={4}
              {...form.register('ordre_du_jour')}
            />
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
                <SelectItem value="planifiee">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="reportee">Reportée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Enregistrement...' : (initialData?.id ? 'Mettre à jour' : 'Créer la réunion')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
