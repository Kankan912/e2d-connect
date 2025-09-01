import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Shield, Save, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  resource: string;
  permission: string;
  description: string;
}

interface RolePermission {
  role_id: string;
  resource: string;
  permission: string;
  granted: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { resource: "membres", permission: "read", description: "Voir les membres" },
  { resource: "membres", permission: "write", description: "Modifier les membres" },
  { resource: "membres", permission: "delete", description: "Supprimer les membres" },
  { resource: "cotisations", permission: "read", description: "Voir les cotisations" },
  { resource: "cotisations", permission: "write", description: "Modifier les cotisations" },
  { resource: "epargnes", permission: "read", description: "Voir les épargnes" },
  { resource: "epargnes", permission: "write", description: "Modifier les épargnes" },
  { resource: "prets", permission: "read", description: "Voir les prêts" },
  { resource: "prets", permission: "write", description: "Modifier les prêts" },
  { resource: "aides", permission: "read", description: "Voir les aides" },
  { resource: "aides", permission: "write", description: "Modifier les aides" },
  { resource: "sanctions", permission: "read", description: "Voir les sanctions" },
  { resource: "sanctions", permission: "write", description: "Modifier les sanctions" },
  { resource: "reunions", permission: "read", description: "Voir les réunions" },
  { resource: "reunions", permission: "write", description: "Modifier les réunions" },
  { resource: "rapports", permission: "read", description: "Voir les rapports" },
  { resource: "rapports", permission: "write", description: "Modifier les rapports" },
  { resource: "sport", permission: "read", description: "Voir les activités sportives" },
  { resource: "sport", permission: "write", description: "Modifier les activités sportives" },
  { resource: "configuration", permission: "read", description: "Voir la configuration" },
  { resource: "configuration", permission: "write", description: "Modifier la configuration" },
];

export default function RolePermissionsManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        supabase.from('roles').select('*').order('name'),
        supabase.from('role_permissions').select('*')
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (permissionsRes.error) throw permissionsRes.error;

      setRoles(rolesRes.data || []);
      setPermissions(permissionsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (roleId: string, resource: string, permission: string): boolean => {
    return permissions.some(p => 
      p.role_id === roleId && 
      p.resource === resource && 
      p.permission === permission && 
      p.granted
    );
  };

  const togglePermission = (roleId: string, resource: string, permission: string) => {
    const currentPermission = permissions.find(p => 
      p.role_id === roleId && 
      p.resource === resource && 
      p.permission === permission
    );

    if (currentPermission) {
      setPermissions(prev => prev.map(p => 
        p.role_id === roleId && p.resource === resource && p.permission === permission
          ? { ...p, granted: !p.granted }
          : p
      ));
    } else {
      setPermissions(prev => [...prev, {
        role_id: roleId,
        resource,
        permission,
        granted: true
      }]);
    }
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // Supprimer toutes les permissions existantes
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .neq('role_id', '');

      if (deleteError) throw deleteError;

      // Insérer les nouvelles permissions
      const permissionsToInsert = permissions
        .filter(p => p.granted)
        .map(p => ({
          role_id: p.role_id,
          resource: p.resource,
          permission: p.permission,
          granted: p.granted
        }));

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Succès",
        description: "Permissions mises à jour avec succès",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "membres": return "👥";
      case "cotisations": return "💰";
      case "epargnes": return "💵";
      case "prets": return "🏦";
      case "aides": return "🤝";
      case "sanctions": return "⚖️";
      case "reunions": return "📅";
      case "rapports": return "📊";
      case "sport": return "⚽";
      case "configuration": return "⚙️";
      default: return "📁";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Grouper les permissions par ressource
  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestion des Permissions
          </h2>
          <p className="text-muted-foreground">
            Configurez les droits d'accès pour chaque rôle
          </p>
        </div>
        <Button 
          onClick={savePermissions} 
          disabled={saving}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matrice des Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
              <div key={resource} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getResourceIcon(resource)}</span>
                  <h3 className="font-semibold text-lg capitalize">{resource}</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        {roles.map(role => (
                          <TableHead key={role.id} className="text-center min-w-[120px]">
                            <div>
                              <div className="font-semibold">{role.name}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resourcePermissions.map(perm => (
                        <TableRow key={`${resource}-${perm.permission}`}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{perm.description}</div>
                              <Badge variant="outline" className="text-xs mt-1">
                                {perm.permission}
                              </Badge>
                            </div>
                          </TableCell>
                          {roles.map(role => (
                            <TableCell key={role.id} className="text-center">
                              <Checkbox
                                checked={hasPermission(role.id, resource, perm.permission)}
                                onCheckedChange={() => togglePermission(role.id, resource, perm.permission)}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rôles Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <Card key={role.id} className="border-2 border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{role.name}</h4>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs">
                      {permissions.filter(p => p.role_id === role.id && p.granted).length} permissions
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}