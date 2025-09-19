import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type TypeSanction = Database['public']['Tables']['types_sanctions']['Row'];
type SanctionTarif = Database['public']['Tables']['sanctions_tarifs']['Row'];

export const SanctionTarifsForm = () => {
  const [typesSanctions, setTypesSanctions] = useState<TypeSanction[]>([]);
  const [tarifs, setTarifs] = useState<SanctionTarif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesResult, tarifsResult] = await Promise.all([
        supabase.from('types_sanctions').select('*'),
        supabase.from('sanctions_tarifs').select('*')
      ]);

      if (typesResult.error) throw typesResult.error;
      if (tarifsResult.error) throw tarifsResult.error;

      setTypesSanctions(typesResult.data || []);
      setTarifs(tarifsResult.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTypeSanction = async (nom: string, description: string) => {
    try {
      const { data, error } = await supabase
        .from('types_sanctions')
        .insert({ nom, description })
        .select()
        .single();

      if (error) throw error;
      
      setTypesSanctions([...typesSanctions, data]);
      toast.success('Type de sanction ajouté');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleAddTarif = async (typeSanctionId: string, montant: number, categorieMembre: string) => {
    try {
      const { data, error } = await supabase
        .from('sanctions_tarifs')
        .insert({
          type_sanction_id: typeSanctionId,
          montant,
          categorie_membre: categorieMembre,
          actif: true
        })
        .select()
        .single();

      if (error) throw error;
      
      setTarifs([...tarifs, data]);
      toast.success('Tarif ajouté');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'ajout du tarif');
    }
  };

  const handleDeleteTarif = async (tarifId: string) => {
    try {
      const { error } = await supabase
        .from('sanctions_tarifs')
        .delete()
        .eq('id', tarifId);

      if (error) throw error;
      
      setTarifs(tarifs.filter(t => t.id !== tarifId));
      toast.success('Tarif supprimé');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Tarifs de Sanctions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulaire pour ajouter un type de sanction */}
          <TypeSanctionForm onSubmit={handleAddTypeSanction} />
          
          {/* Liste des types de sanctions existants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Types de sanctions existants</h3>
            {typesSanctions.map((type) => (
              <Card key={type.id} className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-medium">{type.nom}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                
                {/* Tarifs pour ce type */}
                <TarifsSection 
                  typeSanctionId={type.id}
                  tarifs={tarifs.filter(t => t.type_sanction_id === type.id)}
                  onAddTarif={handleAddTarif}
                  onDeleteTarif={handleDeleteTarif}
                />
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TypeSanctionForm = ({ onSubmit }: { onSubmit: (nom: string, description: string) => void }) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    
    onSubmit(nom, description);
    setNom('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium">Ajouter un type de sanction</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nom">Nom du type de sanction</Label>
          <Input
            id="nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Retard"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description détaillée"
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter le type de sanction
      </Button>
    </form>
  );
};

const TarifsSection = ({ 
  typeSanctionId, 
  tarifs, 
  onAddTarif, 
  onDeleteTarif 
}: {
  typeSanctionId: string;
  tarifs: SanctionTarif[];
  onAddTarif: (typeSanctionId: string, montant: number, categorieMembre: string) => void;
  onDeleteTarif: (tarifId: string) => void;
}) => {
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState('membre_simple');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const montantNum = parseFloat(montant);
    if (isNaN(montantNum) || montantNum <= 0) return;
    
    onAddTarif(typeSanctionId, montantNum, categorie);
    setMontant('');
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">Tarifs</h4>
      
      {/* Tarifs existants */}
      {tarifs.map((tarif) => (
        <div key={tarif.id} className="flex items-center justify-between p-2 bg-muted rounded">
          <span className="text-sm">
            {tarif.categorie_membre}: {tarif.montant} FCFA
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteTarif(tarif.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      
      {/* Formulaire d'ajout de tarif */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="Montant (FCFA)"
            min="0"
            step="0.01"
            required
          />
        </div>
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="membre_simple">Membre simple</SelectItem>
            <SelectItem value="membre_bureau">Membre bureau</SelectItem>
            <SelectItem value="dirigeant">Dirigeant</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};