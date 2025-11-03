import { Users, Calendar, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const stats = [
    {
      icon: Users,
      value: "40+",
      label: "Membres Actifs",
    },
    {
      icon: Trophy,
      value: "3+",
      label: "Tournois Organisés",
    },
    {
      icon: Calendar,
      value: "6+",
      label: "Années d'Existence",
    },
  ];

  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="backdrop-blur-lg bg-card border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            À Propos de l'Association E2D
          </h2>
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              L'Association E2D (Ensemble pour Demain) est une association sportive passionnée, dédiée à promouvoir l'excellence sportive, la solidarité et le fair-play au sein de notre communauté.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-primary">Notre Mission</h3>
                  <p className="text-muted-foreground">
                    Développer la passion du sport et favoriser l'épanouissement de chaque membre à travers des activités sportives de qualité
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-primary">Nos Valeurs</h3>
                  <p className="text-muted-foreground">
                    Excellence, solidarité, dépassement de soi et fair-play sont au cœur de notre association
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-primary">Notre Vision</h3>
                  <p className="text-muted-foreground">
                    Une communauté sportive unie, passionnée et engagée, ensemble pour demain
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
