import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Calendar, TrendingUp, Wallet, Users, Calculator, AlertCircle } from "lucide-react";
import CotisationsMembresManager from "./CotisationsMembresManager";
import CotisationsTypesManager from './CotisationsTypesManager';
import CotisationsEcheancesConfig from './CotisationsEcheancesConfig';
import CotisationsSimulation from './CotisationsSimulation';
import PhoenixCotisationsAnnuelles from './PhoenixCotisationsAnnuelles';
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

      {/* Note explicative */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>E2D (Minimales/Types/Échéances)</strong> : Cotisations des réunions mensuelles
          <br />
          <strong>Phoenix (Sport)</strong> : Cotisations annuelles de l'équipe sportive
        </AlertDescription>
      </Alert>

      {/* Configuration par catégorie */}
      <Tabs defaultValue="mensuelles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mensuelles">
            <DollarSign className="w-4 h-4 mr-2" />
            Minimales (E2D)
          </TabsTrigger>
          <TabsTrigger value="types">
            <Users className="w-4 h-4 mr-2" />
            Types
          </TabsTrigger>
          <TabsTrigger value="echeances">
            <Calendar className="w-4 h-4 mr-2" />
            Échéances
          </TabsTrigger>
          <TabsTrigger value="simulation">
            <Calculator className="w-4 h-4 mr-2" />
            Simulation
          </TabsTrigger>
          <TabsTrigger value="annuelles">
            <TrendingUp className="w-4 h-4 mr-2" />
            Phoenix (Sport)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mensuelles" className="space-y-6">
          <CotisationsMembresManager />
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <CotisationsTypesManager />
        </TabsContent>

        <TabsContent value="echeances" className="space-y-6">
          <CotisationsEcheancesConfig />
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <CotisationsSimulation />
        </TabsContent>

        <TabsContent value="annuelles" className="space-y-6">
          <PhoenixCotisationsAnnuelles />
        </TabsContent>
      </Tabs>
    </div>
  );
}
