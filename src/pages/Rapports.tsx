import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart,
  Calendar,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";

export default function Rapports() {
  const rapportsDisponibles = [
    {
      title: "Rapport des Cotisations",
      description: "État détaillé des cotisations par membre et par type",
      type: "Financier",
      lastUpdate: "23/01/2025",
      icon: DollarSign,
      color: "success"
    },
    {
      title: "Rapport des Membres",
      description: "Liste complète des membres avec leurs statuts",
      type: "Administratif", 
      lastUpdate: "22/01/2025",
      icon: Users,
      color: "primary"
    },
    {
      title: "Statistiques Sport Phoenix",
      description: "Performance sportive et présences aux entraînements",
      type: "Sportif",
      lastUpdate: "21/01/2025", 
      icon: BarChart3,
      color: "accent"
    },
    {
      title: "Rapport des Sanctions",
      description: "Historique des sanctions appliquées",
      type: "Disciplinaire",
      lastUpdate: "20/01/2025",
      icon: FileText,
      color: "warning"
    }
  ];

  const statistiquesRapides = [
    { label: "Taux de paiement", value: "87%", trend: "+5%", color: "success" },
    { label: "Membres actifs", value: "45", trend: "+3", color: "primary" },
    { label: "Recettes mois", value: "125k FCFA", trend: "+12%", color: "secondary" },
    { label: "Présence sport", value: "78%", trend: "-2%", color: "accent" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Rapports & États
          </h1>
          <p className="text-muted-foreground">
            Consultez et exportez les rapports de l'association
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-light">
          <Download className="w-4 h-4 mr-2" />
          Exporter tout
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statistiquesRapides.map((stat, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex items-center gap-1 text-${stat.color}`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{stat.trend}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vue d'ensemble mensuelle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Vue d'ensemble - Janvier 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Finances</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Cotisations collectées</span>
                  <span className="font-semibold">125,000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Dépenses</span>
                  <span className="font-semibold">45,000 FCFA</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Solde</span>
                  <span className="font-bold text-success">80,000 FCFA</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Membres</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Membres E2D</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Adhérents Phoenix</span>
                  <span className="font-semibold">28</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Taux d'activité</span>
                  <span className="font-bold text-primary">87%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Sport</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Entraînements</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Matchs joués</span>
                  <span className="font-semibold">3</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Taux présence</span>
                  <span className="font-bold text-accent">78%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rapports disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapports Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {rapportsDisponibles.map((rapport, index) => {
              const Icon = rapport.icon;
              return (
                <Card 
                  key={index} 
                  className="border-2 border-dashed border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${rapport.color}/10`}>
                          <Icon className={`h-5 w-5 text-${rapport.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{rapport.title}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {rapport.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {rapport.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        MAJ: {rapport.lastUpdate}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                        <Button size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="border-info/20 bg-info/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Rapport mensuel
            </Button>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              État des membres
            </Button>
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Bilan financier
            </Button>
            <Button variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Planning activités
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}