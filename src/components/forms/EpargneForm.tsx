import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EpargneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface Exercice {
  id: string;
  nom: string;
  statut: string;
}

export default function EpargneForm({ open, onOpenChange, onSuccess }: EpargneFormProps) {
  const [formData, setFormData] = useState({
    membre_id: "",
    exercice_id: "",
    montant: "",
    date_depot: new Date().toISOString().split('T')[0],
    statut: "actif",
    notes: ""
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
      fetchExercices();
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

  const fetchExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
      
      // Auto-select active exercise
      const activeExercise = data?.find(e => e.statut === 'actif');
      if (activeExercise) {
        setFormData(prev => ({ ...prev, exercice_id: activeExercise.id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.membre_id || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const montant = parseFloat(formData.montant);
    if (isNaN(montant) || montant <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un montant valide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('epargnes')
        .insert([{
          membre_id: formData.membre_id,
          exercice_id: formData.exercice_id || null,
          montant: montant,
          date_depot: formData.date_depot,
          statut: formData.statut,
          notes: formData.notes.trim() || null,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Épargne enregistrée avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        membre_id: "",
        exercice_id: "",
        montant: "",
        date_depot: new Date().toISOString().split('T')[0],
        statut: "actif",
        notes: ""
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'épargne",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enregistrer une épargne</DialogTitle>
          <DialogDescription>
            Enregistrez un dépôt d'épargne d'un membre.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre">Membre *</Label>
            <Select value={formData.membre_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, membre_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {membres.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.prenom} {membre.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="exercice">Exercice</Label>
            <Select value={formData.exercice_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, exercice_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un exercice" />
              </SelectTrigger>
              <SelectContent>
                {exercices.map((exercice) => (
                  <SelectItem key={exercice.id} value={exercice.id}>
                    {exercice.nom} {exercice.statut === 'actif' ? '(Actuel)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="Ex: 100000"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_depot">Date de dépôt</Label>
              <Input
                id="date_depot"
                type="date"
                value={formData.date_depot}
                onChange={(e) => setFormData(prev => ({ ...prev, date_depot: e.target.value }))}
              />
            </div>
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
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="retiré">Retiré</SelectItem>
                <SelectItem value="bloque">Bloqué</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes additionnelles..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}