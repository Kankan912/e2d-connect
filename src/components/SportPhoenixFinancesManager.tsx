import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

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

export default function SportPhoenixFinancesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRecetteDialog, setShowRecetteDialog] = useState(false);
  const [showDepenseDialog, setShowDepenseDialog] = useState(false);

  // Real-time updates
  useRealtimeUpdates({
    table: 'sport_phoenix_recettes',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-phoenix-recettes'] });
    }
  });

  useRealtimeUpdates({
    table: 'sport_phoenix_depenses',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-phoenix-depenses'] });
    }
  });

  const [recetteForm, setRecetteForm] = useState({
    libelle: "",
    montant: "",
    date_recette: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const [depenseForm, setDepenseForm] = useState({
    libelle: "",
    montant: "",
    date_depense: new Date().toISOString().split('T')[0],
    justificatif_url: ""
  });

  // Queries
  const { data: recettes = [] } = useQuery({
    queryKey: ['sport-phoenix-recettes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_recettes')
        .select('*')
        .order('date_recette', { ascending: false });
      if (error) throw error;
      return data as Recette[];
    }
  });

  const { data: depenses = [] } = useQuery({
    queryKey: ['sport-phoenix-depenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_depenses')
        .select('*')
        .order('date_depense', { ascending: false });
      if (error) throw error;
      return data as Depense[];
    }
  });

  // Mutations
  const createRecetteMutation = useMutation({
    mutationFn: async (newRecette: any) => {
      const { error } = await supabase
        .from('sport_phoenix_recettes')
        .insert([newRecette]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-phoenix-recettes'] });
      toast({ title: "Succès", description: "Recette ajoutée avec succès" });
      setShowRecetteDialog(false);
      setRecetteForm({
        libelle: "",
        montant: "",
        date_recette: new Date().toISOString().split('T')[0],
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createDepenseMutation = useMutation({
    mutationFn: async (newDepense: any) => {
      const { error } = await supabase
        .from('sport_phoenix_depenses')
        .insert([newDepense]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-phoenix-depenses'] });
      toast({ title: "Succès", description: "Dépense ajoutée avec succès" });
      setShowDepenseDialog(false);
      setDepenseForm({
        libelle: "",
        montant: "",
        date_depense: new Date().toISOString().split('T')[0],
        justificatif_url: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handlers
  const handleRecetteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRecetteMutation.mutate({
      libelle: recetteForm.libelle,
      montant: parseFloat(recetteForm.montant),
      date_recette: recetteForm.date_recette,
      notes: recetteForm.notes || null
    });
  };

  const handleDepenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDepenseMutation.mutate({
      libelle: depenseForm.libelle,
      montant: parseFloat(depenseForm.montant),
      date_depense: depenseForm.date_depense,
      justificatif_url: depenseForm.justificatif_url || null
    });
  };

  // Calculations
  const totalRecettes = recettes.reduce((sum, r) => sum + Number(r.montant || 0), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalRecettes.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalDepenses.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {solde.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recettes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recettes">Recettes</TabsTrigger>
          <TabsTrigger value="depenses">Dépenses</TabsTrigger>
        </TabsList>

        <TabsContent value="recettes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recettes Phoenix</CardTitle>
              <Dialog open={showRecetteDialog} onOpenChange={setShowRecetteDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une recette
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle recette</DialogTitle>
                    <DialogDescription>
                      Ajouter une nouvelle recette pour Sport Phoenix
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRecetteSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="libelle">Libellé *</Label>
                      <Input
                        id="libelle"
                        value={recetteForm.libelle}
                        onChange={(e) => setRecetteForm(prev => ({ ...prev, libelle: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="montant">Montant (FCFA) *</Label>
                      <Input
                        id="montant"
                        type="number"
                        value={recetteForm.montant}
                        onChange={(e) => setRecetteForm(prev => ({ ...prev, montant: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_recette">Date *</Label>
                      <Input
                        id="date_recette"
                        type="date"
                        value={recetteForm.date_recette}
                        onChange={(e) => setRecetteForm(prev => ({ ...prev, date_recette: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={recetteForm.notes}
                        onChange={(e) => setRecetteForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowRecetteDialog(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">Ajouter</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {recettes.length > 0 ? (
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
                    {recettes.map((recette) => (
                      <TableRow key={recette.id}>
                        <TableCell>{recette.libelle}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {Number(recette.montant).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>{new Date(recette.date_recette).toLocaleDateString()}</TableCell>
                        <TableCell>{recette.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune recette enregistrée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depenses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dépenses Phoenix</CardTitle>
              <Dialog open={showDepenseDialog} onOpenChange={setShowDepenseDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une dépense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle dépense</DialogTitle>
                    <DialogDescription>
                      Ajouter une nouvelle dépense pour Sport Phoenix
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDepenseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="libelle_depense">Libellé *</Label>
                      <Input
                        id="libelle_depense"
                        value={depenseForm.libelle}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, libelle: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="montant_depense">Montant (FCFA) *</Label>
                      <Input
                        id="montant_depense"
                        type="number"
                        value={depenseForm.montant}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, montant: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_depense">Date *</Label>
                      <Input
                        id="date_depense"
                        type="date"
                        value={depenseForm.date_depense}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, date_depense: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="justificatif_url">URL Justificatif</Label>
                      <Input
                        id="justificatif_url"
                        type="url"
                        value={depenseForm.justificatif_url}
                        onChange={(e) => setDepenseForm(prev => ({ ...prev, justificatif_url: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowDepenseDialog(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">Ajouter</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {depenses.length > 0 ? (
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
                    {depenses.map((depense) => (
                      <TableRow key={depense.id}>
                        <TableCell>{depense.libelle}</TableCell>
                        <TableCell className="font-medium text-red-600">
                          {Number(depense.montant).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>{new Date(depense.date_depense).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {depense.justificatif_url ? (
                            <a href={depense.justificatif_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Voir
                            </a>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune dépense enregistrée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}