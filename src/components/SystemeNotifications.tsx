import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bell, Settings, Send, Users, Clock, CheckCircle2, 
  AlertTriangle, Mail, MessageSquare, Calendar, 
  DollarSign, Plus, Edit, Trash2, History 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from './LogoHeader';

interface NotificationConfig {
  id: string;
  type_notification: string;
  delai_jours: number;
  actif: boolean;
  template_sujet: string;
  template_contenu: string;
  created_at: string;
}

interface NotificationLog {
  id: string;
  type: string;
  destinataire: string;
  sujet: string;
  contenu: string;
  statut: 'envoye' | 'erreur' | 'en_attente';
  date_envoi: string;
}

interface NotificationTemplate {
  type: string;
  nom: string;
  description: string;
  template_defaut_sujet: string;
  template_defaut_contenu: string;
  variables: string[];
}

export const SystemeNotifications: React.FC = () => {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NotificationConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Templates de notifications prédéfinis
  const templates: NotificationTemplate[] = [
    {
      type: 'cotisation_rappel',
      nom: 'Rappel de Cotisation',
      description: 'Rappel automatique pour les cotisations en retard',
      template_defaut_sujet: 'Rappel - Cotisation en attente',
      template_defaut_contenu: 'Bonjour {nom_membre},\n\nNous vous rappelons que votre cotisation de {montant} FCFA est en attente depuis {nb_jours} jours.\n\nMerci de régulariser votre situation.\n\nCordialement,\nL\'équipe E2D',
      variables: ['nom_membre', 'montant', 'nb_jours', 'type_cotisation']
    },
    {
      type: 'reunion_convocation',
      nom: 'Convocation Réunion',
      description: 'Convocation automatique pour les réunions',
      template_defaut_sujet: 'Convocation - Réunion du {date_reunion}',
      template_defaut_contenu: 'Bonjour {nom_membre},\n\nVous êtes convoqué(e) à la réunion qui se déroulera le {date_reunion} à {heure_reunion} au {lieu_reunion}.\n\nOrdre du jour :\n{ordre_du_jour}\n\nVotre présence est requise.\n\nCordialement,\nLe Secrétaire Général',
      variables: ['nom_membre', 'date_reunion', 'heure_reunion', 'lieu_reunion', 'ordre_du_jour']
    },
    {
      type: 'pret_echeance',
      nom: 'Échéance de Prêt',
      description: 'Rappel automatique pour les échéances de prêt',
      template_defaut_sujet: 'Rappel - Échéance de prêt',
      template_defaut_contenu: 'Bonjour {nom_membre},\n\nNous vous rappelons que l\'échéance de votre prêt de {montant_pret} FCFA arrive le {date_echeance}.\n\nMontant à rembourser : {montant_total} FCFA\n\nMerci de prévoir le remboursement.\n\nCordialement,\nLe Trésorier',
      variables: ['nom_membre', 'montant_pret', 'date_echeance', 'montant_total', 'taux_interet']
    },
    {
      type: 'sanction_notification',
      nom: 'Notification de Sanction',
      description: 'Notification automatique pour les sanctions',
      template_defaut_sujet: 'Notification - Sanction appliquée',
      template_defaut_contenu: 'Bonjour {nom_membre},\n\nUne sanction de {montant_sanction} FCFA vous a été appliquée pour le motif suivant :\n{motif_sanction}\n\nMerci de régulariser cette situation.\n\nCordialement,\nLe Censeur',
      variables: ['nom_membre', 'montant_sanction', 'motif_sanction', 'date_sanction']
    },
    {
      type: 'epargne_rappel',
      nom: 'Rappel d\'Épargne',
      description: 'Encouragement à l\'épargne mensuelle',
      template_defaut_sujet: 'Rappel - Épargne mensuelle',
      template_defaut_contenu: 'Bonjour {nom_membre},\n\nN\'oubliez pas de constituer votre épargne mensuelle.\n\nVotre épargne actuelle : {montant_epargne_actuel} FCFA\n\nMerci de votre engagement.\n\nCordialement,\nLe Trésorier',
      variables: ['nom_membre', 'montant_epargne_actuel', 'objectif_epargne']
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [configsRes, logsRes] = await Promise.all([
        supabase.from('notifications_config').select('*').order('created_at', { ascending: false }),
        // Simulation des logs - à adapter selon votre implémentation
        Promise.resolve({ data: [] as NotificationLog[] })
      ]);

      if (configsRes.error) throw configsRes.error;

      setConfigs(configsRes.data || []);
      setLogs(logsRes.data || []);

    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les configurations de notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (configData: Partial<NotificationConfig>) => {
    try {
      if (editingConfig) {
        // Mise à jour
        const { error } = await supabase
          .from('notifications_config')
          .update(configData)
          .eq('id', editingConfig.id);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Configuration mise à jour avec succès.",
        });
      } else {
        // Création
        const { error } = await supabase
          .from('notifications_config')
          .insert([{...configData, type_notification: configData.type_notification || ''}]);

        if (error) throw error;
        
        toast({
          title: "Succès",
          description: "Configuration créée avec succès.",
        });
      }

      setShowConfigDialog(false);
      setEditingConfig(null);
      loadData();

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration supprimée avec succès.",
      });
      
      loadData();

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la configuration.",
        variant: "destructive",
      });
    }
  };

  const handleToggleConfig = async (id: string, actif: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications_config')
        .update({ actif })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Configuration ${actif ? 'activée' : 'désactivée'} avec succès.`,
      });
      
      loadData();

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la configuration.",
        variant: "destructive",
      });
    }
  };

  const sendTestNotification = async (config: NotificationConfig) => {
    try {
      // Simulation de l'envoi d'une notification de test
      toast({
        title: "Test envoyé",
        description: "Une notification de test a été envoyée avec succès.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du test:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification de test.",
        variant: "destructive",
      });
    }
  };

  const filteredConfigs = configs.filter(config =>
    config.type_notification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.template_sujet.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <LogoHeader title="Système de Notifications" subtitle="Gestion des notifications automatiques" />
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <LogoHeader title="Système de Notifications" subtitle="Configuration et gestion des notifications automatiques" />

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Input
                placeholder="Rechercher une configuration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button onClick={() => setShowConfigDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Configuration
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredConfigs.map((config) => (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {templates.find(t => t.type === config.type_notification)?.nom || config.type_notification}
                        <Badge variant={config.actif ? "default" : "secondary"}>
                          {config.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {templates.find(t => t.type === config.type_notification)?.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Switch
                        checked={config.actif}
                        onCheckedChange={(checked) => handleToggleConfig(config.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestNotification(config)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingConfig(config);
                          setShowConfigDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Délai: {config.delai_jours} jours
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Sujet:</p>
                      <p className="text-sm text-muted-foreground">{config.template_sujet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Les templates utilisent des variables dynamiques entre accolades (ex: {'{nom_membre}'}).
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.type}>
                <CardHeader>
                  <CardTitle>{template.nom}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Sujet par défaut:</Label>
                    <Input value={template.template_defaut_sujet} readOnly />
                  </div>
                  <div>
                    <Label>Contenu par défaut:</Label>
                    <Textarea value={template.template_defaut_contenu} readOnly rows={4} />
                  </div>
                  <div>
                    <Label>Variables disponibles:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="outline">
                          {'{' + variable + '}'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingConfig({
                        id: '',
                        type_notification: template.type,
                        delai_jours: 7,
                        actif: true,
                        template_sujet: template.template_defaut_sujet,
                        template_contenu: template.template_defaut_contenu,
                        created_at: ''
                      });
                      setShowConfigDialog(true);
                    }}
                  >
                    Créer une configuration
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Notifications</CardTitle>
              <CardDescription>Dernières notifications envoyées</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune notification dans l'historique</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Sujet</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.date_envoi).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>{log.type}</TableCell>
                        <TableCell>{log.destinataire}</TableCell>
                        <TableCell>{log.sujet}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.statut === 'envoye' ? 'default' :
                            log.statut === 'erreur' ? 'destructive' : 'secondary'
                          }>
                            {log.statut === 'envoye' ? 'Envoyé' :
                             log.statut === 'erreur' ? 'Erreur' : 'En attente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistiques" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Configurations Actives</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {configs.filter(c => c.actif).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  sur {configs.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications Envoyées</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {logs.filter(l => l.statut === 'envoye').length}
                </div>
                <p className="text-xs text-muted-foreground">ce mois</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {logs.length > 0 ? 
                    Math.round((logs.filter(l => l.statut === 'envoye').length / logs.length) * 100) : 0
                  }%
                </div>
                <p className="text-xs text-muted-foreground">notifications réussies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {logs.filter(l => l.statut === 'en_attente').length}
                </div>
                <p className="text-xs text-muted-foreground">à traiter</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de configuration */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig?.id ? 'Modifier' : 'Créer'} une Configuration
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres de notification automatique.
            </DialogDescription>
          </DialogHeader>
          
          <NotificationConfigForm
            config={editingConfig}
            templates={templates}
            onSave={handleSaveConfig}
            onCancel={() => {
              setShowConfigDialog(false);
              setEditingConfig(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Composant formulaire de configuration
const NotificationConfigForm: React.FC<{
  config: NotificationConfig | null;
  templates: NotificationTemplate[];
  onSave: (config: Partial<NotificationConfig>) => void;
  onCancel: () => void;
}> = ({ config, templates, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    type_notification: config?.type_notification || '',
    delai_jours: config?.delai_jours || 7,
    actif: config?.actif ?? true,
    template_sujet: config?.template_sujet || '',
    template_contenu: config?.template_contenu || ''
  });

  const selectedTemplate = templates.find(t => t.type === formData.type_notification);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Inclure l'ID si on édite une configuration existante
    onSave(config?.id ? { ...formData, id: config.id } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">Type de notification</Label>
        <Select
          value={formData.type_notification}
          onValueChange={(value) => {
            const template = templates.find(t => t.type === value);
            setFormData({
              ...formData,
              type_notification: value,
              template_sujet: template?.template_defaut_sujet || '',
              template_contenu: template?.template_defaut_contenu || ''
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.type} value={template.type}>
                {template.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="delai">Délai (jours)</Label>
        <Input
          id="delai"
          type="number"
          min="1"
          value={formData.delai_jours}
          onChange={(e) => setFormData({...formData, delai_jours: parseInt(e.target.value)})}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="actif"
          checked={formData.actif}
          onCheckedChange={(checked) => setFormData({...formData, actif: checked})}
        />
        <Label htmlFor="actif">Configuration active</Label>
      </div>

      <div>
        <Label htmlFor="sujet">Sujet du message</Label>
        <Input
          id="sujet"
          value={formData.template_sujet}
          onChange={(e) => setFormData({...formData, template_sujet: e.target.value})}
          placeholder="Sujet de la notification"
        />
      </div>

      <div>
        <Label htmlFor="contenu">Contenu du message</Label>
        <Textarea
          id="contenu"
          value={formData.template_contenu}
          onChange={(e) => setFormData({...formData, template_contenu: e.target.value})}
          placeholder="Contenu de la notification"
          rows={6}
        />
      </div>

      {selectedTemplate && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Variables disponibles: {selectedTemplate.variables.map(v => `{${v}}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {config?.id ? 'Mettre à jour' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
};