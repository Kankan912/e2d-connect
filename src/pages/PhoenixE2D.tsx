import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus,
  Trophy,
  Shield,
  BarChart3,
  Calendar,
  Settings,
  Target
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LogoHeader from "@/components/LogoHeader";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import MatchExterneForm from "@/components/forms/MatchExterneForm";
import EntrainementInterneForm from "@/components/forms/EntrainementInterneForm";
import MatchDetailsModal from "@/components/MatchDetailsModal";
import PhoenixEquipesManager from "@/components/PhoenixEquipesManager";
import PhoenixCompositionsManager from "@/components/PhoenixCompositionsManager";
import PhoenixClassements from "@/components/PhoenixClassements";
import PhoenixCotisationsAnnuelles from "@/components/PhoenixCotisationsAnnuelles";
import TableauBordJauneRouge from "@/components/TableauBordJauneRouge";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

export default function PhoenixE2D() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMatchExterneForm, setShowMatchExterneForm] = useState(false);
  const [showEntrainementForm, setShowEntrainementForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  // Temps réel
  useRealtimeUpdates({
    table: 'sport_e2d_matchs',
    onUpdate: () => queryClient.invalidateQueries({ queryKey: ['sport-e2d-matchs'] }),
  });

  useRealtimeUpdates({
    table: 'phoenix_entrainements_internes',
    onUpdate: () => queryClient.invalidateQueries({ queryKey: ['phoenix-entrainements-internes'] }),
  });

  // Charger les configurations
  const { data: configE2D } = useQuery({
    queryKey: ['sport-e2d-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_config')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: configPhoenix } = useQuery({
    queryKey: ['sport-phoenix-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_config')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Charger les membres
  const { data: membresE2D } = useQuery({
    queryKey: ['membres-e2d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  const { data: adherentsPhoenix } = useQuery({
    queryKey: ['phoenix-adherents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select('*, membres(id, nom, prenom)')
        .order('date_adhesion', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Charger les matchs externes récents
  const { data: matchsExternes } = useQuery({
    queryKey: ['sport-e2d-matchs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_matchs')
        .select('*')
        .order('date_match', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  // Charger les entraînements internes récents
  const { data: entrainementsInternes } = useQuery({
    queryKey: ['phoenix-entrainements-internes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_entrainements_internes')
        .select('*')
        .order('date_entrainement', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  const totalMembres = (membresE2D?.length || 0) + (adherentsPhoenix?.length || 0);

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Phoenix E2D"
        subtitle="Gestion unifiée des activités sportives"
      />

      {/* Configuration unifiée */}
      {(configE2D || configPhoenix) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configE2D && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-blue-600">Équipe E2D</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nom:</span> {configE2D.nom_equipe}</p>
                    {configE2D.entraineur && <p><span className="font-medium">Entraîneur:</span> {configE2D.entraineur}</p>}
                    {configE2D.lieu_entrainement && <p><span className="font-medium">Lieu:</span> {configE2D.lieu_entrainement}</p>}
                    {configE2D.horaire_entrainement && <p><span className="font-medium">Horaire:</span> {configE2D.horaire_entrainement}</p>}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate("/sport-config")}>
                    Modifier config E2D
                  </Button>
                </div>
              )}
              {configPhoenix && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-orange-600">Club Phoenix</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nom:</span> {configPhoenix.nom_club}</p>
                    <p><span className="font-medium">Adhésion:</span> {configPhoenix.montant_adhesion} FCFA</p>
                    <p><span className="font-medium">Durée:</span> {configPhoenix.duree_adhesion_mois} mois</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/phoenix-adherents")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adhérents</p>
                <p className="text-2xl font-bold">{totalMembres}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          onClick={() => setShowMatchExterneForm(true)}
        >
          <Plus className="h-8 w-8 mb-2" />
          <span className="text-sm">Match externe</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => setShowEntrainementForm(true)}
        >
          <Target className="h-8 w-8 mb-2" />
          <span className="text-sm">Entraînement interne</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/gestion-presences")}
        >
          <Calendar className="h-8 w-8 mb-2" />
          <span className="text-sm">Gérer présences</span>
        </Button>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="matchs-externes">Matchs externes</TabsTrigger>
          <TabsTrigger value="entrainements">Entraînements</TabsTrigger>
          <TabsTrigger value="equipes">Équipes</TabsTrigger>
          <TabsTrigger value="compositions">Compositions</TabsTrigger>
          <TabsTrigger value="classements">Classements</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matchs externes récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-500" />
                  Derniers matchs externes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchsExternes && matchsExternes.length > 0 ? (
                  <div className="space-y-3">
                    {matchsExternes.slice(0, 3).map((match) => (
                      <div 
                        key={match.id} 
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedMatch(match);
                          setShowMatchDetails(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {match.logo_equipe_adverse && (
                            <img src={match.logo_equipe_adverse} alt="" className="w-8 h-8 object-contain" />
                          )}
                          <div>
                            <p className="font-medium">{configE2D?.nom_equipe || 'E2D'} vs {match.nom_complet_equipe_adverse || match.equipe_adverse}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(match.date_match).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {match.score_e2d !== null && match.score_adverse !== null ? (
                            <p className="text-lg font-bold">
                              {match.score_e2d} - {match.score_adverse}
                            </p>
                          ) : (
                            <Badge variant="outline">{match.statut}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun match externe</p>
                )}
              </CardContent>
            </Card>

            {/* Entraînements internes récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  Derniers entraînements internes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entrainementsInternes && entrainementsInternes.length > 0 ? (
                  <div className="space-y-3">
                    {entrainementsInternes.slice(0, 3).map((entrainement) => (
                      <div 
                        key={entrainement.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">Jaune vs Rouge</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(entrainement.date_entrainement).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {entrainement.statut === 'termine' ? (
                            <p className="text-lg font-bold">
                              <span className="text-yellow-600">{entrainement.score_jaune}</span>
                              {' - '}
                              <span className="text-red-600">{entrainement.score_rouge}</span>
                            </p>
                          ) : (
                            <Badge variant="outline">{entrainement.statut}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun entraînement interne</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Matchs externes */}
        <TabsContent value="matchs-externes">
          <Card>
            <CardHeader>
              <CardTitle>Tous les matchs externes</CardTitle>
            </CardHeader>
            <CardContent>
              {matchsExternes && matchsExternes.length > 0 ? (
                <div className="space-y-3">
                  {matchsExternes.map((match) => (
                    <div 
                      key={match.id} 
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowMatchDetails(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {match.logo_equipe_adverse && (
                          <img src={match.logo_equipe_adverse} alt="" className="w-12 h-12 object-contain" />
                        )}
                        <div>
                          <p className="font-medium text-lg">{configE2D?.nom_equipe || 'E2D'} vs {match.nom_complet_equipe_adverse || match.equipe_adverse}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(match.date_match).toLocaleDateString()}</span>
                            {match.lieu && <span>• {match.lieu}</span>}
                            <Badge variant="secondary">{match.type_match}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {match.score_e2d !== null && match.score_adverse !== null ? (
                          <p className="text-2xl font-bold">
                            {match.score_e2d} - {match.score_adverse}
                          </p>
                        ) : (
                          <Badge variant="outline">{match.statut}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">Aucun match externe programmé</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entraînements internes */}
        <TabsContent value="entrainements">
          <Card>
            <CardHeader>
              <CardTitle>Tous les entraînements internes (Jaune vs Rouge)</CardTitle>
            </CardHeader>
            <CardContent>
              {entrainementsInternes && entrainementsInternes.length > 0 ? (
                <div className="space-y-3">
                  {entrainementsInternes.map((entrainement) => (
                    <div 
                      key={entrainement.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-lg">Équipe Jaune vs Équipe Rouge</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(entrainement.date_entrainement).toLocaleDateString()}</span>
                          {entrainement.lieu && <span>• {entrainement.lieu}</span>}
                          {entrainement.heure_debut && <span>• {entrainement.heure_debut}</span>}
                        </div>
                        {entrainement.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{entrainement.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {entrainement.statut === 'termine' ? (
                          <div>
                            <p className="text-2xl font-bold">
                              <span className="text-yellow-600">{entrainement.score_jaune}</span>
                              {' - '}
                              <span className="text-red-600">{entrainement.score_rouge}</span>
                            </p>
                            {entrainement.equipe_gagnante && (
                              <p className={`text-sm mt-1 ${
                                entrainement.equipe_gagnante === 'jaune' ? 'text-yellow-600' : 
                                entrainement.equipe_gagnante === 'rouge' ? 'text-red-600' : 
                                'text-muted-foreground'
                              }`}>
                                {entrainement.equipe_gagnante === 'nul' ? 'Match nul' : `Victoire ${entrainement.equipe_gagnante}`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">{entrainement.statut}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">Aucun entraînement interne programmé</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Équipes */}
        <TabsContent value="equipes">
          <PhoenixEquipesManager />
        </TabsContent>

        {/* Compositions */}
        <TabsContent value="compositions">
          <PhoenixCompositionsManager />
        </TabsContent>

        {/* Classements */}
        <TabsContent value="classements">
          <PhoenixClassements />
        </TabsContent>

        {/* Statistiques Jaune vs Rouge */}
        <TabsContent value="statistiques">
          <TableauBordJauneRouge />
        </TabsContent>

        {/* Cotisations Phoenix */}
        <TabsContent value="cotisations">
          <PhoenixCotisationsAnnuelles />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <MatchExterneForm
        open={showMatchExterneForm}
        onOpenChange={setShowMatchExterneForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sport-e2d-matchs'] });
          setShowMatchExterneForm(false);
        }}
      />

      <EntrainementInterneForm
        open={showEntrainementForm}
        onOpenChange={setShowEntrainementForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['phoenix-entrainements-internes'] });
          setShowEntrainementForm(false);
        }}
      />

      <MatchDetailsModal
        open={showMatchDetails}
        onOpenChange={setShowMatchDetails}
        match={selectedMatch}
        matchType="e2d"
      />
    </div>
  );
}
