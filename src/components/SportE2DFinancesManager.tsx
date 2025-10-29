import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface Recette {
  id: string;
  libelle: string;
  montant: number;
  date_recette: string;
  notes?: string;
}

interface Depense {
  id: string;
  libelle: string;
  montant: number;
  date_depense: string;
  justificatif_url?: string;
}

interface RecetteFormData {
  libelle: string;
  montant: string;
  date_recette: string;
  notes: string;
}

interface DepenseFormData {
  libelle: string;
  montant: string;
  date_depense: string;
  justificatif_url: string;
}

export default function SportE2DFinancesManager() {
  const [recetteDialogOpen, setRecetteDialogOpen] = useState(false);
  const [depenseDialogOpen, setDepenseDialogOpen] = useState(false);
  const [recetteForm, setRecetteForm] = useState({
    libelle: '',
    montant: '',
    date_recette: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [depenseForm, setDepenseForm] = useState({
    libelle: '',
    montant: '',
    date_depense: new Date().toISOString().split('T')[0],
    justificatif_url: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time updates
  useRealtimeUpdates({
    table: 'sport_e2d_recettes',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-e2d-recettes'] });
    }
  });

  useRealtimeUpdates({
    table: 'sport_e2d_depenses',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-e2d-depenses'] });
    }
  });

  const { data: recettes } = useQuery({
    queryKey: ['sport-e2d-recettes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_recettes')
        .select('*')
        .order('date_recette', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: depenses } = useQuery({
    queryKey: ['sport-e2d-depenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_depenses')
        .select('*')
        .order('date_depense', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createRecetteMutation = useMutation({
    mutationFn: async (recetteData: RecetteFormData) => {
      const { error } = await supabase
        .from('sport_e2d_recettes')
        .insert([{
          ...recetteData,
          montant: parseFloat(recetteData.montant)
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-e2d-recettes'] });
      toast({
        title: "Recette ajoutée",
        description: "La recette a été enregistrée avec succès.",
      });
      setRecetteDialogOpen(false);
      setRecetteForm({
        libelle: '',
        montant: '',
        date_recette: new Date().toISOString().split('T')[0],
        notes: ''
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la recette: " + errorMessage,
        variant: "destructive",
      });
    }
  });

  const createDepenseMutation = useMutation({
    mutationFn: async (depenseData: DepenseFormData) => {
      const { error } = await supabase
        .from('sport_e2d_depenses')
        .insert([{
          ...depenseData,
          montant: parseFloat(depenseData.montant)
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-e2d-depenses'] });
      toast({
        title: "Dépense ajoutée",
        description: "La dépense a été enregistrée avec succès.",
      });
      setDepenseDialogOpen(false);
      setDepenseForm({
        libelle: '',
        montant: '',
        date_depense: new Date().toISOString().split('T')[0],
        justificatif_url: ''
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la dépense: " + errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleRecetteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecetteMutation.mutate(recetteForm);
  };

  const handleDepenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDepenseMutation.mutate(depenseForm);
  };

  const totalRecettes = recettes?.reduce((sum, r) => sum + Number(r.montant), 0) || 0;
  const totalDepenses = depenses?.reduce((sum, d) => sum + Number(d.montant), 0) || 0;
  const solde = totalRecettes - totalDepenses;

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalRecettes.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {recettes?.length || 0} recette(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalDepenses.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              {depenses?.length || 0} dépense(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <DollarSign className={`h-4 w-4 ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {solde.toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground">
              Différence recettes/dépenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des transactions */}
      <Tabs defaultValue="recettes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recettes" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recettes
          </TabsTrigger>
          <TabsTrigger value="depenses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Dépenses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recettes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recettes E2D</CardTitle>
                <Dialog open={recetteDialogOpen} onOpenChange={setRecetteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une recette
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle Recette</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleRecetteSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="libelle">Libellé</Label>
                        <Input
                          id="libelle"
                          value={recetteForm.libelle}
                          onChange={(e) => setRecetteForm({ ...recetteForm, libelle: e.target.value })}
                          placeholder="Description de la recette"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="montant">Montant (FCFA)</Label>
                          <Input
                            id="montant"
                            type="number"
                            min="0"
                            step="0.01"
                            value={recetteForm.montant}
                            onChange={(e) => setRecetteForm({ ...recetteForm, montant: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="date_recette">Date</Label>
                          <Input
                            id="date_recette"
                            type="date"
                            value={recetteForm.date_recette}
                            onChange={(e) => setRecetteForm({ ...recetteForm, date_recette: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={recetteForm.notes}
                          onChange={(e) => setRecetteForm({ ...recetteForm, notes: e.target.value })}
                          placeholder="Notes optionnelles..."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setRecetteDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createRecetteMutation.isPending}>
                          {createRecetteMutation.isPending ? 'Ajout...' : 'Ajouter'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recettes?.map((recette) => (
                    <TableRow key={recette.id}>
                      <TableCell className="font-medium">{recette.libelle}</TableCell>
                      <TableCell className="text-green-600 font-bold">
                        +{Number(recette.montant).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(recette.date_recette).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {recette.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!recettes || recettes.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucune recette enregistrée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dépenses E2D</CardTitle>
                <Dialog open={depenseDialogOpen} onOpenChange={setDepenseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une dépense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvelle Dépense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDepenseSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="libelle">Libellé</Label>
                        <Input
                          id="libelle"
                          value={depenseForm.libelle}
                          onChange={(e) => setDepenseForm({ ...depenseForm, libelle: e.target.value })}
                          placeholder="Description de la dépense"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="montant">Montant (FCFA)</Label>
                          <Input
                            id="montant"
                            type="number"
                            min="0"
                            step="0.01"
                            value={depenseForm.montant}
                            onChange={(e) => setDepenseForm({ ...depenseForm, montant: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="date_depense">Date</Label>
                          <Input
                            id="date_depense"
                            type="date"
                            value={depenseForm.date_depense}
                            onChange={(e) => setDepenseForm({ ...depenseForm, date_depense: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="justificatif_url">URL du justificatif</Label>
                        <Input
                          id="justificatif_url"
                          type="url"
                          value={depenseForm.justificatif_url}
                          onChange={(e) => setDepenseForm({ ...depenseForm, justificatif_url: e.target.value })}
                          placeholder="Lien vers le justificatif (optionnel)"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setDepenseDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createDepenseMutation.isPending}>
                          {createDepenseMutation.isPending ? 'Ajout...' : 'Ajouter'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Justificatif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depenses?.map((depense) => (
                    <TableRow key={depense.id}>
                      <TableCell className="font-medium">{depense.libelle}</TableCell>
                      <TableCell className="text-red-600 font-bold">
                        -{Number(depense.montant).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(depense.date_depense).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {depense.justificatif_url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={depense.justificatif_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1" />
                              Voir
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!depenses || depenses.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Aucune dépense enregistrée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}