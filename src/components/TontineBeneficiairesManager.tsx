import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, Euro, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnsureAdmin } from '@/hooks/useEnsureAdmin';

interface TontineAttribution {
  id: string;
  mois: number;
  annee: number;
  membre_id: string;
  montant_attribue: number;
  total_cotisations_mois: number;
  created_at: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface CotisationMensuelle {
  membre_id: string;
  montant_total: number;
  nom_complet: string;
}

interface SelectedBeneficiaire {
  membre_id: string;
  montant: number;
}

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function TontineBeneficiairesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ensureAdmin = useEnsureAdmin();

  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());
  const [selectedBeneficiaires, setSelectedBeneficiaires] = useState<SelectedBeneficiaire[]>([]);

  // Get all membres
  const { data: membres } = useQuery({
    queryKey: ['membres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom', { ascending: true });
      
      if (error) throw error;
      return data as Membre[];
    }
  });

  // Get monthly cotisations for selected month/year
  const { data: cotisationsMensuelles, isLoading: loadingCotisations } = useQuery({
    queryKey: ['cotisations-mensuelles', selectedMois, selectedAnnee],
    queryFn: async () => {
      const startDate = new Date(selectedAnnee, selectedMois - 1, 1);
      const endDate = new Date(selectedAnnee, selectedMois, 0);

      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          membre_id,
          montant,
          membres (nom, prenom)
        `)
        .gte('date_paiement', startDate.toISOString().split('T')[0])
        .lte('date_paiement', endDate.toISOString().split('T')[0])
        .eq('statut', 'paye');

      if (error) throw error;

      // Group by membre and sum amounts
      const grouped = data.reduce((acc: any, cotisation: any) => {
        const membreId = cotisation.membre_id;
        if (!acc[membreId]) {
          acc[membreId] = {
            membre_id: membreId,
            montant_total: 0,
            nom_complet: `${cotisation.membres.nom} ${cotisation.membres.prenom}`
          };
        }
        acc[membreId].montant_total += Number(cotisation.montant);
        return acc;
      }, {});

      return Object.values(grouped) as CotisationMensuelle[];
    }
  });

  // Get existing attributions for selected month/year
  const { data: attributions } = useQuery({
    queryKey: ['attributions', selectedMois, selectedAnnee],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontine_attributions')
        .select(`
          *,
          membres (nom, prenom)
        `)
        .eq('mois', selectedMois)
        .eq('annee', selectedAnnee);

      if (error) throw error;
      return data;
    }
  });

  // Get historical attributions
  const { data: historique } = useQuery({
    queryKey: ['historique-attributions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tontine_attributions')
        .select(`
          *,
          membres (nom, prenom)
        `)
        .order('annee', { ascending: false })
        .order('mois', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Calculate totals
  const totalCotisations = cotisationsMensuelles?.reduce((sum, cotisation) => sum + cotisation.montant_total, 0) || 0;
  const totalAttribue = selectedBeneficiaires.reduce((sum, beneficiaire) => sum + beneficiaire.montant, 0);
  const resteARepartir = totalCotisations - totalAttribue;
  // Phase 1 Fix: Allow total_attribue <= total_cotisations instead of strict equality
  const isValidRepartition = totalAttribue <= totalCotisations && totalAttribue > 0;

  // Load existing attributions when month/year changes
  useEffect(() => {
    if (attributions) {
      const existingBeneficiaires = attributions.map(attr => ({
        membre_id: attr.membre_id,
        montant: Number(attr.montant_attribue)
      }));
      setSelectedBeneficiaires(existingBeneficiaires);
    } else {
      setSelectedBeneficiaires([]);
    }
  }, [attributions]);

  // Save attribution mutation
  const saveAttributionMutation = useMutation({
    mutationFn: async () => {
      await ensureAdmin.ensureAdmin();

      // First delete existing attributions for this month/year
      await supabase
        .from('tontine_attributions')
        .delete()
        .eq('mois', selectedMois)
        .eq('annee', selectedAnnee);

      // Insert new attributions
      const attributionsToInsert = selectedBeneficiaires.map(beneficiaire => ({
        mois: selectedMois,
        annee: selectedAnnee,
        membre_id: beneficiaire.membre_id,
        montant_attribue: beneficiaire.montant,
        total_cotisations_mois: totalCotisations
      }));

      const { error } = await supabase
        .from('tontine_attributions')
        .insert(attributionsToInsert);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Attribution sauvegardée",
        description: `Les bénéficiaires pour ${MOIS_NOMS[selectedMois - 1]} ${selectedAnnee} ont été enregistrés.`
      });
      queryClient.invalidateQueries({ queryKey: ['attributions'] });
      queryClient.invalidateQueries({ queryKey: ['historique-attributions'] });
    },
    onError: (error) => {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des attributions.",
        variant: "destructive"
      });
    }
  });

  const handleBeneficiaireChange = (membreId: string, checked: boolean) => {
    if (checked) {
      setSelectedBeneficiaires(prev => [...prev, { membre_id: membreId, montant: 0 }]);
    } else {
      setSelectedBeneficiaires(prev => prev.filter(b => b.membre_id !== membreId));
    }
  };

  const handleMontantChange = (membreId: string, montant: number) => {
    setSelectedBeneficiaires(prev => 
      prev.map(b => b.membre_id === membreId ? { ...b, montant } : b)
    );
  };

  const getMemberName = (membreId: string) => {
    const membre = membres?.find(m => m.id === membreId);
    return membre ? `${membre.nom} ${membre.prenom}` : 'Membre introuvable';
  };

  // Group historical data by month/year
  const historiqueGrouped = historique?.reduce((acc: any, attr: any) => {
    const key = `${attr.mois}-${attr.annee}`;
    if (!acc[key]) {
      acc[key] = {
        mois: attr.mois,
        annee: attr.annee,
        total_cotisations: attr.total_cotisations_mois,
        beneficiaires: []
      };
    }
    acc[key].beneficiaires.push({
      nom: `${attr.membres.nom} ${attr.membres.prenom}`,
      montant: attr.montant_attribue
    });
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Selection Month/Year */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestion Mensuelle des Bénéficiaires - Tontine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mois">Mois</Label>
              <Select value={selectedMois.toString()} onValueChange={(value) => setSelectedMois(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOIS_NOMS.map((mois, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {mois}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="annee">Année</Label>
              <Select value={selectedAnnee.toString()} onValueChange={(value) => setSelectedAnnee(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cotisations Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Cotisations du mois - {MOIS_NOMS[selectedMois - 1]} {selectedAnnee}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCotisations ? (
            <p>Chargement des cotisations...</p>
          ) : cotisationsMensuelles && cotisationsMensuelles.length > 0 ? (
            <div className="space-y-4">
              <div className="text-lg font-semibold">
                Total collecté: {totalCotisations.toLocaleString('fr-FR')} F CFA
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotisationsMensuelles.map(cotisation => (
                    <TableRow key={cotisation.membre_id}>
                      <TableCell>{cotisation.nom_complet}</TableCell>
                      <TableCell className="text-right">
                        {cotisation.montant_total.toLocaleString('fr-FR')} F CFA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Aucune cotisation trouvée pour {MOIS_NOMS[selectedMois - 1]} {selectedAnnee}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Beneficiaires Selection */}
      {totalCotisations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attribution des bénéficiaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {membres?.map(membre => {
                const isSelected = selectedBeneficiaires.some(b => b.membre_id === membre.id);
                const selectedBeneficiaire = selectedBeneficiaires.find(b => b.membre_id === membre.id);
                
                return (
                  <div key={membre.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleBeneficiaireChange(membre.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label>{membre.nom} {membre.prenom}</Label>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`montant-${membre.id}`}>Montant:</Label>
                        <Input
                          id={`montant-${membre.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={selectedBeneficiaire?.montant || 0}
                          onChange={(e) => handleMontantChange(membre.id, Number(e.target.value))}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">F CFA</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {selectedBeneficiaires.length > 0 && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Total à répartir:</span>
                  <span className="font-semibold">{totalCotisations.toLocaleString('fr-FR')} F CFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Total attribué:</span>
                  <span className="font-semibold">{totalAttribue.toLocaleString('fr-FR')} F CFA</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Reste à répartir:</span>
                  <span className={`font-semibold ${resteARepartir === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {resteARepartir.toLocaleString('fr-FR')} F CFA
                  </span>
                </div>
                {isValidRepartition && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Répartition valide - prêt à enregistrer
                    </AlertDescription>
                  </Alert>
                )}
                {!isValidRepartition && selectedBeneficiaires.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      La somme attribuée ne peut pas dépasser le total des cotisations et doit être supérieure à 0
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              onClick={() => saveAttributionMutation.mutate()}
              disabled={!isValidRepartition || selectedBeneficiaires.length === 0 || saveAttributionMutation.isPending}
              className="w-full"
            >
              {saveAttributionMutation.isPending ? 'Enregistrement...' : 'Enregistrer les attributions'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historical Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des attributions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Période</TableHead>
                <TableHead>Total cotisations</TableHead>
                <TableHead>Bénéficiaires</TableHead>
                <TableHead>Montants reçus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(historiqueGrouped).length > 0 ? (
                Object.entries(historiqueGrouped).map(([key, group]: [string, any]) => (
                  <TableRow key={key}>
                    <TableCell>
                      {MOIS_NOMS[group.mois - 1]} {group.annee}
                    </TableCell>
                    <TableCell>
                      {group.total_cotisations.toLocaleString('fr-FR')} F CFA
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.beneficiaires.map((beneficiaire: any, index: number) => (
                          <Badge key={index} variant="secondary">
                            {beneficiaire.nom}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.beneficiaires.map((beneficiaire: any, index: number) => (
                        <div key={index} className="text-sm">
                          {beneficiaire.montant.toLocaleString('fr-FR')} F CFA
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun historique d'attribution trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}