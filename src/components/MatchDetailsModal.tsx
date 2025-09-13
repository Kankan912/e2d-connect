import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Target, 
  Trophy, 
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Match {
  id: string;
  date_match: string;
  heure_match?: string;
  lieu?: string;
  equipe_adverse?: string;
  score_e2d?: number;
  score_adverse?: number;
  score_phoenix?: number;
  statut: string;
  type_match: string;
  notes?: string;
}

interface MatchPresence {
  id: string;
  membre_id: string;
  present: boolean;
  notes?: string;
  membres: {
    nom: string;
    prenom: string;
    equipe?: string;
  };
}

interface MatchStatistic {
  id: string;
  player_name: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  man_of_match: boolean;
}

interface MatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  matchType: 'e2d' | 'phoenix';
}

export default function MatchDetailsModal({ 
  open, 
  onOpenChange, 
  match, 
  matchType 
}: MatchDetailsModalProps) {
  const [presences, setPresences] = useState<MatchPresence[]>([]);
  const [statistics, setStatistics] = useState<MatchStatistic[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && match) {
      loadMatchDetails();
    }
  }, [open, match]);

  const loadMatchDetails = async () => {
    if (!match) return;
    
    setLoading(true);
    try {
      // Load match presences with member data using the foreign key relationship
      const { data: presencesData, error: presencesError } = await supabase
        .from('match_presences')
        .select(`
          *,
          membres!fk_match_presences_membre_id (
            nom,
            prenom,
            equipe
          )
        `)
        .eq('match_id', match.id)
        .eq('match_type', matchType);

      if (presencesError) throw presencesError;

      // Load match statistics
      const { data: statisticsData, error: statisticsError } = await supabase
        .from('match_statistics')
        .select('*')
        .eq('match_id', match.id)
        .eq('match_type', matchType);

      if (statisticsError) throw statisticsError;

      setPresences(presencesData || []);
      setStatistics(statisticsData || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  const isInternalMatch = matchType === 'e2d' && match.equipe_adverse === 'Rouge' || match.equipe_adverse === 'Jaune';
  const matchTitle = isInternalMatch 
    ? `${match.equipe_adverse} vs ${match.equipe_adverse === 'Jaune' ? 'Rouge' : 'Jaune'}`
    : `${matchType.toUpperCase()} vs ${match.equipe_adverse}`;

  const getScore = () => {
    if (matchType === 'e2d') {
      return `${match.score_e2d || 0} - ${match.score_adverse || 0}`;
    }
    return `${match.score_phoenix || 0} - ${match.score_adverse || 0}`;
  };

  const getResult = () => {
    const ourScore = matchType === 'e2d' ? (match.score_e2d || 0) : (match.score_phoenix || 0);
    const theirScore = match.score_adverse || 0;
    
    if (ourScore > theirScore) return { text: 'Victoire', variant: 'default' as const };
    if (ourScore < theirScore) return { text: 'Défaite', variant: 'destructive' as const };
    return { text: 'Match nul', variant: 'secondary' as const };
  };

  const presentPlayers = presences.filter(p => p.present);
  const absentPlayers = presences.filter(p => !p.present);
  
  // Group by teams for internal matches
  const jaunePresent = presentPlayers.filter(p => p.membres.equipe === 'Jaune');
  const rougePresent = presentPlayers.filter(p => p.membres.equipe === 'Rouge');

  const totalGoals = statistics.reduce((sum, stat) => sum + stat.goals, 0);
  const totalAssists = statistics.reduce((sum, stat) => sum + stat.assists, 0);
  const totalYellowCards = statistics.reduce((sum, stat) => sum + stat.yellow_cards, 0);
  const totalRedCards = statistics.reduce((sum, stat) => sum + stat.red_cards, 0);
  const manOfMatch = statistics.find(stat => stat.man_of_match);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {matchTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Match</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(match.date_match).toLocaleDateString('fr-FR')}
                    {match.heure_match && ` à ${match.heure_match}`}
                  </span>
                </div>
                
                {match.lieu && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{match.lieu}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{match.type_match}</Badge>
                  <Badge variant={match.statut === 'termine' ? 'default' : 'secondary'}>
                    {match.statut}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {match.statut === 'termine' && (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{getScore()}</div>
                      <Badge variant={getResult().variant} className="mt-1">
                        {getResult().text}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="presences" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presences">Présences</TabsTrigger>
              <TabsTrigger value="statistics">Statistiques</TabsTrigger>
              <TabsTrigger value="summary">Résumé</TabsTrigger>
            </TabsList>

            <TabsContent value="presences" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      Joueurs Présents ({presentPlayers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isInternalMatch ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            Équipe Jaune ({jaunePresent.length})
                          </h4>
                          <div className="space-y-1">
                            {jaunePresent.map(presence => (
                              <div key={presence.id} className="text-sm">
                                {presence.membres.prenom} {presence.membres.nom}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            Équipe Rouge ({rougePresent.length})
                          </h4>
                          <div className="space-y-1">
                            {rougePresent.map(presence => (
                              <div key={presence.id} className="text-sm">
                                {presence.membres.prenom} {presence.membres.nom}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {presentPlayers.map(presence => (
                          <div key={presence.id} className="text-sm">
                            {presence.membres.prenom} {presence.membres.nom}
                            {presence.membres.equipe && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {presence.membres.equipe}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-red-600" />
                      Joueurs Absents ({absentPlayers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {absentPlayers.map(presence => (
                        <div key={presence.id} className="text-sm text-muted-foreground">
                          {presence.membres.prenom} {presence.membres.nom}
                          {presence.membres.equipe && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {presence.membres.equipe}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques Individuelles</CardTitle>
                </CardHeader>
                <CardContent>
                  {statistics.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Joueur</TableHead>
                          <TableHead>Buts</TableHead>
                          <TableHead>Passes D.</TableHead>
                          <TableHead>Cartons J.</TableHead>
                          <TableHead>Cartons R.</TableHead>
                          <TableHead>Homme du Match</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statistics.map((stat) => (
                          <TableRow key={stat.id}>
                            <TableCell className="font-medium">
                              {stat.player_name}
                            </TableCell>
                            <TableCell>{stat.goals}</TableCell>
                            <TableCell>{stat.assists}</TableCell>
                            <TableCell>{stat.yellow_cards}</TableCell>
                            <TableCell>{stat.red_cards}</TableCell>
                            <TableCell>
                              {stat.man_of_match && (
                                <Badge variant="default">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Oui
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                      <p>Aucune statistique enregistrée pour ce match</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="summary" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé des Statistiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Buts:</span>
                      <span className="font-semibold">{totalGoals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Passes Décisives:</span>
                      <span className="font-semibold">{totalAssists}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartons Jaunes:</span>
                      <span className="font-semibold">{totalYellowCards}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cartons Rouges:</span>
                      <span className="font-semibold">{totalRedCards}</span>
                    </div>
                    {manOfMatch && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          <span className="font-semibold">Homme du Match:</span>
                          <span>{manOfMatch.player_name}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Participation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Joueurs Présents:</span>
                      <span className="font-semibold text-green-600">{presentPlayers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Joueurs Absents:</span>
                      <span className="font-semibold text-red-600">{absentPlayers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taux de Présence:</span>
                      <span className="font-semibold">
                        {presences.length > 0 
                          ? Math.round((presentPlayers.length / presences.length) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {match.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes du Match</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{match.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}