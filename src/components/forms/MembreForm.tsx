import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
}

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
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Phase 1 Fix: Properly pre-fill form when editing
  useEffect(() => {
    if (open) {
      fetchRoles();
      if (membre?.id) {
        fetchMembreRoles(membre.id);
        // Pre-fill form data with existing member data
        setFormData({
          nom: membre.nom || "",
          prenom: membre.prenom || "",
          email: membre.email || "",
          telephone: membre.telephone || "",
          statut: membre.statut || "actif",
          est_membre_e2d: membre.est_membre_e2d ?? true,
          est_adherent_phoenix: membre.est_adherent_phoenix ?? false,
        });
      } else {
        // Reset form for new member
        setFormData({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          statut: "actif",
          est_membre_e2d: true,
          est_adherent_phoenix: false,
        });
        setSelectedRoles([]);
      }
    }
  }, [open, membre?.id]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    }
  };

  const fetchMembreRoles = async (membreId: string) => {
    try {
      const { data, error } = await supabase
        .from('membres_roles')
        .select('role_id')
        .eq('membre_id', membreId);

      if (error) throw error;
      setSelectedRoles(data?.map(mr => mr.role_id) || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles du membre:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - Seul l'email est obligatoire lors de l'édition pour l'admin
    if (membre?.id) {
      // Mode édition - seul l'email est obligatoire
      if (!formData.email) {
        toast({
          title: "Erreur",
          description: "L'email est obligatoire",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Mode création - nom, prénom et email sont obligatoires
      if (!formData.nom || !formData.prenom || !formData.email) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        });
        return;
      }
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
      let membreId = membre?.id;
      
      // Insérer ou mettre à jour le membre
      if (membre?.id) {
        const { error } = await supabase
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
          .eq('id', membre.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('membres')
          .insert([{
            nom: formData.nom.trim(),
            prenom: formData.prenom.trim(),
            email: formData.email.trim().toLowerCase(),
            telephone: formData.telephone.trim(),
            statut: formData.statut,
            est_membre_e2d: formData.est_membre_e2d,
            est_adherent_phoenix: formData.est_adherent_phoenix,
          }])
          .select()
          .single();
        
        if (error) throw error;
        membreId = data.id;
      }

      // Gérer les rôles si un membre ID est disponible
      if (membreId && selectedRoles.length > 0) {
        // Supprimer les anciens rôles
        await supabase
          .from('membres_roles')
          .delete()
          .eq('membre_id', membreId);

        // Ajouter les nouveaux rôles
        const rolesData = selectedRoles.map(roleId => ({
          membre_id: membreId,
          role_id: roleId
        }));

        const { error: rolesError } = await supabase
          .from('membres_roles')
          .insert(rolesData);

        if (rolesError) {
          console.error('Erreur lors de l\'attribution des rôles:', rolesError);
        }
      }

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
      setSelectedRoles([]);
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
              <Label htmlFor="nom">Nom {!membre?.id && '*'}</Label>
              <Input
                id="nom"
                placeholder="Nom de famille"
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                required={!membre?.id}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom {!membre?.id && '*'}</Label>
              <Input
                id="prenom"
                placeholder="Prénoms"
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                required={!membre?.id}
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
            <Label htmlFor="telephone">Téléphone {!membre?.id && '*'}</Label>
            <Input
              id="telephone"
              placeholder="+225 XX XX XX XX XX"
              value={formData.telephone}
              onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
              required={!membre?.id}
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
            {/* Rôles du membre */}
            <div className="space-y-3">
              <Label>Rôles du membre</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role_${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles(prev => [...prev, role.id]);
                        } else {
                          setSelectedRoles(prev => prev.filter(id => id !== role.id));
                        }
                      }}
                    />
                    <Label htmlFor={`role_${role.id}`} className="text-sm">
                      {role.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
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