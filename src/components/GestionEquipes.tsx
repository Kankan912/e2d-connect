import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Shield, Target, Zap, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from '@/components/LogoHeader';

interface Player {
  id: string;
  nom: string;
  prenom: string;
  position: string;
  numeroMaillot: number;
  statut: 'titulaire' | 'remplacant' | 'blesse' | 'suspendu';
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
}

interface Formation {
  id: string;
  name: string;
  formation: string; // ex: "4-4-2"
  description?: string;
  positions: FormationPosition[];
}

interface FormationPosition {
  position: string;
  x: number; // Position sur le terrain (0-100)
  y: number; // Position sur le terrain (0-100)
  playerId?: string;
}

const POSITIONS = [
  'Gardien', 'Défenseur Central', 'Défenseur Droit', 'Défenseur Gauche',
  'Milieu Défensif', 'Milieu Central', 'Milieu Offensif', 'Ailier Droit', 'Ailier Gauche',
  'Attaquant', 'Buteur'
];

const FORMATIONS_PRESET = [
  { name: '4-4-2', formation: '4-4-2', positions: [
    { position: 'Gardien', x: 50, y: 5 },
    { position: 'Défenseur Gauche', x: 20, y: 20 },
    { position: 'Défenseur Central', x: 40, y: 20 },
    { position: 'Défenseur Central', x: 60, y: 20 },
    { position: 'Défenseur Droit', x: 80, y: 20 },
    { position: 'Milieu Gauche', x: 20, y: 50 },
    { position: 'Milieu Central', x: 40, y: 50 },
    { position: 'Milieu Central', x: 60, y: 50 },
    { position: 'Milieu Droit', x: 80, y: 50 },
    { position: 'Attaquant', x: 35, y: 80 },
    { position: 'Attaquant', x: 65, y: 80 }
  ]},
  { name: '4-3-3', formation: '4-3-3', positions: [
    { position: 'Gardien', x: 50, y: 5 },
    { position: 'Défenseur Gauche', x: 20, y: 20 },
    { position: 'Défenseur Central', x: 40, y: 20 },
    { position: 'Défenseur Central', x: 60, y: 20 },
    { position: 'Défenseur Droit', x: 80, y: 20 },
    { position: 'Milieu Défensif', x: 50, y: 40 },
    { position: 'Milieu Central', x: 35, y: 55 },
    { position: 'Milieu Central', x: 65, y: 55 },
    { position: 'Ailier Gauche', x: 20, y: 75 },
    { position: 'Buteur', x: 50, y: 80 },
    { position: 'Ailier Droit', x: 80, y: 75 }
  ]}
];

export default function GestionEquipes() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showFormationForm, setShowFormationForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'e2d' | 'phoenix'>('e2d');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [playerForm, setPlayerForm] = useState({
    nom: '',
    prenom: '',
    position: '',
    numeroMaillot: 0,
    statut: 'titulaire' as const
  });

  const [formationForm, setFormationForm] = useState({
    name: '',
    formation: '',
    description: '',
    preset: ''
  });

  useEffect(() => {
    loadData();
  }, [selectedTeam]);

  const loadData = async () => {
    try {
      const [membresRes, formationsRes] = await Promise.all([
        supabase
          .from('membres')
          .select('*')
          .eq(selectedTeam === 'e2d' ? 'est_membre_e2d' : 'est_adherent_phoenix', true)
          .eq('statut', 'actif'),
        Promise.resolve({ data: [] })
      ]);

      const playersWithPositions = (membresRes.data || []).map(membre => ({
        ...membre,
        position: 'Non définie',
        numeroMaillot: 0,
        statut: 'titulaire' as const
      }));

      setPlayers(playersWithPositions);
      setFormations(formationsRes.data || []);
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
            position: playerForm.position,
            numero_maillot: playerForm.numeroMaillot,
            statut_sportif: playerForm.statut
          })
          .eq('id', editingPlayer.id);

        if (error) throw error;
        toast({ title: 'Succès', description: 'Joueur mis à jour' });
      }

      await loadData();
      setShowPlayerForm(false);
      setEditingPlayer(null);
      setPlayerForm({ nom: '', prenom: '', position: '', numeroMaillot: 0, statut: 'titulaire' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la sauvegarde', variant: 'destructive' });
    }
  };

  const handleFormationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let positions: FormationPosition[] = [];
      
      if (formationForm.preset) {
        const preset = FORMATIONS_PRESET.find(f => f.formation === formationForm.preset);
        if (preset) {
          positions = preset.positions;
        }
      }

      const { error } = await supabase
        .from('formations_tactiques')
        .insert([{
          name: formationForm.name,
          formation: formationForm.formation,
          description: formationForm.description,
          positions: positions,
          equipe: selectedTeam
        }]);

      if (error) throw error;
      
      await loadData();
      toast({ title: 'Succès', description: 'Formation créée' });
      setShowFormationForm(false);
      setFormationForm({ name: '', formation: '', description: '', preset: '' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la création', variant: 'destructive' });
    }
  };

  const editPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      nom: player.nom,
      prenom: player.prenom,
      position: player.position,
      numeroMaillot: player.numeroMaillot,
      statut: player.statut
    });
    setShowPlayerForm(true);
  };

  const getPositionColor = (position: string) => {
    if (position.includes('Gardien')) return 'bg-yellow-100 text-yellow-800';
    if (position.includes('Défenseur')) return 'bg-blue-100 text-blue-800';
    if (position.includes('Milieu')) return 'bg-green-100 text-green-800';
    if (position.includes('Attaquant') || position.includes('Ailier') || position.includes('Buteur')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'titulaire': return 'bg-green-100 text-green-800';
      case 'remplacant': return 'bg-blue-100 text-blue-800';
      case 'blesse': return 'bg-red-100 text-red-800';
      case 'suspendu': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <CardTitle className="text-sm font-medium">Titulaires</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.statut === 'titulaire').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remplaçants</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {players.filter(p => p.statut === 'remplacant').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des joueurs et formations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des joueurs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Effectif {selectedTeam.toUpperCase()}</CardTitle>
              <Dialog open={showPlayerForm} onOpenChange={setShowPlayerForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier un joueur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPlayer ? 'Modifier le joueur' : 'Ajouter un joueur'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handlePlayerSubmit} className="space-y-4">
                    {editingPlayer && (
                      <div className="p-3 bg-muted rounded-lg">
                        <strong>{editingPlayer.prenom} {editingPlayer.nom}</strong>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select 
                        value={playerForm.position} 
                        onValueChange={(value) => setPlayerForm(prev => ({ ...prev, position: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une position" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map(position => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Numéro de maillot</Label>
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={playerForm.numeroMaillot}
                        onChange={(e) => setPlayerForm(prev => ({ 
                          ...prev, 
                          numeroMaillot: parseInt(e.target.value) || 0 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select 
                        value={playerForm.statut} 
                        onValueChange={(value: any) => setPlayerForm(prev => ({ ...prev, statut: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="titulaire">Titulaire</SelectItem>
                          <SelectItem value="remplacant">Remplaçant</SelectItem>
                          <SelectItem value="blesse">Blessé</SelectItem>
                          <SelectItem value="suspendu">Suspendu</SelectItem>
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
                      {player.numeroMaillot > 0 && (
                        <Badge variant="outline">#{player.numeroMaillot}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPositionColor(player.position)}>
                        {player.position}
                      </Badge>
                      <Badge className={getStatutColor(player.statut)}>
                        {player.statut}
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

        {/* Formations tactiques */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Formations Tactiques</CardTitle>
              <Dialog open={showFormationForm} onOpenChange={setShowFormationForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle formation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une formation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleFormationSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nom de la formation</Label>
                      <Input
                        value={formationForm.name}
                        onChange={(e) => setFormationForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Formation offensive"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Schéma tactique</Label>
                      <Select 
                        value={formationForm.preset} 
                        onValueChange={(value) => {
                          setFormationForm(prev => ({ 
                            ...prev, 
                            preset: value, 
                            formation: value 
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un schéma" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMATIONS_PRESET.map(formation => (
                            <SelectItem key={formation.formation} value={formation.formation}>
                              {formation.formation} - {formation.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formationForm.description}
                        onChange={(e) => setFormationForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de la tactique..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        <Save className="h-4 w-4 mr-2" />
                        Créer
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowFormationForm(false)}>
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
              {formations.map(formation => (
                <Card key={formation.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{formation.name}</h3>
                      <Badge variant="outline">{formation.formation}</Badge>
                    </div>
                    {formation.description && (
                      <p className="text-sm text-muted-foreground">{formation.description}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedFormation(formation)}
                      >
                        Visualiser
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {formations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune formation créée. Commencez par créer votre première formation tactique.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualisation du terrain */}
      {selectedFormation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Formation: {selectedFormation.name} ({selectedFormation.formation})
              <Button variant="outline" onClick={() => setSelectedFormation(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="relative bg-green-100 border-2 border-green-400 mx-auto"
              style={{ width: '600px', height: '400px' }}
            >
              {/* Lignes du terrain */}
              <div className="absolute inset-0">
                {/* Ligne médiane */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                {/* Cercle central */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
                {/* Surface de réparation */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white border-b-0"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white border-t-0"></div>
              </div>
              
              {/* Positions des joueurs */}
              {selectedFormation.positions.map((pos, index) => (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`
                  }}
                  title={pos.position}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            
            {/* Légende des positions */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              {selectedFormation.positions.map((pos, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span>{pos.position}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}