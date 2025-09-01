import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface MembreCotisationConfigFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function MembreCotisationConfigForm({
  open,
  onOpenChange,
  onSuccess
}: MembreCotisationConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [types, setTypes] = useState<TypeCotisation[]>([]);
  const [formData, setFormData] = useState({
    membre_id: "",
    type_cotisation_id: "",
    montant_personnalise: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [membresRes, typesRes] = await Promise.all([
        supabase.from('membres').select('id, nom, prenom').order('nom'),
        supabase.from('cotisations_types').select('id, nom, montant_defaut').order('nom')
      ]);

      if (membresRes.error) throw membresRes.error;
      if (typesRes.error) throw typesRes.error;

      setMembres(membresRes.data || []);
      setTypes(typesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.type_cotisation_id || !formData.montant_personnalise) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Vérifier si une config existe déjà
      const { data: existing } = await supabase
        .from('membres_cotisations_config')
        .select('id')
        .eq('membre_id', formData.membre_id)
        .eq('type_cotisation_id', formData.type_cotisation_id)
        .single();

      const configData = {
        membre_id: formData.membre_id,
        type_cotisation_id: formData.type_cotisation_id,
        montant_personnalise: parseFloat(formData.montant_personnalise)
      };

      const { error } = existing
        ? await supabase
            .from('membres_cotisations_config')
            .update(configData)
            .eq('id', existing.id)
        : await supabase
            .from('membres_cotisations_config')
            .insert([configData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration enregistrée avec succès",
      });

      setFormData({ membre_id: "", type_cotisation_id: "", montant_personnalise: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = types.find(t => t.id === formData.type_cotisation_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuration Montant Personnalisé</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre">Membre *</Label>
            <Select value={formData.membre_id} onValueChange={(value) => setFormData(prev => ({ ...prev, membre_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {membres.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.nom} {membre.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Type de cotisation *</Label>
            <Select value={formData.type_cotisation_id} onValueChange={(value) => setFormData(prev => ({ ...prev, type_cotisation_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.nom} ({type.montant_defaut?.toLocaleString()} FCFA)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedType && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Montant par défaut: <span className="font-medium">{selectedType.montant_defaut?.toLocaleString()} FCFA</span>
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="montant_personnalise">Montant personnalisé (FCFA) *</Label>
            <Input
              id="montant_personnalise"
              type="number"
              placeholder="Ex: 7500"
              value={formData.montant_personnalise}
              onChange={(e) => setFormData(prev => ({ ...prev, montant_personnalise: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
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