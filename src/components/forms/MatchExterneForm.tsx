import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoUpload from "@/components/LogoUpload";

interface MatchExterneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MatchExterneForm({ open, onOpenChange, onSuccess }: MatchExterneFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date_match: "",
    heure_match: "",
    nom_complet_equipe_adverse: "",
    logo_equipe_adverse: "",
    equipe_adverse: "",
    lieu: "",
    type_match: "amical",
    statut: "prevu",
    score_e2d: 0,
    score_adverse: 0,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_match || !formData.nom_complet_equipe_adverse) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const matchData: any = {
        date_match: formData.date_match,
        heure_match: formData.heure_match || null,
        nom_complet_equipe_adverse: formData.nom_complet_equipe_adverse,
        equipe_adverse: formData.nom_complet_equipe_adverse,
        logo_equipe_adverse: formData.logo_equipe_adverse || null,
        lieu: formData.lieu || null,
        type_match: formData.type_match,
        statut: formData.statut,
        notes: formData.notes || null,
      };

      if (formData.statut === "termine") {
        matchData.score_e2d = formData.score_e2d;
        matchData.score_adverse = formData.score_adverse;
      }

      const { error } = await supabase
        .from("sport_e2d_matchs")
        .insert([matchData]);

      if (error) throw error;

      toast({
        title: "Match programmé",
        description: "Le match a été programmé avec succès",
      });

      // Reset form
      setFormData({
        date_match: "",
        heure_match: "",
        nom_complet_equipe_adverse: "",
        logo_equipe_adverse: "",
        equipe_adverse: "",
        lieu: "",
        type_match: "amical",
        statut: "prevu",
        score_e2d: 0,
        score_adverse: 0,
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
          <DialogTitle>Programmer un match externe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_match">Date du match *</Label>
              <Input
                id="date_match"
                type="date"
                required
                value={formData.date_match}
                onChange={(e) => setFormData({ ...formData, date_match: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="heure_match">Heure</Label>
              <Input
                id="heure_match"
                type="time"
                value={formData.heure_match}
                onChange={(e) => setFormData({ ...formData, heure_match: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="nom_complet_equipe_adverse">Nom de l'équipe adverse *</Label>
            <Input
              id="nom_complet_equipe_adverse"
              required
              placeholder="Ex: AS Djibloho, FC Akonibe..."
              value={formData.nom_complet_equipe_adverse}
              onChange={(e) => setFormData({ ...formData, nom_complet_equipe_adverse: e.target.value })}
            />
          </div>

          <LogoUpload
            currentLogoUrl={formData.logo_equipe_adverse}
            onLogoUploaded={(url) => setFormData({ ...formData, logo_equipe_adverse: url })}
          />

          <div>
            <Label htmlFor="lieu">Lieu</Label>
            <Input
              id="lieu"
              placeholder="Ex: Stade de Bata"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_match">Type de match</Label>
              <Select
                value={formData.type_match}
                onValueChange={(value) => setFormData({ ...formData, type_match: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amical">Amical</SelectItem>
                  <SelectItem value="championnat">Championnat</SelectItem>
                  <SelectItem value="coupe">Coupe</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="reporte">Reporté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.statut === "termine" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="score_e2d">Score E2D</Label>
                <Input
                  id="score_e2d"
                  type="number"
                  min="0"
                  value={formData.score_e2d}
                  onChange={(e) => setFormData({ ...formData, score_e2d: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="score_adverse">Score Adverse</Label>
                <Input
                  id="score_adverse"
                  type="number"
                  min="0"
                  value={formData.score_adverse}
                  onChange={(e) => setFormData({ ...formData, score_adverse: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Observations, remarques..."
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
