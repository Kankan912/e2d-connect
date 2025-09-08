import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

const compteRenduSchema = z.object({
  sujets: z.array(z.object({
    titre: z.string().min(1, "Le titre est requis"),
    resolution: z.string().min(1, "La résolution est requise"),
  })).min(1, "Au moins un sujet est requis"),
});

type CompteRenduFormData = z.infer<typeof compteRenduSchema>;

interface CompteRenduFormProps {
  reunionId: string;
  ordreJour?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CompteRenduForm({ 
  reunionId, 
  ordreJour = "", 
  onSuccess, 
  onCancel 
}: CompteRenduFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompteRenduFormData>({
    resolver: zodResolver(compteRenduSchema),
    defaultValues: {
      sujets: ordreJour 
        ? ordreJour.split('\n').filter(s => s.trim()).map(s => ({ titre: s.trim(), resolution: '' }))
        : [{ titre: '', resolution: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sujets"
  });

  const onSubmit = async (data: CompteRenduFormData) => {
    setIsSubmitting(true);
    try {
      // Supprimer les anciens rapports
      await supabase
        .from('rapports_seances')
        .delete()
        .eq('reunion_id', reunionId);

      // Insérer les nouveaux rapports
      const rapports = data.sujets.map(sujet => ({
        reunion_id: reunionId,
        sujet: sujet.titre,
        resolution: sujet.resolution,
      }));

      const { error: insertError } = await supabase
        .from('rapports_seances')
        .insert(rapports);

      if (insertError) throw insertError;

      // Mettre à jour le statut de la réunion
      const { error: updateError } = await supabase
        .from('reunions')
        .update({ 
          statut: 'terminee',
          compte_rendu_url: 'generated' // Marquer comme ayant un compte-rendu
        })
        .eq('id', reunionId);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Compte-rendu enregistré avec succès",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur compte-rendu:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le compte-rendu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter le compte-rendu</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sujet {index + 1}</Label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`sujets.${index}.titre`}>Titre du sujet *</Label>
                  <Input
                    {...form.register(`sujets.${index}.titre`)}
                    placeholder="Ex: Approbation du budget 2024"
                  />
                  {form.formState.errors.sujets?.[index]?.titre && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.sujets[index]?.titre?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`sujets.${index}.resolution`}>Résolution/Décision *</Label>
                  <Textarea
                    {...form.register(`sujets.${index}.resolution`)}
                    placeholder="Décision prise, vote, action à mener..."
                    rows={3}
                  />
                  {form.formState.errors.sujets?.[index]?.resolution && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.sujets[index]?.resolution?.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ titre: '', resolution: '' })}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un sujet
          </Button>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le compte-rendu'}
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