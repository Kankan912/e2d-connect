import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Users, Clock, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SportEvent {
  id: string;
  date: Date;
  type: 'e2d' | 'phoenix';
  eventType: 'match' | 'entrainement' | 'activite';
  title: string;
  opponent?: string;
  location?: string;
  time?: string;
  status: 'prevu' | 'en_cours' | 'termine' | 'annule';
  score?: { home: number; away: number };
}

export default function CalendrierSportifUnifie() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      const [e2dMatches, phoenixMatches, e2dActivites] = await Promise.all([
        supabase
          .from('sport_e2d_matchs')
          .select('*')
          .gte('date_match', startDate.toISOString().split('T')[0])
          .lte('date_match', endDate.toISOString().split('T')[0]),
        supabase
          .from('sport_phoenix_matchs')
          .select('*')
          .gte('date_match', startDate.toISOString().split('T')[0])
          .lte('date_match', endDate.toISOString().split('T')[0]),
        supabase
          .from('sport_e2d_activites')
          .select('*')
          .gte('date_activite', startDate.toISOString().split('T')[0])
          .lte('date_activite', endDate.toISOString().split('T')[0])
      ]);

      const allEvents: SportEvent[] = [
        // Matchs E2D
        ...(e2dMatches.data || []).map(match => ({
          id: match.id,
          date: new Date(match.date_match),
          type: 'e2d' as const,
          eventType: 'match' as const,
          title: `E2D vs ${match.equipe_adverse}`,
          opponent: match.equipe_adverse,
          location: match.lieu,
          time: match.heure_match,
          status: match.statut as 'prevu' | 'en_cours' | 'termine' | 'annule',
          score: match.score_e2d !== null && match.score_adverse !== null 
            ? { home: match.score_e2d, away: match.score_adverse }
            : undefined
        })),
        // Matchs Phoenix
        ...(phoenixMatches.data || []).map(match => ({
          id: match.id,
          date: new Date(match.date_match),
          type: 'phoenix' as const,
          eventType: 'match' as const,
          title: `Phoenix vs ${match.equipe_adverse}`,
          opponent: match.equipe_adverse,
          location: match.lieu,
          time: match.heure_match,
          status: match.statut as 'prevu' | 'en_cours' | 'termine' | 'annule',
          score: match.score_phoenix !== null && match.score_adverse !== null 
            ? { home: match.score_phoenix, away: match.score_adverse }
            : undefined
        })),
        // Activités E2D
        ...(e2dActivites.data || []).map(activite => ({
          id: activite.id,
          date: new Date(activite.date_activite),
          type: 'e2d' as const,
          eventType: 'activite' as const,
          title: 'Activité E2D',
          location: activite.lieu,
          status: 'prevu' as const
        }))
      ];

      setEvents(allEvents);
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger le calendrier sportif',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'termine': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'annule': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'e2d' ? 'bg-blue-500' : 'bg-purple-500';
  };

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Calendrier Sportif Unifié"
        subtitle="Vue d'ensemble des activités E2D et Phoenix"
      />

      {/* Navigation du calendrier */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                ←
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                →
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                Mois
              </Button>
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                Semaine
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement du calendrier...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Légende */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>E2D</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>Phoenix</span>
                </div>
              </div>

              {/* Calendrier mensuel */}
              <div className="grid grid-cols-7 gap-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth().map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div 
                      key={day.toString()}
                      className={`
                        min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                        ${isCurrentDay ? 'ring-2 ring-primary' : ''}
                        ${selectedDate && isSameDay(day, selectedDate) ? 'bg-muted' : ''}
                        hover:bg-muted/50
                      `}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div 
                            key={event.id}
                            className={`
                              text-xs px-1 py-0.5 rounded text-white truncate
                              ${getTypeColor(event.type)}
                            `}
                            title={event.title}
                          >
                            {event.eventType === 'match' && event.score 
                              ? `${event.score.home}-${event.score.away}`
                              : event.title.slice(0, 10)
                            }
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} autre(s)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Détails de la date sélectionnée */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Événements du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map(event => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getTypeColor(event.type)}>
                            {event.type.toUpperCase()}
                          </Badge>
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                        
                        {event.score && (
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold">
                              Score: {event.score.home} - {event.score.away}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun événement prévu pour cette date
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs ce mois</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.eventType === 'match').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements E2D</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.type === 'e2d').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements Phoenix</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.type === 'phoenix').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs joués</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.eventType === 'match' && e.status === 'termine').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}