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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, Save, Users, Zap, CheckSquare, XSquare, Copy } from "lucide-react";
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

  // CORRECTION #15: Actions rapides permissions
  const grantAllPermissions = (roleId: string) => {
    const updatedPerms = AVAILABLE_PERMISSIONS.map(perm => ({
      role_id: roleId,
      resource: perm.resource,
      permission: perm.permission,
      granted: true
    }));
    setPermissions(prev => {
      const filtered = prev.filter(p => p.role_id !== roleId);
      return [...filtered, ...updatedPerms];
    });
    toast({
      title: "Succès",
      description: `Toutes les permissions activées pour ${roles.find(r => r.id === roleId)?.name}`,
    });
  };

  const revokeAllPermissions = (roleId: string) => {
    setPermissions(prev => prev.filter(p => p.role_id !== roleId));
    toast({
      title: "Succès",
      description: `Toutes les permissions désactivées pour ${roles.find(r => r.id === roleId)?.name}`,
    });
  };

  const copyPermissions = (sourceRoleId: string, targetRoleId: string) => {
    const sourcePerms = permissions.filter(p => p.role_id === sourceRoleId && p.granted);
    const targetPerms = sourcePerms.map(p => ({
      ...p,
      role_id: targetRoleId
    }));
    
    setPermissions(prev => {
      const filtered = prev.filter(p => p.role_id !== targetRoleId);
      return [...filtered, ...targetPerms];
    });
    
    toast({
      title: "Succès",
      description: `${sourcePerms.length} permissions copiées de ${roles.find(r => r.id === sourceRoleId)?.name} vers ${roles.find(r => r.id === targetRoleId)?.name}`,
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // 1. Récupérer toutes les permissions existantes
      const { data: existingPerms, error: fetchError } = await supabase
        .from('role_permissions')
        .select('id, role_id, resource, permission, granted');
      
      if (fetchError) throw fetchError;

      // 2. Créer des Maps pour comparaison
      const existingMap = new Map(
        (existingPerms || []).map(p => [`${p.role_id}-${p.resource}-${p.permission}`, p])
      );
      
      const currentMap = new Map(
        permissions.map(p => [`${p.role_id}-${p.resource}-${p.permission}`, p])
      );

      // 3. Identifier les opérations
      const toDelete: string[] = [];
      const toUpdate: any[] = [];
      const toInsert: any[] = [];

      // Parcourir les permissions existantes
      existingMap.forEach((existing, key) => {
        const current = currentMap.get(key);
        if (!current) {
          // Permission supprimée
          toDelete.push(existing.id);
        } else if (existing.granted !== current.granted) {
          // Permission modifiée
          toUpdate.push({ id: existing.id, granted: current.granted });
        }
      });

      // Parcourir les nouvelles permissions
      currentMap.forEach((current, key) => {
        if (!existingMap.has(key) && current.granted) {
          // Nouvelle permission
          toInsert.push({
            role_id: current.role_id,
            resource: current.resource,
            permission: current.permission,
            granted: current.granted
          });
        }
      });

      // 4. Exécuter les opérations via Edge Function (avec transaction)
      const { data: result, error: saveError } = await supabase.functions.invoke('save-permissions', {
        body: { toDelete, toUpdate, toInsert }
      });

      if (saveError) throw saveError;

      toast({
        title: "Succès",
        description: `${result.inserted} créées, ${result.updated} modifiées, ${result.deleted} supprimées`,
      });

      await loadData(); // Recharger les données
    } catch (error: any) {
      console.error('Erreur sauvegarde permissions:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: error.message || "Impossible de sauvegarder les permissions",
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

      {/* CORRECTION #15: Accordéon Actions rapides */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="quick-actions">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions Rapides
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              {roles.map(role => (
                <Card key={role.id} className="border-2">
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold mb-3">{role.name}</h4>
                    <Button 
                      onClick={() => grantAllPermissions(role.id)} 
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Tout activer
                    </Button>
                    <Button 
                      onClick={() => revokeAllPermissions(role.id)} 
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <XSquare className="w-4 h-4 mr-2" />
                      Tout désactiver
                    </Button>
                    {role.name !== 'administrateur' && roles.find(r => r.name === 'administrateur') && (
                      <Button 
                        onClick={() => copyPermissions(roles.find(r => r.name === 'administrateur')!.id, role.id)} 
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier admin
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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