import { Dumbbell, Users, Trophy, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Activities = () => {
  const activities = [
    {
      icon: Dumbbell,
      title: "Entraînements",
      description: "Sessions d'entraînement régulières pour tous les niveaux, encadrées par des coaches expérimentés",
    },
    {
      icon: Trophy,
      title: "Compétitions",
      description: "Participation à des tournois locaux et régionaux pour développer l'esprit de compétition",
    },
    {
      icon: Users,
      title: "Team Building",
      description: "Activités de cohésion d'équipe pour renforcer les liens entre membres",
    },
    {
      icon: Calendar,
      title: "Événements",
      description: "Organisation d'événements sportifs et culturels tout au long de l'année",
    },
  ];

  return (
    <section id="activities" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Nos <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Activités</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les différentes activités sportives et services que nous proposons à nos membres
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-border"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{activity.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {activity.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Activities;
