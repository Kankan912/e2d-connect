import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PhoenixEquipe {
  id: string;
  nom: string;
  couleur_hex: string;
  created_at: string;
}

export default function PhoenixEquipesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState<PhoenixEquipe | null>(null);
  const [formData, setFormData] = useState({
    nom: "",
    couleur_hex: "#FFFF00"
  });

  const queryClient = useQueryClient();

  const { data: equipes, isLoading } = useQuery({
    queryKey: ['phoenix-equipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_equipes' as any)
        .select('*')
        .order('nom');
      if (error) throw error;
      return data as any;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nom: string; couleur_hex: string }) => {
      const { error } = await supabase
        .from('phoenix_equipes' as any)
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-equipes'] });
      toast.success("Équipe créée avec succès");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création : " + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nom: string; couleur_hex: string }) => {
      const { error } = await supabase
        .from('phoenix_equipes' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-equipes'] });
      toast.success("Équipe modifiée avec succès");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification : " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phoenix_equipes' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-equipes'] });
      toast.success("Équipe supprimée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression : " + error.message);
    }
  });

  const resetForm = () => {
    setFormData({ nom: "", couleur_hex: "#FFFF00" });
    setEditingEquipe(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipe) {
      updateMutation.mutate({ id: editingEquipe.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (equipe: PhoenixEquipe) => {
    setEditingEquipe(equipe);
    setFormData({
      nom: equipe.nom,
      couleur_hex: equipe.couleur_hex
    });
    setShowForm(true);
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des équipes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Équipes Phoenix</h2>
          <p className="text-muted-foreground">Gérez les équipes Jaune et Rouge</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle équipe
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {equipes?.map((equipe) => (
          <Card key={equipe.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: equipe.couleur_hex }}
                  />
                  {equipe.nom}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(equipe)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(equipe.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Équipe {equipe.nom}
                </span>
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: equipe.couleur_hex,
                    color: equipe.couleur_hex 
                  }}
                >
                  {equipe.couleur_hex}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEquipe ? "Modifier l'équipe" : "Nouvelle équipe"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nom">Nom de l'équipe</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: Équipe Jaune"
                required
              />
            </div>
            <div>
              <Label htmlFor="couleur">Couleur</Label>
              <div className="flex gap-2">
                <Input
                  id="couleur"
                  type="color"
                  value={formData.couleur_hex}
                  onChange={(e) => setFormData(prev => ({ ...prev, couleur_hex: e.target.value }))}
                  className="w-20"
                />
                <Input
                  value={formData.couleur_hex}
                  onChange={(e) => setFormData(prev => ({ ...prev, couleur_hex: e.target.value }))}
                  placeholder="#FFFF00"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingEquipe ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}