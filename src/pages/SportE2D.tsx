import { useState, useEffect } from "react";
import { Plus, Edit, Calendar, MapPin, TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SportActivite {
  id: string;
  date_activite: string;
  lieu?: string;
  participants_count: number;
  notes?: string;
}

interface SportDepense {
  id: string;
  libelle: string;
  montant: number;
  date_depense: string;
  justificatif_url?: string;
}

interface SportRecette {
  id: string;
  libelle: string;
  montant: number;
  date_recette: string;
  notes?: string;
}

export default function SportE2D() {
  const [activites, setActivites] = useState<SportActivite[]>([]);
  const [depenses, setDepenses] = useState<SportDepense[]>([]);
  const [recettes, setRecettes] = useState<SportRecette[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiviteDialog, setShowActiviteDialog] = useState(false);
  const [showDepenseDialog, setShowDepenseDialog] = useState(false);
  const [showRecetteDialog, setShowRecetteDialog] = useState(false);
  const [selectedActivite, setSelectedActivite] = useState<SportActivite | null>(null);
  const [selectedDepense, setSelectedDepense] = useState<SportDepense | null>(null);
  const [selectedRecette, setSelectedRecette] = useState<SportRecette | null>(null);
  
  const [activiteFormData, setActiviteFormData] = useState({
    date_activite: "",
    lieu: "",
    participants_count: "",
    notes: ""
  });
  
  const [depenseFormData, setDepenseFormData] = useState({
    libelle: "",
    montant: "",
    date_depense: "",
    notes: ""
  });
  
  const [recetteFormData, setRecetteFormData] = useState({
    libelle: "",
    montant: "",
    date_recette: "",
    notes: ""
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchActivites();
    fetchDepenses();
    fetchRecettes();
  }, []);

  const fetchActivites = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_e2d_activites')
        .select('*')
        .order('date_activite', { ascending: false });

      if (error) throw error;
      setActivites(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les activités",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepenses = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_e2d_depenses')
        .select('*')
        .order('date_depense', { ascending: false });

      if (error) throw error;
      setDepenses(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des dépenses:', error);
    }
  };

  const fetchRecettes = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_e2d_recettes')
        .select('*')
        .order('date_recette', { ascending: false });

      if (error) throw error;
      setRecettes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
    }
  };

  const handleSubmitActivite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activiteFormData.date_activite) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir la date d'activité",
        variant: "destructive",
      });
      return;
    }

    try {
      const activiteData = {
        date_activite: activiteFormData.date_activite,
        lieu: activiteFormData.lieu || null,
        participants_count: activiteFormData.participants_count ? parseInt(activiteFormData.participants_count) : 0,
        notes: activiteFormData.notes || null
      };

      const { error } = selectedActivite
        ? await supabase
            .from('sport_e2d_activites')
            .update(activiteData)
            .eq('id', selectedActivite.id)
        : await supabase
            .from('sport_e2d_activites')
            .insert([activiteData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedActivite ? "Activité modifiée avec succès" : "Activité ajoutée avec succès",
      });

      setShowActiviteDialog(false);
      setSelectedActivite(null);
      setActiviteFormData({ date_activite: "", lieu: "", participants_count: "", notes: "" });
      fetchActivites();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'activité",
        variant: "destructive",
      });
    }
  };

  const handleSubmitDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depenseFormData.libelle || !depenseFormData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const depenseData = {
        libelle: depenseFormData.libelle,
        montant: parseFloat(depenseFormData.montant),
        date_depense: depenseFormData.date_depense || new Date().toISOString().split('T')[0]
      };

      const { error } = selectedDepense
        ? await supabase
            .from('sport_e2d_depenses')
            .update(depenseData)
            .eq('id', selectedDepense.id)
        : await supabase
            .from('sport_e2d_depenses')
            .insert([depenseData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedDepense ? "Dépense modifiée avec succès" : "Dépense ajoutée avec succès",
      });

      setShowDepenseDialog(false);
      setSelectedDepense(null);
      setDepenseFormData({ libelle: "", montant: "", date_depense: "", notes: "" });
      fetchDepenses();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la dépense",
        variant: "destructive",
      });
    }
  };

  const handleSubmitRecette = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recetteFormData.libelle || !recetteFormData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const recetteData = {
        libelle: recetteFormData.libelle,
        montant: parseFloat(recetteFormData.montant),
        date_recette: recetteFormData.date_recette || new Date().toISOString().split('T')[0],
        notes: recetteFormData.notes || null
      };

      const { error } = selectedRecette
        ? await supabase
            .from('sport_e2d_recettes')
            .update(recetteData)
            .eq('id', selectedRecette.id)
        : await supabase
            .from('sport_e2d_recettes')
            .insert([recetteData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedRecette ? "Recette modifiée avec succès" : "Recette ajoutée avec succès",
      });

      setShowRecetteDialog(false);
      setSelectedRecette(null);
      setRecetteFormData({ libelle: "", montant: "", date_recette: "", notes: "" });
      fetchRecettes();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la recette",
        variant: "destructive",
      });
    }
  };

  const openEditActiviteDialog = (activite: SportActivite) => {
    setSelectedActivite(activite);
    setActiviteFormData({
      date_activite: activite.date_activite,
      lieu: activite.lieu || "",
      participants_count: activite.participants_count.toString(),
      notes: activite.notes || ""
    });
    setShowActiviteDialog(true);
  };

  const openEditDepenseDialog = (depense: SportDepense) => {
    setSelectedDepense(depense);
    setDepenseFormData({
      libelle: depense.libelle,
      montant: depense.montant.toString(),
      date_depense: depense.date_depense,
      notes: ""
    });
    setShowDepenseDialog(true);
  };

  const openEditRecetteDialog = (recette: SportRecette) => {
    setSelectedRecette(recette);
    setRecetteFormData({
      libelle: recette.libelle,
      montant: recette.montant.toString(),
      date_recette: recette.date_recette,
      notes: recette.notes || ""
    });
    setShowRecetteDialog(true);
  };

  const totalRecettes = recettes.reduce((sum, recette) => sum + recette.montant, 0);
  const totalDepenses = depenses.reduce((sum, depense) => sum + depense.montant, 0);
  const solde = totalRecettes - totalDepenses;
  const totalParticipants = activites.reduce((sum, activite) => sum + activite.participants_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sport E2D</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des activités sportives hebdomadaires (Football le dimanche)
          </p>
        </div>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activités</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activites.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalRecettes.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {solde.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activites">Activités</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="activites" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Enregistrez les séances de football hebdomadaires et les matchs
            </p>
            
            <div className="flex gap-2">
              <Dialog open={showActiviteDialog} onOpenChange={setShowActiviteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => {
                    setSelectedActivite(null);
                    setActiviteFormData({ date_activite: "", lieu: "", participants_count: "", notes: "" });
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle Activité
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedActivite ? "Modifier l'activité" : "Ajouter une activité"}
                    </DialogTitle>
                    <DialogDescription>
                      Enregistrez une séance de football
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitActivite} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_activite">Date d'activité *</Label>
                      <Input
                        id="date_activite"
                        type="date"
                        value={activiteFormData.date_activite}
                        onChange={(e) => setActiviteFormData(prev => ({ ...prev, date_activite: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lieu">Lieu</Label>
                      <Input
                        id="lieu"
                        placeholder="Ex: Terrain municipal, Stade..."
                        value={activiteFormData.lieu}
                        onChange={(e) => setActiviteFormData(prev => ({ ...prev, lieu: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="participants">Nombre de participants</Label>
                      <Input
                        id="participants"
                        type="number"
                        placeholder="Ex: 15"
                        value={activiteFormData.participants_count}
                        onChange={(e) => setActiviteFormData(prev => ({ ...prev, participants_count: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Notes sur la séance..."
                        value={activiteFormData.notes}
                        onChange={(e) => setActiviteFormData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowActiviteDialog(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {selectedActivite ? "Modifier" : "Ajouter"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button onClick={() => {
                // TODO: Ouvrir dialogue de match E2D
                toast({
                  title: "À venir",
                  description: "Fonctionnalité de gestion des matchs E2D en cours de développement",
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Match
              </Button>
            </div>
          </div>

          {/* Liste des activités */}
          <div className="grid gap-4">
            {activites.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Aucune activité enregistrée</p>
                  <p className="text-sm text-muted-foreground">Ajoutez la première activité pour commencer</p>
                </CardContent>
              </Card>
            ) : (
              activites.map((activite) => (
                <Card key={activite.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          {format(new Date(activite.date_activite), "EEEE dd MMMM yyyy", { locale: fr })}
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {activite.lieu || "Lieu non spécifié"}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {activite.participants_count}
                        </p>
                        <p className="text-sm text-muted-foreground">participants</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activite.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{activite.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditActiviteDialog(activite)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="finances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">Recettes</CardTitle>
                <CardDescription>{totalRecettes.toLocaleString()} FCFA</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showRecetteDialog} onOpenChange={setShowRecetteDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => {
                      setSelectedRecette(null);
                      setRecetteFormData({ libelle: "", montant: "", date_recette: "", notes: "" });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter Recette
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {selectedRecette ? "Modifier la recette" : "Ajouter une recette"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitRecette} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="libelle_recette">Libellé *</Label>
                        <Input
                          id="libelle_recette"
                          placeholder="Ex: Cotisation sport, Don..."
                          value={recetteFormData.libelle}
                          onChange={(e) => setRecetteFormData(prev => ({ ...prev, libelle: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="montant_recette">Montant (FCFA) *</Label>
                        <Input
                          id="montant_recette"
                          type="number"
                          placeholder="Ex: 5000"
                          value={recetteFormData.montant}
                          onChange={(e) => setRecetteFormData(prev => ({ ...prev, montant: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date_recette">Date</Label>
                        <Input
                          id="date_recette"
                          type="date"
                          value={recetteFormData.date_recette}
                          onChange={(e) => setRecetteFormData(prev => ({ ...prev, date_recette: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notes_recette">Notes</Label>
                        <Textarea
                          id="notes_recette"
                          placeholder="Notes..."
                          value={recetteFormData.notes}
                          onChange={(e) => setRecetteFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowRecetteDialog(false)}>
                          Annuler
                        </Button>
                        <Button type="submit">
                          {selectedRecette ? "Modifier" : "Ajouter"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Dépenses</CardTitle>
                <CardDescription>{totalDepenses.toLocaleString()} FCFA</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showDepenseDialog} onOpenChange={setShowDepenseDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => {
                      setSelectedDepense(null);
                      setDepenseFormData({ libelle: "", montant: "", date_depense: "", notes: "" });
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter Dépense
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {selectedDepense ? "Modifier la dépense" : "Ajouter une dépense"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitDepense} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="libelle_depense">Libellé *</Label>
                        <Input
                          id="libelle_depense"
                          placeholder="Ex: Équipement, Terrain..."
                          value={depenseFormData.libelle}
                          onChange={(e) => setDepenseFormData(prev => ({ ...prev, libelle: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="montant_depense">Montant (FCFA) *</Label>
                        <Input
                          id="montant_depense"
                          type="number"
                          placeholder="Ex: 15000"
                          value={depenseFormData.montant}
                          onChange={(e) => setDepenseFormData(prev => ({ ...prev, montant: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="date_depense">Date</Label>
                        <Input
                          id="date_depense"
                          type="date"
                          value={depenseFormData.date_depense}
                          onChange={(e) => setDepenseFormData(prev => ({ ...prev, date_depense: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowDepenseDialog(false)}>
                          Annuler
                        </Button>
                        <Button type="submit">
                          {selectedDepense ? "Modifier" : "Ajouter"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className={`text-lg ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Solde
                </CardTitle>
                <CardDescription>{solde.toLocaleString()} FCFA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {solde >= 0 ? 'Excédent' : 'Déficit'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listes des transactions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recettes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Dernières Recettes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recettes.slice(0, 5).map((recette) => (
                    <div key={recette.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{recette.libelle}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(recette.date_recette), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+{recette.montant.toLocaleString()} FCFA</p>
                        <Button variant="ghost" size="sm" onClick={() => openEditRecetteDialog(recette)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dépenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                  Dernières Dépenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {depenses.slice(0, 5).map((depense) => (
                    <div key={depense.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{depense.libelle}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(depense.date_depense), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">-{depense.montant.toLocaleString()} FCFA</p>
                        <Button variant="ghost" size="sm" onClick={() => openEditDepenseDialog(depense)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}