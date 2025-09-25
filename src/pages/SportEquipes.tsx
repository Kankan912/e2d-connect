import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Users, Settings, Trophy, MapPin, Clock, DollarSign, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LogoHeader from "@/components/LogoHeader";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import E2DMatchForm from "@/components/forms/E2DMatchForm";
import BackButton from "@/components/BackButton";

export default function SportEquipes() {
  const navigate = useNavigate();
  const [showMatchForm, setShowMatchForm] = useState(false);
  const queryClient = useQueryClient();
  
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

  const { data: membresE2D } = useQuery({
    queryKey: ['membres-e2d'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, equipe_e2d')
        .eq('est_membre_e2d', true)
        .eq('statut', 'actif');
      if (error) throw error;
      return data;
    }
  });

  const { data: matchsE2D } = useQuery({
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

  const equipesStats = {
    jaune: membresE2D?.filter(m => m.equipe_e2d === 'Jaune').length || 0,
    rouge: membresE2D?.filter(m => m.equipe_e2d === 'Rouge').length || 0
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <LogoHeader 
        title="Sport E2D - Équipes"
        subtitle="Gestion des équipes Jaune et Rouge"
      />

      {/* Configuration Display */}
      {configE2D && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration E2D
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{configE2D.nom_equipe}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span>{configE2D.lieu_entrainement || "Non défini"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{configE2D.horaire_entrainement || "Non défini"}</span>
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/sport-config")}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Modifier la config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques des équipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Équipe Jaune */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Trophy className="h-5 w-5" />
              Équipe Jaune
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Membres actifs</span>
                <Badge className="bg-yellow-200 text-yellow-800">{equipesStats.jaune}</Badge>
              </div>
              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600"
                onClick={() => navigate("/gestion-presences?equipe=Jaune")}
              >
                <Users className="h-4 w-4 mr-2" />
                Gérer les présences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Équipe Rouge */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trophy className="h-5 w-5" />
              Équipe Rouge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Membres actifs</span>
                <Badge className="bg-red-200 text-red-800">{equipesStats.rouge}</Badge>
              </div>
              <Button 
                className="w-full bg-red-500 hover:bg-red-600"
                onClick={() => navigate("/gestion-presences?equipe=Rouge")}
              >
                <Users className="h-4 w-4 mr-2" />
                Gérer les présences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          onClick={() => setShowMatchForm(true)}
        >
          <Plus className="h-8 w-8 mb-2" />
          <span className="text-sm">Planifier un match</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/match-results")}
        >
          <TrendingUp className="h-8 w-8 mb-2" />
          <span className="text-sm">Voir les résultats</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/sport-e2d-finances")}
        >
          <DollarSign className="h-8 w-8 mb-2" />
          <span className="text-sm">Finances Sport</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/gestion-equipes")}
        >
          <Users className="h-8 w-8 mb-2" />
          <span className="text-sm">Gérer les équipes</span>
        </Button>
      </div>

      {/* Derniers matchs E2D */}
      {matchsE2D && matchsE2D.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Derniers Matchs E2D
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchsE2D.slice(0, 3).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">E2D vs {match.equipe_adverse}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(match.date_match).toLocaleDateString()}
                    </p>
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
          </CardContent>
        </Card>
      )}

      <E2DMatchForm
        open={showMatchForm}
        onOpenChange={setShowMatchForm}
        onSuccess={() => {
          // Rafraîchir les données des matchs
          queryClient.invalidateQueries({ queryKey: ['sport-equipes-matchs'] });
          setShowMatchForm(false);
        }}
      />
    </div>
  );
}