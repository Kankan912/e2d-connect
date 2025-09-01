import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function AdminCreateAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminCreation, setShowAdminCreation] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    nom: "",
    prenom: "",
    telephone: "",
    password: ""
  });
  const { toast } = useToast();

  const createAdminAccount = async () => {
    setLoading(true);
    try {
      // Créer le compte admin avec Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@e2d.com',
        password: '699195570',
        options: {
          data: {
            nom: 'Admin',
            prenom: 'E2D',
            role: 'administrateur'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Information",
            description: "Le compte administrateur existe déjà. Email: admin@e2d.com, Mot de passe: 699195570",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Compte administrateur créé",
          description: "Email: admin@e2d.com, Mot de passe: 699195570",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte administrateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowAdminCreation(false);
    }
  };

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

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.nom || !formData.prenom || !formData.telephone || !formData.password) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Appeler l'Edge Function pour créer le compte
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          password: formData.password,
          roles: selectedRoles.length > 0 ? selectedRoles.map(roleId => {
            const role = roles.find(r => r.id === roleId);
            return role?.name;
          }).filter(Boolean) : []
        }
      });

      if (error) throw error;

      toast({
        title: "Compte créé avec succès",
        description: "L'utilisateur a reçu un email avec ses identifiants de connexion",
      });

      // Reset form
      setFormData({
        email: "",
        nom: "",
        prenom: "",
        telephone: "",
        password: ""
      });
      setSelectedRoles([]);
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  return (
    <>
      {/* Bouton pour créer le compte admin */}
      {!showAdminCreation && (
        <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <UserPlus className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">Compte Administrateur</h3>
                <p className="text-sm text-muted-foreground">
                  Créer le compte administrateur par défaut
                </p>
              </div>
              <Button 
                onClick={() => setShowAdminCreation(true)}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Créer Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation pour créer l'admin */}
      {showAdminCreation && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Créer le compte administrateur
            </CardTitle>
            <CardDescription>
              Ceci va créer un compte administrateur avec l'email admin@e2d.com et le mot de passe 699195570
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">Détails du compte :</p>
              <p className="text-sm">Email: admin@e2d.com</p>
              <p className="text-sm">Mot de passe: 699195570</p>
              <p className="text-sm">Rôle: Administrateur</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={createAdminAccount}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Création..." : "Confirmer"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAdminCreation(false)}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour créer un nouveau membre avec notification */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          fetchRoles();
        }
      }}>
        <DialogTrigger asChild>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Créer un membre
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Créer un nouveau membre
            </DialogTitle>
            <DialogDescription>
              Le membre recevra un email avec ses identifiants de connexion
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="membre@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                placeholder="+225 XX XX XX XX XX"
                value={formData.telephone}
                onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe *</Label>
                <Button type="button" variant="outline" size="sm" onClick={generatePassword}>
                  Générer
                </Button>
              </div>
              <Input
                id="password"
                type="text"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            {/* Rôles */}
            <div className="space-y-3">
              <Label>Rôles (optionnel)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
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

            <div className="bg-info/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-info-foreground">
                <Mail className="w-4 h-4 inline mr-2" />
                Notification automatique
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Un email sera automatiquement envoyé au nouveau membre avec son mot de passe.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Création..." : "Créer et Notifier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}