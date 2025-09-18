import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Send, 
  Users, 
  Calendar, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Target,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationCampagne {
  id: string;
  nom: string;
  description?: string;
  type_campagne: 'rappel_cotisation' | 'reunion' | 'echeance_pret' | 'custom';
  destinataires: string[];
  template_sujet: string;
  template_contenu: string;
  date_envoi_prevue?: string;
  date_envoi_reelle?: string;
  statut: 'brouillon' | 'programme' | 'envoye' | 'annule';
  nb_destinataires: number;
  nb_envoyes: number;
  nb_erreurs: number;
  created_by_nom?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationEnvoi {
  id: string;
  campagne_id: string;
  membre_nom: string;
  canal: 'email' | 'sms' | 'push';
  statut: 'en_attente' | 'envoye' | 'lu' | 'erreur';
  date_envoi?: string;
  date_lecture?: string;
  erreur_message?: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  statut: string;
}

export const NotificationsAvancees: React.FC = () => {
  const [campagnes, setCampagnes] = useState<NotificationCampagne[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [selectedCampagne, setSelectedCampagne] = useState<NotificationCampagne | null>(null);
  const [envoisDetails, setEnvoisDetails] = useState<NotificationEnvoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campagnes');

  // États pour nouvelle campagne
  const [nouvelleCampagne, setNouvelleCampagne] = useState({
    nom: '',
    description: '',
    type_campagne: '' as 'rappel_cotisation' | 'reunion' | 'echeance_pret' | 'custom' | '',
    destinataires: [] as string[],
    template_sujet: '',
    template_contenu: '',
    date_envoi_prevue: '',
    envoi_immediat: false
  });

  const { toast } = useToast();

  useRealtimeUpdates({
    table: 'notifications_campagnes',
    onUpdate: loadCampagnes,
    enabled: true
  });

  useRealtimeUpdates({
    table: 'notifications_envois',
    onUpdate: loadEnvoisDetails,
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCampagnes(),
        loadMembres()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCampagnes = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications_campagnes')
        .select(`
          *,
          created_by:membres!created_by(nom, prenom)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const campagnesFormatted = (data || []).map(campagne => ({
        ...campagne,
        created_by_nom: campagne.created_by ? `${campagne.created_by.nom} ${campagne.created_by.prenom}` : ''
      }));

      setCampagnes(campagnesFormatted);
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
    }
  };

  const loadMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, email, telephone, statut')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const loadEnvoisDetails = async () => {
    if (!selectedCampagne) return;

    try {
      const { data, error } = await supabase
        .from('notifications_envois')
        .select(`
          *,
          membre:membres!membre_id(nom, prenom)
        `)
        .eq('campagne_id', selectedCampagne.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const envoisFormatted = (data || []).map(envoi => ({
        ...envoi,
        membre_nom: envoi.membre ? `${envoi.membre.nom} ${envoi.membre.prenom}` : ''
      }));

      setEnvoisDetails(envoisFormatted);
    } catch (error) {
      console.error('Erreur chargement détails envois:', error);
    }
  };

  const creerCampagne = async () => {
    if (!nouvelleCampagne.nom || !nouvelleCampagne.template_sujet || !nouvelleCampagne.template_contenu) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data: membreData } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membreData) throw new Error('Membre non trouvé');

      const dateEnvoi = nouvelleCampagne.envoi_immediat ? new Date().toISOString() : 
                      nouvelleCampagne.date_envoi_prevue ? new Date(nouvelleCampagne.date_envoi_prevue).toISOString() : null;

      const destinataires = nouvelleCampagne.destinataires.length > 0 ? 
                           nouvelleCampagne.destinataires : 
                           membres.map(m => m.id);

      const { error } = await supabase
        .from('notifications_campagnes')
        .insert({
          nom: nouvelleCampagne.nom,
          description: nouvelleCampagne.description || null,
          type_campagne: nouvelleCampagne.type_campagne,
          destinataires: destinataires,
          template_sujet: nouvelleCampagne.template_sujet,
          template_contenu: nouvelleCampagne.template_contenu,
          date_envoi_prevue: dateEnvoi,
          statut: nouvelleCampagne.envoi_immediat ? 'programme' : 'brouillon',
          nb_destinataires: destinataires.length,
          created_by: membreData.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Campagne créée avec succès"
      });

      // Réinitialiser le formulaire
      setNouvelleCampagne({
        nom: '',
        description: '',
        type_campagne: '' as any,
        destinataires: [],
        template_sujet: '',
        template_contenu: '',
        date_envoi_prevue: '',
        envoi_immediat: false
      });

      loadCampagnes();

    } catch (error: any) {
      console.error('Erreur création campagne:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la campagne",
        variant: "destructive"
      });
    }
  };

  const lancerCampagne = async (campagne: NotificationCampagne) => {
    try {
      const { error } = await supabase
        .from('notifications_campagnes')
        .update({
          statut: 'programme',
          date_envoi_prevue: new Date().toISOString()
        })
        .eq('id', campagne.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Campagne programmée pour envoi immédiat"
      });

      loadCampagnes();

    } catch (error: any) {
      console.error('Erreur lancement campagne:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer la campagne",
        variant: "destructive"
      });
    }
  };

  const annulerCampagne = async (campagne: NotificationCampagne) => {
    try {
      const { error } = await supabase
        .from('notifications_campagnes')
        .update({ statut: 'annule' })
        .eq('id', campagne.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Campagne annulée"
      });

      loadCampagnes();

    } catch (error: any) {
      console.error('Erreur annulation campagne:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la campagne",
        variant: "destructive"
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'programme':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'envoye':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'annule':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return <Edit className="h-3 w-3" />;
      case 'programme':
        return <Clock className="h-3 w-3" />;
      case 'envoye':
        return <CheckCircle className="h-3 w-3" />;
      case 'annule':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const templates = {
    rappel_cotisation: {
      sujet: "Rappel de cotisation - E2D",
      contenu: "Bonjour {nom},\n\nNous vous rappelons que votre cotisation mensuelle est en attente de règlement.\n\nMontant : {montant} FCFA\nÉchéance : {echeance}\n\nMerci de régulariser votre situation.\n\nCordialement,\nL'équipe E2D"
    },
    reunion: {
      sujet: "Invitation à la réunion - E2D",
      contenu: "Bonjour {nom},\n\nVous êtes invité(e) à participer à notre prochaine réunion.\n\nDate : {date_reunion}\nLieu : {lieu}\nOrdre du jour : {ordre_du_jour}\n\nVotre présence est importante.\n\nCordialement,\nL'équipe E2D"
    },
    echeance_pret: {
      sujet: "Échéance de prêt - E2D",
      contenu: "Bonjour {nom},\n\nNous vous informons que l'échéance de votre prêt approche.\n\nMontant du prêt : {montant_pret} FCFA\nÉchéance : {echeance}\nMontant à rembourser : {montant_remboursement} FCFA\n\nMerci de vous rapprocher du trésorier.\n\nCordialement,\nL'équipe E2D"
    },
    custom: {
      sujet: "Notification - E2D",
      contenu: "Bonjour {nom},\n\n[Votre message personnalisé ici]\n\nCordialement,\nL'équipe E2D"
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  const totalCampagnes = campagnes.length;
  const campagnesEnvoyees = campagnes.filter(c => c.statut === 'envoye').length;
  const campagnesProgrammees = campagnes.filter(c => c.statut === 'programme').length;
  const tauxSucces = totalCampagnes > 0 ? Math.round((campagnesEnvoyees / totalCampagnes) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications Avancées
          </h1>
          <p className="text-muted-foreground">
            Gérer les campagnes de notifications et communications
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une Campagne</DialogTitle>
              <DialogDescription>
                Configurez une nouvelle campagne de notifications
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">Nom de la campagne *</Label>
                  <Input
                    id="nom"
                    value={nouvelleCampagne.nom}
                    onChange={(e) => setNouvelleCampagne({...nouvelleCampagne, nom: e.target.value})}
                    placeholder="Ex: Rappel cotisations mars 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type de campagne *</Label>
                  <Select 
                    value={nouvelleCampagne.type_campagne} 
                    onValueChange={(value: any) => {
                      setNouvelleCampagne({
                        ...nouvelleCampagne, 
                        type_campagne: value,
                        template_sujet: templates[value]?.sujet || '',
                        template_contenu: templates[value]?.contenu || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rappel_cotisation">Rappel Cotisation</SelectItem>
                      <SelectItem value="reunion">Réunion</SelectItem>
                      <SelectItem value="echeance_pret">Échéance Prêt</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={nouvelleCampagne.description}
                  onChange={(e) => setNouvelleCampagne({...nouvelleCampagne, description: e.target.value})}
                  placeholder="Description courte de la campagne"
                />
              </div>

              <div>
                <Label htmlFor="sujet">Sujet du message *</Label>
                <Input
                  id="sujet"
                  value={nouvelleCampagne.template_sujet}
                  onChange={(e) => setNouvelleCampagne({...nouvelleCampagne, template_sujet: e.target.value})}
                  placeholder="Sujet de l'email/SMS"
                />
              </div>

              <div>
                <Label htmlFor="contenu">Contenu du message *</Label>
                <Textarea
                  id="contenu"
                  value={nouvelleCampagne.template_contenu}
                  onChange={(e) => setNouvelleCampagne({...nouvelleCampagne, template_contenu: e.target.value})}
                  placeholder="Contenu du message (utilisez {nom}, {montant}, etc. pour la personnalisation)"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Variables disponibles: {"{nom}, {email}, {telephone}, {montant}, {echeance}, {date_reunion}"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="envoi-immediat"
                  checked={nouvelleCampagne.envoi_immediat}
                  onCheckedChange={(checked) => setNouvelleCampagne({...nouvelleCampagne, envoi_immediat: checked})}
                />
                <Label htmlFor="envoi-immediat">Envoi immédiat</Label>
              </div>

              {!nouvelleCampagne.envoi_immediat && (
                <div>
                  <Label htmlFor="date-programmee">Date d'envoi programmée</Label>
                  <Input
                    id="date-programmee"
                    type="datetime-local"
                    value={nouvelleCampagne.date_envoi_prevue}
                    onChange={(e) => setNouvelleCampagne({...nouvelleCampagne, date_envoi_prevue: e.target.value})}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setNouvelleCampagne({
                nom: '',
                description: '',
                type_campagne: '' as any,
                destinataires: [],
                template_sujet: '',
                template_contenu: '',
                date_envoi_prevue: '',
                envoi_immediat: false
              })}>
                Annuler
              </Button>
              <Button onClick={creerCampagne}>
                Créer la Campagne
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campagnes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampagnes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Envoyées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campagnesEnvoyees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programmées</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{campagnesProgrammees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tauxSucces}%</div>
            <Progress value={tauxSucces} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campagnes">Campagnes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campagnes" className="space-y-4">
          {/* Liste des campagnes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Campagnes de Notifications
              </CardTitle>
              <CardDescription>
                Gérer et suivre vos campagnes de communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campagnes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune campagne créée</p>
                  <p className="text-sm">Créez votre première campagne pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campagnes.map((campagne) => (
                    <div key={campagne.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{campagne.nom}</h3>
                            <Badge className={getStatutColor(campagne.statut)}>
                              {getStatutIcon(campagne.statut)}
                              <span className="ml-1">{campagne.statut}</span>
                            </Badge>
                            <Badge variant="outline">
                              {campagne.type_campagne.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {campagne.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {campagne.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {campagne.nb_destinataires} destinataires
                            </span>
                            {campagne.nb_envoyes > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                {campagne.nb_envoyes} envoyés
                              </span>
                            )}
                            {campagne.nb_erreurs > 0 && (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-red-600" />
                                {campagne.nb_erreurs} erreurs
                              </span>
                            )}
                            <span>
                              Par {campagne.created_by_nom}
                            </span>
                            <span>
                              {format(new Date(campagne.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          
                          {campagne.date_envoi_prevue && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Prévu pour: {format(new Date(campagne.date_envoi_prevue), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedCampagne(campagne);
                                  loadEnvoisDetails();
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>{campagne.nom}</DialogTitle>
                                <DialogDescription>
                                  Détails et statistiques de la campagne
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold">{campagne.nb_destinataires}</div>
                                    <div className="text-sm text-muted-foreground">Destinataires</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{campagne.nb_envoyes}</div>
                                    <div className="text-sm text-muted-foreground">Envoyés</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{campagne.nb_erreurs}</div>
                                    <div className="text-sm text-muted-foreground">Erreurs</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold">
                                      {campagne.nb_destinataires > 0 ? 
                                        Math.round((campagne.nb_envoyes / campagne.nb_destinataires) * 100) : 0}%
                                    </div>
                                    <div className="text-sm text-muted-foreground">Succès</div>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Template du message</h4>
                                  <div className="bg-muted p-3 rounded">
                                    <p className="font-medium">{campagne.template_sujet}</p>
                                    <div className="mt-2 whitespace-pre-wrap text-sm">
                                      {campagne.template_contenu}
                                    </div>
                                  </div>
                                </div>
                                
                                {envoisDetails.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Détails des envois</h4>
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                      {envoisDetails.map((envoi) => (
                                        <div key={envoi.id} className="flex items-center justify-between p-2 border rounded">
                                          <div>
                                            <span className="font-medium">{envoi.membre_nom}</span>
                                            <Badge variant="outline" className="ml-2">
                                              {envoi.canal}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={
                                              envoi.statut === 'envoye' ? 'default' :
                                              envoi.statut === 'erreur' ? 'destructive' :
                                              'secondary'
                                            }>
                                              {envoi.statut}
                                            </Badge>
                                            {envoi.date_envoi && (
                                              <span className="text-sm text-muted-foreground">
                                                {format(new Date(envoi.date_envoi), 'dd/MM HH:mm')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {campagne.statut === 'brouillon' && (
                            <Button 
                              size="sm" 
                              onClick={() => lancerCampagne(campagne)}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Lancer
                            </Button>
                          )}
                          
                          {campagne.statut === 'programme' && (
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => annulerCampagne(campagne)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics des Campagnes
              </CardTitle>
              <CardDescription>
                Statistiques détaillées et performance des notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics détaillées à venir</p>
                <p className="text-sm">Graphiques de performance, taux d'ouverture, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};