import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Star, Users, Search, CheckCircle, XCircle, AlertTriangle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

interface MembreEligibilite {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  cotisationsPayees: number;
  totalCotisations: number;
  presenceEntrainements: number;
  totalEntrainements: number;
  presenceMatchs: number;
  totalMatchs: number;
  sanctionsImpayees: number;
  scoreEligibilite: number;
  eligible: boolean;
  commentaires: string[];
}

interface CriteresEligibilite {
  cotisationMinimum: number; // Pourcentage minimum de cotisations payées
  presenceMinimum: number;   // Pourcentage minimum de présence
  sanctionsMaximum: number;  // Nombre maximum de sanctions impayées
  scoreMinimum: number;      // Score minimum pour être éligible
}

export default function EligibiliteGala() {
  const [membres, setMembres] = useState<MembreEligibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [criteres, setCriteres] = useState<CriteresEligibilite>({
    cotisationMinimum: 80,
    presenceMinimum: 70,
    sanctionsMaximum: 0,
    scoreMinimum: 75
  });
  const { toast } = useToast();

  useEffect(() => {
    loadEligibiliteData();
  }, []);

  const loadEligibiliteData = async () => {
    try {
      // Charger tous les membres actifs
      const { data: membresData, error: membresError } = await supabase
        .from('membres')
        .select('*')
        .eq('statut', 'actif');

      if (membresError) throw membresError;

      const eligibiliteData: MembreEligibilite[] = [];

      for (const membre of membresData || []) {
        // Calculer les cotisations
        const { data: cotisationsData } = await supabase
          .from('cotisations')
          .select('*')
          .eq('membre_id', membre.id);

        const totalCotisations = cotisationsData?.length || 0;
        const cotisationsPayees = cotisationsData?.filter(c => c.statut === 'paye').length || 0;

        // Calculer les présences aux entraînements
        const { data: presencesEntrainements } = await supabase
          .from('sport_e2d_presences')
          .select('*')
          .eq('membre_id', membre.id)
          .in('type_seance', ['entrainement_e2d', 'entrainement_phoenix']);

        const totalEntrainements = presencesEntrainements?.length || 0;
        const presenceEntrainements = presencesEntrainements?.filter(p => p.present).length || 0;

        // Calculer les présences aux matchs
        const { data: presencesMatchs } = await supabase
          .from('sport_e2d_presences')
          .select('*')
          .eq('membre_id', membre.id)
          .in('type_seance', ['match_e2d', 'match_phoenix']);

        const totalMatchs = presencesMatchs?.length || 0;
        const presenceMatchs = presencesMatchs?.filter(p => p.present).length || 0;

        // Calculer les sanctions impayées
        const { data: sanctionsData } = await supabase
          .from('sanctions')
          .select('*')
          .eq('membre_id', membre.id)
          .eq('statut', 'impaye');

        const sanctionsImpayees = sanctionsData?.length || 0;

        // Calculer le score d'éligibilité
        const pourcentageCotisations = totalCotisations > 0 ? (cotisationsPayees / totalCotisations) * 100 : 0;
        const pourcentagePresenceEntrainements = totalEntrainements > 0 ? (presenceEntrainements / totalEntrainements) * 100 : 0;
        const pourcentagePresenceMatchs = totalMatchs > 0 ? (presenceMatchs / totalMatchs) * 100 : 0;
        const pourcentagePresenceGlobal = (pourcentagePresenceEntrainements + pourcentagePresenceMatchs) / 2;

        // Score pondéré : 40% cotisations, 50% présences, 10% sanctions
        let scoreEligibilite = (pourcentageCotisations * 0.4) + (pourcentagePresenceGlobal * 0.5);
        
        // Pénalité pour les sanctions
        scoreEligibilite -= (sanctionsImpayees * 10);
        scoreEligibilite = Math.max(0, scoreEligibilite);

        // Vérifier l'éligibilité
        const commentaires: string[] = [];
        let eligible = true;

        if (pourcentageCotisations < criteres.cotisationMinimum) {
          eligible = false;
          commentaires.push(`Cotisations insuffisantes (${pourcentageCotisations.toFixed(1)}% < ${criteres.cotisationMinimum}%)`);
        }

        if (pourcentagePresenceGlobal < criteres.presenceMinimum) {
          eligible = false;
          commentaires.push(`Présence insuffisante (${pourcentagePresenceGlobal.toFixed(1)}% < ${criteres.presenceMinimum}%)`);
        }

        if (sanctionsImpayees > criteres.sanctionsMaximum) {
          eligible = false;
          commentaires.push(`Sanctions impayées (${sanctionsImpayees} > ${criteres.sanctionsMaximum})`);
        }

        if (scoreEligibilite < criteres.scoreMinimum) {
          eligible = false;
          commentaires.push(`Score insuffisant (${scoreEligibilite.toFixed(1)} < ${criteres.scoreMinimum})`);
        }

        if (eligible) {
          commentaires.push("Éligible au gala de fin d'année");
        }

        eligibiliteData.push({
          id: membre.id,
          nom: membre.nom,
          prenom: membre.prenom,
          email: membre.email,
          cotisationsPayees,
          totalCotisations,
          presenceEntrainements,
          totalEntrainements,
          presenceMatchs,
          totalMatchs,
          sanctionsImpayees,
          scoreEligibilite,
          eligible,
          commentaires
        });
      }

      // Trier par score décroissant
      eligibiliteData.sort((a, b) => b.scoreEligibilite - a.scoreEligibilite);
      setMembres(eligibiliteData);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'éligibilité: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membre.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEligibiliteBadge = (eligible: boolean, score: number) => {
    if (eligible) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Éligible
        </Badge>
      );
    } else if (score >= criteres.scoreMinimum * 0.8) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Limite
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          <XCircle className="w-3 h-3 mr-1" />
          Non éligible
        </Badge>
      );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= criteres.scoreMinimum) return "text-success";
    if (score >= criteres.scoreMinimum * 0.8) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalMembres = membres.length;
  const membresEligibles = membres.filter(m => m.eligible).length;
  const membresLimite = membres.filter(m => !m.eligible && m.scoreEligibilite >= criteres.scoreMinimum * 0.8).length;
  const tauxEligibilite = totalMembres > 0 ? (membresEligibles / totalMembres * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Éligibilité Gala de Fin d'Année"
        subtitle="Système d'évaluation basé sur les cotisations, présences et sanctions"
      />

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Membres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembres}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Éligibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{membresEligibles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-warning">À la Limite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{membresLimite}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">Taux d'Éligibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{tauxEligibilite}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Critères d'éligibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Critères d'Éligibilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Cotisations minimum (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={criteres.cotisationMinimum}
                onChange={(e) => setCriteres(prev => ({ ...prev, cotisationMinimum: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Présence minimum (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={criteres.presenceMinimum}
                onChange={(e) => setCriteres(prev => ({ ...prev, presenceMinimum: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sanctions max</label>
              <Input
                type="number"
                min="0"
                value={criteres.sanctionsMaximum}
                onChange={(e) => setCriteres(prev => ({ ...prev, sanctionsMaximum: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Score minimum</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={criteres.scoreMinimum}
                onChange={(e) => setCriteres(prev => ({ ...prev, scoreMinimum: parseInt(e.target.value) }))}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={loadEligibiliteData}>
            Recalculer l'éligibilité
          </Button>
        </CardContent>
      </Card>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Classement des Membres
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
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
                <TableHead>Rang</TableHead>
                <TableHead>Membre</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Cotisations</TableHead>
                <TableHead>Présences</TableHead>
                <TableHead>Sanctions</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembres.map((membre, index) => {
                const pourcentageCotisations = membre.totalCotisations > 0 ? 
                  (membre.cotisationsPayees / membre.totalCotisations) * 100 : 0;
                const pourcentagePresenceEntrainements = membre.totalEntrainements > 0 ? 
                  (membre.presenceEntrainements / membre.totalEntrainements) * 100 : 0;
                const pourcentagePresenceMatchs = membre.totalMatchs > 0 ? 
                  (membre.presenceMatchs / membre.totalMatchs) * 100 : 0;
                const pourcentagePresenceGlobal = (pourcentagePresenceEntrainements + pourcentagePresenceMatchs) / 2;

                return (
                  <TableRow key={membre.id}>
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        {index < 3 && <Trophy className={`w-4 h-4 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-orange-600'
                        }`} />}
                        #{index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{membre.nom} {membre.prenom}</p>
                        <p className="text-xs text-muted-foreground">{membre.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className={`text-lg font-bold ${getScoreColor(membre.scoreEligibilite)}`}>
                          {membre.scoreEligibilite.toFixed(1)}
                        </div>
                        <Progress 
                          value={membre.scoreEligibilite} 
                          className="w-16 h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {membre.cotisationsPayees}/{membre.totalCotisations}
                        </div>
                        <div className="text-muted-foreground">
                          {pourcentageCotisations.toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {membre.presenceEntrainements + membre.presenceMatchs}/
                          {membre.totalEntrainements + membre.totalMatchs}
                        </div>
                        <div className="text-muted-foreground">
                          {pourcentagePresenceGlobal.toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {membre.sanctionsImpayees > 0 ? (
                        <Badge variant="destructive">
                          {membre.sanctionsImpayees}
                        </Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground">
                          0
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {getEligibiliteBadge(membre.eligible, membre.scoreEligibilite)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}