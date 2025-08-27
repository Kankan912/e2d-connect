import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface TypeCotisation {
  id: string;
  nom: string;
  montant_defaut: number;
}

interface CotisationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CotisationForm({ open, onOpenChange, onSuccess }: CotisationFormProps) {
  const [formData, setFormData] = useState({
    membre_id: "",
    type_cotisation_id: "",
    montant: "",
    date_paiement: new Date().toISOString().split('T')[0],
    statut: "paye",
    notes: ""
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [typesCotisations, setTypesCotisations] = useState<TypeCotisation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
      fetchTypesCotisations();
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

  const fetchTypesCotisations = async () => {
    try {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypesCotisations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = typesCotisations.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      type_cotisation_id: typeId,
      montant: selectedType?.montant_defaut?.toString() || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.membre_id || !formData.type_cotisation_id || !formData.montant) {
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
        .from('cotisations')
        .insert([{
          membre_id: formData.membre_id,
          type_cotisation_id: formData.type_cotisation_id,
          montant: montant,
          date_paiement: formData.date_paiement,
          statut: formData.statut,
          notes: formData.notes.trim() || null,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Cotisation ajoutée avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        membre_id: "",
        type_cotisation_id: "",
        montant: "",
        date_paiement: new Date().toISOString().split('T')[0],
        statut: "paye",
        notes: ""
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la cotisation",
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
          <DialogTitle>Ajouter une cotisation</DialogTitle>
          <DialogDescription>
            Enregistrez le paiement d'une cotisation par un membre.
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
            <Label htmlFor="type">Type de cotisation *</Label>
            <Select value={formData.type_cotisation_id} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typesCotisations.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.nom} - {type.montant_defaut?.toLocaleString()} FCFA
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
                placeholder="Ex: 10000"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date de paiement</Label>
              <Input
                id="date_paiement"
                type="date"
                value={formData.date_paiement}
                onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
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
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
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
              {loading ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}