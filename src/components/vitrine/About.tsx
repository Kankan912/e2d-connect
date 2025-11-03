import { useState, useEffect } from "react";
import { Users, Calendar, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface PageContent {
  title: string;
  content: string;
}

const About = () => {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_pages")
        .select("title, content")
        .eq("page_key", "about")
        .single();

      if (error) throw error;
      setPageContent(data);
    } catch (error) {
      console.error("Error fetching about content:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Users,
      value: "500+",
      label: "Membres Actifs",
    },
    {
      icon: Calendar,
      value: "100+",
      label: "Événements par An",
    },
    {
      icon: Award,
      value: "10+",
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
          {loading ? (
            <div className="space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                {pageContent?.title || "À Propos de Nous"}
              </h2>
              {pageContent?.content ? (
                <div
                  className="text-lg text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: pageContent.content }}
                />
              ) : (
                <div className="space-y-6">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    E2D Connect est une association dédiée à l'entraide et au développement communautaire.
                    Nous croyons en la force du collectif et en la solidarité pour construire un avenir meilleur.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-3 text-primary">Notre Mission</h3>
                        <p className="text-muted-foreground">
                          Favoriser l'entraide et la solidarité au sein de notre communauté
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-3 text-primary">Nos Valeurs</h3>
                        <p className="text-muted-foreground">
                          Solidarité, respect, transparence et engagement communautaire
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-3 text-primary">Notre Vision</h3>
                        <p className="text-muted-foreground">
                          Une communauté unie et prospère, ensemble pour demain
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default About;
