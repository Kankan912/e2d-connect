import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportRapports } from "@/components/ExportRapports";
import RapportFinancierGlobal from "@/components/RapportFinancierGlobal";
import LogoHeader from "@/components/LogoHeader";

export default function Rapports() {
  return (
    <div className="space-y-6">
      <LogoHeader title="Rapports et Exports" subtitle="Génération de rapports et exports de données" />
      
      <Tabs defaultValue="financier" className="space-y-6">
        <TabsList>
          <TabsTrigger value="financier">Rapport Financier</TabsTrigger>
          <TabsTrigger value="exports">Exports Personnalisés</TabsTrigger>
        </TabsList>

        <TabsContent value="financier">
          <RapportFinancierGlobal />
        </TabsContent>

        <TabsContent value="exports">
          <ExportRapports />
        </TabsContent>
      </Tabs>
    </div>
  );
}