import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  CreditCard, 
  PiggyBank, 
  Banknote, 
  Phone, 
  Mail,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

interface MembreDetail {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  photo_url?: string;
}

interface Cotisation {
  id: string;
  montant: number;
  statut: string;
  date_paiement: string;
  type_cotisation: {
    nom: string;
    obligatoire: boolean;
  };
}

interface Epargne {
  id: string;
  montant: number;
  statut: string;
  date_depot: string;
}

interface Pret {
  id: string;
  montant: number;
  statut: string;
  date_pret: string;
  echeance: string;
  taux_interet: number;
}

export default function MembreFiche() {
  const { id } = useParams<{ id: string }>();
  const [membre, setMembre] = useState<MembreDetail | null>(null);
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [epargnes, setEpargnes] = useState<Epargne[]>([]);
  const [prets, setPrets] = useState<Pret[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadMembreData();
    }
  }, [id]);

  const loadMembreData = async () => {
    try {
      // Charger les informations du membre
      const { data: membreData, error: membreError } = await supabase
        .from('membres')
        .select('*')
        .eq('id', id)
        .single();

      if (membreError) throw membreError;
      setMembre(membreData);

      // Charger les cotisations
      const { data: cotisationsData, error: cotisationsError } = await supabase
        .from('cotisations')
        .select(`
          *,
          type_cotisation:cotisations_types(nom, obligatoire)
        `)
        .eq('membre_id', id)
        .order('date_paiement', { ascending: false });

      if (cotisationsError) throw cotisationsError;
      setCotisations(cotisationsData || []);

      // Charger les épargnes
      const { data: epargnesToutes, error: epargnesToutesError } = await supabase
        .from('epargnes')
        .select('*')
        .eq('membre_id', id)
        .order('date_depot', { ascending: false });

      if (epargnesToutesError) throw epargnesToutesError;
      setEpargnes(epargnesToutes || []);

      // Charger les prêts
      const { data: pretsData, error: pretsError } = await supabase
        .from('prets')
        .select('*')
        .eq('membre_id', id)
        .order('date_pret', { ascending: false });

      if (pretsError) throw pretsError;
      setPrets(pretsData || []);

    } catch (error: any) {
      console.error('Erreur chargement fiche membre:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du membre",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string, echeance?: string) => {
    switch (statut) {
      case 'paye':
      case 'actif':
      case 'rembourse':
        return 'success';
      case 'en_retard':
        return 'destructive';
      case 'en_cours':
        if (echeance && new Date(echeance) < new Date()) {
          return 'destructive';
        }
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'paye':
      case 'actif':
      case 'rembourse':
        return CheckCircle;
      case 'en_retard':
        return AlertTriangle;
      case 'en_cours':
        return Clock;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!membre) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Membre non trouvé</p>
      </div>
    );
  }

  const totalEpargnes = epargnes.filter(e => e.statut === 'actif').reduce((sum, e) => sum + Number(e.montant), 0);
  const totalPrets = prets.filter(p => p.statut === 'en_cours').reduce((sum, p) => sum + Number(p.montant), 0);
  const cotisationsEnRetard = cotisations.filter(c => c.statut === 'en_retard').length;

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Fiche Membre"
        subtitle="Détails complets et historique"
      />

      {/* Profil du membre */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={membre.photo_url} alt={`${membre.prenom} ${membre.nom}`} />
              <AvatarFallback className="text-lg">
                {membre.prenom.charAt(0)}{membre.nom.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{membre.prenom} {membre.nom}</h2>
              <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{membre.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{membre.telephone}</span>
                </div>
              </div>
              <Badge className={`mt-2 ${membre.statut === 'actif' ? 'bg-success' : 'bg-muted'}`}>
                {membre.statut}
              </Badge>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{totalEpargnes.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">FCFA épargné</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{totalPrets.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">FCFA emprunté</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">{cotisationsEnRetard}</div>
                  <div className="text-xs text-muted-foreground">En retard</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets détaillés */}
      <Tabs defaultValue="cotisations" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="epargnes">Épargnes</TabsTrigger>
          <TabsTrigger value="prets">Prêts</TabsTrigger>
          <TabsTrigger value="resume">Résumé</TabsTrigger>
        </TabsList>

        <TabsContent value="cotisations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historique des Cotisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cotisations.map((cotisation) => {
                  const StatutIcon = getStatutIcon(cotisation.statut);
                  return (
                    <div key={cotisation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{cotisation.type_cotisation.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(cotisation.date_paiement).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{cotisation.montant.toLocaleString()} FCFA</div>
                        <Badge className={`mt-1 bg-${getStatutColor(cotisation.statut)}`}>
                          <StatutIcon className="w-3 h-3 mr-1" />
                          {cotisation.statut}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {cotisations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune cotisation enregistrée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="epargnes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Historique des Épargnes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {epargnes.map((epargne) => {
                  const StatutIcon = getStatutIcon(epargne.statut);
                  return (
                    <div key={epargne.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Dépôt d'épargne</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(epargne.date_depot).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{epargne.montant.toLocaleString()} FCFA</div>
                        <Badge className={`mt-1 bg-${getStatutColor(epargne.statut)}`}>
                          <StatutIcon className="w-3 h-3 mr-1" />
                          {epargne.statut}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {epargnes.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucune épargne enregistrée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Historique des Prêts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prets.map((pret) => {
                  const StatutIcon = getStatutIcon(pret.statut);
                  return (
                    <div key={pret.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Prêt - {pret.taux_interet}%</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pret.date_pret).toLocaleDateString('fr-FR')} → {new Date(pret.echeance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{pret.montant.toLocaleString()} FCFA</div>
                        <Badge className={`mt-1 bg-${getStatutColor(pret.statut, pret.echeance)}`}>
                          <StatutIcon className="w-3 h-3 mr-1" />
                          {pret.statut}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {prets.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucun prêt enregistré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resume" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Situation Financière</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total épargnes actives:</span>
                    <span className="font-bold text-success">{totalEpargnes.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total prêts en cours:</span>
                    <span className="font-bold text-warning">{totalPrets.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cotisations en retard:</span>
                    <span className="font-bold text-destructive">{cotisationsEnRetard} cotisation(s)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statut Général</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Cotisations:</span>
                    <Badge className={cotisationsEnRetard === 0 ? 'bg-success' : 'bg-destructive'}>
                      {cotisationsEnRetard === 0 ? 'À jour' : 'En retard'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Épargnes:</span>
                    <Badge className={totalEpargnes > 0 ? 'bg-success' : 'bg-secondary'}>
                      {totalEpargnes > 0 ? 'Épargnant actif' : 'Aucune épargne'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prêts:</span>
                    <Badge className={totalPrets > 0 ? 'bg-warning' : 'bg-success'}>
                      {totalPrets > 0 ? 'Emprunteur' : 'Aucun prêt'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}