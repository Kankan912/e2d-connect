import { useState, useEffect } from "react";
import { Heart, Users, FileText, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import LogoHeader from "@/components/LogoHeader";
import { useNavigate } from "react-router-dom";

export default function Aides() {
  const [stats, setStats] = useState({
    totalReunion: 0,
    totalSport: 0,
    countReunion: 0,
    countSport: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: aidesReunion, error: errorReunion } = await supabase
        .from('aides')
        .select('montant')
        .eq('contexte_aide', 'reunion');

      const { data: aidesSport, error: errorSport } = await supabase
        .from('aides')
        .select('montant')
        .eq('contexte_aide', 'sport');

      if (errorReunion || errorSport) {
        throw new Error('Erreur lors du chargement des statistiques');
      }

      const totalReunion = aidesReunion?.reduce((sum, aide) => sum + aide.montant, 0) || 0;
      const totalSport = aidesSport?.reduce((sum, aide) => sum + aide.montant, 0) || 0;

      setStats({
        totalReunion,
        totalSport,
        countReunion: aidesReunion?.length || 0,
        countSport: aidesSport?.length || 0
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mises à jour temps réel
  useRealtimeUpdates({
    table: 'aides',
    onUpdate: fetchStats,
    enabled: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <LogoHeader 
        title="Gestion des Aides"
        subtitle="Gérez les aides allouées aux membres selon le contexte"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="reunion">Réunions</TabsTrigger>
          <TabsTrigger value="sport">Sport</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Réunions */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate('/aides-reunion')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Aides - Réunions</CardTitle>
                <Heart className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalReunion.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="text-2xl font-bold">{stats.countReunion}</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Gérer les aides de réunions
                </Button>
              </CardContent>
            </Card>

            {/* Card Sport */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => navigate('/aides-sport')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Aides - Sport</CardTitle>
                <Trophy className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalSport.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="text-2xl font-bold">{stats.countSport}</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Gérer les aides sportives
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Global</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats.totalReunion + stats.totalSport).toLocaleString()} FCFA
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aides Totales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.countReunion + stats.countSport}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne par Aide</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.countReunion + stats.countSport > 0 
                    ? Math.round((stats.totalReunion + stats.totalSport) / (stats.countReunion + stats.countSport)).toLocaleString() 
                    : '0'} FCFA
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reunion">
          <div className="text-center py-8">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aides de Réunions</h3>
            <p className="text-muted-foreground mb-4">
              Gérez les aides allouées lors des réunions
            </p>
            <Button onClick={() => navigate('/aides-reunion')}>
              Accéder aux aides de réunions
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sport">
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aides Sportives</h3>
            <p className="text-muted-foreground mb-4">
              Gérez les aides allouées dans le contexte sportif
            </p>
            <Button onClick={() => navigate('/aides-sport')}>
              Accéder aux aides sportives
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}