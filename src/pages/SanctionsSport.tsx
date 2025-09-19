import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import LogoHeader from '@/components/LogoHeader';
import SanctionForm from '@/components/forms/SanctionForm';
import PaymentSanctionForm from '@/components/forms/PaymentSanctionForm';
import BackButton from '@/components/BackButton';

interface Sanction {
  id: string;
  membre_id: string;
  type_sanction_id: string;
  montant: number;
  montant_paye: number;
  date_sanction: string;
  statut: string;
  motif?: string;
}

interface SanctionWithDetails extends Sanction {
  membre: {
    nom: string;
    prenom: string;
  };
  type_sanction: {
    nom: string;
    categorie: string;
  };
  sanctions_types?: {
    nom: string;
    categorie: string;
  };
}

export default function SanctionsSport() {
  const [sanctions, setSanctions] = useState<SanctionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSanctionForm, setShowSanctionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionWithDetails | null>(null);
  const [editingSanction, setEditingSanction] = useState<SanctionWithDetails | null>(null);
  
  const { toast } = useToast();

  useRealtimeUpdates({
    table: 'sanctions',
    onUpdate: loadSanctions,
    enabled: true
  });

  useEffect(() => {
    loadSanctions();
  }, []);

  async function loadSanctions() {
    try {
      // Approche alternative : charger d'abord les sanctions, puis joindre manuellement
      const { data: sanctionsData, error: sanctionsError } = await supabase
        .from('sanctions')
        .select(`
          *,
          sanctions_types!inner(nom, categorie)
        `)
        .eq('sanctions_types.categorie', 'sport')
        .order('date_sanction', { ascending: false });

      if (sanctionsError) throw sanctionsError;

      if (!sanctionsData) {
        setSanctions([]);
        return;
      }

      // Charger les informations des membres séparément
      const membreIds = [...new Set(sanctionsData.map(s => s.membre_id))];
      const { data: membresData, error: membresError } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .in('id', membreIds);

      if (membresError) throw membresError;

      // Joindre manuellement les données
      const sanctionsWithDetails = sanctionsData.map(sanction => ({
        ...sanction,
        membre: membresData?.find(m => m.id === sanction.membre_id) || { nom: 'Inconnu', prenom: '' },
        type_sanction: sanction.sanctions_types
      }));

      setSanctions(sanctionsWithDetails);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions sportives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePayment = (sanction: SanctionWithDetails) => {
    setSelectedSanction(sanction);
    setShowPaymentForm(true);
  };

  const handleEdit = (sanction: SanctionWithDetails) => {
    setEditingSanction(sanction);
    setShowSanctionForm(true);
  };

  const handleDelete = async (sanctionId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette sanction ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sanctions')
        .delete()
        .eq('id', sanctionId);

      if (error) throw error;

      toast({
        title: "Sanction supprimée",
        description: "La sanction a été supprimée avec succès",
      });
      
      loadSanctions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (sanction: SanctionWithDetails) => {
    const statut = sanction.statut;
    
    if (statut === 'paye') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Payé</Badge>;
    } else if (statut === 'partiel') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partiel</Badge>;
    } else {
      return <Badge variant="destructive">Impayé</Badge>;
    }
  };

  const filteredSanctions = sanctions.filter(sanction =>
    sanction.membre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.membre.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.type_sanction.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sanction.motif && sanction.motif.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <p>Chargement des sanctions sportives...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSanctions = sanctions.length;
  const sanctionsPayees = sanctions.filter(s => s.statut === 'paye').length;
  const sanctionsImpayees = sanctions.filter(s => s.statut === 'impaye').length;
  const montantTotal = sanctions.reduce((sum, s) => sum + s.montant, 0);
  const montantCollecte = sanctions.reduce((sum, s) => sum + (s.montant_paye || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton to="/sanctions" />
          <LogoHeader 
            title="Sanctions Sportives"
            subtitle="Gestion des sanctions liées aux activités sportives"
          />
        </div>
        <Button onClick={() => setShowSanctionForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Sanction
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSanctions}</div>
            <p className="text-xs text-muted-foreground">
              {montantTotal.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{sanctionsPayees}</div>
            <p className="text-xs text-muted-foreground">
              {((sanctionsPayees / totalSanctions) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impayées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sanctionsImpayees}</div>
            <p className="text-xs text-muted-foreground">
              {((sanctionsImpayees / totalSanctions) * 100 || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{montantCollecte.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, type ou motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tableau des sanctions */}
      <Card>
        <CardHeader>
          <CardTitle>Sanctions Sportives ({filteredSanctions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSanctions.map((sanction) => (
                <TableRow key={sanction.id}>
                  <TableCell>
                    {sanction.membre.prenom} {sanction.membre.nom}
                  </TableCell>
                  <TableCell>{sanction.type_sanction.nom}</TableCell>
                  <TableCell>{sanction.montant.toLocaleString()} FCFA</TableCell>
                  <TableCell>{getStatutBadge(sanction)}</TableCell>
                  <TableCell>
                    {new Date(sanction.date_sanction).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{sanction.motif || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sanction.statut !== 'paye' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayment(sanction)}
                        >
                          Payer
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(sanction)}
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(sanction.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formulaire de paiement inline */}
      {showPaymentForm && selectedSanction && (
        <Card>
          <CardHeader>
            <CardTitle>Paiement de Sanction</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentSanctionForm
              sanctionId={selectedSanction.id}
              montantTotal={selectedSanction.montant}
              montantPaye={selectedSanction.montant_paye || 0}
              onSuccess={() => {
                setShowPaymentForm(false);
                setSelectedSanction(null);
                loadSanctions();
              }}
              onCancel={() => {
                setShowPaymentForm(false);
                setSelectedSanction(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Formulaire de sanction */}
      <SanctionForm
        open={showSanctionForm}
        onOpenChange={(open) => {
          setShowSanctionForm(open);
          if (!open) {
            setEditingSanction(null);
          }
        }}
        onSuccess={() => {
          setShowSanctionForm(false);
          setEditingSanction(null);
          loadSanctions();
        }}
      />
    </div>
  );
}