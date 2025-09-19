import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const membreSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  telephone: z.string().min(1, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  statut: z.string().min(1, "Le statut est requis"),
  est_membre_e2d: z.boolean(),
  est_adherent_phoenix: z.boolean(),
  equipe_e2d: z.string().optional(),
  equipe_phoenix: z.string().optional(),
});

type MembreFormData = z.infer<typeof membreSchema>;

interface MembreEditFormProps {
  membreId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MembreEditForm({ membreId, onSuccess, onCancel }: MembreEditFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<MembreFormData>({
    resolver: zodResolver(membreSchema),
  });

  const estMembreE2D = watch('est_membre_e2d');
  const estAdherentPhoenix = watch('est_adherent_phoenix');

  useEffect(() => {
    loadMembreData();
  }, [membreId]);

  const loadMembreData = async () => {
    try {
      const { data: membre, error } = await supabase
        .from('membres')
        .select('*')
        .eq('id', membreId)
        .single();

      if (error) throw error;

      reset({
        nom: membre.nom,
        prenom: membre.prenom,
        telephone: membre.telephone,
        email: membre.email || '',
        statut: membre.statut,
        est_membre_e2d: membre.est_membre_e2d,
        est_adherent_phoenix: membre.est_adherent_phoenix,
        equipe_e2d: membre.equipe_e2d || '',
        equipe_phoenix: membre.equipe_phoenix || '',
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du membre",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MembreFormData) => {
    try {
      const { error } = await supabase
        .from('membres')
        .update({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          email: data.email || null,
          statut: data.statut,
          est_membre_e2d: data.est_membre_e2d,
          est_adherent_phoenix: data.est_adherent_phoenix,
          equipe_e2d: data.equipe_e2d || null,
          equipe_phoenix: data.equipe_phoenix || null,
        })
        .eq('id', membreId);

      if (error) throw error;

      toast({
        title: "Membre mis à jour",
        description: "Les informations du membre ont été mises à jour avec succès",
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p>Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Modifier le Membre</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom')}
                placeholder="Nom de famille"
              />
              {errors.nom && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nom.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                {...register('prenom')}
                placeholder="Prénom"
              />
              {errors.prenom && (
                <p className="text-sm text-destructive mt-1">
                  {errors.prenom.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                {...register('telephone')}
                placeholder="Numéro de téléphone"
              />
              {errors.telephone && (
                <p className="text-sm text-destructive mt-1">
                  {errors.telephone.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="Adresse email"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="statut">Statut</Label>
            <Select onValueChange={(value) => setValue('statut', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="est_membre_e2d"
                checked={estMembreE2D}
                onCheckedChange={(checked) => setValue('est_membre_e2d', checked)}
              />
              <Label htmlFor="est_membre_e2d">Membre E2D</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="est_adherent_phoenix"
                checked={estAdherentPhoenix}
                onCheckedChange={(checked) => setValue('est_adherent_phoenix', checked)}
              />
              <Label htmlFor="est_adherent_phoenix">Adhérent Phoenix</Label>
            </div>
          </div>

          {estMembreE2D && (
            <div>
              <Label htmlFor="equipe_e2d">Équipe E2D</Label>
              <Select onValueChange={(value) => setValue('equipe_e2d', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'équipe E2D" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jaune">Équipe Jaune</SelectItem>
                  <SelectItem value="rouge">Équipe Rouge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {estAdherentPhoenix && (
            <div>
              <Label htmlFor="equipe_phoenix">Équipe Phoenix</Label>
              <Input
                id="equipe_phoenix"
                {...register('equipe_phoenix')}
                placeholder="Équipe Phoenix"
              />
            </div>
          )}

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
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}