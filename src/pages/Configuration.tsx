import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  Shield,
  Calendar,
  Trophy,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TypeCotisation {
  id: string;
  nom: string;
  description: string;
  montant_defaut: number;
  obligatoire: boolean;
}

interface TypeAide {
  id: string;
  nom: string;
  description: string;
  montant_defaut: number;
  mode_repartition: string;
}

interface TypeSanction {
  id: string;
  nom: string;
  description: string;
  montant: number;
  categorie: string;
}

export default function Configuration() {
  const [typesCotisations, setTypesCotisations] = useState<TypeCotisation[]>([]);
  const [typesAides, setTypesAides] = useState<TypeAide[]>([]);
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCotisationDialog, setShowCotisationDialog] = useState(false);
  const [showAideDialog, setShowAideDialog] = useState(false);
  const [showSanctionDialog, setShowSanctionDialog] = useState(false);
  
  const [cotisationForm, setCotisationForm] = useState({
    nom: "",
    description: "",
    montant_defaut: "",
    obligatoire: false
  });

  const [aideForm, setAideForm] = useState({
    nom: "",
    description: "",
    montant_defaut: "",
    mode_repartition: "equitable"
  });

  const [sanctionForm, setSanctionForm] = useState({
    nom: "",
    description: "",
    montant: "",
    categorie: "discipline"
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchAllTypes();
  }, []);

  const fetchAllTypes = async () => {
    try {
      const [cotisations, aides, sanctions] = await Promise.all([
        supabase.from('cotisations_types').select('*').order('nom'),
        supabase.from('aides_types').select('*').order('nom'),
        supabase.from('sanctions_types').select('*').order('nom')
      ]);

      setTypesCotisations(cotisations.data || []);
      setTypesAides(aides.data || []);
      setTypesSanctions(sanctions.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCotisation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cotisationForm.nom || !cotisationForm.montant_defaut) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('cotisations_types')
        .insert([{
          nom: cotisationForm.nom,
          description: cotisationForm.description,
          montant_defaut: parseFloat(cotisationForm.montant_defaut),
          obligatoire: cotisationForm.obligatoire
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Type de cotisation ajouté avec succès",
      });

      setShowCotisationDialog(false);
      setCotisationForm({ nom: "", description: "", montant_defaut: "", obligatoire: false });
      fetchAllTypes();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le type de cotisation",
        variant: "destructive",
      });
    }
  };

  const handleSubmitAide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aideForm.nom || !aideForm.montant_defaut) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('aides_types')
        .insert([{
          nom: aideForm.nom,
          description: aideForm.description,
          montant_defaut: parseFloat(aideForm.montant_defaut),
          mode_repartition: aideForm.mode_repartition
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Type d'aide ajouté avec succès",
      });

      setShowAideDialog(false);
      setAideForm({ nom: "", description: "", montant_defaut: "", mode_repartition: "equitable" });
      fetchAllTypes();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le type d'aide",
        variant: "destructive",
      });
    }
  };

  const handleSubmitSanction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sanctionForm.nom || !sanctionForm.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sanctions_types')
        .insert([{
          nom: sanctionForm.nom,
          description: sanctionForm.description,
          montant: parseFloat(sanctionForm.montant),
          categorie: sanctionForm.categorie
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Type de sanction ajouté avec succès",
      });

      setShowSanctionDialog(false);
      setSanctionForm({ nom: "", description: "", montant: "", categorie: "discipline" });
      fetchAllTypes();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le type de sanction",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Configuration
          </h1>
          <p className="text-muted-foreground">
            Gérez les paramètres et types de l'application
          </p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Tabs defaultValue="cotisations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cotisations" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cotisations
          </TabsTrigger>
          <TabsTrigger value="aides" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Aides
          </TabsTrigger>
          <TabsTrigger value="sanctions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sanctions
          </TabsTrigger>
          <TabsTrigger value="sport" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Sport
          </TabsTrigger>
        </TabsList>

        {/* Types de Cotisations */}
        <TabsContent value="cotisations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Types de Cotisations</CardTitle>
                  <CardDescription>
                    Gérez les différents types de cotisations de l'association
                  </CardDescription>
                </div>
                <Dialog open={showCotisationDialog} onOpenChange={setShowCotisationDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un type de cotisation</DialogTitle>
                      <DialogDescription>
                        Créez un nouveau type de cotisation pour l'association
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitCotisation} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom *</Label>
                        <Input
                          id="nom"
                          placeholder="Ex: Cotisation mensuelle"
                          value={cotisationForm.nom}
                          onChange={(e) => setCotisationForm(prev => ({ ...prev, nom: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Description du type de cotisation"
                          value={cotisationForm.description}
                          onChange={(e) => setCotisationForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="montant">Montant par défaut (FCFA) *</Label>
                        <Input
                          id="montant"
                          type="number"
                          placeholder="Ex: 5000"
                          value={cotisationForm.montant_defaut}
                          onChange={(e) => setCotisationForm(prev => ({ ...prev, montant_defaut: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="obligatoire">Cotisation obligatoire</Label>
                          <p className="text-sm text-muted-foreground">
                            Cette cotisation est-elle obligatoire pour tous les membres ?
                          </p>
                        </div>
                        <Switch
                          id="obligatoire"
                          checked={cotisationForm.obligatoire}
                          onCheckedChange={(checked) => 
                            setCotisationForm(prev => ({ ...prev, obligatoire: checked }))
                          }
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowCotisationDialog(false)}>
                          Annuler
                        </Button>
                        <Button type="submit">Ajouter</Button>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant par défaut</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesCotisations.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {type.description || "Aucune description"}
                      </TableCell>
                      <TableCell>{type.montant_defaut?.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <Badge variant={type.obligatoire ? "default" : "secondary"}>
                          {type.obligatoire ? "Obligatoire" : "Optionnelle"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types d'Aides */}
        <TabsContent value="aides">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Types d'Aides</CardTitle>
                  <CardDescription>
                    Configurez les différents types d'aides disponibles
                  </CardDescription>
                </div>
                <Dialog open={showAideDialog} onOpenChange={setShowAideDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un type d'aide</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitAide} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom_aide">Nom *</Label>
                        <Input
                          id="nom_aide"
                          placeholder="Ex: Aide médicale"
                          value={aideForm.nom}
                          onChange={(e) => setAideForm(prev => ({ ...prev, nom: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description_aide">Description</Label>
                        <Textarea
                          id="description_aide"
                          placeholder="Description du type d'aide"
                          value={aideForm.description}
                          onChange={(e) => setAideForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="montant_aide">Montant par défaut (FCFA) *</Label>
                        <Input
                          id="montant_aide"
                          type="number"
                          placeholder="Ex: 25000"
                          value={aideForm.montant_defaut}
                          onChange={(e) => setAideForm(prev => ({ ...prev, montant_defaut: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mode_repartition">Mode de répartition</Label>
                        <Select value={aideForm.mode_repartition} onValueChange={(value) => 
                          setAideForm(prev => ({ ...prev, mode_repartition: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equitable">Équitable</SelectItem>
                            <SelectItem value="proportionnel">Proportionnel</SelectItem>
                            <SelectItem value="fixe">Montant fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowAideDialog(false)}>
                          Annuler
                        </Button>
                        <Button type="submit">Ajouter</Button>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant par défaut</TableHead>
                    <TableHead>Mode répartition</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesAides.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {type.description || "Aucune description"}
                      </TableCell>
                      <TableCell>{type.montant_defaut?.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {type.mode_repartition}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types de Sanctions */}  
        <TabsContent value="sanctions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Types de Sanctions</CardTitle>
                  <CardDescription>
                    Gérez les différents types de sanctions applicables
                  </CardDescription>
                </div>
                <Dialog open={showSanctionDialog} onOpenChange={setShowSanctionDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un type de sanction</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitSanction} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="nom_sanction">Nom *</Label>
                        <Input
                          id="nom_sanction"
                          placeholder="Ex: Retard réunion"
                          value={sanctionForm.nom}
                          onChange={(e) => setSanctionForm(prev => ({ ...prev, nom: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description_sanction">Description</Label>
                        <Textarea
                          id="description_sanction"
                          placeholder="Description de la sanction"
                          value={sanctionForm.description}
                          onChange={(e) => setSanctionForm(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="montant_sanction">Montant (FCFA) *</Label>
                        <Input
                          id="montant_sanction"
                          type="number"
                          placeholder="Ex: 1000"
                          value={sanctionForm.montant}
                          onChange={(e) => setSanctionForm(prev => ({ ...prev, montant: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="categorie">Catégorie</Label>
                        <Select value={sanctionForm.categorie} onValueChange={(value) => 
                          setSanctionForm(prev => ({ ...prev, categorie: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discipline">Discipline</SelectItem>
                            <SelectItem value="financiere">Financière</SelectItem>
                            <SelectItem value="administrative">Administrative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setShowSanctionDialog(false)}>
                          Annuler
                        </Button>
                        <Button type="submit">Ajouter</Button>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesSanctions.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.nom}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {type.description || "Aucune description"}
                      </TableCell>
                      <TableCell>{type.montant?.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {type.categorie}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Sport */}
        <TabsContent value="sport">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sport Phoenix</CardTitle>
                <CardDescription>Configuration du club de football</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Montant adhésion par défaut</Label>
                  <Input type="number" placeholder="15000" />
                </div>
                <div className="space-y-2">
                  <Label>Durée adhésion (mois)</Label>
                  <Input type="number" placeholder="12" />
                </div>
                <div className="space-y-2">
                  <Label>Terrain principal</Label>
                  <Input placeholder="Stade municipal" />
                </div>
                <Button>Sauvegarder</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sport E2D</CardTitle>
                <CardDescription>Configuration des activités sportives hebdomadaires</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Jour des activités</Label>
                  <Select defaultValue="dimanche">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dimanche">Dimanche</SelectItem>
                      <SelectItem value="samedi">Samedi</SelectItem>
                      <SelectItem value="mercredi">Mercredi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Heure par défaut</Label>
                  <Input type="time" defaultValue="15:00" />
                </div>
                <div className="space-y-2">
                  <Label>Cotisation par séance</Label>
                  <Input type="number" placeholder="500" />
                </div>
                <Button>Sauvegarder</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}