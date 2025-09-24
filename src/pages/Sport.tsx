import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Users, 
  Calendar,
  TrendingUp,
  Settings,
  Activity,
  Target
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LogoHeader from "@/components/LogoHeader";
import { useNavigate } from "react-router-dom";
import { useBackNavigation } from "@/hooks/useBackNavigation";

// Import existing sport components
import GestionPresences from "./GestionPresences";
import CalendrierSportifUnifie from "@/components/CalendrierSportifUnifie";
import MatchResults from "./MatchResults";
import StatsMatchDetaillee from "@/components/StatsMatchDetaillee";
import ClassementJoueurs from "@/components/ClassementJoueurs";
import SportE2D from "./SportE2D";
import SportPhoenix from "./SportPhoenix";
import SportEquipes from "./SportEquipes";

export default function Sport() {
  const navigate = useNavigate();
  const { goBack, BackIcon } = useBackNavigation();

  const { data: e2dMembers } = useQuery({
    queryKey: ['e2d-members'],
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

  const { data: phoenixAdherents } = useQuery({
    queryKey: ['phoenix-adherents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          id,
          membre:membres(nom, prenom)
        `)
        .order('created_at');
      if (error) throw error;
      return data;
    }
  });

  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches'],
    queryFn: async () => {
      const [e2dMatches, phoenixMatches] = await Promise.all([
        supabase
          .from('sport_e2d_matchs')
          .select('*')
          .order('date_match', { ascending: false })
          .limit(3),
        supabase
          .from('sport_phoenix_matchs')
          .select('*')
          .order('date_match', { ascending: false })
          .limit(3)
      ]);
      
      return {
        e2d: e2dMatches.data || [],
        phoenix: phoenixMatches.data || []
      };
    }
  });

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "primary",
    onClick 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
    onClick?: () => void;
  }) => (
    <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <BackIcon className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <LogoHeader 
            title="Gestion Sportive"
            subtitle="Centre de gestion des activités sportives E2D et Phoenix"
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate("/sport-config")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </Button>
      </div>

      {/* Aperçu général */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Membres E2D"
          value={e2dMembers?.length || 0}
          icon={Trophy}
          color="primary"
        />
        <StatCard
          title="Adhérents Phoenix"
          value={phoenixAdherents?.length || 0}
          icon={Activity}
          color="secondary"
        />
        <StatCard
          title="Matchs E2D"
          value={recentMatches?.e2d.length || 0}
          icon={Target}
          color="success"
        />
        <StatCard
          title="Matchs Phoenix"
          value={recentMatches?.phoenix.length || 0}
          icon={Target}
          color="warning"
        />
      </div>

      {/* Derniers résultats */}
      {(recentMatches?.e2d.length > 0 || recentMatches?.phoenix.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {recentMatches?.e2d.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Derniers matchs E2D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentMatches.e2d.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">E2D vs {match.equipe_adverse}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(match.date_match).toLocaleDateString()}
                        </span>
                        {match.score_e2d !== null && match.score_adverse !== null ? (
                          <Badge variant="outline">
                            {match.score_e2d} - {match.score_adverse}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{match.statut}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {recentMatches?.phoenix.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-secondary" />
                  Derniers matchs Phoenix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentMatches.phoenix.slice(0, 3).map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Phoenix vs {match.equipe_adverse}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(match.date_match).toLocaleDateString()}
                        </span>
                        {match.score_phoenix !== null && match.score_adverse !== null ? (
                          <Badge variant="outline">
                            {match.score_phoenix} - {match.score_adverse}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{match.statut}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Onglets de navigation */}
      <Tabs defaultValue="presences" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="presences" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Présences
          </TabsTrigger>
          <TabsTrigger value="calendrier" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="resultats" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            Résultats
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="classements" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            Classements
          </TabsTrigger>
          <TabsTrigger value="e2d" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            E2D
          </TabsTrigger>
          <TabsTrigger value="phoenix" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Phoenix
          </TabsTrigger>
          <TabsTrigger value="equipes" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            Équipes E2D
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presences" className="mt-6">
          <GestionPresences />
        </TabsContent>

        <TabsContent value="calendrier" className="mt-6">
          <CalendrierSportifUnifie />
        </TabsContent>

        <TabsContent value="resultats" className="mt-6">
          <MatchResults />
        </TabsContent>

        <TabsContent value="statistiques" className="mt-6">
          <StatsMatchDetaillee />
        </TabsContent>

        <TabsContent value="classements" className="mt-6">
          <ClassementJoueurs />
        </TabsContent>

        <TabsContent value="e2d" className="mt-6">
          <SportE2D />
        </TabsContent>

        <TabsContent value="phoenix" className="mt-6">
          <SportPhoenix />
        </TabsContent>

        <TabsContent value="equipes" className="mt-6">
          <SportEquipes />
        </TabsContent>
      </Tabs>
    </div>
  );
}