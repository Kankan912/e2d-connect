import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEnsureAdmin } from "@/hooks/useEnsureAdmin";
import LogoUpload from "@/components/LogoUpload";

interface E2DMatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function E2DMatchForm({ open, onOpenChange, onSuccess }: E2DMatchFormProps) {
  const [formData, setFormData] = useState({
    date_match: "",
    heure_match: "15:00",
    equipe_adverse: "",
    nom_complet_equipe_adverse: "",
    logo_equipe_adverse: "",
    lieu: "",
    type_match: "amical",
    score_e2d: "",
    score_adverse: "",
    statut: "prevu",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { withEnsureAdmin } = useEnsureAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_match || !formData.nom_complet_equipe_adverse) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const operation = async () => {
      const matchData = {
        date_match: formData.date_match,
        heure_match: formData.heure_match || null,
        equipe_adverse: formData.equipe_adverse || formData.nom_complet_equipe_adverse,
        nom_complet_equipe_adverse: formData.nom_complet_equipe_adverse,
        logo_equipe_adverse: formData.logo_equipe_adverse || null,
        lieu: formData.lieu || null,
        type_match: formData.type_match,
        score_e2d: formData.score_e2d ? parseInt(formData.score_e2d) : null,
        score_adverse: formData.score_adverse ? parseInt(formData.score_adverse) : null,
        statut: formData.statut,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('sport_e2d_matchs')
        .insert([matchData]);

      if (error) throw error;
    };

    try {
      await withEnsureAdmin(operation);

      toast({
        title: "Succès",
        description: "Match E2D programmé avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        date_match: "",
        heure_match: "15:00",
        equipe_adverse: "",
        nom_complet_equipe_adverse: "",
        logo_equipe_adverse: "",
        lieu: "",
        type_match: "amical",
        score_e2d: "",
        score_adverse: "",
        statut: "prevu",
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
          <DialogTitle>Programmer un match E2D</DialogTitle>
          <DialogDescription>
            Planifiez un nouveau match pour l'équipe E2D.
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
            <Label htmlFor="nom_complet_equipe_adverse">Nom complet de l'équipe adverse *</Label>
            <Input
              id="nom_complet_equipe_adverse"
              placeholder="Ex: FC Barcelone Junior, Real Madrid U17..."
              value={formData.nom_complet_equipe_adverse}
              onChange={(e) => setFormData(prev => ({ ...prev, nom_complet_equipe_adverse: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipe_adverse">Nom court (pour affichage)</Label>
            <Input
              id="equipe_adverse"
              placeholder="Ex: Barcelone, Real Madrid..."
              value={formData.equipe_adverse}
              onChange={(e) => setFormData(prev => ({ ...prev, equipe_adverse: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo de l'équipe adverse</Label>
            <LogoUpload 
              onLogoUploaded={(url) => setFormData(prev => ({ ...prev, logo_equipe_adverse: url }))}
              currentLogoUrl={formData.logo_equipe_adverse}
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
                  <SelectItem value="amical">Match amical</SelectItem>
                  <SelectItem value="championnat">Championnat</SelectItem>
                  <SelectItem value="coupe">Coupe</SelectItem>
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
                  <SelectItem value="prevu">Prévu</SelectItem>
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
                <Label htmlFor="score_e2d">Buts E2D</Label>
                <Input
                  id="score_e2d"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.score_e2d}
                  onChange={(e) => setFormData(prev => ({ ...prev, score_e2d: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="score_adverse">Buts adversaire</Label>
                <Input
                  id="score_adverse"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.score_adverse}
                  onChange={(e) => setFormData(prev => ({ ...prev, score_adverse: e.target.value }))}
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