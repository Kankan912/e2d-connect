import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Shield, Database, Download, Upload } from "lucide-react";
import AdminCreateAccount from "@/components/AdminCreateAccount";
import BackupManager from "@/components/BackupManager";
import RolePermissionsManager from "@/components/RolePermissionsManager";
import LogoHeader from "@/components/LogoHeader";

export default function Configuration() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <LogoHeader 
        title="Configuration"
        subtitle="Paramètres généraux et administration"
      />

      {/* Configuration Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sauvegarde
          </TabsTrigger>
        </TabsList>

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
          <RolePermissionsManager />
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