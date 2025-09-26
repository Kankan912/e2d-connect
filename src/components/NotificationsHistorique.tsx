import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail, Clock, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationHistorique {
  id: string;
  type_notification: string;
  destinataire_email: string;
  sujet: string;
  contenu: string;
  statut: string;
  variables_utilisees: any;
  date_envoi: string;
  erreur_message?: string;
}

export default function NotificationsHistorique() {
  const [notifications, setNotifications] = useState<NotificationHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('notifications_historique')
        .select('*')
        .order('date_envoi', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet historique ?')) return;
    
    try {
      const { error } = await (supabase as any)
        .from('notifications_historique')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Historique supprimé avec succès",
      });
      
      loadHistorique();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'historique: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'envoye':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Envoyé
          </Badge>
        );
      case 'erreur':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Erreur
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const filteredNotifications = notifications.filter(notif =>
    notif.destinataire_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.type_notification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statsNotifications = {
    total: notifications.length,
    envoyes: notifications.filter(n => n.statut === 'envoye').length,
    erreurs: notifications.filter(n => n.statut === 'erreur').length,
    enCours: notifications.filter(n => n.statut === 'en_cours').length
  };

  if (loading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsNotifications.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envoyées</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{statsNotifications.envoyes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsNotifications.erreurs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{statsNotifications.enCours}</div>
          </CardContent>
        </Card>
      </div>

      {/* Historique */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Historique des Notifications
            </CardTitle>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">
                    {format(new Date(notification.date_envoi), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{notification.type_notification}</Badge>
                  </TableCell>
                  <TableCell>{notification.destinataire_email}</TableCell>
                  <TableCell className="max-w-xs truncate">{notification.sujet}</TableCell>
                  <TableCell>{getStatutBadge(notification.statut)}</TableCell>
                  <TableCell>
                    {notification.variables_utilisees && Object.keys(notification.variables_utilisees).length > 0 ? (
                      <Badge variant="secondary">
                        {Object.keys(notification.variables_utilisees).length} vars
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredNotifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Aucune notification trouvée" : "Aucune notification dans l'historique"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {notifications.length > 100 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Affichage des 100 dernières notifications seulement
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}