import { useState } from 'react';
import CotisationsConfigManager from '@/components/CotisationsConfigManager';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';

export default function ConfigurationCotisations() {
  const [selectedExercice, setSelectedExercice] = useState("");
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const { data: exercices } = useQuery({
    queryKey: ['exercices-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .eq('statut', 'actif')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const handleAppliquerExercice = async () => {
    if (!selectedExercice) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un exercice",
        variant: "destructive",
      });
      return;
    }

    setApplying(true);
    try {
      // Récupérer tous les membres actifs et types de cotisations
      const [membresRes, typesRes] = await Promise.all([
        supabase.from('membres').select('id').eq('statut', 'actif'),
        supabase.from('cotisations_types').select('id, montant_defaut')
      ]);

      if (membresRes.error) throw membresRes.error;
      if (typesRes.error) throw typesRes.error;

      // Créer les cotisations pour l'exercice
      const cotisationsToCreate = [];
      for (const membre of membresRes.data || []) {
        for (const type of typesRes.data || []) {
          cotisationsToCreate.push({
            membre_id: membre.id,
            type_cotisation_id: type.id,
            exercice_id: selectedExercice,
            montant: type.montant_defaut || 0,
            statut: 'en_attente',
            date_paiement: new Date().toISOString().split('T')[0]
          });
        }
      }

      const { error: insertError } = await supabase
        .from('cotisations')
        .insert(cotisationsToCreate);

      if (insertError) throw insertError;

      toast({
        title: "✅ Configuration appliquée",
        description: `${cotisationsToCreate.length} cotisations créées pour l'exercice`,
      });

      setSelectedExercice("");
    } catch (error: any) {
      console.error('Erreur application config:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'appliquer la configuration",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <BackButton to="/configuration" />
        <h1 className="text-3xl font-bold">Configuration Cotisations</h1>
      </div>

      {/* Carte pour appliquer la config par exercice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Appliquer la configuration par exercice
          </CardTitle>
          <CardDescription>
            Créer automatiquement toutes les cotisations pour un exercice donné selon la configuration définie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="exercice">Sélectionner un exercice</Label>
              <Select value={selectedExercice} onValueChange={setSelectedExercice}>
                <SelectTrigger id="exercice">
                  <SelectValue placeholder="Choisir un exercice actif" />
                </SelectTrigger>
                <SelectContent>
                  {exercices?.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.nom} ({new Date(ex.date_debut).toLocaleDateString()} - {new Date(ex.date_fin).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAppliquerExercice} 
              disabled={!selectedExercice || applying}
            >
              {applying ? "Application en cours..." : "Appliquer"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <CotisationsConfigManager />
    </div>
  );
}
