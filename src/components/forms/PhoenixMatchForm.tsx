import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhoenixMatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PhoenixMatchForm({ open, onOpenChange, onSuccess }: PhoenixMatchFormProps) {
  const [formData, setFormData] = useState({
    date_match: "",
    heure_match: "15:00",
    adversaire: "",
    lieu: "",
    type_match: "championnat",
    resultat_nous: "",
    resultat_adversaire: "",
    statut: "planifie",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_match || !formData.adversaire) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simuler l'insertion dans une table phoenix_matchs (à créer si nécessaire)
      // Pour l'instant, on peut l'ajouter aux activités Sport E2D
      const matchData = {
        date_activite: formData.date_match,
        lieu: `${formData.lieu} - Match vs ${formData.adversaire}`,
        participants_count: 22, // Nombre standard de joueurs
        notes: `Match ${formData.type_match} vs ${formData.adversaire}. ${formData.notes}`,
      };

      const { error } = await supabase
        .from('sport_e2d_activites')
        .insert([matchData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Match Phoenix programmé avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        date_match: "",
        heure_match: "15:00",
        adversaire: "",
        lieu: "",
        type_match: "championnat",
        resultat_nous: "",
        resultat_adversaire: "",
        statut: "planifie",
        notes: ""
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de programmer le match",
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
          <DialogTitle>Programmer un match Phoenix</DialogTitle>
          <DialogDescription>
            Planifiez un nouveau match pour l'équipe Phoenix.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_match">Date du match *</Label>
              <Input
                id="date_match"
                type="date"
                value={formData.date_match}
                onChange={(e) => setFormData(prev => ({ ...prev, date_match: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="heure_match">Heure</Label>
              <Input
                id="heure_match"
                type="time"
                value={formData.heure_match}
                onChange={(e) => setFormData(prev => ({ ...prev, heure_match: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adversaire">Équipe adversaire *</Label>
            <Input
              id="adversaire"
              placeholder="Ex: FC Étoiles, AS Victoire..."
              value={formData.adversaire}
              onChange={(e) => setFormData(prev => ({ ...prev, adversaire: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu</Label>
            <Input
              id="lieu"
              placeholder="Ex: Stade municipal, Terrain du quartier..."
              value={formData.lieu}
              onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_match">Type de match</Label>
              <Select value={formData.type_match} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, type_match: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="championnat">Championnat</SelectItem>
                  <SelectItem value="coupe">Coupe</SelectItem>
                  <SelectItem value="amical">Match amical</SelectItem>
                  <SelectItem value="tournoi">Tournoi</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="reporte">Reporté</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.statut === "termine" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resultat_nous">Nos buts</Label>
                <Input
                  id="resultat_nous"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.resultat_nous}
                  onChange={(e) => setFormData(prev => ({ ...prev, resultat_nous: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="resultat_adversaire">Buts adversaire</Label>
                <Input
                  id="resultat_adversaire"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.resultat_adversaire}
                  onChange={(e) => setFormData(prev => ({ ...prev, resultat_adversaire: e.target.value }))}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Informations supplémentaires..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Programmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}