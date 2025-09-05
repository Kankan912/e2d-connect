import { useEffect, useState } from "react";
import LogoHeader from "@/components/LogoHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Event {
  id: string;
  type: 'match' | 'reunion' | 'entrainement';
  title: string;
  date: string;
  time?: string;
  lieu?: string;
  details?: string;
  equipe?: 'e2d' | 'phoenix';
}

export default function CalendrierSportif() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [matchsE2D, matchsPhoenix, reunions] = await Promise.all([
        supabase
          .from('sport_e2d_matchs')
          .select('*')
          .gte('date_match', today)
          .lte('date_match', nextMonth)
          .order('date_match'),
        supabase
          .from('sport_phoenix_matchs')
          .select('*')
          .gte('date_match', today)
          .lte('date_match', nextMonth)
          .order('date_match'),
        supabase
          .from('reunions')
          .select('*')
          .eq('statut', 'planifie')
          .gte('date_reunion', today)
          .lte('date_reunion', nextMonth)
          .order('date_reunion')
      ]);

      const allEvents: Event[] = [
        ...(matchsE2D.data || []).map(match => ({
          id: match.id,
          type: 'match' as const,
          title: `E2D vs ${match.equipe_adverse}`,
          date: match.date_match,
          time: match.heure_match,
          lieu: match.lieu,
          details: match.notes,
          equipe: 'e2d' as const
        })),
        ...(matchsPhoenix.data || []).map(match => ({
          id: match.id,
          type: 'match' as const,
          title: `Phoenix vs ${match.equipe_adverse}`,
          date: match.date_match,
          time: match.heure_match,
          lieu: match.lieu,
          details: match.notes,
          equipe: 'phoenix' as const
        })),
        ...(reunions.data || []).map(reunion => ({
          id: reunion.id,
          type: 'reunion' as const,
          title: 'Réunion',
          date: reunion.date_reunion.split('T')[0],
          time: reunion.date_reunion.split('T')[1]?.slice(0, 5),
          lieu: reunion.lieu_description,
          details: reunion.ordre_du_jour
        }))
      ];

      // Ajouter les entraînements Phoenix du dimanche
      const trainingStartDate = new Date();
      const trainingEndDate = new Date(trainingStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Générer les dimanches d'entraînement Phoenix
      const phoenixTrainings = [];
      let iterDate = new Date(trainingStartDate);
      while (iterDate <= trainingEndDate) {
        if (iterDate.getDay() === 0) { // Dimanche = 0
          phoenixTrainings.push({
            id: `training-${iterDate.toISOString().slice(0, 10)}`,
            type: 'entrainement' as const,
            title: 'Entraînement Phoenix',
            date: iterDate.toISOString().slice(0, 10),
            time: '15:00',
            lieu: 'Terrain habituel',
            details: 'Entraînement hebdomadaire Phoenix',
            equipe: 'phoenix' as const
          });
        }
        iterDate.setDate(iterDate.getDate() + 1);
      }

      allEvents.push(...phoenixTrainings);
      setEvents(allEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadge = (event: Event) => {
    if (event.type === 'match') {
      return (
        <Badge variant={event.equipe === 'e2d' ? 'default' : 'secondary'}>
          {event.equipe?.toUpperCase()} Match
        </Badge>
      );
    } else if (event.type === 'reunion') {
      return <Badge variant="outline">Réunion</Badge>;
    }
    return <Badge>Entraînement</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader title="Calendrier Sportif" subtitle="Matchs et entraînements à venir" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <LogoHeader title="Calendrier Sportif" subtitle="Matchs et entraînements à venir" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Événements à venir (30 prochains jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {getEventBadge(event)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('fr-FR')}
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                  )}
                  {event.lieu && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.lieu}
                    </div>
                  )}
                </div>
                {event.details && (
                  <p className="mt-2 text-sm">{event.details}</p>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun événement prévu pour les 30 prochains jours</p>
                <p className="text-xs mt-2">Ajoutez des matchs et des réunions depuis les pages correspondantes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {events.filter(e => e.type === 'match' && e.equipe === 'e2d').length}
              </div>
              <div className="text-sm text-muted-foreground">Matchs E2D</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {events.filter(e => e.type === 'match' && e.equipe === 'phoenix').length}
              </div>
              <div className="text-sm text-muted-foreground">Matchs Phoenix</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {events.filter(e => e.type === 'reunion').length}
              </div>
              <div className="text-sm text-muted-foreground">Réunions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}