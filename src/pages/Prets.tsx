
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BackButtonGlobal from '@/components/ui/back-button-global';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Banknote, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import PretForm from "@/components/forms/PretForm";
import LogoHeader from "@/components/LogoHeader";
import PretPaymentModal from "@/components/modals/PretPaymentModal";
import PretReconductionModal from "@/components/modals/PretReconductionModal";
import PretPaymentPartielForm from '@/components/forms/PretPaymentPartielForm';

interface Pret {
  id: string;
  montant: number;
  montant_total_du?: number;
  montant_paye?: number;
  date_pret: string;
  echeance: string;
  statut: string;
  taux_interet: number;
  reconductions: number;
  notes: string;
  membre: {
    nom: string;
    prenom: string;
  };
  avaliste?: {
    nom: string;
    prenom: string;
  };
}

export default function Prets() {
  const [prets, setPrets] = useState<Pret[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReconductionModal, setShowReconductionModal] = useState(false);
  const [showPartialPayment, setShowPartialPayment] = useState(false);
  const [selectedPretId, setSelectedPretId] = useState<string | null>(null);
  const [selectedPret, setSelectedPret] = useState<Pret | null>(null);
  const [sanctionsImpayees, setSanctionsImpayees] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadPrets();
    loadSanctionsImpayees();
  }, []);

  async function loadSanctionsImpayees() {
    try {
      const { data, error } = await supabase
        .from('sanctions')
        .select('montant, montant_paye')
        .neq('statut', 'paye');

      if (error) throw error;

      const totalImpaye = data?.reduce((sum, sanction) => {
        const montantRestant = sanction.montant - (sanction.montant_paye || 0);
        return sum + (montantRestant > 0 ? montantRestant : 0);
      }, 0) || 0;

      setSanctionsImpayees(totalImpaye);
    } catch (error) {
      console.error('Erreur lors du chargement des sanctions:', error);
    }
  }

  const loadPrets = async () => {
    try {
      const { data, error } = await supabase
        .from('prets')
        .select('*')
        .order('date_pret', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      // Charger séparément les données des membres
      const pretsWithMembers = await Promise.all(
        (data || []).map(async (pret) => {
          const [membreData, avalisteData] = await Promise.all([
            pret.membre_id 
              ? supabase.from('membres').select('nom, prenom').eq('id', pret.membre_id).single()
              : { data: null, error: null },
            pret.avaliste_id
              ? supabase.from('membres').select('nom, prenom').eq('id', pret.avaliste_id).single()
              : { data: null, error: null }
          ]);

          return {
            ...pret,
            membre: membreData.data || { nom: '', prenom: '' },
            avaliste: avalisteData.data || { nom: '', prenom: '' }
          };
        })
      );
      
      setPrets(pretsWithMembers);
    } catch (error: any) {
      console.error('Erreur lors du chargement des prêts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prêts: " + (error.message || "Erreur inconnue"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Activer les mises à jour temps réel
  useRealtimeUpdates({
    table: 'prets',
    onUpdate: loadPrets,
    enabled: true
  });

  const handlePayment = (pretId: string) => {
    setSelectedPretId(pretId);
    setShowPaymentModal(true);
  };

  const handlePartialPayment = (pret: Pret) => {
    setSelectedPret(pret);
    setShowPartialPayment(true);
  };

  const handleReconduction = (pretId: string) => {
    setSelectedPretId(pretId);
    setShowReconductionModal(true);
  };

  const filteredPrets = prets.filter(pret =>
    `${pret.membre?.nom} ${pret.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pret.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  const getStatutBadge = (statut: string, echeance: string) => {
    const dateEcheance = new Date(echeance);
    const now = new Date();
    
    switch (statut) {
      case 'rembourse':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Remboursé
          </Badge>
        );
      case 'en_cours':
        if (dateEcheance < now) {
          return (
            <Badge className="bg-destructive text-destructive-foreground">
              <AlertTriangle className="w-3 h-3 mr-1" />
              En retard
            </Badge>
          );
        }
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'annule':
        return (
          <Badge variant="outline">
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Gestion des Prêts"
          subtitle="Suivi des prêts accordés aux membres"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalPrets = prets.reduce((sum, p) => sum + Number(p.montant || 0), 0);
  const pretsEnCours = prets.filter(p => p.statut === 'en_cours').length;
  const pretsRembourses = prets.filter(p => p.statut === 'rembourse').length;
  const pretsEnRetard = prets.filter(p => {
    const dateEcheance = new Date(p.echeance);
    const now = new Date();
    return p.statut === 'en_cours' && dateEcheance < now;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButtonGlobal />
          <LogoHeader 
            title="Gestion des Prêts"
            subtitle="Suivi des prêts accordés aux membres"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau prêt
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Prêts"
          value={`${totalPrets.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="En Cours"
          value={pretsEnCours}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Remboursés"
          value={pretsRembourses}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="En Retard"
          value={pretsEnRetard}
          icon={AlertTriangle}
          color="destructive"
        />
      </div>

      {/* Liste des prêts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Historique des Prêts
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Date prêt</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Total Attendu</TableHead>
                  <TableHead>Avaliste</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrets.map((pret) => (
                  <TableRow key={pret.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {pret.membre?.nom} {pret.membre?.prenom}
                    </TableCell>
                    
                    <TableCell className="font-bold text-primary">
                      {Number(pret.montant || 0).toLocaleString()} FCFA
                      <div className="text-xs text-muted-foreground">
                        +{(Number(pret.montant || 0) * Number(pret.taux_interet || 0) / 100 * (1 + (pret.reconductions || 0))).toLocaleString()} FCFA intérêt
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        {pret.taux_interet}%
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(pret.date_pret).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(pret.echeance).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell>
                      {getStatutBadge(pret.statut, pret.echeance)}
                    </TableCell>
                    
                    <TableCell className="font-bold text-secondary">
                      {(Number(pret.montant || 0) + (Number(pret.montant || 0) * Number(pret.taux_interet || 0) / 100 * (1 + (pret.reconductions || 0)))).toLocaleString()} FCFA
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {pret.avaliste ? (
                        `${pret.avaliste.nom} ${pret.avaliste.prenom}`
                      ) : (
                        "Aucun"
                      )}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {pret.notes || "-"}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(pret.id)}
                        disabled={pret.statut === 'rembourse'}
                        className="bg-success/10 hover:bg-success/20 text-success border-success/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Payer Total
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePartialPayment(pret)}
                        disabled={pret.statut === 'rembourse'}
                      >
                        Paiement Partiel
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReconduction(pret.id)}
                        disabled={pret.statut === 'rembourse'}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reconduire
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredPrets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucun prêt trouvé" : "Aucun prêt enregistré"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PretForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadPrets}
      />

      {/* Modales de paiement et reconduction */}
      <PretPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        pretId={selectedPretId}
        onSuccess={loadPrets}
      />
      
      <PretReconductionModal
        open={showReconductionModal}
        onOpenChange={setShowReconductionModal}
        pretId={selectedPretId}
        onSuccess={loadPrets}
      />

      {/* Modal de paiement partiel */}
      {showPartialPayment && selectedPret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <PretPaymentPartielForm
            pretId={selectedPret.id}
            montantTotal={Number(selectedPret.montant_total_du || selectedPret.montant)}
            montantPaye={Number(selectedPret.montant_paye || 0)}
            onSuccess={() => {
              setShowPartialPayment(false);
              setSelectedPret(null);
              loadPrets();
            }}
            onCancel={() => {
              setShowPartialPayment(false);
              setSelectedPret(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
