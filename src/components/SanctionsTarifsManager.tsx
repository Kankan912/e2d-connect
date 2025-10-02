import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TypeSanction {
  id: string;
  nom: string;
  description?: string;
  contexte: 'sport' | 'reunion' | 'tous';
  categorie?: string;
}

interface Tarif {
  id: string;
  type_sanction_id: string;
  montant: number;
  categorie_membre: string;
  actif: boolean;
}

export default function SanctionsTarifsManager() {
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sport' | 'reunion' | 'tous'>('tous');
  const { toast } = useToast();

  // Form state pour nouveau type
  const [newType, setNewType] = useState({
    nom: '',
    description: '',
    contexte: 'tous' as 'sport' | 'reunion' | 'tous',
    categorie: ''
  });

  // Form state pour nouveau tarif
  const [newTarif, setNewTarif] = useState({
    type_sanction_id: '',
    montant: 0,
    categorie_membre: 'membre_simple'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, tarifsRes] = await Promise.all([
        supabase.from('types_sanctions').select('*').order('nom'),
        supabase.from('sanctions_tarifs').select('*').eq('actif', true)
      ]);

      if (typesRes.error) throw typesRes.error;
      if (tarifsRes.error) throw tarifsRes.error;

      setTypesSanctions((typesRes.data || []) as TypeSanction[]);
      setTarifs(tarifsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newType.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est obligatoire",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('types_sanctions')
        .insert([{
          nom: newType.nom.trim(),
          description: newType.description.trim(),
          contexte: newType.contexte,
          categorie: newType.categorie.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Type de sanction ajouté",
      });

      setNewType({ nom: '', description: '', contexte: 'tous', categorie: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddTarif = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTarif.type_sanction_id || newTarif.montant <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('sanctions_tarifs')
        .insert([newTarif]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tarif ajouté",
      });

      setNewTarif({ type_sanction_id: '', montant: 0, categorie_membre: 'membre_simple' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTarif = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sanctions_tarifs')
        .update({ actif: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Tarif désactivé",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTypes = typesSanctions.filter(t => 
    activeTab === 'tous' || t.contexte === activeTab || t.contexte === 'tous'
  );

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tous">Tous</TabsTrigger>
          <TabsTrigger value="sport">Sport</TabsTrigger>
          <TabsTrigger value="reunion">Réunion</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Formulaire ajout type */}
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Type de Sanction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddType} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={newType.nom}
                      onChange={(e) => setNewType(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="Ex: Carton jaune, Absence..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contexte *</Label>
                    <Select 
                      value={newType.contexte} 
                      onValueChange={(v) => setNewType(prev => ({ ...prev, contexte: v as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="sport">Sport</SelectItem>
                        <SelectItem value="reunion">Réunion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Input
                      value={newType.categorie}
                      onChange={(e) => setNewType(prev => ({ ...prev, categorie: e.target.value }))}
                      placeholder="Ex: carton_jaune, absence..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newType.description}
                      onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description optionnelle"
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter Type
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste types et tarifs */}
          <div className="space-y-4">
            {filteredTypes.map((type) => {
              const typeTarifs = tarifs.filter(t => t.type_sanction_id === type.id);
              
              return (
                <Card key={type.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {type.nom}
                          <Badge variant={type.contexte === 'sport' ? 'default' : 'secondary'}>
                            {type.contexte}
                          </Badge>
                          {type.categorie && (
                            <Badge variant="outline">{type.categorie}</Badge>
                          )}
                        </CardTitle>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Tarifs existants */}
                    {typeTarifs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Tarifs actuels:</h4>
                        {typeTarifs.map((tarif) => (
                          <div key={tarif.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <span className="font-medium">{tarif.montant.toLocaleString()} FCFA</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({tarif.categorie_membre})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTarif(tarif.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulaire ajout tarif */}
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTarif(e);
                    }} className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Montant"
                        value={newTarif.type_sanction_id === type.id ? newTarif.montant || '' : ''}
                        onChange={(e) => setNewTarif({
                          type_sanction_id: type.id,
                          montant: Number(e.target.value),
                          categorie_membre: newTarif.categorie_membre
                        })}
                        className="flex-1"
                      />
                      <Select
                        value={newTarif.type_sanction_id === type.id ? newTarif.categorie_membre : 'membre_simple'}
                        onValueChange={(v) => setNewTarif(prev => ({
                          ...prev,
                          type_sanction_id: type.id,
                          categorie_membre: v
                        }))}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membre_simple">Membre simple</SelectItem>
                          <SelectItem value="membre_bureau">Membre bureau</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        type="submit"
                        size="sm"
                        disabled={newTarif.type_sanction_id !== type.id}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
