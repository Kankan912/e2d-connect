import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trophy, Target, AlertTriangle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface MatchStatistics {
  id: string;
  match_id: string;
  player_name: string;
  goals: number;
  yellow_cards: number;
  red_cards: number;
  man_of_match: boolean;
  match_date: string;
  opponent_team: string;
  team_type: 'e2d' | 'phoenix';
}

interface Match {
  id: string;
  date_match: string;
  equipe_adverse: string;
  score_e2d?: number;
  score_phoenix?: number;
  type: 'e2d' | 'phoenix';
}

export default function StatistiquesMatchs() {
  const [statistics, setStatistics] = useState<MatchStatistics[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    match_id: '',
    player_name: '',
    goals: 0,
    yellow_cards: 0,
    red_cards: 0,
    man_of_match: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les matchs E2D et Phoenix
      const [e2dMatches, phoenixMatches] = await Promise.all([
        supabase.from('sport_e2d_matchs').select('*').order('date_match', { ascending: false }),
        supabase.from('sport_phoenix_matchs').select('*').order('date_match', { ascending: false })
      ]);

      const allMatches: Match[] = [
        ...(e2dMatches.data || []).map(m => ({ 
          ...m, 
          type: 'e2d' as const,
          score_e2d: m.score_e2d 
        })),
        ...(phoenixMatches.data || []).map(m => ({ 
          ...m, 
          type: 'phoenix' as const,
          score_phoenix: m.score_phoenix 
        }))
      ];

      setMatches(allMatches);

      // Pour l'instant, on simule les statistiques (en attendant la création de la table)
      setStatistics([]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Sauvegarder dans la table match_statistics (à créer)
      console.log('Statistiques à sauvegarder:', formData);
      
      toast({
        title: "Succès",
        description: "Statistiques enregistrées (simulation)",
      });
      
      setShowForm(false);
      setFormData({
        match_id: '',
        player_name: '',
        goals: 0,
        yellow_cards: 0,
        red_cards: 0,
        man_of_match: false
      });
    } catch (error) {
      toast({
        title: "Erreur", 
        description: "Erreur lors de l'enregistrement",
        variant: "destructive"
      });
    }
  };

  const getTopScorers = () => {
    const scorers = statistics.reduce((acc, stat) => {
      acc[stat.player_name] = (acc[stat.player_name] || 0) + stat.goals;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(scorers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  const getPlayerStats = (playerName: string) => {
    const playerStats = statistics.filter(s => s.player_name === playerName);
    return {
      goals: playerStats.reduce((sum, s) => sum + s.goals, 0),
      yellowCards: playerStats.reduce((sum, s) => sum + s.yellow_cards, 0),
      redCards: playerStats.reduce((sum, s) => sum + s.red_cards, 0),
      manOfMatches: playerStats.filter(s => s.man_of_match).length,
      matches: playerStats.length
    };
  };

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Statistiques des Matchs"
        subtitle="Buteurs, cartons, homme du match..."
      />

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter des statistiques
        </Button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter des statistiques de match</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Match</Label>
                  <Select value={formData.match_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, match_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un match" />
                    </SelectTrigger>
                    <SelectContent>
                      {matches.map(match => (
                        <SelectItem key={match.id} value={match.id}>
                          {match.type.toUpperCase()} vs {match.equipe_adverse} - {new Date(match.date_match).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Nom du joueur</Label>
                  <Input
                    value={formData.player_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                    placeholder="Nom du joueur"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Buts</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.goals}
                    onChange={(e) => setFormData(prev => ({ ...prev, goals: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cartons jaunes</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.yellow_cards}
                    onChange={(e) => setFormData(prev => ({ ...prev, yellow_cards: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Cartons rouges</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.red_cards}
                    onChange={(e) => setFormData(prev => ({ ...prev, red_cards: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Homme du match</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      checked={formData.man_of_match}
                      onChange={(e) => setFormData(prev => ({ ...prev, man_of_match: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Oui</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit">Enregistrer</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buts</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.reduce((sum, s) => sum + s.goals, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartons Jaunes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.reduce((sum, s) => sum + s.yellow_cards, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartons Rouges</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.reduce((sum, s) => sum + s.red_cards, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homme du Match</CardTitle>
            <Star className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.filter(s => s.man_of_match).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top buteurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Buteurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getTopScorers().length > 0 ? (
            <div className="space-y-2">
              {getTopScorers().map(([name, goals], index) => (
                <div key={name} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold">{goals}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              Aucune statistique enregistrée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tableau des statistiques */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Joueur</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buts</TableHead>
                <TableHead>Cartons J.</TableHead>
                <TableHead>Cartons R.</TableHead>
                <TableHead>Homme du Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statistics.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium">{stat.player_name}</TableCell>
                  <TableCell>
                    {stat.team_type.toUpperCase()} vs {stat.opponent_team}
                  </TableCell>
                  <TableCell>
                    {new Date(stat.match_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {stat.goals > 0 && (
                      <Badge variant="default">
                        <Target className="h-3 w-3 mr-1" />
                        {stat.goals}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stat.yellow_cards > 0 && (
                      <Badge className="bg-yellow-500 text-white">
                        {stat.yellow_cards}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stat.red_cards > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {stat.red_cards}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stat.man_of_match && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {statistics.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune statistique enregistrée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}