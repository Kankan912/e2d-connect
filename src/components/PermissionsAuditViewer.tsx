import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { logger } from '@/lib/logger';

interface AuditLog {
  id: string;
  action: string;
  record_id: string;
  user_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

export default function PermissionsAuditViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    logger.debug('[AUDIT_VIEWER] Loading audit logs');
    try {
      const { data, error } = await supabase
        .from('permissions_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      logger.success('[AUDIT_VIEWER] Loaded logs', { count: data?.length });
      setLogs(data || []);
    } catch (error) {
      logger.error('[AUDIT_VIEWER] Failed to load logs', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-green-500">Création</Badge>;
      case 'UPDATE':
        return <Badge className="bg-yellow-500">Modification</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">Suppression</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (loading) return <div>Chargement de l'audit...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Historique des modifications de permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Avant</TableHead>
              <TableHead>Après</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {log.new_data?.resource || log.old_data?.resource}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.new_data?.permission || log.old_data?.permission}
                </TableCell>
                <TableCell className="text-xs">
                  {log.old_data?.granted !== undefined 
                    ? (log.old_data.granted ? '✅ Autorisé' : '❌ Refusé')
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-xs">
                  {log.new_data?.granted !== undefined
                    ? (log.new_data.granted ? '✅ Autorisé' : '❌ Refusé')
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {logs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune modification enregistrée
          </div>
        )}
      </CardContent>
    </Card>
  );
}
