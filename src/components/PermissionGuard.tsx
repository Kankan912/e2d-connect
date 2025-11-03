import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { logger } from '@/lib/logger';

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
    // CORRECTION #16: Logger structuré avec contexte
    logger.logWithContext('warn', 'Access blocked', {
      component: 'PermissionGuard',
      action: 'blockAccess',
      data: { resource, action: action, userRole }
    });
    
    // CORRECTION #15: Message d'erreur contextuel amélioré
    return fallback || (
      <Alert className="m-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Accès Refusé</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Vous n'avez pas la permission <Badge variant="destructive" className="mx-1">{action}</Badge> 
            sur la ressource <Badge className="mx-1">{resource}</Badge>.
          </p>
          <p className="text-xs text-muted-foreground">
            💡 Contactez un administrateur pour obtenir cette permission. 
            Votre rôle actuel : <strong>{userRole || 'Aucun'}</strong>
          </p>
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              ← Retour
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = '/configuration'}
            >
              ⚙️ Configuration
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
