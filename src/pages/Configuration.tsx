
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Shield, Database, DollarSign } from "lucide-react";
import AdminCreateAccount from "@/components/AdminCreateAccount";
import BackupManager from "@/components/BackupManager";
import RolePermissionsManager from "@/components/RolePermissionsManager";
import RoleManager from "@/components/RoleManager";
import TontineBeneficiairesManager from "@/components/TontineBeneficiairesManager";
import { SystemeNotifications } from "@/components/SystemeNotifications";
import LogoHeader from "@/components/LogoHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import ExercicesManager from "@/components/ExercicesManager";
import SMTPConfigManager from "@/components/SMTPConfigManager";
import NotificationsHistorique from "@/components/NotificationsHistorique";
import MatchGalaConfig from "@/components/MatchGalaConfig";
import HistoriqueVariables from "@/components/HistoriqueVariables";
import TontineConfigManager from "@/components/TontineConfigManager";
import SanctionsTarifsManager from "@/components/SanctionsTarifsManager";
import CotisationsConfigManager from "@/components/CotisationsConfigManager";
import HistoriqueBeneficiaires from "@/components/HistoriqueBeneficiaires";
import NotificationsTemplatesManager from "@/components/NotificationsTemplatesManager";
import { NotificationsErrorBoundary } from "@/components/NotificationsErrorBoundary";

export default function Configuration() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [ensureAdminLoading, setEnsureAdminLoading] = useState(false);

  const { data: currentRole } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer le rôle",
          variant: "destructive",
        });
        return null;
      }
      return data;
    },
    retry: false,
  });

  const handleEnsureAdmin = async () => {
    setEnsureAdminLoading(true);
    try {
      const { error } = await supabase.functions.invoke('ensure-admin');
      if (error) {
        toast({
          title: "Échec",
          description: `Erreur: ${error.message}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Rôle administrateur initialisé. Les permissions ont été mises à jour.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setEnsureAdminLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <LogoHeader 
          title="Configuration"
          subtitle="Paramètres généraux et administration"
        />
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="exercices" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Exercices
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="cotisations" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cotisations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="tontine" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Tontine
          </TabsTrigger>
          <TabsTrigger value="sanctions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sanctions
          </TabsTrigger>
          <TabsTrigger value="gestion" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gestion
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sauvegarde
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercices" className="space-y-6">
          <ExercicesManager />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestion des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Créer et gérer les comptes utilisateurs de l'association
              </p>
              <AdminCreateAccount />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics des accès</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <strong>Rôle actuel:</strong> {currentRole || 'Aucun rôle détecté'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dernière vérification: {new Date().toLocaleString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Si vous rencontrez des erreurs 403 (accès refusé), cliquez ci-dessous pour corriger automatiquement vos droits administrateur.
                </p>
                <Button 
                  onClick={handleEnsureAdmin}
                  disabled={ensureAdminLoading}
                  className="w-full"
                >
                  {ensureAdminLoading ? "Correction en cours..." : "🔧 Rétablir les accès administrateur"}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Erreurs communes:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>403 Forbidden:</strong> Permissions manquantes → Utiliser le bouton ci-dessus</li>
                  <li><strong>RLS Policy:</strong> Rôle non reconnu → Vérifier l'association membre/rôle</li>
                  <li><strong>42501:</strong> Violation RLS → Réessayer après correction des accès</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <RoleManager />
            <RolePermissionsManager />
          </div>
        </TabsContent>

        <TabsContent value="cotisations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuration des Cotisations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gérer les types de cotisations, les montants minimaux, les échéances et les simulations financières
              </p>
              <Button onClick={() => navigate('/configuration/cotisations')} className="w-full">
                Voir la Configuration Avancée
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="space-y-6">
            <NotificationsErrorBoundary>
              <NotificationsTemplatesManager />
            </NotificationsErrorBoundary>
            <SystemeNotifications />
            <SMTPConfigManager />
            <NotificationsHistorique />
            <MatchGalaConfig />
          </div>
        </TabsContent>

          <TabsContent value="tontine" className="space-y-6">
            <TontineConfigManager />
            <TontineBeneficiairesManager />
            <HistoriqueBeneficiaires />
          </TabsContent>

        <TabsContent value="sanctions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Types de Sanctions et Tarifs</CardTitle>
            </CardHeader>
            <CardContent>
              <SanctionsTarifsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestion" className="space-y-6">
          {/* Fond de Caisse */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fond de Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gestion du fond de caisse et des opérations
              </p>
              <Button onClick={() => navigate('/fond-caisse')}>
                Accéder au Fond de Caisse
              </Button>
            </CardContent>
          </Card>

          {/* Photos des Membres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Photos des Membres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gestion des photos des membres de l'association
              </p>
              <Button onClick={() => navigate('/gestion-photos')}>
                Gérer les Photos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sauvegarde et Restauration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Sauvegarde et restauration des données de l'association
              </p>
              <BackupManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
