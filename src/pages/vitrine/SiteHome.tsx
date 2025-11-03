import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  background_image: string;
  cta_text: string | null;
  cta_link: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  image_url: string | null;
  is_featured: boolean;
}

export default function SiteHome() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch hero slides
        const { data: slides } = await supabase
          .from("cms_hero_slides")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (slides) setHeroSlides(slides);

        // Fetch featured events
        const { data: eventsData } = await supabase
          .from("cms_events")
          .select("*")
          .eq("is_active", true)
          .eq("is_featured", true)
          .order("event_date", { ascending: true })
          .limit(3);

        if (eventsData) setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PublicLayout>
      {/* Hero Carousel */}
      <section className="relative">
        {loading || heroSlides.length === 0 ? (
          <div className="relative h-[600px] bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
            <div className="container mx-auto px-4 text-center text-white">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Bienvenue sur E2D Connect
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                Ensemble pour Demain
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/site/adhesion">
                  <Button size="lg" variant="secondary">
                    Devenir Membre
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    Portail Membre
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <Carousel
            opts={{ loop: true }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {heroSlides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <div
                    className="relative h-[600px] bg-cover bg-center flex items-center"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${slide.background_image})`,
                    }}
                  >
                    <div className="container mx-auto px-4 text-white">
                      <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        {slide.title}
                      </h1>
                      {slide.subtitle && (
                        <p className="text-xl md:text-2xl mb-8">
                          {slide.subtitle}
                        </p>
                      )}
                      {slide.cta_text && slide.cta_link && (
                        <Link to={slide.cta_link}>
                          <Button size="lg" variant="secondary">
                            {slide.cta_text}
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        )}
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-4xl font-bold mb-2">150+</h3>
                <p className="text-muted-foreground">Membres Actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-4xl font-bold mb-2">50+</h3>
                <p className="text-muted-foreground">Événements par An</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Award className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-4xl font-bold mb-2">10</h3>
                <p className="text-muted-foreground">Années d'Existence</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Rejoignez Notre Communauté
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Devenez membre de l'Association E2D et participez à nos activités solidaires
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/site/adhesion">
              <Button size="lg" variant="secondary">
                Devenir Membre
              </Button>
            </Link>
            <Link to="/site/contact">
              <Button size="lg" variant="outline">
                Nous Contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Events */}
      {events.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Événements à Venir
              </h2>
              <p className="text-muted-foreground text-lg">
                Ne manquez pas nos prochains événements
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.map((event) => (
                <Card key={event.id}>
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {new Date(event.event_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/site/evenements">
                <Button variant="outline">
                  Voir Tous les Événements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
