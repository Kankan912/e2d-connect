import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Membre {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
}

interface MembreFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membre?: Membre | null;
  onSuccess: () => void;
}

export default function MembreForm({ open, onOpenChange, membre, onSuccess }: MembreFormProps) {
  const [formData, setFormData] = useState<Membre>({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    statut: "actif",
    est_membre_e2d: true,
    est_adherent_phoenix: false,
    ...membre
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom || !formData.prenom || !formData.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = membre?.id
        ? await supabase
            .from('membres')
            .update({
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              email: formData.email.trim().toLowerCase(),
              telephone: formData.telephone.trim(),
              statut: formData.statut,
              est_membre_e2d: formData.est_membre_e2d,
              est_adherent_phoenix: formData.est_adherent_phoenix,
            })
            .eq('id', membre.id)
        : await supabase
            .from('membres')
            .insert([{
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              email: formData.email.trim().toLowerCase(),
              telephone: formData.telephone.trim(),
              statut: formData.statut,
              est_membre_e2d: formData.est_membre_e2d,
              est_adherent_phoenix: formData.est_adherent_phoenix,
            }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: membre?.id ? "Membre modifié avec succès" : "Membre ajouté avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        statut: "actif",
        est_membre_e2d: true,
        est_adherent_phoenix: false,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message.includes('duplicate') 
          ? "Un membre avec cet email existe déjà" 
          : "Impossible d'enregistrer le membre",
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
          <DialogTitle>
            {membre?.id ? "Modifier le membre" : "Ajouter un membre"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du membre. Les champs marqués d'un * sont obligatoires.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Nom de famille"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                placeholder="Prénoms"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              placeholder="+225 XX XX XX XX XX"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
            />
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
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="est_membre_e2d">Membre E2D</Label>
                <p className="text-sm text-muted-foreground">
                  Membre de l'association E2D
                </p>
              </div>
              <Switch
                id="est_membre_e2d"
                checked={formData.est_membre_e2d}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, est_membre_e2d: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="est_adherent_phoenix">Adhérent Phoenix</Label>
                <p className="text-sm text-muted-foreground">
                  Adhérent du club sportif Phoenix
                </p>
              </div>
              <Switch
                id="est_adherent_phoenix"
                checked={formData.est_adherent_phoenix}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, est_adherent_phoenix: checked }))
                }
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : membre?.id ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}