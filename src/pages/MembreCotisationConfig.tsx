import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface CotisationType {
  id: string;
  nom: string;
  montant_defaut: number;
}

interface Config {
  id?: string;
  membre_id: string;
  type_cotisation_id: string;
  montant_personnalise: number;
}

export default function MembreCotisationConfig() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [cotisationTypes, setCotisationTypes] = useState<CotisationType[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConfig, setNewConfig] = useState<Partial<Config>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membresRes, typesRes, configsRes] = await Promise.all([
        supabase.from('membres').select('id, nom, prenom').order('nom'),
        supabase.from('cotisations_types').select('*').order('nom'),
        supabase.from('membres_cotisations_config').select('*')
      ]);

      if (membresRes.error) throw membresRes.error;
      if (typesRes.error) throw typesRes.error;
      if (configsRes.error) throw configsRes.error;

      setMembres(membresRes.data || []);
      setCotisationTypes(typesRes.data || []);
      setConfigs(configsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config: Config) => {
    try {
      if (config.id) {
        const { error } = await supabase
          .from('membres_cotisations_config')
          .update({
            montant_personnalise: config.montant_personnalise
          })
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('membres_cotisations_config')
          .insert({
            membre_id: config.membre_id,
            type_cotisation_id: config.type_cotisation_id,
            montant_personnalise: config.montant_personnalise
          });
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Configuration sauvegardée",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('membres_cotisations_config')
        .delete()
        .eq('id', id);
      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration supprimée",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    if (!newConfig.membre_id || !newConfig.type_cotisation_id || !newConfig.montant_personnalise) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    handleSave(newConfig as Config);
    setNewConfig({});
  };

  const getMemberName = (membreId: string) => {
    const membre = membres.find(m => m.id === membreId);
    return membre ? `${membre.nom} ${membre.prenom}` : '';
  };

  const getTypeName = (typeId: string) => {
    const type = cotisationTypes.find(t => t.id === typeId);
    return type ? type.nom : '';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader title="Configuration des Cotisations par Membre" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Configuration des Cotisations par Membre" 
        subtitle="Montants personnalisés par membre et type de cotisation"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={newConfig.membre_id || ""}
              onValueChange={(value) => setNewConfig({ ...newConfig, membre_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {membres.map((membre) => (
                  <SelectItem key={membre.id} value={membre.id}>
                    {membre.nom} {membre.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newConfig.type_cotisation_id || ""}
              onValueChange={(value) => setNewConfig({ ...newConfig, type_cotisation_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de cotisation" />
              </SelectTrigger>
              <SelectContent>
                {cotisationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Montant personnalisé"
              value={newConfig.montant_personnalise || ''}
              onChange={(e) => setNewConfig({ 
                ...newConfig, 
                montant_personnalise: parseFloat(e.target.value) || 0 
              })}
            />

            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurations Existantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Type de Cotisation</TableHead>
                  <TableHead>Montant Personnalisé</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>{getMemberName(config.membre_id)}</TableCell>
                    <TableCell>{getTypeName(config.type_cotisation_id)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={config.montant_personnalise}
                        onChange={(e) => {
                          const newConfigs = configs.map(c => 
                            c.id === config.id 
                              ? { ...c, montant_personnalise: parseFloat(e.target.value) || 0 }
                              : c
                          );
                          setConfigs(newConfigs);
                        }}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(config)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => config.id && handleDelete(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {configs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucune configuration personnalisée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}