import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEnsureAdmin } from "@/hooks/useEnsureAdmin";

interface BeneficiairesConfig {
  id?: string;
  nom: string;
  description?: string;
  mode_calcul: 'pourcentage' | 'montant_fixe';
  pourcentage_cotisations?: number;
  montant_fixe?: number;
  actif: boolean;
  type_beneficiaire: 'aides' | 'cotisations' | 'epargnes';
}

export default function BeneficiairesConfigManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BeneficiairesConfig | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    pourcentage_cotisations: 10,
    montant_fixe: 0,
    mode_calcul: 'pourcentage',
    actif: true,
    type_beneficiaire: 'aides',
    membre_id: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { withEnsureAdmin } = useEnsureAdmin();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['beneficiaires-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beneficiaires_config')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Charger les membres et adhérents pour la sélection
  const { data: membres = [] } = useQuery({
    queryKey: ['membres-adherents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, est_membre_e2d, est_adherent_phoenix')
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data || [];
    },
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      pourcentage_cotisations: 10,
      montant_fixe: 0,
      mode_calcul: 'pourcentage',
      actif: true,
      type_beneficiaire: 'aides',
      membre_id: ''
    });
    setEditingConfig(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const operation = async () => {
      if (editingConfig) {
        const { error } = await supabase
          .from('beneficiaires_config')
          .update(formData)
          .eq('id', editingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('beneficiaires_config')
          .insert([formData]);
        if (error) throw error;
      }
    };

    try {
      await withEnsureAdmin(operation);
      
      toast({
        title: "Succès",
        description: editingConfig ? "Configuration mise à jour" : "Configuration créée",
      });

      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la configuration",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (config: BeneficiairesConfig) => {
    setEditingConfig(config);
    setFormData({
      nom: config.nom,
      description: config.description || '',
      pourcentage_cotisations: config.pourcentage_cotisations || 10,
      montant_fixe: config.montant_fixe || 0,
      mode_calcul: config.mode_calcul,
      actif: config.actif,
      type_beneficiaire: config.type_beneficiaire || 'aides',
      membre_id: (config as any).membre_id || ''
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) return;

    const operation = async () => {
      const { error } = await supabase
        .from('beneficiaires_config')
        .delete()
        .eq('id', id);
      if (error) throw error;
    };

    try {
      await withEnsureAdmin(operation);
      
      toast({
        title: "Succès",
        description: "Configuration supprimée",
      });

      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la configuration",
        variant: "destructive",
      });
    }
  };

  const toggleActif = async (id: string, actif: boolean) => {
    const operation = async () => {
      const { error } = await supabase
        .from('beneficiaires_config')
        .update({ actif: !actif })
        .eq('id', id);
      if (error) throw error;
    };

    try {
      await withEnsureAdmin(operation);
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-config'] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuration des Bénéficiaires
          </span>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingConfig ? 'Modifier' : 'Nouvelle'} Configuration
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="membre_id">Bénéficiaire *</Label>
                  <Select 
                    value={formData.membre_id} 
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, membre_id: value }));
                      // Auto-remplir le nom avec le membre sélectionné
                      const membre = membres.find(m => m.id === value);
                      if (membre) {
                        setFormData(prev => ({ ...prev, nom: `${membre.prenom} ${membre.nom}` }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un membre/adhérent" />
                    </SelectTrigger>
                    <SelectContent>
                      {membres.map((membre) => (
                        <SelectItem key={membre.id} value={membre.id}>
                          {membre.prenom} {membre.nom}
                          {membre.est_membre_e2d && " (Membre E2D)"}
                          {membre.est_adherent_phoenix && " (Adhérent Phoenix)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nom">Nom d'affichage</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Généré automatiquement"
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du mode de calcul..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="type_beneficiaire">Type de bénéficiaire</Label>
                  <Select 
                    value={formData.type_beneficiaire} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type_beneficiaire: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aides">Bénéficiaires d'aides (Membres + Adhérents)</SelectItem>
                      <SelectItem value="cotisations">Bénéficiaires de cotisations (Membres seulement)</SelectItem>
                      <SelectItem value="epargnes">Bénéficiaires d'épargnes (Membres seulement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mode_calcul">Mode de calcul</Label>
                  <Select 
                    value={formData.mode_calcul} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, mode_calcul: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pourcentage">Pourcentage des cotisations</SelectItem>
                      <SelectItem value="fixe">Montant fixe</SelectItem>
                      <SelectItem value="manuel">Saisie manuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.mode_calcul === 'pourcentage' && (
                  <div>
                    <Label htmlFor="pourcentage">Pourcentage (%)</Label>
                    <Input
                      id="pourcentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.pourcentage_cotisations}
                      onChange={(e) => setFormData(prev => ({ ...prev, pourcentage_cotisations: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}

                {formData.mode_calcul === 'fixe' && (
                  <div>
                    <Label htmlFor="montant_fixe">Montant fixe (FCFA)</Label>
                    <Input
                      id="montant_fixe"
                      type="number"
                      min="0"
                      value={formData.montant_fixe}
                      onChange={(e) => setFormData(prev => ({ ...prev, montant_fixe: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="actif"
                    checked={formData.actif}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
                  />
                  <Label htmlFor="actif">Configuration active</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingConfig ? 'Mettre à jour' : 'Créer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Mode de calcul</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config: any) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{config.nom}</p>
                      {config.description && (
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {config.mode_calcul === 'pourcentage' ? 'Pourcentage' :
                       config.mode_calcul === 'fixe' ? 'Montant fixe' : 'Manuel'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {config.mode_calcul === 'pourcentage' && (
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {config.pourcentage_cotisations}%
                      </span>
                    )}
                    {config.mode_calcul === 'fixe' && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {config.montant_fixe.toLocaleString()} FCFA
                      </span>
                    )}
                    {config.mode_calcul === 'manuel' && (
                      <span className="text-muted-foreground">Saisie manuelle</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={config.actif}
                      onCheckedChange={() => toggleActif(config.id, config.actif)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {configs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune configuration. Créez votre première configuration de bénéficiaires.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}