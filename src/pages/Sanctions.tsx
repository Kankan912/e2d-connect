
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useNavigate } from "react-router-dom";

export default function Sanctions() {
  const { goBack, BackIcon } = useBackNavigation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={goBack}>
          <BackIcon className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <LogoHeader 
          title="Gestion des Sanctions"
          subtitle="Suivi des sanctions et pénalités"
        />
      </div>

      {/* Navigation vers Sport et Réunion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Sanctions Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gérer les sanctions liées aux activités sportives (cartons, absences, retards...)
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-warning to-warning/80"
              onClick={() => navigate('/sanctions-sport')}
            >
              Accéder aux Sanctions Sport
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Sanctions Réunion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gérer les sanctions liées aux réunions (absences, retards, comportement...)
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-destructive to-destructive/80"
              onClick={() => navigate('/sanctions-reunion')}
            >
              Accéder aux Sanctions Réunion
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

}
