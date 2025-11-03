import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { calculateSoldeNetBeneficiaire, type SoldeNetDetail } from '@/lib/beneficiairesCalculs';
import { logger } from '@/lib/logger';

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
  const [soldesNets, setSoldesNets] = useState<Record<string, SoldeNetDetail>>({}); // CORRECTION 11
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
      
      const result = data || [];
      setBeneficiaires(result);
      
      // CORRECTION 11: Calculer soldes nets pour chaque bénéficiaire
      // Trouver l'exercice actif
      const { data: exerciceActif } = await supabase
        .from('exercices')
        .select('id')
        .eq('statut', 'actif')
        .single();
      
      if (exerciceActif) {
        const soldesMap: Record<string, SoldeNetDetail> = {};
        for (const beneficiaire of result) {
          const solde = await calculateSoldeNetBeneficiaire(
            beneficiaire.membre_id,
            exerciceActif.id
          );
          soldesMap[beneficiaire.id] = solde;
        }
        setSoldesNets(soldesMap);
      }
      
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

  // CORRECTION 10: Notification automatique paiement bénéficiaire
  const handleConfirmerPaiement = async (beneficiaireId: string) => {
    if (!confirm('Confirmer le paiement de ce bénéficiaire ?')) return;

    try {
      // 1. Mise à jour statut dans la DB
      const { error: updateError } = await supabase
        .from('reunion_beneficiaires')
        .update({
          statut: 'paye',
          date_paiement_reel: new Date().toISOString().split('T')[0]
        })
        .eq('id', beneficiaireId);

      if (updateError) throw updateError;

      // 2. Récupérer infos bénéficiaire
      const beneficiaire = beneficiaires.find(b => b.id === beneficiaireId);
      if (!beneficiaire) throw new Error('Bénéficiaire introuvable');

      // 3. Récupérer email du membre
      const { data: membre, error: membreError } = await supabase
        .from('membres')
        .select('email, nom, prenom')
        .eq('id', beneficiaire.membre_id)
        .single();

      if (membreError || !membre?.email) {
        console.warn('[BENEFICIAIRE] Email membre introuvable, skip notification');
      } else {
        // 4. Envoyer notification
        const { error: notifError } = await supabase.functions.invoke('send-notification', {
          body: {
            type_notification: 'paiement_beneficiaire',
            destinataire_email: membre.email,
            variables: {
              membre_nom: `${membre.prenom} ${membre.nom}`,
              montant: beneficiaire.montant_benefice.toLocaleString(),
              date_paiement: new Date().toLocaleDateString('fr-FR'),
              reunion_sujet: beneficiaire.reunions?.sujet || 'Réunion'
            }
          }
        });

        if (notifError) {
          console.error('[BENEFICIAIRE] Erreur envoi notification:', notifError);
          // Ne pas bloquer le processus principal
        } else {
          console.log('[BENEFICIAIRE] Notification paiement bénéficiaire envoyée');
        }
      }

      toast({
        title: "Succès",
        description: "Paiement confirmé et notification envoyée",
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
                <TableHead>Montant Brut</TableHead>
                <TableHead>Déductions</TableHead>
                <TableHead>Solde Net</TableHead>
                <TableHead>Date prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaires.map((beneficiaire) => {
                const soldeNet = soldesNets[beneficiaire.id];
                return (
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
                      {soldeNet ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="cursor-help">
                                -{soldeNet.totalDeductions.toLocaleString()} FCFA
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="text-xs space-y-1">
                                <div className="font-semibold border-b pb-1 mb-1">Détail des déductions:</div>
                                <div className="flex justify-between">
                                  <span>Sanctions:</span>
                                  <span className="font-medium">{soldeNet.sanctionsImpayees.toLocaleString()} FCFA</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Fonds sport:</span>
                                  <span className="font-medium">{soldeNet.fondsSport.toLocaleString()} FCFA</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Fonds invest:</span>
                                  <span className="font-medium">{soldeNet.fondsInvest.toLocaleString()} FCFA</span>
                                </div>
                                {soldeNet.pourcentageDeduction > 20 && (
                                  <div className="text-orange-500 text-xs mt-1 pt-1 border-t">
                                    ⚠️ Déduction importante ({soldeNet.pourcentageDeduction.toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="secondary">Calcul...</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-success">
                      {soldeNet ? soldeNet.soldeNet.toLocaleString() : '...'} FCFA
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
                );
              })}
              {beneficiaires.length === 0 && (
                <TableRow>
                  <TableCell colSpan={reunionId ? 8 : 9} className="text-center py-8 text-muted-foreground">
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