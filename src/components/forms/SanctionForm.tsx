import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SanctionFormProps {
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

interface TypeSanction {
  id: string;
  nom: string;
  montant: number;
  categorie: string;
}

export default function SanctionForm({ open, onOpenChange, onSuccess, contexte = 'reunion' }: SanctionFormProps) {
  const [formData, setFormData] = useState({
    membre_id: "",
    type_sanction_id: "",
    montant: "",
    date_sanction: new Date().toISOString().split('T')[0],
    statut: "impaye",
    motif: "",
    contexte_sanction: contexte
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
      fetchTypesSanctions();
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

  const fetchTypesSanctions = async () => {
    try {
      const { data, error } = await supabase
        .from('sanctions_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypesSanctions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de sanctions:', error);
    }
  };

  const handleTypeChange = (typeId: string) => {
    const selectedType = typesSanctions.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      type_sanction_id: typeId,
      montant: selectedType?.montant?.toString() || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.membre_id || !formData.type_sanction_id || !formData.montant) {
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
        .from('sanctions')
        .insert([{
          membre_id: formData.membre_id,
          type_sanction_id: formData.type_sanction_id,
          montant: montant,
          date_sanction: formData.date_sanction,
          statut: formData.statut,
          motif: formData.motif.trim() || null,
          contexte_sanction: formData.contexte_sanction,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Sanction enregistrée avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        membre_id: "",
        type_sanction_id: "",
        montant: "",
        date_sanction: new Date().toISOString().split('T')[0],
        statut: "impaye",
        motif: "",
        contexte_sanction: contexte
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la sanction",
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
          <DialogTitle>Enregistrer une sanction - {contexte === 'sport' ? 'Sport' : 'Réunion'}</DialogTitle>
          <DialogDescription>
            Appliquer une sanction disciplinaire à un membre dans le contexte {contexte === 'sport' ? 'sportif' : 'des réunions'}.
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
              <Label htmlFor="type">Type de sanction *</Label>
              <Select value={formData.type_sanction_id} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesSanctions.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span>{type.nom}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.categorie} - {type.montant?.toLocaleString()} FCFA
                        </span>
                      </div>
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
                placeholder="Ex: 5000"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_sanction">Date de sanction</Label>
              <Input
                id="date_sanction"
                type="date"
                value={formData.date_sanction}
                onChange={(e) => setFormData(prev => ({ ...prev, date_sanction: e.target.value }))}
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
                <SelectItem value="impaye">Impayé</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="motif">Motif de la sanction</Label>
            <Textarea
              id="motif"
              placeholder="Décrivez le motif de la sanction..."
              value={formData.motif}
              onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
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