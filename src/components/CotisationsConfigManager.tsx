import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, TrendingUp, Wallet } from "lucide-react";
import CotisationsMembresManager from "./CotisationsMembresManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function CotisationsConfigManager() {
  const [stats, setStats] = useState({
    totalMensuelles: 0,
    totalAnnuelles: 0,
    nombreMembres: 0,
    moyenneMensuelle: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Charger les cotisations minimales
      const { data: cotisMin, error: cotisMinError } = await supabase
        .from('cotisations_minimales')
        .select('montant_mensuel')
        .eq('actif', true);

      if (cotisMinError) throw cotisMinError;

      const totalMensuelles = cotisMin?.reduce((sum, c) => sum + Number(c.montant_mensuel), 0) || 0;
      const nombreMembres = cotisMin?.length || 0;
      const moyenneMensuelle = nombreMembres > 0 ? totalMensuelles / nombreMembres : 0;

      setStats({
        totalMensuelles,
        totalAnnuelles: totalMensuelles * 12,
        nombreMembres,
        moyenneMensuelle
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalMensuelles.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Annuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalAnnuelles.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Moyenne Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(stats.moyenneMensuelle).toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Membres Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.nombreMembres}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration par catégorie */}
      <Tabs defaultValue="mensuelles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mensuelles">Cotisations Mensuelles</TabsTrigger>
          <TabsTrigger value="annuelles">Cotisations Annuelles</TabsTrigger>
          <TabsTrigger value="fonds">Fonds</TabsTrigger>
          <TabsTrigger value="investissements">Investissements</TabsTrigger>
        </TabsList>

        <TabsContent value="mensuelles" className="space-y-4">
          <CotisationsMembresManager />
        </TabsContent>

        <TabsContent value="annuelles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cotisations Annuelles</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configuration des cotisations annuelles (Phoenix, Sport, etc.)
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cette section sera développée prochainement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Fonds</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fond de caisse, Fond sport, etc.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configuration des différents fonds disponibles
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investissements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investissements</CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestion des investissements de la tontine
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Suivi des investissements et rendements
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
