import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

export default function GestionPresences() {
  return (
    <div className="space-y-6">
      <LogoHeader title="Présences" subtitle="Gestion des présences (entraînements, matchs)" />

      <Tabs defaultValue="e2d" className="space-y-6">
        <TabsList>
          <TabsTrigger value="e2d">E2D</TabsTrigger>
          <TabsTrigger value="phoenix">Phoenix</TabsTrigger>
        </TabsList>

        <TabsContent value="e2d">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Présences E2D
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">Interface de pointage à venir.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phoenix">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Présences Phoenix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">Interface de pointage à venir.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}