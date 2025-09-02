import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";

export default function CalendrierSportif() {
  return (
    <div className="space-y-6">
      <LogoHeader title="Calendrier Sportif" subtitle="Matchs et entraînements à venir" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Événements à venir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Aucun événement enregistré pour le moment. Ajoutez des matchs et des entraînements depuis les pages Sport.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Derniers lieux utilisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            À venir.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}