import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsFinancieres } from "@/components/AnalyticsFinancieres";
import { AlertesBudgetaires } from "@/components/AlertesBudgetaires";
import { PredictionsBudgetaires } from "@/components/PredictionsBudgetaires";
import { ExportScheduler } from "@/components/ExportScheduler";
import LogoHeader from "@/components/LogoHeader";

export default function Analytics() {
  return (
    <div className="space-y-6 p-6">
      <LogoHeader 
        title="Analytics Financières Avancées" 
        subtitle="Analyse, prédictions et alertes budgétaires intelligentes" 
      />
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="predictions">Prédictions</TabsTrigger>
          <TabsTrigger value="exports">Exports Auto</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <AnalyticsFinancieres />
        </TabsContent>

        <TabsContent value="alertes" className="space-y-6">
          <AlertesBudgetaires />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionsBudgetaires />
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <ExportScheduler />
        </TabsContent>
      </Tabs>
    </div>
  );
}