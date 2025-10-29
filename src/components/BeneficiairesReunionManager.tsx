import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface BeneficiaireReunion {
  id: string;
  reunion_id: string;
  membre_id: string;
  montant_benefice: number;
  date_benefice_prevue: string;
  date_paiement_reel?: string;
  statut: string;
  notes?: string;
  membres?: {
    nom: string;
    prenom: string;
  };
  reunions?: {
    sujet: string;
    date_reunion: string;
  };
}

interface Props {
  reunionId?: string;
}

export default function BeneficiairesReunionManager({ reunionId }: Props) {
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireReunion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { data: reunions } = useQuery({
    queryKey: ['reunions-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions')
        .select('id, sujet, date_reunion')
        .order('date_reunion', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    loadBeneficiaires();
  }, [reunionId]);

  const loadBeneficiaires = async () => {
    try {
      let query = supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membres!membre_id (
            nom,
            prenom
          ),
          reunions!reunion_id (
            sujet,
            date_reunion
          )
        `)
        .order('date_benefice_prevue', { ascending: false });

      if (reunionId) {
        query = query.eq('reunion_id', reunionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBeneficiaires(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de charger les bénéficiaires: " + errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmerPaiement = async (beneficiaireId: string) => {
    if (!confirm('Confirmer le paiement de ce bénéficiaire ?')) return;

    try {
      const { error } = await supabase
        .from('reunion_beneficiaires')
        .update({
          statut: 'paye',
          date_paiement_reel: new Date().toISOString().split('T')[0]
        })
        .eq('id', beneficiaireId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement confirmé avec succès",
      });

      loadBeneficiaires();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le paiement: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'prevu':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Prévu
          </Badge>
        );
      case 'paye':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payé
          </Badge>
        );
      case 'annule':
        return (
          <Badge variant="destructive">
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const totalMontant = beneficiaires.reduce((sum, b) => sum + b.montant_benefice, 0);
  const totalPaye = beneficiaires.filter(b => b.statut === 'paye').reduce((sum, b) => sum + b.montant_benefice, 0);
  const nombreBeneficiaires = beneficiaires.length;

  if (loading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bénéficiaires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nombreBeneficiaires}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMontant.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déjà Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalPaye.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{(totalMontant - totalPaye).toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des bénéficiaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {reunionId ? "Bénéficiaires de la réunion" : "Tous les bénéficiaires"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bénéficiaire</TableHead>
                {!reunionId && <TableHead>Réunion</TableHead>}
                <TableHead>Montant</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaires.map((beneficiaire) => (
                <TableRow key={beneficiaire.id}>
                  <TableCell className="font-medium">
                    {beneficiaire.membres?.prenom} {beneficiaire.membres?.nom}
                  </TableCell>
                  {!reunionId && (
                    <TableCell>
                      <div className="text-sm">
                        <div>{beneficiaire.reunions?.sujet}</div>
                        <div className="text-muted-foreground">
                          {new Date(beneficiaire.reunions?.date_reunion || '').toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-bold text-primary">
                    {beneficiaire.montant_benefice.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    {new Date(beneficiaire.date_benefice_prevue).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getStatutBadge(beneficiaire.statut)}</TableCell>
                  <TableCell>
                    {beneficiaire.date_paiement_reel ? (
                      new Date(beneficiaire.date_paiement_reel).toLocaleDateString('fr-FR')
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {beneficiaire.statut === 'prevu' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConfirmerPaiement(beneficiaire.id)}
                        className="bg-success/10 hover:bg-success/20 text-success border-success/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmer paiement
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {beneficiaires.length === 0 && (
                <TableRow>
                  <TableCell colSpan={reunionId ? 6 : 7} className="text-center py-8 text-muted-foreground">
                    Aucun bénéficiaire enregistré
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