import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Calendar, MapPin, Clock, Plus, Goal, AlertTriangle, UserMinus, Star } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Match {
  id: string;
  date_match: string;
  heure_match: string;
  equipe_adverse: string;
  lieu: string;
  score_phoenix: number;
  score_adverse: number;
  statut: string;
  type_match: string;
  notes: string;
}

interface MatchEvent {
  id: string;
  match_id: string;
  membre_id: string;
  type_evenement: string;
  minute: number;
  equipe_nom: string;
  description: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixMatchDetails() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    membre_id: "",
    type_evenement: "",
    minute: "",
    equipe_nom: "",
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: matchs } = useQuery({
    queryKey: ['phoenix-matchs-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_matchs')
        .select('*')
        .order('date_match', { ascending: false });
      if (error) throw error;
      return data as Match[];
    }
  });

  const { data: membres } = useQuery({
    queryKey: ['phoenix-membres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          membre_id,
          membres:membre_id (
            id,
            nom,
            prenom
          )
        `);
      if (error) throw error;
      return data?.map(a => a.membres).filter(Boolean) || [];
    }
  });

  const { data: events } = useQuery({
    queryKey: ['phoenix-match-events', selectedMatch?.id],
    queryFn: async () => {
      if (!selectedMatch?.id) return [];
      const { data, error } = await supabase
        .from('phoenix_evenements_match' as any)
        .select(`
          *,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('match_id', selectedMatch.id)
        .order('minute');
      if (error) throw error;
      return data as any;
    },
    enabled: !!selectedMatch?.id
  });

  const addEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('phoenix_evenements_match' as any)
        .insert([{
          match_id: selectedMatch?.id,
          ...data,
          minute: parseInt(data.minute)
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-match-events'] });
      toast.success("Événement ajouté avec succès");
      resetEventForm();
    }
  });

  const resetEventForm = () => {
    setEventForm({
      membre_id: "",
      type_evenement: "",
      minute: "",
      equipe_nom: "",
      description: ""
    });
    setShowEventForm(false);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addEventMutation.mutate(eventForm);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'but': return <Goal className="w-4 h-4" />;
      case 'carton_jaune': return <AlertTriangle className="w-4 h-4" />;
      case 'carton_rouge': return <UserMinus className="w-4 h-4" />;
      case 'passe_decisive': return <Star className="w-4 h-4" />;
      default: return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Détails des Matchs Phoenix</h2>
          <p className="text-muted-foreground">Enregistrez les événements de match</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Liste des matchs */}
        <Card>
          <CardHeader>
            <CardTitle>Matchs récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchs?.map((match) => (
                <div 
                  key={match.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMatch?.id === match.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Phoenix vs {match.equipe_adverse}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(match.date_match).toLocaleDateString()}
                        {match.heure_match && (
                          <>
                            <Clock className="w-3 h-3 ml-2" />
                            {match.heure_match}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {match.score_phoenix !== null && match.score_adverse !== null ? (
                        <p className="text-lg font-bold">
                          {match.score_phoenix} - {match.score_adverse}
                        </p>
                      ) : (
                        <Badge variant="outline">{match.statut}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Détails du match sélectionné */}
        {selectedMatch && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Événements du match</CardTitle>
                <Button onClick={() => setShowEventForm(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events?.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 border rounded">
                    {getEventIcon(event.type_evenement)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {event.membres.prenom} {event.membres.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.type_evenement.replace('_', ' ').toUpperCase()} - {event.minute}'
                        {event.equipe_nom && ` (${event.equipe_nom})`}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {(!events || events.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun événement enregistré pour ce match
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog pour ajouter un événement */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un événement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
              <Label>Joueur</Label>
              <Select
                value={eventForm.membre_id}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, membre_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent>
                  {membres?.map((membre: any) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type d'événement</Label>
              <Select
                value={eventForm.type_evenement}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, type_evenement: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="but">But</SelectItem>
                  <SelectItem value="passe_decisive">Passe décisive</SelectItem>
                  <SelectItem value="carton_jaune">Carton jaune</SelectItem>
                  <SelectItem value="carton_rouge">Carton rouge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minute</Label>
                <Input
                  type="number"
                  value={eventForm.minute}
                  onChange={(e) => setEventForm(prev => ({ ...prev, minute: e.target.value }))}
                  placeholder="90"
                  min="0"
                  max="120"
                />
              </div>
              <div>
                <Label>Équipe</Label>
                <Select
                  value={eventForm.equipe_nom}
                  onValueChange={(value) => setEventForm(prev => ({ ...prev, equipe_nom: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Jaune">Jaune</SelectItem>
                    <SelectItem value="Rouge">Rouge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Détails supplémentaires..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetEventForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={addEventMutation.isPending}>
                Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}