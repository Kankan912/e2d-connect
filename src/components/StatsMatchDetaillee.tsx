import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface PlayerStat {
  membre_id: string;
  buts: number;
  passes_decisives: number;
  cartons_jaunes: number;
  cartons_rouges: number;
}

interface StatsMatchDetailleeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  matchType: 'e2d' | 'phoenix';
  onSuccess?: () => void;
}

export default function StatsMatchDetaillee({ 
  open, 
  onOpenChange, 
  matchId, 
  matchType,
  onSuccess 
}: StatsMatchDetailleeProps) {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingSanctions, setCreatingSanctions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
    }
  }, [open]);

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq(matchType === 'e2d' ? 'est_membre_e2d' : 'est_adherent_phoenix', true)
        .eq('statut', 'actif')
        .order('nom');
      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const addPlayerStat = () => {
    setStats([...stats, {
      membre_id: '',
      buts: 0,
      passes_decisives: 0,
      cartons_jaunes: 0,
      cartons_rouges: 0
    }]);
  };

  const removePlayerStat = (index: number) => {
    setStats(stats.filter((_, i) => i !== index));
  };

  const updateStat = (index: number, field: keyof PlayerStat, value: string | number) => {
    const newStats = [...stats];
    if (field === 'membre_id') {
      newStats[index][field] = value as string;
    } else {
      newStats[index][field] = typeof value === 'string' ? parseInt(value) || 0 : value;
    }
    setStats(newStats);
  };

  const createSanctionFromCard = async (membreId: string, cardType: 'jaune' | 'rouge') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-sanction-from-card', {
        body: {
          membre_id: membreId,
          card_type: cardType,
          match_id: matchId,
          match_type: matchType
        }
      });

      if (error) throw error;

      console.log(`[STATS] Sanction créée pour carton ${cardType}:`, data);
      return data;
    } catch (error: any) {
      console.error('[STATS] Erreur création sanction:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    const validStats = stats.filter(s => s.membre_id);
    
    if (validStats.length === 0) {
      toast({
        title: "Aucune statistique",
        description: "Veuillez ajouter au moins un joueur",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCreatingSanctions(true);

    try {
      // 1. Supprimer les anciennes statistiques pour ce match
      await supabase
        .from('match_statistics')
        .delete()
        .eq('match_id', matchId)
        .eq('match_type', matchType);

      // 2. Insérer les nouvelles statistiques
      const statsToInsert = validStats.map(stat => {
        const membre = membres.find(m => m.id === stat.membre_id);
        return {
          match_id: matchId,
          match_type: matchType,
          player_name: `${membre?.prenom} ${membre?.nom}`,
          goals: stat.buts,
          assists: stat.passes_decisives,
          yellow_cards: stat.cartons_jaunes,
          red_cards: stat.cartons_rouges
        };
      });

      const { error: insertError } = await supabase
        .from('match_statistics')
        .insert(statsToInsert);

      if (insertError) throw insertError;

      // 3. Créer automatiquement les sanctions pour chaque carton
      const sanctionsPromises = [];
      for (const stat of validStats) {
        // Cartons jaunes
        for (let i = 0; i < stat.cartons_jaunes; i++) {
          sanctionsPromises.push(
            createSanctionFromCard(stat.membre_id, 'jaune')
          );
        }
        
        // Cartons rouges
        for (let i = 0; i < stat.cartons_rouges; i++) {
          sanctionsPromises.push(
            createSanctionFromCard(stat.membre_id, 'rouge')
          );
        }
      }

      // Attendre que toutes les sanctions soient créées
      if (sanctionsPromises.length > 0) {
        const sanctionsResults = await Promise.allSettled(sanctionsPromises);
        const failed = sanctionsResults.filter(r => r.status === 'rejected');
        
        if (failed.length > 0) {
          console.warn(`[STATS] ${failed.length} sanctions n'ont pas pu être créées`);
        }

        toast({
          title: "✅ Statistiques + Sanctions enregistrées",
          description: `${sanctionsPromises.length} sanctions créées automatiquement`,
        });
      } else {
        toast({
          title: "✅ Statistiques enregistrées",
          description: "Match mis à jour avec succès",
        });
      }

      onOpenChange(false);
      onSuccess?.();
      setStats([]);
    } catch (error: any) {
      console.error('[STATS] Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCreatingSanctions(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Statistiques détaillées du match</DialogTitle>
          <DialogDescription>
            Enregistrez les performances individuelles. Les sanctions seront créées automatiquement pour chaque carton.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Auto-sanctions :</strong> Chaque carton jaune/rouge créera automatiquement une sanction dans le système.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {stats.map((stat, index) => {
            const membre = membres.find(m => m.id === stat.membre_id);
            return (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Joueur {index + 1}</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removePlayerStat(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <Select 
                  value={stat.membre_id} 
                  onValueChange={(value) => updateStat(index, 'membre_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un joueur" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.prenom} {membre.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Buts</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stat.buts}
                      onChange={(e) => updateStat(index, 'buts', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Passes D.</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stat.passes_decisives}
                      onChange={(e) => updateStat(index, 'passes_decisives', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">🟨 Jaunes</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stat.cartons_jaunes}
                      onChange={(e) => updateStat(index, 'cartons_jaunes', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">🟥 Rouges</Label>
                    <Input
                      type="number"
                      min="0"
                      value={stat.cartons_rouges}
                      onChange={(e) => updateStat(index, 'cartons_rouges', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <Button 
            type="button" 
            variant="outline" 
            onClick={addPlayerStat}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un joueur
          </Button>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || creatingSanctions}
          >
            {creatingSanctions ? "Création sanctions..." : loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}