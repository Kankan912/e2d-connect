import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Exercice {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  croissance_fond_caisse: number;
  plafond_fond_caisse?: number;
  created_at: string;
}

export default function ExercicesManager() {
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExercice, setEditingExercice] = useState<Exercice | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    date_debut: '',
    date_fin: '',
    croissance_fond_caisse: '5000',
    plafond_fond_caisse: '',
    statut: 'actif'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadExercices();
  }, []);

  const loadExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices((data || []) as Exercice[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de charger les exercices: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.date_debut || !formData.date_fin) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const exerciceData = {
        nom: formData.nom,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
        croissance_fond_caisse: parseFloat(formData.croissance_fond_caisse),
        plafond_fond_caisse: formData.plafond_fond_caisse ? parseFloat(formData.plafond_fond_caisse) : null,
        statut: formData.statut
      };

      const { error } = editingExercice
        ? await supabase
            .from('exercices')
            .update(exerciceData)
            .eq('id', editingExercice.id)
        : await supabase
            .from('exercices')
            .insert([exerciceData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: editingExercice ? "Exercice modifié avec succès" : "Exercice créé avec succès",
      });

      setShowForm(false);
      setEditingExercice(null);
      setFormData({
        nom: '',
        date_debut: '',
        date_fin: '',
        croissance_fond_caisse: '5000',
        plafond_fond_caisse: '',
        statut: 'actif'
      });
      loadExercices();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClotureExercice = async (exerciceId: string) => {
    try {
      const { error } = await supabase
        .from('exercices')
        .update({ statut: 'cloture' })
        .eq('id', exerciceId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Exercice clôturé avec succès",
      });

      loadExercices();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de clôturer: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (exercice: Exercice) => {
    setEditingExercice(exercice);
    setFormData({
      nom: exercice.nom,
      date_debut: exercice.date_debut,
      date_fin: exercice.date_fin,
      croissance_fond_caisse: exercice.croissance_fond_caisse.toString(),
      plafond_fond_caisse: exercice.plafond_fond_caisse?.toString() || '',
      statut: exercice.statut
    });
    setShowForm(true);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Badge className="bg-success text-success-foreground">Actif</Badge>;
      case 'cloture':
        return <Badge variant="secondary">Clôturé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Exercices</h2>
          <p className="text-muted-foreground">Gérez les périodes d'activité de la tontine</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingExercice(null);
              setFormData({
                nom: '',
                date_debut: '',
                date_fin: '',
                croissance_fond_caisse: '5000',
                plafond_fond_caisse: '',
                statut: 'actif'
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Exercice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExercice ? "Modifier l'exercice" : "Créer un exercice"}
              </DialogTitle>
              <DialogDescription>
                {editingExercice 
                  ? "Modifiez les informations de cet exercice."
                  : "Définissez les dates et paramètres du nouvel exercice."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'exercice *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Exercice 2024"
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_debut: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date de fin *</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_fin: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="croissance_fond_caisse">Croissance Fond de Caisse (FCFA)</Label>
                  <Input
                    id="croissance_fond_caisse"
                    type="number"
                    placeholder="5000"
                    value={formData.croissance_fond_caisse}
                    onChange={(e) => setFormData(prev => ({ ...prev, croissance_fond_caisse: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plafond_fond_caisse">Plafond (optionnel)</Label>
                  <Input
                    id="plafond_fond_caisse"
                    type="number"
                    placeholder="50000"
                    value={formData.plafond_fond_caisse}
                    onChange={(e) => setFormData(prev => ({ ...prev, plafond_fond_caisse: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select value={formData.statut} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, statut: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="cloture">Clôturé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingExercice ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Liste des Exercices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Croissance Fond</TableHead>
                <TableHead>Plafond</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercices.map((exercice) => (
                <TableRow key={exercice.id}>
                  <TableCell className="font-medium">{exercice.nom}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Du {new Date(exercice.date_debut).toLocaleDateString('fr-FR')}</div>
                      <div>Au {new Date(exercice.date_fin).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatutBadge(exercice.statut)}</TableCell>
                  <TableCell>{exercice.croissance_fond_caisse.toLocaleString()} FCFA</TableCell>
                  <TableCell>
                    {exercice.plafond_fond_caisse 
                      ? `${exercice.plafond_fond_caisse.toLocaleString()} FCFA`
                      : 'Aucun'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(exercice)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {exercice.statut === 'actif' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClotureExercice(exercice.id)}
                        >
                          <Lock className="w-4 h-4 mr-1" />
                          Clôturer
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {exercices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun exercice créé
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