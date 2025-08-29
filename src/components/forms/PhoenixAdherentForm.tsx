import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface PhoenixAdherentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PhoenixAdherentForm({ open, onOpenChange, onSuccess }: PhoenixAdherentFormProps) {
  const [formData, setFormData] = useState({
    membre_id: "",
    montant_adhesion: "15000",
    date_adhesion: new Date().toISOString().split('T')[0],
    date_limite_paiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    adhesion_payee: false
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMembres();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant_adhesion) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const montant = parseFloat(formData.montant_adhesion);
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
        .from('phoenix_adherents')
        .insert([{
          membre_id: formData.membre_id,
          montant_adhesion: montant,
          date_adhesion: formData.date_adhesion,
          date_limite_paiement: formData.date_limite_paiement,
          adhesion_payee: formData.adhesion_payee,
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Adhérent Phoenix ajouté avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        membre_id: "",
        montant_adhesion: "15000",
        date_adhesion: new Date().toISOString().split('T')[0],
        date_limite_paiement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adhesion_payee: false
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'adhérent",
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
          <DialogTitle>Ajouter un adhérent Phoenix</DialogTitle>
          <DialogDescription>
            Enregistrez un nouveau membre comme adhérent Phoenix.
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant adhésion (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="Ex: 15000"
                value={formData.montant_adhesion}
                onChange={(e) => setFormData(prev => ({ ...prev, montant_adhesion: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_adhesion">Date d'adhésion</Label>
              <Input
                id="date_adhesion"
                type="date"
                value={formData.date_adhesion}
                onChange={(e) => setFormData(prev => ({ ...prev, date_adhesion: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_limite">Date limite de paiement</Label>
            <Input
              id="date_limite"
              type="date"
              value={formData.date_limite_paiement}
              onChange={(e) => setFormData(prev => ({ ...prev, date_limite_paiement: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="adhesion_payee">Adhésion payée</Label>
              <p className="text-sm text-muted-foreground">
                L'adhérent a-t-il déjà payé son adhésion ?
              </p>
            </div>
            <Switch
              id="adhesion_payee"
              checked={formData.adhesion_payee}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, adhesion_payee: checked }))
              }
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