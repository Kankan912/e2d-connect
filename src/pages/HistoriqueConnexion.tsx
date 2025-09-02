import { useEffect, useState } from "react";
import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface LogItem {
  id: string;
  user_id: string | null;
  date_connexion: string;
  statut: string;
  ip_address: string | null;
  user_agent: string | null;
}

export default function HistoriqueConnexion() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('historique_connexion')
        .select('*')
        .order('date_connexion', { ascending: false })
        .limit(100);

      if (error) {
        setError(error.message);
      } else {
        const typedLogs: LogItem[] = (data || []).map(log => ({
          id: log.id,
          user_id: log.user_id,
          date_connexion: log.date_connexion,
          statut: log.statut,
          ip_address: log.ip_address ? String(log.ip_address) : null,
          user_agent: log.user_agent ? String(log.user_agent) : null
        }));
        setLogs(typedLogs);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <LogoHeader title="Historique de Connexion" subtitle="Vérification des connexions et activités" />

      {error ? (
        <Card>
          <CardContent className="text-sm text-destructive p-6">
            {error.includes('permission') || error.includes('RLS') ? (
              <span>Accès refusé. Assurez-vous que votre rôle administrateur est correctement configuré (onglet Configuration &gt; Permissions).</span>
            ) : (
              <span>{error}</span>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dernières connexions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{new Date(l.date_connexion).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>{l.user_id ?? '-'}</TableCell>
                      <TableCell>{l.statut}</TableCell>
                      <TableCell>{l.ip_address ?? '-'}</TableCell>
                      <TableCell className="max-w-md truncate">{l.user_agent ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune donnée</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}