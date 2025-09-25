import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, Crown, Shirt, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Match {
  id: string;
  date_match: string;
  equipe_adverse: string;
  statut: string;
}

interface Composition {
  id: string;
  match_id: string;
  membre_id: string;
  equipe_nom: string;
  poste: string;
  est_capitaine: boolean;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixCompositionsManager() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showCompositionForm, setShowCompositionForm] = useState(false);
  const [compositionForm, setCompositionForm] = useState({
    membre_id: "",
    equipe_nom: "Jaune",
    poste: "",
    est_capitaine: false
  });

  const queryClient = useQueryClient();

  const { data: matchs } = useQuery({
    queryKey: ['phoenix-matchs-compositions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_matchs')
        .select('*')
        .order('date_match', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Match[];
    }
  });

  const { data: adherents } = useQuery({
    queryKey: ['phoenix-adherents-compositions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          membre_id,
          membres:membre_id (
            id,
            nom,
            prenom
          )
        `);
      if (error) throw error;
      return data?.map(a => a.membres).filter(Boolean) || [];
    }
  });

  const { data: compositions } = useQuery({
    queryKey: ['phoenix-compositions', selectedMatch?.id],
    queryFn: async () => {
      if (!selectedMatch?.id) return [];
      const { data, error } = await supabase
        .from('phoenix_compositions' as any)
        .select(`
          *,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('match_id', selectedMatch.id);
      if (error) throw error;
      return data as any;
    },
    enabled: !!selectedMatch?.id
  });

  const addCompositionMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('phoenix_compositions' as any)
        .insert([{
          match_id: selectedMatch?.id,
          ...data
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-compositions'] });
      toast.success("Joueur ajouté à la composition");
      resetForm();
    }
  });

  const deleteCompositionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phoenix_compositions' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-compositions'] });
      toast.success("Joueur retiré de la composition");
    }
  });

  const resetForm = () => {
    setCompositionForm({
      membre_id: "",
      equipe_nom: "Jaune",
      poste: "",
      est_capitaine: false
    });
    setShowCompositionForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCompositionMutation.mutate(compositionForm);
  };

  const getEquipeCompositions = (equipe: string) => {
    return compositions?.filter(c => c.equipe_nom === equipe) || [];
  };

  const postes = [
    "Gardien",
    "Défenseur central",
    "Défenseur droit",
    "Défenseur gauche",
    "Milieu défensif",
    "Milieu central",
    "Milieu offensif",
    "Ailier droit",
    "Ailier gauche",
    "Attaquant",
    "Avant-centre"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compositions d'Équipes</h2>
          <p className="text-muted-foreground">Gérez les compositions Jaune vs Rouge</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Liste des matchs */}
        <Card>
          <CardHeader>
            <CardTitle>Matchs récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchs?.map((match) => (
                <div 
                  key={match.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMatch?.id === match.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Phoenix vs {match.equipe_adverse}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(match.date_match).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{match.statut}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compositions du match sélectionné */}
        {selectedMatch && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compositions</CardTitle>
                <Button onClick={() => setShowCompositionForm(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter joueur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Équipe Jaune */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                    <h3 className="font-semibold">Équipe Jaune</h3>
                    <Badge variant="outline">{getEquipeCompositions("Jaune").length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {getEquipeCompositions("Jaune").map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {comp.est_capitaine && <Crown className="w-3 h-3" />}
                          <Shirt className="w-3 h-3" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {comp.membres.prenom} {comp.membres.nom}
                            </p>
                            {comp.poste && (
                              <p className="text-xs text-muted-foreground">{comp.poste}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCompositionMutation.mutate(comp.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Équipe Rouge */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <h3 className="font-semibold">Équipe Rouge</h3>
                    <Badge variant="outline">{getEquipeCompositions("Rouge").length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {getEquipeCompositions("Rouge").map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {comp.est_capitaine && <Crown className="w-3 h-3" />}
                          <Shirt className="w-3 h-3" />
                          <div className="text-sm">
                            <p className="font-medium">
                              {comp.membres.prenom} {comp.membres.nom}
                            </p>
                            {comp.poste && (
                              <p className="text-xs text-muted-foreground">{comp.poste}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCompositionMutation.mutate(comp.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {(!compositions || compositions.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  Aucune composition définie pour ce match
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog pour ajouter un joueur à la composition */}
      <Dialog open={showCompositionForm} onOpenChange={setShowCompositionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un joueur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Joueur</Label>
              <Select
                value={compositionForm.membre_id}
                onValueChange={(value) => setCompositionForm(prev => ({ ...prev, membre_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent>
                  {adherents?.map((membre: any) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Équipe</Label>
              <Select
                value={compositionForm.equipe_nom}
                onValueChange={(value) => setCompositionForm(prev => ({ ...prev, equipe_nom: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jaune">Équipe Jaune</SelectItem>
                  <SelectItem value="Rouge">Équipe Rouge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Poste (optionnel)</Label>
              <Select
                value={compositionForm.poste}
                onValueChange={(value) => setCompositionForm(prev => ({ ...prev, poste: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {postes.map((poste) => (
                    <SelectItem key={poste} value={poste}>
                      {poste}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="capitaine"
                checked={compositionForm.est_capitaine}
                onCheckedChange={(checked) => setCompositionForm(prev => ({ ...prev, est_capitaine: checked }))}
              />
              <Label htmlFor="capitaine">Capitaine d'équipe</Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={addCompositionMutation.isPending}>
                Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}