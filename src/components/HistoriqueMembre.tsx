import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface ActiviteMembre {
  id: string;
  type_activite: string;
  description: string;
  montant?: number;
  reference_id?: string;
  reference_table?: string;
  metadata?: any;
  created_at: string;
}

interface StatistiqueFinanciere {
  periode: string;
  cotisations: number;
  epargnes: number;
  prets: number;
  sanctions: number;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  photo_url?: string;
  statut: string;
  date_inscription: string;
}

interface HistoriqueMembreProps {
  membreId: string;
}

export const HistoriqueMembre: React.FC<HistoriqueMembreProps> = ({ membreId }) => {
  const [membre, setMembre] = useState<Membre | null>(null);
  const [activites, setActivites] = useState<ActiviteMembre[]>([]);
  const [statistiques, setStatistiques] = useState<StatistiqueFinanciere[]>([]);
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [periodeStats, setPeriodeStats] = useState<number>(6); // mois
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  const loadMembre = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('id', membreId)
        .single();

      if (error) throw error;
      setMembre(data);
    } catch (error) {
      logger.error('Erreur chargement membre', error);
    }
  };

  const loadActivites = async () => {
    try {
      // Charger les activités depuis activites_membres
      let activitesQuery = supabase
        .from('activites_membres')
        .select('*')
        .eq('membre_id', membreId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filtreType !== 'tous' && filtreType !== 'fond_caisse') {
        activitesQuery = activitesQuery.eq('type_activite', filtreType);
      }

      const { data: activitesData, error: activitesError } = await activitesQuery;
      if (activitesError) throw activitesError;

      let allActivites = [...(activitesData || [])];

      // Charger les opérations de fond de caisse si nécessaire
      if (filtreType === 'tous' || filtreType === 'fond_caisse') {
        const { data: fondCaisseData, error: fondCaisseError } = await supabase
          .from('fond_caisse_operations')
          .select('*')
          .eq('beneficiaire_id', membreId)
          .order('date_operation', { ascending: false })
          .limit(50);

        if (!fondCaisseError && fondCaisseData) {
          // Transformer les opérations fond de caisse en format activité
          const fondCaisseActivites = fondCaisseData.map(op => ({
            id: op.id,
            membre_id: membreId,
            type_activite: 'fond_caisse',
            description: `${op.type_operation}: ${op.libelle}`,
            montant: op.montant,
            reference_id: op.id,
            reference_table: 'fond_caisse_operations',
            metadata: { type_operation: op.type_operation },
            created_at: op.date_operation
          }));
          
          allActivites = [...allActivites, ...fondCaisseActivites];
        }
      }

      // Trier toutes les activités par date
      allActivites.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivites(allActivites.slice(0, 100));
    } catch (error) {
      logger.error('Erreur chargement activités', error);
    }
  };

  const loadStatistiques = async () => {
    try {
      const dateDebut = startOfMonth(subMonths(new Date(), periodeStats - 1));
      const dateFin = endOfMonth(new Date());

      // Charger les données financières par mois
      const [cotisationsData, epargnesData, pretsData, sanctionsData] = await Promise.all([
        // Cotisations
        supabase
          .from('cotisations')
          .select('montant, date_paiement')
          .eq('membre_id', membreId)
          .gte('date_paiement', dateDebut.toISOString())
          .lte('date_paiement', dateFin.toISOString()),
        
        // Épargnes
        supabase
          .from('epargnes')
          .select('montant, date_depot')
          .eq('membre_id', membreId)
          .gte('date_depot', dateDebut.toISOString())
          .lte('date_depot', dateFin.toISOString()),
        
        // Prêts
        supabase
          .from('prets')
          .select('montant, date_pret')
          .eq('membre_id', membreId)
          .gte('date_pret', dateDebut.toISOString())
          .lte('date_pret', dateFin.toISOString()),
        
        // Sanctions
        supabase
          .from('sanctions')
          .select('montant, date_sanction')
          .eq('membre_id', membreId)
          .gte('date_sanction', dateDebut.toISOString())
          .lte('date_sanction', dateFin.toISOString())
      ]);

      // Créer statistiques par mois
      const stats: StatistiqueFinanciere[] = [];
      
      for (let i = 0; i < periodeStats; i++) {
        const date = subMonths(new Date(), periodeStats - 1 - i);
        const debutMois = startOfMonth(date);
        const finMois = endOfMonth(date);
        
        const cotisations = (cotisationsData.data || [])
          .filter(c => {
            const datePaiement = new Date(c.date_paiement);
            return datePaiement >= debutMois && datePaiement <= finMois;
          })
          .reduce((sum, c) => sum + Number(c.montant), 0);

        const epargnes = (epargnesData.data || [])
          .filter(e => {
            const dateDepot = new Date(e.date_depot);
            return dateDepot >= debutMois && dateDepot <= finMois;
          })
          .reduce((sum, e) => sum + Number(e.montant), 0);

        const prets = (pretsData.data || [])
          .filter(p => {
            const datePret = new Date(p.date_pret);
            return datePret >= debutMois && datePret <= finMois;
          })
          .reduce((sum, p) => sum + Number(p.montant), 0);

        const sanctions = (sanctionsData.data || [])
          .filter(s => {
            const dateSanction = new Date(s.date_sanction);
            return dateSanction >= debutMois && dateSanction <= finMois;
          })
          .reduce((sum, s) => sum + Number(s.montant), 0);

        stats.push({
          periode: format(date, 'MMM yyyy', { locale: fr }),
          cotisations,
          epargnes,
          prets,
          sanctions
        });
      }

      setStatistiques(stats);
    } catch (error) {
      logger.error('Erreur chargement statistiques', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMembre(),
        loadActivites(),
        loadStatistiques()
      ]);
    } catch (error) {
      logger.error('Erreur chargement données', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique du membre",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates({
    table: 'activites_membres',
    onUpdate: loadActivites,
    enabled: true
  });

  useEffect(() => {
    if (membreId) {
      loadData();
    }
  }, [membreId, filtreType, periodeStats]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cotisation':
        return <CreditCard className="h-4 w-4" />;
      case 'epargne':
        return <Banknote className="h-4 w-4" />;
      case 'pret':
        return <DollarSign className="h-4 w-4" />;
      case 'sanction':
        return <AlertTriangle className="h-4 w-4" />;
      case 'fond_caisse':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cotisation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epargne':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pret':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sanction':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fond_caisse':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exporterHistorique = async () => {
    try {
      // Ici on pourrait implémenter l'export PDF
      toast({
        title: "Export en cours",
        description: "Fonctionnalité d'export à implémenter"
      });
    } catch (error) {
      logger.error('Erreur export', error);
    }
  };

  if (loading || !membre) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  const totalCotisations = statistiques.reduce((sum, s) => sum + s.cotisations, 0);
  const totalEpargnes = statistiques.reduce((sum, s) => sum + s.epargnes, 0);
  const totalPrets = statistiques.reduce((sum, s) => sum + s.prets, 0);
  const totalSanctions = statistiques.reduce((sum, s) => sum + s.sanctions, 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec infos membre */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={membre.photo_url} alt={`${membre.nom} ${membre.prenom}`} />
                <AvatarFallback className="text-lg">
                  {membre.nom.charAt(0)}{membre.prenom.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {membre.nom} {membre.prenom}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 mt-1">
                  <span>{membre.email}</span>
                  <span>{membre.telephone}</span>
                  <Badge variant={membre.statut === 'actif' ? 'default' : 'secondary'}>
                    {membre.statut}
                  </Badge>
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-1">
                  Membre depuis le {format(new Date(membre.date_inscription), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exporterHistorique}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotisations</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCotisations.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {periodeStats} derniers mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargnes</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalEpargnes.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {periodeStats} derniers mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prêts</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalPrets.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {periodeStats} derniers mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sanctions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalSanctions.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {periodeStats} derniers mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques d'évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution Financière
              </CardTitle>
              <Select value={periodeStats.toString()} onValueChange={(value) => setPeriodeStats(Number(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 mois</SelectItem>
                  <SelectItem value="6">6 mois</SelectItem>
                  <SelectItem value="12">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistiques}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periode" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} FCFA`, '']} />
                <Line 
                  type="monotone" 
                  dataKey="cotisations" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Cotisations"
                />
                <Line 
                  type="monotone" 
                  dataKey="epargnes" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Épargnes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistiques}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periode" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} FCFA`, '']} />
                <Bar dataKey="cotisations" fill="#3b82f6" name="Cotisations" />
                <Bar dataKey="epargnes" fill="#10b981" name="Épargnes" />
                <Bar dataKey="prets" fill="#f59e0b" name="Prêts" />
                <Bar dataKey="sanctions" fill="#ef4444" name="Sanctions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline des activités */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Chronologie des Activités
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filtreType} onValueChange={setFiltreType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Toutes</SelectItem>
                  <SelectItem value="cotisation">Cotisations</SelectItem>
                  <SelectItem value="epargne">Épargnes</SelectItem>
                  <SelectItem value="pret">Prêts</SelectItem>
                  <SelectItem value="sanction">Sanctions</SelectItem>
                  <SelectItem value="fond_caisse">Fond de Caisse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>
            {activites.length} activité(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune activité trouvée pour ce membre</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activites.map((activite, index) => (
                <div key={activite.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full border ${getTypeColor(activite.type_activite)}`}>
                      {getTypeIcon(activite.type_activite)}
                    </div>
                    {index < activites.length - 1 && (
                      <div className="w-px h-8 bg-border mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{activite.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(activite.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                      {activite.montant && (
                        <div className="text-right">
                          <p className="font-semibold">
                            {Number(activite.montant).toLocaleString()} FCFA
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {activite.type_activite}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};