import { useState, useEffect } from "react";
import { Plus, Edit, TrendingUp, PiggyBank, DollarSign, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Epargne {
  id: string;
  membre_id: string;
  montant: number;
  date_depot: string;
  exercice_id?: string;
  statut: string;
  notes?: string;
  membres?: {
    nom: string;
    prenom: string;
  };
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface Exercice {
  id: string;
  nom: string;
  date_debut: string;
  date_fin: string;
  statut: string;
}

export default function Epargnes() {
  const [epargnes, setEpargnes] = useState<Epargne[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEpargne, setSelectedEpargne] = useState<Epargne | null>(null);
  const [formData, setFormData] = useState({
    membre_id: "",
    montant: "",
    exercice_id: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEpargnes();
    fetchMembres();
    fetchExercices();
  }, []);

  const fetchEpargnes = async () => {
    try {
      const { data, error } = await supabase
        .from('epargnes')
        .select(`
          *,
          membres!membre_id (
            nom,
            prenom
          )
        `)
        .order('date_depot', { ascending: false });

      if (error) throw error;
      setEpargnes(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les épargnes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const fetchExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const epargneData = {
        membre_id: formData.membre_id,
        montant: parseFloat(formData.montant),
        exercice_id: formData.exercice_id || null,
        notes: formData.notes || null,
        statut: 'actif'
      };

      const { error } = selectedEpargne
        ? await supabase
            .from('epargnes')
            .update(epargneData)
            .eq('id', selectedEpargne.id)
        : await supabase
            .from('epargnes')
            .insert([epargneData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedEpargne ? "Épargne modifiée avec succès" : "Épargne ajoutée avec succès",
      });

      setShowAddDialog(false);
      setSelectedEpargne(null);
      setFormData({ membre_id: "", montant: "", exercice_id: "", notes: "" });
      fetchEpargnes();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'épargne",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (epargne: Epargne) => {
    setSelectedEpargne(epargne);
    setFormData({
      membre_id: epargne.membre_id,
      montant: epargne.montant.toString(),
      exercice_id: epargne.exercice_id || "",
      notes: epargne.notes || ""
    });
    setShowAddDialog(true);
  };

  const totalEpargnes = epargnes.reduce((sum, epargne) => sum + epargne.montant, 0);
  const epargnesActives = epargnes.filter(e => e.statut === 'actif');

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
          <h1 className="text-3xl font-bold text-foreground">Banque E2D - Épargnes</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les épargnes des membres avec intérêts en fin d'exercice
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedEpargne(null);
              setFormData({ membre_id: "", montant: "", exercice_id: "", notes: "" });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Épargne
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedEpargne ? "Modifier l'épargne" : "Ajouter une épargne"}
              </DialogTitle>
              <DialogDescription>
                Enregistrez un dépôt d'épargne pour un membre
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="membre">Membre *</Label>
                <Select value={formData.membre_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, membre_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.prenom} {membre.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="montant">Montant (FCFA) *</Label>
                <Input
                  id="montant"
                  type="number"
                  placeholder="Ex: 25000"
                  value={formData.montant}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercice">Exercice (optionnel)</Label>
                <Select value={formData.exercice_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, exercice_id: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un exercice" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercices.map((exercice) => (
                      <SelectItem key={exercice.id} value={exercice.id}>
                        {exercice.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes additionnelles..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedEpargne ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Épargnes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEpargnes.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre d'Épargnants</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(epargnes.map(e => e.membre_id)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargnes Actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {epargnesActives.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par Membre</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {epargnes.length > 0 ? Math.round(totalEpargnes / new Set(epargnes.map(e => e.membre_id)).size).toLocaleString() : 0} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information sur les intérêts */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Information sur les Intérêts</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p>
            Les épargnes sont rémunérées en fin d'exercice avec les intérêts provenant des revenus des prêts,
            répartis au prorata du montant épargné par chaque membre.
          </p>
        </CardContent>
      </Card>

      {/* Liste des épargnes */}
      <div className="grid gap-4">
        {epargnes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Aucune épargne enregistrée</p>
              <p className="text-sm text-muted-foreground">Ajoutez la première épargne pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          epargnes.map((epargne) => (
            <Card key={epargne.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {epargne.membres?.prenom} {epargne.membres?.nom}
                    </CardTitle>
                    <CardDescription>
                      Dépôt du {format(new Date(epargne.date_depot), "dd MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {epargne.montant.toLocaleString()} FCFA
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {epargne.statut}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {epargne.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{epargne.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(epargne)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}