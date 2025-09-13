import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  Plus,
  Search,
  Trophy,
  Users,
  Calendar,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import SanctionForm from "@/components/forms/SanctionForm";
import PaymentSanctionForm from "@/components/forms/PaymentSanctionForm";

interface Sanction {
  id: string;
  type_sanction_id: string;
  membre_id: string;
  montant: number;
  date_sanction: string;
  statut: string;
  motif?: string;
  montant_paye: number;
}

interface SanctionWithDetails extends Sanction {
  sanctions_types?: {
    nom: string;
    categorie: string;
  };
  membres?: {
    nom: string;
    prenom: string;
  };
}

export default function SanctionsSport() {
  const [sanctions, setSanctions] = useState<SanctionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSanctionForm, setShowSanctionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionWithDetails | null>(null);
  const [editingSanction, setEditingSanction] = useState<SanctionWithDetails | null>(null);
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadSanctions();
  }, []);

  const loadSanctions = async () => {
    try {
      const { data, error } = await supabase
        .from('sanctions')
        .select(`
          *,
          sanctions_types (nom, categorie),
          membres (nom, prenom)
        `)
        .eq('sanctions_types.categorie', 'sport')
        .order('date_sanction', { ascending: false });

      if (error) throw error;
      setSanctions(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions sportives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (sanction: SanctionWithDetails) => {
    setSelectedSanction(sanction);
    setShowPaymentForm(true);
  };

  const handleEdit = (sanction: SanctionWithDetails) => {
    setEditingSanction(sanction);
    setShowSanctionForm(true);
  };

  const handleDelete = async (sanctionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sanction ?')) return;
    
    try {
      const { error } = await supabase
        .from('sanctions')
        .delete()
        .eq('id', sanctionId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Sanction supprimée avec succès",
      });
      loadSanctions();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la sanction",
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (sanction: SanctionWithDetails) => {
    const pourcentagePaye = sanction.montant > 0 ? (sanction.montant_paye / sanction.montant) * 100 : 0;
    
    if (pourcentagePaye >= 100) {
      return (
        <Badge className="bg-success text-success-foreground">
          Payé
        </Badge>
      );
    } else if (pourcentagePaye > 0) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          Partiel ({pourcentagePaye.toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          Impayé
        </Badge>
      );
    }
  };

  const filteredSanctions = sanctions.filter(sanction =>
    sanction.membres && (
      `${sanction.membres.nom} ${sanction.membres.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sanction.sanctions_types?.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sanction.motif || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Sanctions Sportives"
          subtitle="Gestion des sanctions liées aux activités sportives"
        />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSanctions = sanctions.length;
  const sanctionsPayees = sanctions.filter(s => s.montant_paye >= s.montant).length;
  const sanctionsImpayees = sanctions.filter(s => s.montant_paye === 0).length;
  const montantTotal = sanctions.reduce((sum, s) => sum + s.montant, 0);
  const montantPaye = sanctions.reduce((sum, s) => sum + s.montant_paye, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <BackIcon className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <LogoHeader 
            title="Sanctions Sportives"
            subtitle="Gestion des sanctions liées aux activités sportives"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowSanctionForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle sanction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sanctions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSanctions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
            <Trophy className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{sanctionsPayees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayées</CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{sanctionsImpayees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Collecté</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {montantPaye.toLocaleString('fr-FR')} F
            </div>
            <p className="text-xs text-muted-foreground">
              sur {montantTotal.toLocaleString('fr-FR')} F
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sanctions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Sanctions Sportives
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
                  <TableCell className="font-medium">
                    {sanction.membres && 
                      `${sanction.membres.prenom} ${sanction.membres.nom}`
                    }
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {sanction.sanctions_types?.nom || 'Type inconnu'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="font-semibold">
                        {sanction.montant.toLocaleString('fr-FR')} F CFA
                      </p>
                      {sanction.montant_paye > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Payé: {sanction.montant_paye.toLocaleString('fr-FR')} F
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatutBadge(sanction)}
                  </TableCell>
                  
                  <TableCell>
                    {new Date(sanction.date_sanction).toLocaleDateString('fr-FR')}
                  </TableCell>
                  
                  <TableCell>
                    <p className="text-sm max-w-48 truncate" title={sanction.motif}>
                      {sanction.motif || '-'}
                    </p>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      {sanction.montant_paye < sanction.montant && showPaymentForm && selectedSanction?.id === sanction.id ? (
                        <PaymentSanctionForm
                          sanctionId={sanction.id}
                          montantTotal={sanction.montant}
                          montantPaye={sanction.montant_paye}
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
                      ) : sanction.montant_paye < sanction.montant ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePayment(sanction)}
                          className="text-success"
                        >
                          Payer
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sanction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sanction.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredSanctions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Aucune sanction trouvée" : "Aucune sanction sportive enregistrée"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SanctionForm
        open={showSanctionForm}
        onOpenChange={setShowSanctionForm}
        onSuccess={() => {
          setShowSanctionForm(false);
          setEditingSanction(null);
          loadSanctions();
        }}
      />

      {/* Payment form is now inline within the table */}
    </div>
  );
}