import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CotisationType {
  id: string;
  nom: string;
  description?: string;
  montant_defaut: number;
  obligatoire: boolean;
  created_at: string;
}

export default function CotisationsTypesManager() {
  const [types, setTypes] = useState<CotisationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState<CotisationType | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    montant_defaut: '',
    obligatoire: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypes(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les types de cotisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const typeData = {
        nom: formData.nom,
        description: formData.description || null,
        montant_defaut: parseFloat(formData.montant_defaut),
        obligatoire: formData.obligatoire
      };

      const { error } = editingType
        ? await supabase
            .from('cotisations_types')
            .update(typeData)
            .eq('id', editingType.id)
        : await supabase
            .from('cotisations_types')
            .insert([typeData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: editingType ? "Type modifié" : "Type créé",
      });

      setShowDialog(false);
      setEditingType(null);
      setFormData({ nom: '', description: '', montant_defaut: '', obligatoire: false });
      loadTypes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleObligatoire = async (typeId: string, currentObligatoire: boolean) => {
    try {
      const { error } = await supabase
        .from('cotisations_types')
        .update({ obligatoire: !currentObligatoire })
        .eq('id', typeId);

      if (error) throw error;
      loadTypes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (type: CotisationType) => {
    setEditingType(type);
    setFormData({
      nom: type.nom,
      description: type.description || '',
      montant_defaut: type.montant_defaut.toString(),
      obligatoire: type.obligatoire
    });
    setShowDialog(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Types de Cotisations
          </CardTitle>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingType(null);
                setFormData({ nom: '', description: '', montant_defaut: '', obligatoire: false });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingType ? 'Modifier' : 'Créer'} un type</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Montant par défaut (FCFA) *</Label>
                  <Input
                    type="number"
                    value={formData.montant_defaut}
                    onChange={(e) => setFormData({ ...formData, montant_defaut: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.obligatoire}
                    onCheckedChange={(checked) => setFormData({ ...formData, obligatoire: checked })}
                  />
                  <Label>Cotisation obligatoire</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingType ? 'Modifier' : 'Créer'}
                  </Button>
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
              <TableHead>Obligatoire</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.nom}</TableCell>
                <TableCell className="text-muted-foreground">{type.description || '-'}</TableCell>
                <TableCell>{type.montant_defaut.toLocaleString()} FCFA</TableCell>
                <TableCell>
                  <Badge variant={type.obligatoire ? "default" : "secondary"}>
                    {type.obligatoire ? 'Oui' : 'Non'}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(type)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Switch
                    checked={type.obligatoire}
                    onCheckedChange={() => toggleObligatoire(type.id, type.obligatoire)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {types.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun type de cotisation
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
