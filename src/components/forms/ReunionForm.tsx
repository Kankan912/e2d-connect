import React, { useState, useEffect } from 'react';
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
  type_reunion: z.enum(['AGO', 'AGE']).default('AGO'),
  sujet: z.string().min(1, "Le sujet est requis"),
  date_reunion: z.string().min(1, "La date est requise"),
  heure_reunion: z.string().optional(),
  lieu_membre_id: z.string().optional(),
  lieu_description: z.string().optional(),
  ordre_du_jour: z.string().optional(),
  statut: z.enum(['planifie', 'en_cours', 'termine', 'reporte', 'annule']).default('planifie'),
  invites_ids: z.array(z.string()).default([]),
});

type ReunionFormData = z.infer<typeof reunionSchema>;

interface ReunionFormProps {
  onSuccess?: () => void;
  initialData?: Partial<ReunionFormData> & { id?: string };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function ReunionForm({ onSuccess, initialData }: ReunionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { withEnsureAdmin } = useEnsureAdmin();
  const [membres, setMembres] = useState<Membre[]>([]);

  const form = useForm<ReunionFormData>({
    resolver: zodResolver(reunionSchema),
    defaultValues: {
      type_reunion: initialData?.type_reunion || 'AGO',
      sujet: initialData?.sujet || '',
      date_reunion: initialData?.date_reunion || '',
      heure_reunion: initialData?.heure_reunion || '19:00',
      lieu_membre_id: initialData?.lieu_membre_id || '',
      lieu_description: initialData?.lieu_description || '',
      ordre_du_jour: initialData?.ordre_du_jour || '',
      statut: initialData?.statut || 'planifie',
      invites_ids: initialData?.invites_ids || [],
    },
  });

  useEffect(() => {
    fetchMembres();
  }, []);

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');
      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const onSubmit = async (data: ReunionFormData) => {
    console.log('📝 Soumission réunion:', data);
    
    // Préparer les données avec gestion des UUID vides
    const formattedData = {
      type_reunion: data.type_reunion,
      sujet: data.sujet,
      date_reunion: data.heure_reunion 
        ? `${data.date_reunion}T${data.heure_reunion}:00.000Z`
        : `${data.date_reunion}T19:00:00.000Z`,
      lieu_membre_id: data.lieu_membre_id && data.lieu_membre_id.trim() !== '' 
        ? data.lieu_membre_id 
        : null,
      lieu_description: data.lieu_description,
      ordre_du_jour: data.ordre_du_jour,
      statut: data.statut,
    };
    
  // Supprimer heure_reunion car elle est intégrée dans date_reunion
  delete (formattedData as any).heure_reunion;
  
  // Gérer les invitations - envoi automatique à tous les membres
  console.log('Lieu membre sélectionné:', data.lieu_membre_id);
    
    const operation = async () => {
      if (initialData?.id) {
        const { error } = await supabase
          .from('reunions')
          .update(formattedData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reunions')
          .insert([formattedData]);
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_reunion">Type de réunion *</Label>
              <Select 
                value={form.watch('type_reunion')} 
                onValueChange={(value) => form.setValue('type_reunion', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGO">AGO - Assemblée Générale Ordinaire</SelectItem>
                  <SelectItem value="AGE">AGE - Assemblée Générale Extraordinaire</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type_reunion && (
                <p className="text-sm text-red-500">{form.formState.errors.type_reunion.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sujet">Sujet de la réunion *</Label>
              <Input
                id="sujet"
                placeholder="Ex: Budget 2024, Élections..."
                {...form.register('sujet')}
              />
              {form.formState.errors.sujet && (
                <p className="text-sm text-red-500">{form.formState.errors.sujet.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="heure_reunion">Heure</Label>
              <Input
                id="heure_reunion"
                type="time"
                {...form.register('heure_reunion')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lieu_membre_id">Membre qui reçoit la réunion</Label>
              <Select 
                value={form.watch('lieu_membre_id') || ''} 
                onValueChange={(value) => form.setValue('lieu_membre_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {membres.map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieu_description">Lieu (optionnel)</Label>
              <Input
                id="lieu_description"
                placeholder="Ex: Salle communale, Domicile..."
                {...form.register('lieu_description')}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              ℹ️ Les notifications de réunion seront envoyées automatiquement à tous les membres actifs.
            </p>
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
                <SelectItem value="planifie">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminée</SelectItem>
                <SelectItem value="reporte">Reportée</SelectItem>
                <SelectItem value="annule">Annulée</SelectItem>
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
