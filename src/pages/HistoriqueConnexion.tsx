import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Clock, Globe, User, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LogoHeader from "@/components/LogoHeader";

interface HistoriqueConnexion {
  id: string;
  user_id: string;
  date_connexion: string;
  ip_address: string;
  user_agent: string;
  statut: string;
  membre?: {
    nom: string;
    prenom: string;
    email: string;
  };
}

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  old_data?: any;
  new_data?: any;
  user_id?: string;
  timestamp: string;
  membre?: {
    nom: string;
    prenom: string;
  };
}

export default function HistoriqueConnexion() {
  const [connexions, setConnexions] = useState<HistoriqueConnexion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<'connexions' | 'modifications'>('connexions');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger l'historique des connexions
      const { data: connexionsData, error: connexionsError } = await supabase
        .from('historique_connexion')
        .select(`
          *,
          membre:membres!historique_connexion_user_id_fkey(nom, prenom, email)
        `)
        .order('date_connexion', { ascending: false })
        .limit(100);

      if (connexionsError) throw connexionsError;
      
      setConnexions(connexionsData || []);

      // Pour l'audit des modifications, on simule avec les dernières modifications sur quelques tables importantes
      const tables = ['membres', 'cotisations', 'prets', 'aides'];
      const auditData: AuditLog[] = [];

      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*, updated_at, created_at')
            .order('updated_at', { ascending: false })
            .limit(20);

          if (!error && data) {
            data.forEach(row => {
              auditData.push({
                id: `${table}-${row.id}`,
                table_name: table,
                operation: row.created_at === row.updated_at ? 'INSERT' : 'UPDATE',
                new_data: row,
                timestamp: row.updated_at || row.created_at
              });
            });
          }
        } catch (error) {
          // Ignorer les erreurs pour les tables qui n'existent pas ou ne sont pas accessibles
          console.log(`Table ${table} non accessible`);
        }
      }

      // Trier par timestamp
      auditData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(auditData.slice(0, 50));

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConnexions = connexions.filter(connexion =>
    connexion.membre?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connexion.membre?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connexion.membre?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connexion.ip_address?.includes(searchTerm)
  );

  const filteredAuditLogs = auditLogs.filter(log =>
    log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'reussi':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Réussie
          </Badge>
        );
      case 'echec':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Échec
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Badge className="bg-success text-success-foreground">Création</Badge>;
      case 'UPDATE':
        return <Badge className="bg-warning text-warning-foreground">Modification</Badge>;
      case 'DELETE':
        return <Badge className="bg-destructive text-destructive-foreground">Suppression</Badge>;
      default:
        return <Badge variant="outline">{operation}</Badge>;
    }
  };

  const getBrowserInfo = (userAgent: string) => {
    if (!userAgent) return "Navigateur inconnu";
    
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    
    return 'Autre';
  };

  const getTableDisplayName = (tableName: string) => {
    const names: { [key: string]: string } = {
      'membres': 'Membres',
      'cotisations': 'Cotisations',
      'prets': 'Prêts',
      'aides': 'Aides',
      'sanctions': 'Sanctions',
      'reunions': 'Réunions'
    };
    return names[tableName] || tableName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalConnexions = connexions.length;
  const connexionsReussies = connexions.filter(c => c.statut === 'reussi').length;
  const connexionsEchecs = connexions.filter(c => c.statut === 'echec').length;
  const tauxReussite = totalConnexions > 0 ? (connexionsReussies / totalConnexions * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Historique & Audit"
        subtitle="Suivi des connexions et modifications dans le système"
      />

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Connexions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConnexions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Connexions Réussies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{connexionsReussies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Connexions Échouées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{connexionsEchecs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">Taux de Réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tauxReussite}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTab('connexions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedTab === 'connexions' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <Shield className="w-4 h-4" />
                Connexions
              </button>
              <button
                onClick={() => setSelectedTab('modifications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  selectedTab === 'modifications' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <Clock className="w-4 h-4" />
                Modifications
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTab === 'connexions' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Adresse IP</TableHead>
                  <TableHead>Navigateur</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConnexions.map((connexion) => (
                  <TableRow key={connexion.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          {connexion.membre ? (
                            <>
                              <p className="font-medium">
                                {connexion.membre.nom} {connexion.membre.prenom}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {connexion.membre.email}
                              </p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Utilisateur inconnu</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(connexion.date_connexion), 'dd/MM/yyyy', { locale: fr })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(connexion.date_connexion), 'HH:mm:ss', { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{connexion.ip_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getBrowserInfo(connexion.user_agent)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(connexion.statut)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredConnexions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune connexion trouvée" : "Aucune connexion enregistrée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Opération</TableHead>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {getTableDisplayName(log.table_name)}
                    </TableCell>
                    <TableCell>
                      {getOperationBadge(log.operation)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'HH:mm:ss', { locale: fr })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {log.operation === 'INSERT' ? 'Nouveau enregistrement créé' :
                         log.operation === 'UPDATE' ? 'Enregistrement mis à jour' :
                         'Enregistrement supprimé'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAuditLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune modification trouvée" : "Aucune modification enregistrée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}