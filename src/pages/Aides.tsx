import { useState, useEffect } from "react";
import { Plus, Edit, Heart, Users, Settings, FileText } from "lucide-react";
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

interface Aide {
  id: string;
  type_aide_id: string;
  beneficiaire_id: string;
  montant: number;
  date_allocation: string;
  justificatif_url?: string;
  statut: string;
  notes?: string;
  aides_types?: {
    nom: string;
    mode_repartition: string;
  };
  membres?: {
    nom: string;
    prenom: string;
  };
}

interface TypeAide {
  id: string;
  nom: string;
  montant_defaut?: number;
  mode_repartition: string;
  delai_remboursement?: number;
  description?: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function Aides() {
  const [aides, setAides] = useState<Aide[]>([]);
  const [typesAides, setTypesAides] = useState<TypeAide[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [selectedAide, setSelectedAide] = useState<Aide | null>(null);
  const [selectedType, setSelectedType] = useState<TypeAide | null>(null);
  const [formData, setFormData] = useState({
    type_aide_id: "",
    beneficiaire_id: "",
    montant: "",
    notes: ""
  });
  const [typeFormData, setTypeFormData] = useState({
    nom: "",
    montant_defaut: "",
    mode_repartition: "equitable",
    delai_remboursement: "",
    description: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAides();
    fetchTypesAides();
    fetchMembres();
  }, []);

  const fetchAides = async () => {
    try {
      const { data, error } = await supabase
        .from('aides')
        .select(`
          *,
          aides_types!type_aide_id (
            nom,
            mode_repartition
          ),
          membres!beneficiaire_id (
            nom,
            prenom
          )
        `)
        .order('date_allocation', { ascending: false });

      if (error) throw error;
      setAides(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les aides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTypesAides = async () => {
    try {
      const { data, error } = await supabase
        .from('aides_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypesAides(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des types d\'aides:', error);
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

  const handleSubmitAide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type_aide_id || !formData.beneficiaire_id || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const aideData = {
        type_aide_id: formData.type_aide_id,
        beneficiaire_id: formData.beneficiaire_id,
        montant: parseFloat(formData.montant),
        notes: formData.notes || null,
        statut: 'alloue'
      };

      const { error } = selectedAide
        ? await supabase
            .from('aides')
            .update(aideData)
            .eq('id', selectedAide.id)
        : await supabase
            .from('aides')
            .insert([aideData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedAide ? "Aide modifiée avec succès" : "Aide allouée avec succès",
      });

      setShowAddDialog(false);
      setSelectedAide(null);
      setFormData({ type_aide_id: "", beneficiaire_id: "", montant: "", notes: "" });
      fetchAides();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'aide",
        variant: "destructive",
      });
    }
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typeFormData.nom || !typeFormData.mode_repartition) {
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
        montant_defaut: typeFormData.montant_defaut ? parseFloat(typeFormData.montant_defaut) : null,
        mode_repartition: typeFormData.mode_repartition,
        delai_remboursement: typeFormData.delai_remboursement ? parseInt(typeFormData.delai_remboursement) : null,
        description: typeFormData.description || null
      };

      const { error } = selectedType
        ? await supabase
            .from('aides_types')
            .update(typeData)
            .eq('id', selectedType.id)
        : await supabase
            .from('aides_types')
            .insert([typeData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedType ? "Type d'aide modifié avec succès" : "Type d'aide créé avec succès",
      });

      setShowTypeDialog(false);
      setSelectedType(null);
      setTypeFormData({ nom: "", montant_defaut: "", mode_repartition: "equitable", delai_remboursement: "", description: "" });
      fetchTypesAides();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le type d'aide",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (aide: Aide) => {
    setSelectedAide(aide);
    setFormData({
      type_aide_id: aide.type_aide_id,
      beneficiaire_id: aide.beneficiaire_id,
      montant: aide.montant.toString(),
      notes: aide.notes || ""
    });
    setShowAddDialog(true);
  };

  const openEditTypeDialog = (type: TypeAide) => {
    setSelectedType(type);
    setTypeFormData({
      nom: type.nom,
      montant_defaut: type.montant_defaut?.toString() || "",
      mode_repartition: type.mode_repartition,
      delai_remboursement: type.delai_remboursement?.toString() || "",
      description: type.description || ""
    });
    setShowTypeDialog(true);
  };

  const getModeRepartitionLabel = (mode: string) => {
    switch (mode) {
      case 'equitable': return 'Équitable';
      case 'reliquat': return 'Reliquat (fond de caisse)';
      case 'prorata': return 'Au prorata des cotisations';
      default: return mode;
    }
  };

  const totalAides = aides.reduce((sum, aide) => sum + aide.montant, 0);

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
          <h1 className="text-3xl font-bold text-foreground">Gestion des Aides</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les aides allouées aux membres (maladie, mariage, décès, etc.)
          </p>
        </div>
      </div>

      <Tabs defaultValue="aides" className="space-y-6">
        <TabsList>
          <TabsTrigger value="aides">Aides Allouées</TabsTrigger>
          <TabsTrigger value="types">Types d'Aides</TabsTrigger>
        </TabsList>

        <TabsContent value="aides" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 mr-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Aides</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAides.toLocaleString()} FCFA</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nombre d'Aides</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aides.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bénéficiaires</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(aides.map(a => a.beneficiaire_id)).size}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedAide(null);
                  setFormData({ type_aide_id: "", beneficiaire_id: "", montant: "", notes: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Aide
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedAide ? "Modifier l'aide" : "Allouer une aide"}
                  </DialogTitle>
                  <DialogDescription>
                    Enregistrez une aide allouée à un membre
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitAide} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'aide *</Label>
                    <Select value={formData.type_aide_id} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, type_aide_id: value }));
                      const selectedType = typesAides.find(t => t.id === value);
                      if (selectedType?.montant_defaut) {
                        setFormData(prev => ({ ...prev, montant: selectedType.montant_defaut.toString() }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type d'aide" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesAides.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="beneficiaire">Bénéficiaire *</Label>
                    <Select value={formData.beneficiaire_id} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, beneficiaire_id: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un bénéficiaire" />
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
                      placeholder="Ex: 50000"
                      value={formData.montant}
                      onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Motif, justification..."
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedAide ? "Modifier" : "Allouer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Liste des aides */}
          <div className="grid gap-4">
            {aides.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Aucune aide enregistrée</p>
                  <p className="text-sm text-muted-foreground">Allouez la première aide pour commencer</p>
                </CardContent>
              </Card>
            ) : (
              aides.map((aide) => (
                <Card key={aide.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {aide.membres?.prenom} {aide.membres?.nom}
                        </CardTitle>
                        <CardDescription>
                          {aide.aides_types?.nom} - {format(new Date(aide.date_allocation), "dd MMMM yyyy", { locale: fr })}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {aide.montant.toLocaleString()} FCFA
                        </p>
                        <Badge className="mt-1">
                          {getModeRepartitionLabel(aide.aides_types?.mode_repartition || '')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {aide.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{aide.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(aide)}>
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
              Configurez les types d'aides disponibles
            </p>
            <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setSelectedType(null);
                  setTypeFormData({ nom: "", montant_defaut: "", mode_repartition: "equitable", delai_remboursement: "", description: "" });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Type
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedType ? "Modifier le type d'aide" : "Créer un type d'aide"}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez un nouveau type d'aide
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitType} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      placeholder="Ex: Aide maladie"
                      value={typeFormData.nom}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, nom: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="montant_defaut">Montant par défaut (FCFA)</Label>
                    <Input
                      id="montant_defaut"
                      type="number"
                      placeholder="Ex: 50000"
                      value={typeFormData.montant_defaut}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, montant_defaut: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mode_repartition">Mode de répartition *</Label>
                    <Select value={typeFormData.mode_repartition} onValueChange={(value) => 
                      setTypeFormData(prev => ({ ...prev, mode_repartition: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equitable">Équitable</SelectItem>
                        <SelectItem value="reliquat">Reliquat (fond de caisse)</SelectItem>
                        <SelectItem value="prorata">Au prorata des cotisations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delai_remboursement">Délai de remboursement (jours)</Label>
                    <Input
                      id="delai_remboursement"
                      type="number"
                      placeholder="Ex: 30"
                      value={typeFormData.delai_remboursement}
                      onChange={(e) => setTypeFormData(prev => ({ ...prev, delai_remboursement: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Description du type d'aide..."
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

          {/* Liste des types d'aides */}
          <div className="grid gap-4 md:grid-cols-2">
            {typesAides.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{type.nom}</CardTitle>
                      <CardDescription>
                        {getModeRepartitionLabel(type.mode_repartition)}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEditTypeDialog(type)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {type.montant_defaut && (
                      <div>
                        <p className="text-sm text-muted-foreground">Montant par défaut</p>
                        <p className="font-semibold">{type.montant_defaut.toLocaleString()} FCFA</p>
                      </div>
                    )}
                    {type.delai_remboursement && (
                      <div>
                        <p className="text-sm text-muted-foreground">Délai de remboursement</p>
                        <p className="font-semibold">{type.delai_remboursement} jours</p>
                      </div>
                    )}
                    {type.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{type.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}