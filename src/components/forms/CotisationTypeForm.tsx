import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import type { TypeCotisation } from '@/lib/types/cotisations';

interface CotisationTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  typeToEdit?: TypeCotisation | null;
}

export default function CotisationTypeForm({
  open,
  onOpenChange,
  onSuccess,
  typeToEdit
}: CotisationTypeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    montant_defaut: "",
    obligatoire: false
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeToEdit) {
      setFormData({
        nom: typeToEdit.nom,
        description: typeToEdit.description || "",
        montant_defaut: typeToEdit.montant_defaut?.toString() || "",
        obligatoire: typeToEdit.obligatoire || false
      });
    } else {
      setFormData({
        nom: "",
        description: "",
        montant_defaut: "",
        obligatoire: false
      });
    }
  }, [typeToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.montant_defaut) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const typeData = {
        nom: formData.nom,
        description: formData.description,
        montant_defaut: parseFloat(formData.montant_defaut),
        obligatoire: formData.obligatoire
      };

      const { error } = typeToEdit
        ? await supabase
            .from('cotisations_types')
            .update(typeData)
            .eq('id', typeToEdit.id)
        : await supabase
            .from('cotisations_types')
            .insert([typeData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Type de cotisation ${typeToEdit ? 'modifié' : 'créé'} avec succès`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le type de cotisation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {typeToEdit ? "Modifier le type de cotisation" : "Nouveau type de cotisation"}
          </DialogTitle>
          <DialogDescription>
            Configurez un type de cotisation avec ses paramètres par défaut
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input
              id="nom"
              placeholder="Ex: Cotisation mensuelle"
              value={formData.nom}
              onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du type de cotisation..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="montant_defaut">Montant par défaut (FCFA) *</Label>
            <Input
              id="montant_defaut"
              type="number"
              placeholder="Ex: 5000"
              value={formData.montant_defaut}
              onChange={(e) => setFormData(prev => ({ ...prev, montant_defaut: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="obligatoire"
              checked={formData.obligatoire}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, obligatoire: checked }))}
            />
            <Label htmlFor="obligatoire">Cotisation obligatoire</Label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : typeToEdit ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}