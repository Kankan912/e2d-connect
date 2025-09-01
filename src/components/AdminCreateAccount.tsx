import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";

export default function AdminCreateAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdminCreation, setShowAdminCreation] = useState(false);
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="membre@example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Nom"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Prénom"
                  required
                />
              </div>
            </div>

            <div className="bg-info/20 p-4 rounded-lg">
              <p className="text-sm font-medium text-info-foreground">
                <Mail className="w-4 h-4 inline mr-2" />
                Notification automatique
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Un email sera automatiquement envoyé au nouveau membre avec son mot de passe temporaire.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Créer et Notifier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}