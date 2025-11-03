import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: membreData, error: membreError } = await supabase
        .from('membres')
        .select(`
          id,
          membres_roles(
            roles(id, name)
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (membreError) throw membreError;

      const role = membreData?.membres_roles?.[0]?.roles?.name;
      setUserRole(role);

      if (role) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('name', role)
          .single();

        if (roleError) throw roleError;

        const { data: permsData, error: permsError } = await supabase
          .from('role_permissions')
          .select('resource, permission, granted')
          .eq('role_id', roleData.id);

        if (permsError) throw permsError;

        const formattedPerms: Permission[] = (permsData || []).map((p: any) => ({
          resource: p.resource,
          action: p.permission,
          granted: p.granted
        }));

        setPermissions(formattedPerms);
      }
    } catch (error: any) {
      console.error('[PERMISSIONS] Erreur chargement:', error);
      toast({
        title: "Erreur permissions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (userRole === 'administrateur') return true;

    const perm = permissions.find(
      p => p.resource === resource && p.action === action
    );

    return perm?.granted || false;
  };

  const requirePermission = (resource: string, action: string): void => {
    if (!hasPermission(resource, action)) {
      toast({
        title: "Accès refusé",
        description: `Vous n'avez pas la permission de ${action} sur ${resource}`,
        variant: "destructive"
      });
      throw new Error(`Permission denied: ${resource}.${action}`);
    }
  };

  return {
    permissions,
    loading,
    userRole,
    hasPermission,
    requirePermission,
    reload: loadPermissions
  };
}
