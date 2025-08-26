import { useState, useEffect } from "react";
import { Plus, Edit, AlertTriangle, Settings, DollarSign, User, Clock, FileX } from "lucide-react";
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

interface Sanction {
  id: string;
  type_sanction_id: string;
  membre_id: string;
  montant: number;
  date_sanction: string;
  statut: string;
  motif?: string;
  sanctions_types?: {
    nom: string;
    categorie: string;
  } | null;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
}

interface TypeSanction {
  id: string;
  nom: string;
  montant: number;
  categorie: string;
  description?: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function Sanctions() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [selectedType, setSelectedType] = useState<TypeSanction | null>(null);
  const [formData, setFormData] = useState({
    type_sanction_id: "",
    membre_id: "",
    motif: ""
  });
  const [typeFormData, setTypeFormData] = useState({
    nom: "",
    montant: "",
    categorie: "reunion",
    description: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSanctions();
    fetchTypesSanctions();
    fetchMembres();
  }, []);

  const fetchSanctions = async () => {
    try {
      const { data, error } = await supabase
        .from('sanctions')
        .select(`
          *,
          sanctions_types!type_sanction_id (
            nom,
            categorie
          ),
          membres!membre_id (
            nom,
            prenom
          )
        `)
        .order('date_sanction', { ascending: false });

      if (error) throw error;
      setSanctions(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesSanctions = async () => {
    try {
      const { data, error } = await supabase
        .from('sanctions_types')
        .select('*')
        .order('categorie', { ascending: true });

      if (error) throw error;
      setTypesSanctions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types de sanctions:', error);
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

  const handleSubmitSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type_sanction_id || !formData.membre_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedTypeData = typesSanctions.find(t => t.id === formData.type_sanction_id);
      
      const sanctionData = {
        type_sanction_id: formData.type_sanction_id,
        membre_id: formData.membre_id,
        montant: selectedTypeData?.montant || 0,
        motif: formData.motif || null,
        statut: 'impaye'
      };

      const { error } = selectedSanction
        ? await supabase
            .from('sanctions')
            .update(sanctionData)
            .eq('id', selectedSanction.id)
        : await supabase
            .from('sanctions')
            .insert([sanctionData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedSanction ? "Sanction modifiée avec succès" : "Sanction ajoutée avec succès",
      });

      setShowAddDialog(false);
      setSelectedSanction(null);
      setFormData({ type_sanction_id: "", membre_id: "", motif: "" });
      fetchSanctions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la sanction",
        variant: "destructive",
      });
    }
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typeFormData.nom || !typeFormData.montant || !typeFormData.categorie) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const typeData = {
        nom: typeFormData.nom,
        montant: parseFloat(typeFormData.montant),
        categorie: typeFormData.categorie,
        description: typeFormData.description || null
      };

      const { error } = selectedType
        ? await supabase
            .from('sanctions_types')
            .update(typeData)
            .eq('id', selectedType.id)
        : await supabase
            .from('sanctions_types')
            .insert([typeData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedType ? "Type de sanction modifié avec succès" : "Type de sanction créé avec succès",
      });

      setShowTypeDialog(false);
      setSelectedType(null);
      setTypeFormData({ nom: "", montant: "", categorie: "reunion", description: "" });
      fetchTypesSanctions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le type de sanction",
        variant: "destructive",
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'impaye': return 'bg-red-100 text-red-800 border-red-200';
      case 'paye': return 'bg-green-100 text-green-800 border-green-200';
      case 'annule': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'impaye': return 'Impayé';
      case 'paye': return 'Payé';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  const getCategorieColor = (categorie: string) => {
    switch (categorie) {
      case 'reunion': return 'bg-blue-100 text-blue-800';
      case 'sport': return 'bg-green-100 text-green-800';
      case 'financiere': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategorieLabel = (categorie: string) => {
    switch (categorie) {
      case 'reunion': return 'Réunion';
      case 'sport': return 'Sport';
      case 'financiere': return 'Financière';
      default: return categorie;
    }
  };

  const openEditDialog = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setFormData({
      type_sanction_id: sanction.type_sanction_id,
      membre_id: sanction.membre_id,
      motif: sanction.motif || ""
    });
    setShowAddDialog(true);
  };

  const openEditTypeDialog = (type: TypeSanction) => {
    setSelectedType(type);
    setTypeFormData({
      nom: type.nom,
      montant: type.montant.toString(),
      categorie: type.categorie,
      description: type.description || ""
    });
    setShowTypeDialog(true);
  };

  const updateStatutSanction = async (sanctionId: string, newStatut: string) => {
    try {
      const { error } = await supabase
        .from('sanctions')
        .update({ statut: newStatut })
        .eq('id', sanctionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut mis à jour: ${getStatutLabel(newStatut)}`,
      });

      fetchSanctions();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const totalSanctions = sanctions.reduce((sum, sanction) => sum + sanction.montant, 0);
  const sanctionsImpayees = sanctions.filter(s => s.statut === 'impaye');

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
          <h1 className="text-3xl font-bold text-foreground">Gestion des Sanctions</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les sanctions pour réunions, activités sportives et finances
          </p>
        </div>
      </div>

      <Tabs defaultValue="sanctions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sanctions">Sanctions</TabsTrigger>
          <TabsTrigger value="types">Types de Sanctions</TabsTrigger>
        </TabsList>

        <TabsContent value="sanctions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 mr-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sanctions</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSanctions.toLocaleString()} FCFA</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Impayées</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{sanctionsImpayees.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payées</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {sanctions.filter(s => s.statut === 'paye').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Montant Impayé</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {sanctionsImpayees.reduce((sum, s) => sum + s.montant, 0).toLocaleString()} FCFA
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedSanction(null);
                  setFormData({ type_sanction_id: "", membre_id: "", motif: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Sanction
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedSanction ? "Modifier la sanction" : "Ajouter une sanction"}
                  </DialogTitle>
                  <DialogDescription>
                    Attribuez une sanction à un membre
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitSanction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de sanction *</Label>
                    <Select value={formData.type_sanction_id} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, type_sanction_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesSanctions.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.nom} ({type.montant.toLocaleString()} FCFA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                    <Label htmlFor="motif">Motif</Label>
                    <Textarea
                      id="motif"
                      placeholder="Motif de la sanction..."
                      value={formData.motif}
                      onChange={(e) => setFormData(prev => ({ ...prev, motif: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedSanction ? "Modifier" : "Ajouter"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Liste des sanctions */}
          <div className="grid gap-4">
            {sanctions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <FileX className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Aucune sanction enregistrée</p>
                  <p className="text-sm text-muted-foreground">Ajoutez la première sanction pour commencer</p>
                </CardContent>
              </Card>
            ) : (
              sanctions.map((sanction) => (
                <Card key={sanction.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {sanction.membres?.prenom} {sanction.membres?.nom}
                        </CardTitle>
                        <CardDescription>
                          {sanction.sanctions_types?.nom} - {format(new Date(sanction.date_sanction), "dd MMMM yyyy", { locale: fr })}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-2xl font-bold text-red-600">
                          {sanction.montant.toLocaleString()} FCFA
                        </p>
                        <div className="flex space-x-2">
                          <Badge className={getCategorieColor(sanction.sanctions_types?.categorie || '')}>
                            {getCategorieLabel(sanction.sanctions_types?.categorie || '')}
                          </Badge>
                          <Badge className={getStatutColor(sanction.statut)}>
                            {getStatutLabel(sanction.statut)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sanction.motif && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Motif</p>
                        <p className="text-sm">{sanction.motif}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      {sanction.statut === 'impaye' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateStatutSanction(sanction.id, 'paye')}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Marquer comme payé
                        </Button>
                      )}
                      {sanction.statut === 'impaye' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateStatutSanction(sanction.id, 'annule')}
                          className="text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                          Annuler
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(sanction)}>
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

        <TabsContent value="types" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Configurez les types de sanctions et leurs montants
            </p>
            <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedType(null);
                  setTypeFormData({ nom: "", montant: "", categorie: "reunion", description: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedType ? "Modifier le type de sanction" : "Créer un type de sanction"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau type de sanction
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitType} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Retard réunion"
                      value={typeFormData.nom}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="montant">Montant (FCFA) *</Label>
                    <Input
                      id="montant"
                      type="number"
                      placeholder="Ex: 1000"
                      value={typeFormData.montant}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, montant: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categorie">Catégorie *</Label>
                    <Select value={typeFormData.categorie} onValueChange={(value) => 
                      setTypeFormData(prev => ({ ...prev, categorie: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reunion">Réunion</SelectItem>
                        <SelectItem value="sport">Sport</SelectItem>
                        <SelectItem value="financiere">Financière</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description du type de sanction..."
                      value={typeFormData.description}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowTypeDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedType ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Liste groupée par catégorie */}
          {['reunion', 'sport', 'financiere'].map(categorie => {
            const typesCategorie = typesSanctions.filter(t => t.categorie === categorie);
            if (typesCategorie.length === 0) return null;
            
            return (
              <div key={categorie} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Badge className={getCategorieColor(categorie) + ' mr-2'}>
                    {getCategorieLabel(categorie)}
                  </Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {typesCategorie.map((type) => (
                    <Card key={type.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{type.nom}</CardTitle>
                            <CardDescription>
                              {type.montant.toLocaleString()} FCFA
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openEditTypeDialog(type)}>
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      {type.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}