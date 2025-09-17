import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Shield, Target, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface Player {
  id: string;
  nom: string;
  prenom: string;
  equipe?: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
  telephone: string;
  email?: string;
}

export default function GestionEquipes() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'e2d' | 'phoenix'>('e2d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [playerForm, setPlayerForm] = useState({
    equipe: 'jaune'
  });

  useEffect(() => {
    loadData();
  }, [selectedTeam]);

  const loadData = async () => {
    try {
      const { data: membresData, error } = await supabase
        .from('membres')
        .select('*')
        .eq(selectedTeam === 'e2d' ? 'est_membre_e2d' : 'est_adherent_phoenix', true)
        .eq('statut', 'actif');

      if (error) throw error;

      setPlayers(membresData || []);
    } catch (error) {
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les données',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPlayer) {
        const { error } = await supabase
          .from('membres')
          .update({
            equipe: playerForm.equipe,
            equipe_e2d: selectedTeam === 'e2d' ? playerForm.equipe : null,
            equipe_phoenix: selectedTeam === 'phoenix' ? playerForm.equipe : null
          })
          .eq('id', editingPlayer.id);

        if (error) throw error;
        toast({ title: 'Succès', description: 'Joueur mis à jour' });
      }

      await loadData();
      setShowPlayerForm(false);
      setEditingPlayer(null);
      setPlayerForm({ equipe: 'jaune' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    }
  };

  const editPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      equipe: player.equipe || 'jaune'
    });
    setShowPlayerForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Chargement de la gestion des équipes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Gestion des Équipes"
        subtitle="Formation, tactiques et gestion des joueurs"
      />

      {/* Sélecteur d'équipe */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Équipe sélectionnée
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedTeam === 'e2d' ? 'default' : 'outline'}
                onClick={() => setSelectedTeam('e2d')}
              >
                E2D
              </Button>
              <Button
                variant={selectedTeam === 'phoenix' ? 'default' : 'outline'}
                onClick={() => setSelectedTeam('phoenix')}
              >
                Phoenix
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Joueurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{players.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe Jaune</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.equipe === 'jaune').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipe Rouge</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.equipe === 'rouge').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans équipe</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => !p.equipe).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des joueurs */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Effectif {selectedTeam.toUpperCase()}</CardTitle>
              <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Assigner équipe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assigner à une équipe</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePlayerSubmit} className="space-y-4">
                    {editingPlayer && (
                      <div className="p-3 bg-muted rounded-lg">
                        <strong>{editingPlayer.prenom} {editingPlayer.nom}</strong>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Select 
                        value={playerForm.equipe} 
                        onValueChange={(value) => setPlayerForm(prev => ({ ...prev, equipe: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une équipe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="jaune">Équipe Jaune</SelectItem>
                          <SelectItem value="rouge">Équipe Rouge</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Sauvegarder
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowPlayerForm(false)}>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {players.map(player => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-medium">{player.prenom} {player.nom}</span>
            </div>
            <div className="flex gap-2">
              <Badge className={
                (selectedTeam === 'e2d' ? player.equipe : player.equipe) === 'jaune' ? 'bg-yellow-100 text-yellow-800' : 
                (selectedTeam === 'e2d' ? player.equipe : player.equipe) === 'rouge' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'
              }>
                {(selectedTeam === 'e2d' ? player.equipe : player.equipe) ? `Équipe ${(selectedTeam === 'e2d' ? player.equipe : player.equipe)}` : 'Sans équipe'}
              </Badge>
                      <Badge variant="outline">
                        {player.telephone}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editPlayer(player)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun joueur trouvé pour l'équipe {selectedTeam.toUpperCase()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information sur les formations */}
      <Card>
        <CardHeader>
          <CardTitle>Formations Tactiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Les formations tactiques seront disponibles dans une future mise à jour.</p>
            <p className="text-sm mt-2">
              En attendant, vous pouvez gérer les équipes Jaune et Rouge pour les matchs internes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}