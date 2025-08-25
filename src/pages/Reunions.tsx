import { useState, useEffect } from "react";
import { Plus, Edit, Calendar, MapPin, FileText, Users, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Reunion {
  id: string;
  date_reunion: string;
  lieu_membre_id?: string;
  lieu_description?: string;
  statut: string;
  ordre_du_jour?: string;
  compte_rendu_url?: string;
  membres?: {
    nom: string;
    prenom: string;
  };
}

interface RapportSeance {
  id: string;
  reunion_id: string;
  sujet: string;
  resolution?: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function Reunions() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [rapports, setRapports] = useState<RapportSeance[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReunionDialog, setShowReunionDialog] = useState(false);
  const [showRapportDialog, setShowRapportDialog] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [selectedRapport, setSelectedRapport] = useState<RapportSeance | null>(null);
  const [selectedReunionForRapport, setSelectedReunionForRapport] = useState<string>("");
  const [reunionFormData, setReunionFormData] = useState({
    date_reunion: "",
    heure_reunion: "",
    lieu_membre_id: "",
    lieu_description: "",
    ordre_du_jour: ""
  });
  const [rapportFormData, setRapportFormData] = useState({
    reunion_id: "",
    sujet: "",
    resolution: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReunions();
    fetchRapports();
    fetchMembres();
  }, []);

  const fetchReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select(`
          *,
          membres!lieu_membre_id (
            nom,
            prenom
          )
        `)
        .order('date_reunion', { ascending: false });

      if (error) throw error;
      setReunions(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRapports = async () => {
    try {
      const { data, error } = await supabase
        .from('rapports_seances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRapports(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
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

  const handleSubmitReunion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reunionFormData.date_reunion || !reunionFormData.heure_reunion) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const dateTime = `${reunionFormData.date_reunion}T${reunionFormData.heure_reunion}:00`;
      
      const reunionData = {
        date_reunion: dateTime,
        lieu_membre_id: reunionFormData.lieu_membre_id || null,
        lieu_description: reunionFormData.lieu_description || null,
        ordre_du_jour: reunionFormData.ordre_du_jour || null,
        statut: 'planifie'
      };

      const { error } = selectedReunion
        ? await supabase
            .from('reunions')
            .update(reunionData)
            .eq('id', selectedReunion.id)
        : await supabase
            .from('reunions')
            .insert([reunionData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedReunion ? "Réunion modifiée avec succès" : "Réunion planifiée avec succès",
      });

      setShowReunionDialog(false);
      setSelectedReunion(null);
      setReunionFormData({ date_reunion: "", heure_reunion: "", lieu_membre_id: "", lieu_description: "", ordre_du_jour: "" });
      fetchReunions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la réunion",
        variant: "destructive",
      });
    }
  };

  const handleSubmitRapport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rapportFormData.reunion_id || !rapportFormData.sujet) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const rapportData = {
        reunion_id: rapportFormData.reunion_id,
        sujet: rapportFormData.sujet,
        resolution: rapportFormData.resolution || null
      };

      const { error } = selectedRapport
        ? await supabase
            .from('rapports_seances')
            .update(rapportData)
            .eq('id', selectedRapport.id)
        : await supabase
            .from('rapports_seances')
            .insert([rapportData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedRapport ? "Rapport modifié avec succès" : "Rapport ajouté avec succès",
      });

      setShowRapportDialog(false);
      setSelectedRapport(null);
      setRapportFormData({ reunion_id: "", sujet: "", resolution: "" });
      fetchRapports();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le rapport",
        variant: "destructive",
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_cours': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'termine': return 'bg-green-100 text-green-800 border-green-200';
      case 'reporte': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'annule': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'Planifiée';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminée';
      case 'reporte': return 'Reportée';
      case 'annule': return 'Annulée';
      default: return statut;
    }
  };

  const openEditReunionDialog = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    const date = new Date(reunion.date_reunion);
    setReunionFormData({
      date_reunion: format(date, 'yyyy-MM-dd'),
      heure_reunion: format(date, 'HH:mm'),
      lieu_membre_id: reunion.lieu_membre_id || "",
      lieu_description: reunion.lieu_description || "",
      ordre_du_jour: reunion.ordre_du_jour || ""
    });
    setShowReunionDialog(true);
  };

  const openEditRapportDialog = (rapport: RapportSeance) => {
    setSelectedRapport(rapport);
    setRapportFormData({
      reunion_id: rapport.reunion_id,
      sujet: rapport.sujet,
      resolution: rapport.resolution || ""
    });
    setShowRapportDialog(true);
  };

  const updateStatutReunion = async (reunionId: string, newStatut: string) => {
    try {
      const { error } = await supabase
        .from('reunions')
        .update({ statut: newStatut })
        .eq('id', reunionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut mis à jour: ${getStatutLabel(newStatut)}`,
      });

      fetchReunions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const prochainerReunions = reunions.filter(r => r.statut === 'planifie' && new Date(r.date_reunion) > new Date());

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
          <h1 className="text-3xl font-bold text-foreground">Gestion des Réunions</h1>
          <p className="text-muted-foreground mt-2">
            Planifiez les réunions mensuelles et gérez les rapports de séances
          </p>
        </div>
      </div>

      <Tabs defaultValue="reunions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reunions">Réunions</TabsTrigger>
          <TabsTrigger value="rapports">Rapports de Séances</TabsTrigger>
        </TabsList>

        <TabsContent value="reunions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Réunions</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reunions.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prochaines</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{prochainerReunions.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {reunions.filter(r => r.statut === 'termine').length}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Dialog open={showReunionDialog} onOpenChange={setShowReunionDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedReunion(null);
                  setReunionFormData({ date_reunion: "", heure_reunion: "", lieu_membre_id: "", lieu_description: "", ordre_du_jour: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Réunion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedReunion ? "Modifier la réunion" : "Planifier une réunion"}
                  </DialogTitle>
                  <DialogDescription>
                    Planifiez une réunion mensuelle
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitReunion} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={reunionFormData.date_reunion}
                        onChange={(e) => setReunionFormData(prev => ({ ...prev, date_reunion: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heure">Heure *</Label>
                      <Input
                        id="heure"
                        type="time"
                        value={reunionFormData.heure_reunion}
                        onChange={(e) => setReunionFormData(prev => ({ ...prev, heure_reunion: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lieu_membre">Chez le membre (optionnel)</Label>
                    <Select value={reunionFormData.lieu_membre_id} onValueChange={(value) => 
                      setReunionFormData(prev => ({ ...prev, lieu_membre_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un membre hôte" />
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
                    <Label htmlFor="lieu_description">Ou lieu personnalisé</Label>
                    <Input
                      id="lieu_description"
                      placeholder="Ex: Salle communautaire, Mairie..."
                      value={reunionFormData.lieu_description}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, lieu_description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ordre_du_jour">Ordre du jour</Label>
                    <Textarea
                      id="ordre_du_jour"
                      placeholder="Points à aborder lors de la réunion..."
                      value={reunionFormData.ordre_du_jour}
                      onChange={(e) => setReunionFormData(prev => ({ ...prev, ordre_du_jour: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowReunionDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedReunion ? "Modifier" : "Planifier"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Liste des réunions */}
          <div className="grid gap-4">
            {reunions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Aucune réunion planifiée</p>
                  <p className="text-sm text-muted-foreground">Planifiez la première réunion pour commencer</p>
                </CardContent>
              </Card>
            ) : (
              reunions.map((reunion) => (
                <Card key={reunion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          {format(new Date(reunion.date_reunion), "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {reunion.membres ? 
                            `Chez ${reunion.membres.prenom} ${reunion.membres.nom}` :
                            reunion.lieu_description || "Lieu non spécifié"
                          }
                        </CardDescription>
                      </div>
                      <Badge className={getStatutColor(reunion.statut)}>
                        {getStatutLabel(reunion.statut)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reunion.ordre_du_jour && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Ordre du jour</p>
                        <p className="text-sm whitespace-pre-wrap">{reunion.ordre_du_jour}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      {reunion.statut === 'planifie' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateStatutReunion(reunion.id, 'en_cours')}
                            className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                          >
                            Démarrer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateStatutReunion(reunion.id, 'termine')}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            Terminer
                          </Button>
                        </>
                      )}
                      {reunion.statut === 'en_cours' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateStatutReunion(reunion.id, 'termine')}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Terminer
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditReunionDialog(reunion)}>
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

        <TabsContent value="rapports" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Rédigez les rapports de séances pour chaque réunion
            </p>
            <Dialog open={showRapportDialog} onOpenChange={setShowRapportDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedRapport(null);
                  setRapportFormData({ reunion_id: selectedReunionForRapport, sujet: "", resolution: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Rapport
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedRapport ? "Modifier le rapport" : "Ajouter un rapport de séance"}
                  </DialogTitle>
                  <DialogDescription>
                    Ajoutez une résolution par sujet débattu
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitRapport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reunion">Réunion *</Label>
                    <Select value={rapportFormData.reunion_id} onValueChange={(value) => 
                      setRapportFormData(prev => ({ ...prev, reunion_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une réunion" />
                      </SelectTrigger>
                      <SelectContent>
                        {reunions.map((reunion) => (
                          <SelectItem key={reunion.id} value={reunion.id}>
                            {format(new Date(reunion.date_reunion), "dd MMMM yyyy", { locale: fr })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sujet">Sujet *</Label>
                    <Input
                      id="sujet"
                      placeholder="Ex: Budget 2024, Nouveau membre..."
                      value={rapportFormData.sujet}
                      onChange={(e) => setRapportFormData(prev => ({ ...prev, sujet: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Résolution</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Décisions prises concernant ce sujet..."
                      value={rapportFormData.resolution}
                      onChange={(e) => setRapportFormData(prev => ({ ...prev, resolution: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowRapportDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedRapport ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Liste des rapports groupés par réunion */}
          <div className="space-y-6">
            {reunions.filter(r => rapports.some(rap => rap.reunion_id === r.id)).map((reunion) => {
              const rapportsReunion = rapports.filter(r => r.reunion_id === reunion.id);
              
              return (
                <Card key={reunion.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">
                          Réunion du {format(new Date(reunion.date_reunion), "dd MMMM yyyy", { locale: fr })}
                        </CardTitle>
                        <CardDescription>
                          {rapportsReunion.length} sujet(s) traités
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedReunionForRapport(reunion.id);
                          setRapportFormData({ reunion_id: reunion.id, sujet: "", resolution: "" });
                          setShowRapportDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter un sujet
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rapportsReunion.map((rapport) => (
                        <div key={rapport.id} className="border-l-4 border-primary pl-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{rapport.sujet}</h4>
                              {rapport.resolution && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rapport.resolution}
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditRapportDialog(rapport)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {rapports.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Aucun rapport de séance</p>
                  <p className="text-sm text-muted-foreground">Ajoutez le premier rapport pour commencer</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}