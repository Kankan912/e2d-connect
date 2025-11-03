import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useEnsureAdmin } from '@/hooks/useEnsureAdmin';

const pretSchema = z.object({
  membre_id: z.string().min(1, "Le bénéficiaire est requis"),
  montant: z.number().min(1, "Le montant doit être supérieur à 0"),
  taux_interet: z.number().min(0).max(100).default(5),
  date_pret: z.string().min(1, "La date de prêt est requise"),
  echeance: z.string().min(1, "La date d'échéance est requise"),
  avaliste_id: z.string().optional(),
  statut: z.enum(['en_cours', 'rembourse', 'en_retard', 'annule']).default('en_cours'),
  notes: z.string().optional(),
  exercice_id: z.string().optional(),
  reunion_id: z.string().optional(),
});

type PretFormData = z.infer<typeof pretSchema>;

interface PretFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: Partial<PretFormData> & { id?: string };
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface Exercice {
  id: string;
  nom: string;
}

interface Reunion {
  id: string;
  date_reunion: string;
  sujet?: string;
}

export default function PretForm({ open, onOpenChange, onSuccess, initialData }: PretFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { withEnsureAdmin } = useEnsureAdmin();
  const [membres, setMembres] = useState<Membre[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [tauxInteretFixe, setTauxInteretFixe] = useState(5);

  const form = useForm<PretFormData>({
    resolver: zodResolver(pretSchema),
    defaultValues: {
      membre_id: initialData?.membre_id || '',
      montant: initialData?.montant || 0,
      taux_interet: initialData?.taux_interet || tauxInteretFixe,
      date_pret: initialData?.date_pret || new Date().toISOString().split('T')[0],
      echeance: initialData?.echeance || '',
      avaliste_id: initialData?.avaliste_id || '',
      statut: initialData?.statut || 'en_cours',
      notes: initialData?.notes || '',
      exercice_id: initialData?.exercice_id || '',
      reunion_id: initialData?.reunion_id || '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchMembres();
      fetchExercices();
      fetchReunions();
      loadTauxInteret();
    }
  }, [open]);

  // Calcul automatique de l'échéance (2 mois après)
  useEffect(() => {
    const datePret = form.watch('date_pret');
    if (datePret) {
      const date = new Date(datePret);
      date.setMonth(date.getMonth() + 2);
      form.setValue('echeance', date.toISOString().split('T')[0]);
    }
  }, [form.watch('date_pret')]);

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

  const fetchExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom')
        .eq('statut', 'actif')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      setExercices(data || []);
    } catch (error) {
      console.error('Erreur chargement exercices:', error);
    }
  };

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select('id, date_reunion, sujet')
        .order('date_reunion', { ascending: false })
        .limit(20);
      if (error) throw error;
      setReunions(data || []);
    } catch (error) {
      console.error('Erreur chargement réunions:', error);
    }
  };

  const loadTauxInteret = () => {
    // Charger depuis localStorage temporairement (en attendant la table configurations)
    const configs = localStorage.getItem('app_configurations');
    if (configs) {
      try {
        const parsedConfigs = JSON.parse(configs);
        const taux = parseFloat(parsedConfigs.taux_interet_pret || '5');
        setTauxInteretFixe(taux);
        form.setValue('taux_interet', taux);
      } catch (error) {
        console.error('Erreur chargement taux:', error);
      }
    }
  };

  const onSubmit = async (data: PretFormData) => {
    const operation = async () => {
      const pretData = {
        membre_id: data.membre_id,
        montant: data.montant,
        date_pret: data.date_pret,
        echeance: data.echeance,
        taux_interet: data.taux_interet,
        statut: data.statut,
        notes: data.notes || null,
        avaliste_id: data.avaliste_id && data.avaliste_id.trim() !== '' ? data.avaliste_id : null,
        exercice_id: data.exercice_id && data.exercice_id.trim() !== '' ? data.exercice_id : null,
        reunion_id: data.reunion_id && data.reunion_id.trim() !== '' ? data.reunion_id : null,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('prets')
          .update(pretData)
          .eq('id', initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prets')
          .insert(pretData);
        if (error) throw error;
      }
    };

    try {
      await withEnsureAdmin(operation);
      
      toast({
        title: "Succès",
        description: initialData?.id ? "Prêt mis à jour" : "Prêt créé avec succès",
      });
      
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      form.reset();
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Modifier' : 'Nouveau'} Prêt</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre_id">Bénéficiaire *</Label>
            <Select 
              value={form.watch('membre_id') || undefined} 
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
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="Ex: 500000"
                {...form.register('montant', { valueAsNumber: true })}
              />
              {form.formState.errors.montant && (
                <p className="text-sm text-red-500">{form.formState.errors.montant.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="taux_interet">Taux d'intérêt (%) *</Label>
              <Input
                id="taux_interet"
                type="number"
                step="0.1"
                value={tauxInteretFixe}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Taux fixe configuré par l'administrateur</p>
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
              <Label htmlFor="echeance">Date d'échéance *</Label>
              <Input
                id="echeance"
                type="date"
                {...form.register('echeance')}
                className="bg-muted"
                readOnly
              />
              <p className="text-xs text-muted-foreground">Calculée automatiquement (2 mois après)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avaliste_id">Avaliste (optionnel)</Label>
            <Select 
              value={form.watch('avaliste_id') || undefined} 
              onValueChange={(value) => form.setValue('avaliste_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un avaliste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun avaliste</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exercice_id">Exercice (optionnel)</Label>
              <Select 
                value={form.watch('exercice_id') || undefined} 
                onValueChange={(value) => form.setValue('exercice_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un exercice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun exercice</SelectItem>
                  {exercices?.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reunion_id">Réunion (optionnel)</Label>
              <Select 
                value={form.watch('reunion_id') || undefined} 
                onValueChange={(value) => form.setValue('reunion_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une réunion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune réunion</SelectItem>
                  {reunions?.map((reunion) => (
                    <SelectItem key={reunion.id} value={reunion.id}>
                      {new Date(reunion.date_reunion).toLocaleDateString()} - {reunion.sujet || 'Sans sujet'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes sur ce prêt..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Enregistrement...' : (initialData?.id ? 'Mettre à jour' : 'Créer le prêt')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}