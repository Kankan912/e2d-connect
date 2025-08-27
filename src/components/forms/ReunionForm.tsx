import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReunionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function ReunionForm({ open, onOpenChange, onSuccess }: ReunionFormProps) {
  const [formData, setFormData] = useState({
    date_reunion: "",
    heure_reunion: "09:00",
    lieu_membre_id: "",
    lieu_description: "",
    ordre_du_jour: "",
    statut: "planifie"
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
      // Set default date to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        date_reunion: nextWeek.toISOString().split('T')[0]
      }));
    }
  }, [open]);

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
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date_reunion || !formData.heure_reunion) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir la date et l'heure de la réunion",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lieu_membre_id && !formData.lieu_description) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier le lieu de la réunion",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date_reunion}T${formData.heure_reunion}:00`);

      const { error } = await supabase
        .from('reunions')
        .insert([{
          date_reunion: dateTime.toISOString(),
          lieu_membre_id: formData.lieu_membre_id || null,
          lieu_description: formData.lieu_description.trim() || null,
          ordre_du_jour: formData.ordre_du_jour.trim() || null,
          statut: formData.statut,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Réunion planifiée avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setFormData({
        date_reunion: nextWeek.toISOString().split('T')[0],
        heure_reunion: "09:00",
        lieu_membre_id: "",
        lieu_description: "",
        ordre_du_jour: "",
        statut: "planifie"
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de planifier la réunion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Planifier une réunion</DialogTitle>
          <DialogDescription>
            Créez une nouvelle réunion pour les membres de l'association.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_reunion">Date *</Label>
              <Input
                id="date_reunion"
                type="date"
                value={formData.date_reunion}
                onChange={(e) => setFormData(prev => ({ ...prev, date_reunion: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="heure_reunion">Heure *</Label>
              <Input
                id="heure_reunion"
                type="time"
                value={formData.heure_reunion}
                onChange={(e) => setFormData(prev => ({ ...prev, heure_reunion: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lieu_membre">Lieu - Chez un membre</Label>
            <Select value={formData.lieu_membre_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, lieu_membre_id: value, lieu_description: "" }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre hôte" />
              </SelectTrigger>
              <SelectContent>
                {membres.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    Chez {membre.prenom} {membre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lieu_description">
              OU Lieu - Description libre 
              {formData.lieu_membre_id && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Laissez vide si vous avez sélectionné un membre)
                </span>
              )}
            </Label>
            <Input
              id="lieu_description"
              placeholder="Ex: Salle communautaire, Bureau de l'association..."
              value={formData.lieu_description}
              onChange={(e) => setFormData(prev => ({ ...prev, lieu_description: e.target.value, lieu_membre_id: "" }))}
              disabled={!!formData.lieu_membre_id}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="statut">Statut</Label>
            <Select value={formData.statut} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, statut: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planifie">Planifiée</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ordre_du_jour">Ordre du jour</Label>
            <Textarea
              id="ordre_du_jour"
              placeholder="Points à aborder lors de la réunion..."
              value={formData.ordre_du_jour}
              onChange={(e) => setFormData(prev => ({ ...prev, ordre_du_jour: e.target.value }))}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Planification..." : "Planifier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}