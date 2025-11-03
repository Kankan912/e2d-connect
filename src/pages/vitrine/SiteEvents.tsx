import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function SiteEvents() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Upcoming events
        const { data: upcoming } = await supabase
          .from("cms_events")
          .select("*")
          .eq("is_active", true)
          .gte("event_date", today)
          .order("event_date", { ascending: true });

        if (upcoming) setUpcomingEvents(upcoming);

        // Past events
        const { data: past } = await supabase
          .from("cms_events")
          .select("*")
          .eq("is_active", true)
          .lt("event_date", today)
          .order("event_date", { ascending: false })
          .limit(6);

        if (past) setPastEvents(past);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-56 object-cover"
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {event.is_featured && (
            <Badge variant="default">À ne pas manquer</Badge>
          )}
        </div>
        <h3 className="text-2xl font-semibold mb-3">{event.title}</h3>
        
        <div className="space-y-2 mb-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(event.event_date), "EEEE d MMMM yyyy", {
                locale: fr,
              })}
            </span>
          </div>
          {event.event_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{event.event_time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-muted-foreground line-clamp-3">
            {event.description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <PublicLayout
      title="Événements - Association E2D Connect"
      description="Découvrez tous les événements organisés par l'Association E2D Connect"
    >
      <div className="container mx-auto px-4 py-16">
        {/* À venir */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Événements à Venir
            </h1>
            <p className="text-xl text-muted-foreground">
              Rejoignez-nous lors de nos prochains événements
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <div className="h-56 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                Aucun événement programmé pour le moment
              </p>
            </div>
          )}
        </section>

        {/* Événements passés */}
        {pastEvents.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Événements Passés
              </h2>
              <p className="text-lg text-muted-foreground">
                Revivez nos derniers événements
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
