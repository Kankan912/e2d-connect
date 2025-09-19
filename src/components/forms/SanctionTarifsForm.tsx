import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Settings, Plus, Edit } from 'lucide-react';

interface TypeSanction {
  id: string;
  nom: string;
  description: string;
}

interface SanctionTarif {
  id: string;
  type_sanction_id: string;
  montant: number;
  categorie_membre: string;
  actif: boolean;
  types_sanctions?: {
    nom: string;
  };
}

interface SanctionTarifsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES_MEMBRES = [
  { value: 'membre_simple', label: 'Membre Simple' },
  { value: 'bureau', label: 'Membre du Bureau' },
  { value: 'commission', label: 'Membre de Commission' },
  { value: 'adherent_phoenix', label: 'Adhérent Phoenix' }
];

export default function SanctionTarifsForm({ 
  open, 
  onOpenChange, 
  onSuccess 
}: SanctionTarifsFormProps) {
  const [loading, setLoading] = useState(false);
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [tarifs, setTarifs] = useState<SanctionTarif[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type_sanction_id: '',
    montant: '',
    categorie_membre: 'membre_simple'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, tarifsRes] = await Promise.all([
        supabase.from('types_sanctions').select('*').order('nom'),
        supabase
          .from('sanctions_tarifs')
          .select(`
            *,
            types_sanctions:type_sanction_id (nom)
          `)
          .eq('actif', true)
          .order('categorie_membre')
      ]);

      if (typesRes.error) throw typesRes.error;
      if (tarifsRes.error) throw tarifsRes.error;

      setTypesSanctions(typesRes.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type_sanction_id || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Vérifier si un tarif existe déjà pour ce type et cette catégorie
      const { data: existing } = await supabase
        .from('sanctions_tarifs')
        .select('id')
        .eq('type_sanction_id', formData.type_sanction_id)
        .eq('categorie_membre', formData.categorie_membre)
        .eq('actif', true)
        .maybeSingle();

      const tarifData = {
        type_sanction_id: formData.type_sanction_id,
        montant: parseFloat(formData.montant),
        categorie_membre: formData.categorie_membre,
        actif: true
      };

      const { error } = existing
        ? await supabase
            .from('sanctions_tarifs')
            .update(tarifData)
            .eq('id', existing.id)
        : await supabase
            .from('sanctions_tarifs')
            .insert([tarifData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Tarif ${existing ? 'mis à jour' : 'créé'} avec succès`,
      });

      setFormData({ type_sanction_id: '', montant: '', categorie_membre: 'membre_simple' });
      setShowAddForm(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le tarif",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategorieLabel = (categorie: string) => {
    return CATEGORIES_MEMBRES.find(c => c.value === categorie)?.label || categorie;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration des Tarifs de Sanctions
          </DialogTitle>
          <DialogDescription>
            Définissez les montants des sanctions selon la catégorie des membres
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setShowAddForm(true)}
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un tarif
            </Button>
          </div>

          {/* Formulaire d'ajout/modification */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nouveau Tarif</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type de sanction *</Label>
                      <Select 
                        value={formData.type_sanction_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type_sanction_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typesSanctions.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="categorie">Catégorie membre *</Label>
                      <Select 
                        value={formData.categorie_membre} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, categorie_membre: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES_MEMBRES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
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
                        placeholder="Ex: 2500"
                        value={formData.montant}
                        onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Liste des tarifs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tarifs Configurés</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tarifs.map((tarif) => (
                  <Card key={tarif.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{tarif.types_sanctions?.nom}</span>
                        <Badge variant="outline" className="text-xs">
                          {getCategorieLabel(tarif.categorie_membre)}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-success" />
                          <span className="text-lg font-bold text-success">
                            {tarif.montant.toLocaleString()} FCFA
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setFormData({
                              type_sanction_id: tarif.type_sanction_id,
                              montant: tarif.montant.toString(),
                              categorie_membre: tarif.categorie_membre
                            });
                            setShowAddForm(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {tarifs.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun tarif configuré</p>
                    <p className="text-sm">Ajoutez le premier tarif pour commencer</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}