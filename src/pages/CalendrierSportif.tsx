import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, Trophy, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import LogoHeader from "@/components/LogoHeader";

interface SportEvent {
  id: string;
  type: 'training' | 'match_e2d' | 'match_phoenix';
  title: string;
  date: string;
  time?: string;
  location?: string;
  participants?: number;
  adversaire?: string;
  status?: string;
}

export default function CalendrierSportif() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [currentWeek]);

  const loadEvents = async () => {
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      const [activitesData, e2dMatchsData, phoenixMatchsData, configData] = await Promise.all([
        // Activités E2D (entraînements)
        supabase
          .from('sport_e2d_activites')
          .select('*')
          .gte('date_activite', weekStart.toISOString().split('T')[0])
          .lte('date_activite', weekEnd.toISOString().split('T')[0]),
        
        // Matchs E2D
        supabase
          .from('sport_e2d_matchs')
          .select('*')
          .gte('date_match', weekStart.toISOString().split('T')[0])
          .lte('date_match', weekEnd.toISOString().split('T')[0]),
        
        // Matchs Phoenix
        supabase
          .from('sport_phoenix_matchs')
          .select('*')
          .gte('date_match', weekStart.toISOString().split('T')[0])
          .lte('date_match', weekEnd.toISOString().split('T')[0]),
        
        // Configuration E2D pour les entraînements réguliers
        supabase
          .from('sport_e2d_config')
          .select('*')
          .limit(1)
      ]);

      const allEvents: SportEvent[] = [];

      // Entraînements E2D
      if (activitesData.data) {
        activitesData.data.forEach(activite => {
          allEvents.push({
            id: activite.id,
            type: 'training',
            title: 'Entraînement E2D',
            date: activite.date_activite,
            location: activite.lieu,
            participants: activite.participants_count
          });
        });
      }

      // Matchs E2D
      if (e2dMatchsData.data) {
        e2dMatchsData.data.forEach(match => {
          allEvents.push({
            id: match.id,
            type: 'match_e2d',
            title: `E2D vs ${match.equipe_adverse}`,
            date: match.date_match,
            time: match.heure_match,
            location: match.lieu,
            adversaire: match.equipe_adverse,
            status: match.statut
          });
        });
      }

      // Matchs Phoenix
      if (phoenixMatchsData.data) {
        phoenixMatchsData.data.forEach(match => {
          allEvents.push({
            id: match.id,
            type: 'match_phoenix',
            title: `Phoenix vs ${match.equipe_adverse}`,
            date: match.date_match,
            time: match.heure_match,
            location: match.lieu,
            adversaire: match.equipe_adverse,
            status: match.statut
          });
        });
      }

      // Ajouter entraînements réguliers basés sur la config si disponible
      if (configData.data && configData.data.length > 0) {
        const config = configData.data[0];
        if (config.horaire_entrainement) {
          // Ajouter les dimanches comme entraînements E2D réguliers
          const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
          weekDays.forEach(day => {
            if (day.getDay() === 0) { // Dimanche
              // Vérifier s'il n'y a pas déjà un événement ce jour
              const existingEvent = allEvents.find(event => 
                isSameDay(new Date(event.date), day)
              );
              
              if (!existingEvent) {
                allEvents.push({
                  id: `training-${day.toISOString()}`,
                  type: 'training',
                  title: 'Entraînement E2D (Régulier)',
                  date: day.toISOString().split('T')[0],
                  time: config.horaire_entrainement,
                  location: config.lieu_entrainement || 'Terrain habituel'
                });
              }
            }
          });
        }
      }

      // Trier par date
      allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(allEvents);

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <Users className="w-4 h-4" />;
      case 'match_e2d':
      case 'match_phoenix':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'match_e2d':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'match_phoenix':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-muted';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'prevu':
        return <Badge variant="outline">Prévu</Badge>;
      case 'en_cours':
        return <Badge className="bg-warning text-warning-foreground">En cours</Badge>;
      case 'termine':
        return <Badge className="bg-success text-success-foreground">Terminé</Badge>;
      case 'reporte':
        return <Badge className="bg-destructive text-destructive-foreground">Reporté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Calendrier Sportif"
        subtitle="Planning des entraînements et matchs E2D et Phoenix"
      />

      {/* Navigation de semaine */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Semaine du {format(weekStart, "d MMMM", { locale: fr })} au {format(weekEnd, "d MMMM yyyy", { locale: fr })}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentWeek(prev => subWeeks(prev, 1))}
              >
                ← Semaine précédente
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
              >
                Aujourd'hui
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
              >
                Semaine suivante →
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vue calendrier par jour */}
      <div className="grid gap-4">
        {weekDays.map(day => {
          const dayEvents = events.filter(event => 
            isSameDay(new Date(event.date), day)
          );
          
          const isToday = isSameDay(day, new Date());

          return (
            <Card key={day.toISOString()} className={isToday ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${isToday ? "text-primary" : ""}`}>
                  {format(day, "EEEE d MMMM", { locale: fr })}
                  {isToday && <Badge className="ml-2">Aujourd'hui</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun événement prévu
                  </p>
                ) : (
                  <div className="space-y-3">
                    {dayEvents.map(event => (
                      <Card key={event.id} className={`border ${getEventTypeColor(event.type)}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getEventTypeIcon(event.type)}
                                <span className="font-semibold">{event.title}</span>
                                {getStatusBadge(event.status)}
                              </div>
                              
                              {event.time && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </div>
                              )}
                              
                              {event.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              )}
                              
                              {event.participants && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  {event.participants} participants prévus
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Entraînements</span>
                <span className="font-semibold">
                  {events.filter(e => e.type === 'training').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Matchs E2D</span>
                <span className="font-semibold">
                  {events.filter(e => e.type === 'match_e2d').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Matchs Phoenix</span>
                <span className="font-semibold">
                  {events.filter(e => e.type === 'match_phoenix').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Prochains événements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events.slice(0, 3).map(event => (
                <div key={event.id} className="flex items-center gap-2 text-sm">
                  {getEventTypeIcon(event.type)}
                  <span className="truncate">{event.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter entraînement
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Planifier match
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}