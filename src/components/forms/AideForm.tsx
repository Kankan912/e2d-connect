import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AideFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contexte?: 'reunion' | 'sport';
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface TypeAide {
  id: string;
  nom: string;
  montant_defaut: number;
}

export default function AideForm({ open, onOpenChange, onSuccess, contexte = 'reunion' }: AideFormProps) {
  const [formData, setFormData] = useState({
    beneficiaire_id: "",
    type_aide_id: "",
    montant: "",
    date_allocation: new Date().toISOString().split('T')[0],
    statut: "alloue",
    notes: "",
    contexte_aide: contexte
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [typesAides, setTypesAides] = useState<TypeAide[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
      fetchTypesAides();
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

  const fetchTypesAides = async () => {
    try {
      const { data, error } = await supabase
        .from('aides_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypesAides(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types d\'aides:', error);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = typesAides.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      type_aide_id: typeId,
      montant: selectedType?.montant_defaut?.toString() || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.beneficiaire_id || !formData.type_aide_id || !formData.montant) {
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
        .from('aides')
        .insert([{
          beneficiaire_id: formData.beneficiaire_id,
          type_aide_id: formData.type_aide_id,
          montant: montant,
          date_allocation: formData.date_allocation,
          statut: formData.statut,
          notes: formData.notes.trim() || null,
          contexte_aide: formData.contexte_aide,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Aide allouée avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        beneficiaire_id: "",
        type_aide_id: "",
        montant: "",
        date_allocation: new Date().toISOString().split('T')[0],
        statut: "alloue",
        notes: "",
        contexte_aide: contexte
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'aide",
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
          <DialogTitle>Allouer une aide - {contexte === 'sport' ? 'Sport' : 'Réunion'}</DialogTitle>
          <DialogDescription>
            Enregistrez l'allocation d'une aide à un membre dans le contexte {contexte === 'sport' ? 'sportif' : 'des réunions'}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiaire">Bénéficiaire *</Label>
            <Select value={formData.beneficiaire_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, beneficiaire_id: value }))
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
            <Label htmlFor="type">Type d'aide *</Label>
            <Select value={formData.type_aide_id} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typesAides.map((type) => (
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
                placeholder="Ex: 25000"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_allocation">Date d'allocation</Label>
              <Input
                id="date_allocation"
                type="date"
                value={formData.date_allocation}
                onChange={(e) => setFormData(prev => ({ ...prev, date_allocation: e.target.value }))}
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
                <SelectItem value="alloue">Alloué</SelectItem>
                <SelectItem value="verse">Versé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
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
              {loading ? "Enregistrement..." : "Allouer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}