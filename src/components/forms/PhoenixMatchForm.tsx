import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

interface PhoenixMatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PhoenixMatchForm({ open, onOpenChange, onSuccess }: PhoenixMatchFormProps) {
  const [formData, setFormData] = useState({
    date_match: "",
    heure_match: "15:00",
    equipe_adverse: "",
    lieu: "",
    type_match: "amical",
    score_phoenix: "",
    score_adverse: "",
    statut: "prevu",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date_match || !formData.equipe_adverse) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const matchData = {
        date_match: formData.date_match,
        heure_match: formData.heure_match || null,
        equipe_adverse: formData.equipe_adverse,
        lieu: formData.lieu || null,
        type_match: formData.type_match,
        score_phoenix: formData.score_phoenix ? parseInt(formData.score_phoenix) : null,
        score_adverse: formData.score_adverse ? parseInt(formData.score_adverse) : null,
        statut: formData.statut,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('sport_phoenix_matchs')
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
        equipe_adverse: "",
        lieu: "",
        type_match: "amical",
        score_phoenix: "",
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
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Programmer un match Phoenix
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_match">Date du match *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date_match"
                  type="date"
                  value={formData.date_match}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_match: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="heure_match">Heure</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="heure_match"
                  type="time"
                  value={formData.heure_match}
                  onChange={(e) => setFormData(prev => ({ ...prev, heure_match: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipe_adverse">Équipe adversaire *</Label>
            <Input
              id="equipe_adverse"
              placeholder="Ex: FC Étoiles, AS Victoire..."
              value={formData.equipe_adverse}
              onChange={(e) => setFormData(prev => ({ ...prev, equipe_adverse: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lieu">Lieu</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="lieu"
                placeholder="Ex: Stade municipal, Terrain du quartier..."
                value={formData.lieu}
                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                className="pl-10"
              />
            </div>
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
                <Label htmlFor="score_phoenix">Buts Phoenix</Label>
                <Input
                  id="score_phoenix"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.score_phoenix}
                  onChange={(e) => setFormData(prev => ({ ...prev, score_phoenix: e.target.value }))}
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