import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EntrainementInterneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EntrainementInterneForm({ open, onOpenChange, onSuccess }: EntrainementInterneFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date_entrainement: "",
    heure_debut: "",
    heure_fin: "",
    lieu: "",
    statut: "prevu",
    equipe_gagnante: "",
    score_jaune: 0,
    score_rouge: 0,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_entrainement) {
      toast({
        title: "Champs requis",
        description: "Veuillez sélectionner une date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const entrainementData: any = {
        date_entrainement: formData.date_entrainement,
        heure_debut: formData.heure_debut || null,
        heure_fin: formData.heure_fin || null,
        lieu: formData.lieu || null,
        statut: formData.statut,
        notes: formData.notes || null,
      };

      if (formData.statut === "termine") {
        entrainementData.score_jaune = formData.score_jaune;
        entrainementData.score_rouge = formData.score_rouge;
        entrainementData.equipe_gagnante = formData.equipe_gagnante || null;
      }

      const { error } = await supabase
        .from("phoenix_entrainements_internes")
        .insert([entrainementData]);

      if (error) throw error;

      toast({
        title: "Entraînement programmé",
        description: "L'entraînement Jaune vs Rouge a été programmé avec succès",
      });

      // Reset form
      setFormData({
        date_entrainement: "",
        heure_debut: "",
        heure_fin: "",
        lieu: "",
        statut: "prevu",
        equipe_gagnante: "",
        score_jaune: 0,
        score_rouge: 0,
        notes: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programmer un entraînement interne (Jaune vs Rouge)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date_entrainement">Date *</Label>
              <Input
                id="date_entrainement"
                type="date"
                required
                value={formData.date_entrainement}
                onChange={(e) => setFormData({ ...formData, date_entrainement: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="heure_debut">Heure début</Label>
              <Input
                id="heure_debut"
                type="time"
                value={formData.heure_debut}
                onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="heure_fin">Heure fin</Label>
              <Input
                id="heure_fin"
                type="time"
                value={formData.heure_fin}
                onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lieu">Lieu</Label>
              <Input
                id="lieu"
                placeholder="Ex: Stade principal"
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prevu">Prévu</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.statut === "termine" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="score_jaune">Score Équipe Jaune</Label>
                  <Input
                    id="score_jaune"
                    type="number"
                    min="0"
                    value={formData.score_jaune}
                    onChange={(e) => setFormData({ ...formData, score_jaune: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="score_rouge">Score Équipe Rouge</Label>
                  <Input
                    id="score_rouge"
                    type="number"
                    min="0"
                    value={formData.score_rouge}
                    onChange={(e) => setFormData({ ...formData, score_rouge: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="equipe_gagnante">Équipe gagnante</Label>
                <Select
                  value={formData.equipe_gagnante}
                  onValueChange={(value) => setFormData({ ...formData, equipe_gagnante: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'équipe gagnante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jaune">Équipe Jaune</SelectItem>
                    <SelectItem value="rouge">Équipe Rouge</SelectItem>
                    <SelectItem value="nul">Match Nul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Observations, présences, remarques..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Programmation..." : "Programmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
