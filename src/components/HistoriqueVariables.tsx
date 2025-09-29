import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Calendar, 
  Activity,
  TrendingUp,
  Edit
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VariableHistorique {
  id: string;
  nom_variable: string;
  valeur_precedente: string;
  valeur_nouvelle: string;
  date_modification: string;
  modifie_par: string;
  type_variable: string;
  description?: string;
}

export default function HistoriqueVariables() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('tous');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom_variable: '',
    valeur_precedente: '',
    valeur_nouvelle: '',
    type_variable: 'configuration',
    description: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: historique, isLoading } = useQuery({
    queryKey: ['historique-variables'],
    queryFn: async () => {
      // Pour l'instant, on simule des données car la table n'existe pas encore
      return [
        {
          id: '1',
          nom_variable: 'Montant cotisation mensuelle',
          valeur_precedente: '5000',
          valeur_nouvelle: '6000',
          date_modification: new Date().toISOString(),
          modifie_par: 'Admin',
          type_variable: 'financier',
          description: 'Augmentation des cotisations'
        },
        {
          id: '2',
          nom_variable: 'Taux intérêt prêt',
          valeur_precedente: '5%',
          valeur_nouvelle: '7%',
          date_modification: new Date(Date.now() - 86400000).toISOString(),
          modifie_par: 'Trésorier',
          type_variable: 'financier',
          description: 'Ajustement du taux'
        }
      ] as VariableHistorique[];
    }
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulation - à remplacer par l'insertion réelle en base
      console.log('Nouvelle entrée historique:', data);
      toast({
        title: "Entrée ajoutée",
        description: "L'historique a été mis à jour avec succès.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-variables'] });
      setDialogOpen(false);
      setFormData({
        nom_variable: '',
        valeur_precedente: '',
        valeur_nouvelle: '',
        type_variable: 'configuration',
        description: ''
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntryMutation.mutate({
      ...formData,
      date_modification: new Date().toISOString(),
      modifie_par: 'Utilisateur actuel' // À remplacer par l'utilisateur connecté
    });
  };

  const getTypeVariableBadge = (type: string) => {
    switch (type) {
      case 'financier':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Financier</span>;
      case 'configuration':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Configuration</span>;
      case 'sportif':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Sportif</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{type}</span>;
    }
  };

  const filteredHistorique = historique?.filter(entry => {
    const matchesSearch = entry.nom_variable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'tous' || entry.type_variable === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modifications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{historique?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Depuis le début</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {historique?.filter(h => 
                new Date(h.date_modification).getMonth() === new Date().getMonth()
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Modifications récentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variables Actives</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(historique?.map(h => h.nom_variable)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">Variables différentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Historique des variables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des Variables</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une entrée
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle Modification de Variable</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nom_variable">Nom de la variable</Label>
                    <Input
                      id="nom_variable"
                      value={formData.nom_variable}
                      onChange={(e) => setFormData({ ...formData, nom_variable: e.target.value })}
                      placeholder="Ex: Montant cotisation mensuelle"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="valeur_precedente">Valeur précédente</Label>
                      <Input
                        id="valeur_precedente"
                        value={formData.valeur_precedente}
                        onChange={(e) => setFormData({ ...formData, valeur_precedente: e.target.value })}
                        placeholder="Ancienne valeur"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="valeur_nouvelle">Nouvelle valeur</Label>
                      <Input
                        id="valeur_nouvelle"
                        value={formData.valeur_nouvelle}
                        onChange={(e) => setFormData({ ...formData, valeur_nouvelle: e.target.value })}
                        placeholder="Nouvelle valeur"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="type_variable">Type de variable</Label>
                    <Select value={formData.type_variable} onValueChange={(value) => setFormData({ ...formData, type_variable: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financier">Financier</SelectItem>
                        <SelectItem value="configuration">Configuration</SelectItem>
                        <SelectItem value="sportif">Sportif</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Raison de la modification (optionnel)"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createEntryMutation.isPending}>
                      {createEntryMutation.isPending ? 'Ajout...' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une variable..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="financier">Financier</SelectItem>
                <SelectItem value="configuration">Configuration</SelectItem>
                <SelectItem value="sportif">Sportif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Ancienne valeur</TableHead>
                  <TableHead>Nouvelle valeur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Modifié par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorique.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{entry.nom_variable}</TableCell>
                    <TableCell className="text-red-600">{entry.valeur_precedente}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{entry.valeur_nouvelle}</TableCell>
                    <TableCell>{getTypeVariableBadge(entry.type_variable)}</TableCell>
                    <TableCell>{entry.modifie_par}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(entry.date_modification).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredHistorique.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || typeFilter !== 'tous' ? 'Aucune modification trouvée' : 'Aucune modification enregistrée'}
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