import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  children,
  fallback
}: PermissionGuardProps) {
  const { hasPermission, loading, userRole } = usePermissions();

  if (loading) {
    return <div>Chargement des permissions...</div>;
  }

  if (!hasPermission(resource, action)) {
    return fallback || (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Accès restreint</AlertTitle>
        <AlertDescription>
          Vous n'avez pas la permission de {action} sur {resource}.
          <br />
          Rôle actuel : <strong>{userRole || 'Aucun'}</strong>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
