import { useState, useEffect } from "react";
import { Plus, Edit, TrendingUp, PiggyBank, DollarSign, Calculator, Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import LogoHeader from "@/components/LogoHeader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { ExportService } from '@/lib/exportService';

interface Epargne {
  id: string;
  membre_id: string;
  montant: number;
  date_depot: string;
  exercice_id?: string;
  reunion_id?: string;
  statut: string;
  notes?: string;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface Reunion {
  id: string;
  sujet: string;
  date_reunion: string;
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
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedEpargne, setSelectedEpargne] = useState<Epargne | null>(null);
  const [filtres, setFiltres] = useState({
    dateDebut: "",
    dateFin: "",
    membreId: "",
    exerciceId: "",
    montantMin: "",
    montantMax: ""
  });
  const [formData, setFormData] = useState({
    membre_id: "",
    montant: "",
    reunion_id: "",
    exercice_id: "",
    notes: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEpargnes();
    fetchMembres();
    fetchReunions();
    fetchExercices();
  }, []);

  const fetchEpargnes = async () => {
    try {
      // Charger toutes les épargnes
      const { data: epargnesToutes, error: epargnesToutesError } = await supabase
        .from('epargnes')
        .select('*')
        .order('date_depot', { ascending: false });

      if (epargnesToutesError) throw epargnesToutesError;

      // Charger séparément les membres
      const membreIds = [...new Set(epargnesToutes?.map(e => e.membre_id) || [])];
      const { data: membresData } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .in('id', membreIds);

      // Joindre manuellement
      const epargnesToutesWithMembers = (epargnesToutes || []).map(epargne => ({
        ...epargne,
        membres: membresData?.find(m => m.id === epargne.membre_id) || { nom: '', prenom: '' }
      }));

      setEpargnes(epargnesToutesWithMembers);
    } catch (error) {
      console.error("Erreur lors du chargement des épargnes:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les épargnes",
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

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select('id, sujet, date_reunion')
        .order('date_reunion', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReunions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des réunions:', error);
    }
  };

  const fetchExercices = async () => {
    try {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, date_debut, date_fin, statut')
        .order('date_debut', { ascending: false });

      if (error) throw error;
      setExercices(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des exercices:', error);
    }
  };

  // Mises à jour temps réel
  useRealtimeUpdates({
    table: 'epargnes',
    onUpdate: fetchEpargnes,
    enabled: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant || !formData.reunion_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires (membre, montant et réunion)",
        variant: "destructive",
      });
      return;
    }

    try {
      const epargneData = {
        membre_id: formData.membre_id,
        montant: parseFloat(formData.montant),
        reunion_id: formData.reunion_id || null,
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
      setFormData({ membre_id: "", montant: "", reunion_id: "", exercice_id: "", notes: "" });
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
      reunion_id: epargne.reunion_id || "",
      exercice_id: epargne.exercice_id || "",
      notes: epargne.notes || ""
    });
    setShowAddDialog(true);
  };

  const totalEpargnes = epargnes.reduce((sum, epargne) => sum + epargne.montant, 0);
  const epargnesActives = epargnes.filter(e => e.statut === 'actif');

  // Fonction de filtrage avancé
  const epargneFiltrees = epargnes.filter(epargne => {
    // Filtre par date
    if (filtres.dateDebut && new Date(epargne.date_depot) < new Date(filtres.dateDebut)) {
      return false;
    }
    if (filtres.dateFin && new Date(epargne.date_depot) > new Date(filtres.dateFin)) {
      return false;
    }
    
    // Filtre par membre
    if (filtres.membreId && epargne.membre_id !== filtres.membreId) {
      return false;
    }
    
    // Filtre par exercice
    if (filtres.exerciceId && epargne.exercice_id !== filtres.exerciceId) {
      return false;
    }
    
    // Filtre par montant minimum
    if (filtres.montantMin && epargne.montant < parseFloat(filtres.montantMin)) {
      return false;
    }
    
    // Filtre par montant maximum
    if (filtres.montantMax && epargne.montant > parseFloat(filtres.montantMax)) {
      return false;
    }
    
    return true;
  });

  const totalFiltre = epargneFiltrees.reduce((sum, e) => sum + e.montant, 0);
  const epargnantsUniques = new Set(epargneFiltrees.map(e => e.membre_id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Banque E2D - Épargnes"
            subtitle="Gérez les épargnes des membres avec intérêts en fin d'exercice"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/epargnes/benefices')} variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Voir les Bénéficiaires
          </Button>
          <Button variant="outline" onClick={async () => {
            await ExportService.export({
              format: 'pdf',
              title: 'Liste des Épargnes',
              data: epargnes.map(e => ({
                Membre: `${e.membres?.prenom} ${e.membres?.nom}`,
                Montant: `${e.montant} FCFA`,
                Date: new Date(e.date_depot).toLocaleDateString(),
                Statut: e.statut
              })),
              columns: [
                { header: 'Membre', dataKey: 'Membre' },
                { header: 'Montant', dataKey: 'Montant' },
                { header: 'Date', dataKey: 'Date' },
                { header: 'Statut', dataKey: 'Statut' }
              ],
              metadata: { author: 'E2D', dateGeneration: new Date(), association: 'Association E2D' }
            });
          }}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Panneau de filtres avancés */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtres Avancés
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setFiltres({
                dateDebut: "",
                dateFin: "",
                membreId: "",
                exerciceId: "",
                montantMin: "",
                montantMax: ""
              })}
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filtre par période */}
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={filtres.dateDebut}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateDebut: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFin">Date fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={filtres.dateFin}
                onChange={(e) => setFiltres(prev => ({ ...prev, dateFin: e.target.value }))}
              />
            </div>

            {/* Filtre par membre */}
            <div className="space-y-2">
              <Label htmlFor="membreFiltre">Membre</Label>
              <Select 
                value={filtres.membreId} 
                onValueChange={(value) => setFiltres(prev => ({ ...prev, membreId: value }))}
              >
                <SelectTrigger id="membreFiltre">
                  <SelectValue placeholder="Tous les membres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les membres</SelectItem>
                  {membres.map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par exercice */}
            <div className="space-y-2">
              <Label htmlFor="exerciceFiltre">Exercice</Label>
              <Select 
                value={filtres.exerciceId} 
                onValueChange={(value) => setFiltres(prev => ({ ...prev, exerciceId: value }))}
              >
                <SelectTrigger id="exerciceFiltre">
                  <SelectValue placeholder="Tous les exercices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les exercices</SelectItem>
                  {exercices.map((exercice) => (
                    <SelectItem key={exercice.id} value={exercice.id}>
                      {exercice.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par montant */}
            <div className="space-y-2">
              <Label htmlFor="montantMin">Montant minimum</Label>
              <Input
                id="montantMin"
                type="number"
                placeholder="0"
                value={filtres.montantMin}
                onChange={(e) => setFiltres(prev => ({ ...prev, montantMin: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montantMax">Montant maximum</Label>
              <Input
                id="montantMax"
                type="number"
                placeholder="Illimité"
                value={filtres.montantMax}
                onChange={(e) => setFiltres(prev => ({ ...prev, montantMax: e.target.value }))}
              />
            </div>
          </div>

          {/* Indicateur de résultats filtrés */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {epargneFiltrees.length} épargne(s) trouvée(s) • {epargnantsUniques} épargnant(s) • Total: {totalFiltre.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedEpargne(null);
              setFormData({ membre_id: "", montant: "", reunion_id: "", exercice_id: "", notes: "" });
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
                <Label htmlFor="reunion">Réunion planifiée *</Label>
                <Select value={formData.reunion_id} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, reunion_id: value }))
                } required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une réunion planifiée" />
                  </SelectTrigger>
                  <SelectContent>
                    {reunions.map((reunion) => (
                      <SelectItem key={reunion.id} value={reunion.id}>
                        {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')} - {reunion.sujet || 'Réunion'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  L'épargne doit être rattachée à une réunion planifiée
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercice">Exercice</Label>
                <Select 
                  value={formData.exercice_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, exercice_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un exercice (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercices.map((exercice) => (
                      <SelectItem key={exercice.id} value={exercice.id}>
                        {exercice.nom} ({new Date(exercice.date_debut).toLocaleDateString('fr-FR')} - {new Date(exercice.date_fin).toLocaleDateString('fr-FR')})
                        {exercice.statut === 'actif' && ' - Actif'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Associer à un exercice pour le suivi des intérêts
                </p>
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
        {epargneFiltrees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {epargnes.length === 0 ? "Aucune épargne enregistrée" : "Aucune épargne ne correspond aux filtres"}
              </p>
              <p className="text-sm text-muted-foreground">
                {epargnes.length === 0 ? "Ajoutez la première épargne pour commencer" : "Essayez de modifier les critères de filtrage"}
              </p>
            </CardContent>
          </Card>
        ) : (
          epargneFiltrees.map((epargne) => (
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