import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CardStatistic {
  id: string;
  player_name: string;
  yellow_cards: number;
  red_cards: number;
  match_id: string;
  match_type: string;
  created_at: string;
}

interface SanctionType {
  id: string;
  nom: string;
  montant: number;
  categorie: string;
}

export default function CardsToSanctionsSync() {
  const [cardStats, setCardStats] = useState<CardStatistic[]>([]);
  const [sanctionTypes, setSanctionTypes] = useState<SanctionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, typesRes] = await Promise.all([
        supabase
          .from('match_statistics')
          .select('*')
          .or('yellow_cards.gt.0,red_cards.gt.0')
          .order('created_at', { ascending: false }),
        supabase
          .from('sanctions_types')
          .select('*')
          .eq('categorie', 'sport')
      ]);

      if (statsRes.error) throw statsRes.error;
      if (typesRes.error) throw typesRes.error;

      setCardStats(statsRes.data || []);
      setSanctionTypes(typesRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncCardsToSanctions = async () => {
    setSyncing(true);
    try {
      const yellowCardSanction = sanctionTypes.find(st => 
        st.nom.toLowerCase().includes('carton jaune') || 
        st.nom.toLowerCase().includes('yellow')
      );
      const redCardSanction = sanctionTypes.find(st => 
        st.nom.toLowerCase().includes('carton rouge') || 
        st.nom.toLowerCase().includes('red')
      );

      if (!yellowCardSanction || !redCardSanction) {
        toast({
          title: "Erreur",
          description: "Types de sanctions pour cartons introuvables",
          variant: "destructive",
        });
        return;
      }

      let syncedCount = 0;
      
      for (const stat of cardStats) {
        const { data: membre } = await supabase
          .from('membres')
          .select('id')
          .or(`nom.ilike.%${stat.player_name.split(' ')[1] || ''}%,prenom.ilike.%${stat.player_name.split(' ')[0] || ''}%`)
          .limit(1)
          .single();

        if (!membre) continue;

        // Vérifier si les sanctions existent déjà
        const { data: existingSanctions } = await supabase
          .from('sanctions')
          .select('id')
          .eq('membre_id', membre.id)
          .gte('date_sanction', stat.created_at.split('T')[0]);

        const sanctionsToCreate = [];

        // Cartons jaunes
        for (let i = 0; i < stat.yellow_cards; i++) {
          if (!existingSanctions?.length || existingSanctions.length < stat.yellow_cards + stat.red_cards) {
            sanctionsToCreate.push({
              type_sanction_id: yellowCardSanction.id,
              membre_id: membre.id,
              montant: yellowCardSanction.montant,
              date_sanction: stat.created_at.split('T')[0],
              motif: `Carton jaune - Match ${stat.match_type.toUpperCase()}`,
              statut: 'impaye'
            });
          }
        }

        // Cartons rouges
        for (let i = 0; i < stat.red_cards; i++) {
          if (!existingSanctions?.length || existingSanctions.length < stat.yellow_cards + stat.red_cards) {
            sanctionsToCreate.push({
              type_sanction_id: redCardSanction.id,
              membre_id: membre.id,
              montant: redCardSanction.montant,
              date_sanction: stat.created_at.split('T')[0],
              motif: `Carton rouge - Match ${stat.match_type.toUpperCase()}`,
              statut: 'impaye'
            });
          }
        }

        if (sanctionsToCreate.length > 0) {
          const { error } = await supabase
            .from('sanctions')
            .insert(sanctionsToCreate);
          
          if (error) {
            console.error('Erreur insertion sanctions:', error);
          } else {
            syncedCount += sanctionsToCreate.length;
          }
        }
      }

      toast({
        title: "Synchronisation terminée",
        description: `${syncedCount} sanctions créées à partir des cartons`,
      });

    } catch (error) {
      console.error('Erreur synchronisation:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la synchronisation",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Synchronisation Cartons → Sanctions</h2>
        </div>
        <Button onClick={syncCardsToSanctions} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisation...' : 'Synchroniser'}
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cartons à synchroniser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {cardStats.reduce((sum, stat) => sum + stat.yellow_cards + stat.red_cards, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Types sanctions sport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {sanctionTypes.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {sanctionTypes.some(st => st.nom.toLowerCase().includes('carton')) ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Prêt</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-500">Config manquante</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cartons détectés */}
      <Card>
        <CardHeader>
          <CardTitle>Cartons détectés dans les statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Joueur</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Cartons Jaunes</TableHead>
                <TableHead>Cartons Rouges</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cardStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium">{stat.player_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {stat.match_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {stat.yellow_cards > 0 && (
                      <Badge className="bg-yellow-500 text-white">
                        {stat.yellow_cards}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {stat.red_cards > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {stat.red_cards}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(stat.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">À synchroniser</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {cardStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Aucun carton détecté dans les statistiques
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Types de sanctions disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Types de sanctions sport configurés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sanctionTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{type.nom}</h3>
                  <Badge variant="outline">{type.montant.toLocaleString()} FCFA</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Catégorie: {type.categorie}
                </p>
              </div>
            ))}
            {sanctionTypes.length === 0 && (
              <p className="text-center py-8 text-muted-foreground col-span-2">
                Aucun type de sanction sport configuré
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}