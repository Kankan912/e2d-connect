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
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SanctionForm from "@/components/forms/SanctionForm";
import PaymentSanctionForm from "@/components/forms/PaymentSanctionForm";
import LogoHeader from "@/components/LogoHeader";
import BackButton from "@/components/BackButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface SanctionWithDetails {
  id: string;
  membre_id: string;
  type_sanction_id: string;
  montant: number;
  montant_paye: number;
  date_sanction: string;
  statut: string;
  motif: string;
  created_at: string;
  membre: {
    nom: string;
    prenom: string;
  };
  type_sanction: {
    nom: string;
    contexte: string;
  };
}

export default function SanctionsReunion() {
  const [sanctions, setSanctions] = useState<SanctionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionWithDetails | null>(null);
  const [editingSanction, setEditingSanction] = useState<SanctionWithDetails | null>(null);
  const { toast } = useToast();

  // Real-time updates
  useRealtimeUpdates({ table: 'sanctions', onUpdate: loadSanctions });

  useEffect(() => {
    loadSanctions();
  }, []);

  async function loadSanctions() {
    try {
      setLoading(true);
      
      // Charger les sanctions de réunion
      const { data: sanctionsData, error: sanctionsError } = await supabase
        .from('sanctions')
        .select('*')
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

      // Charger les types de sanctions séparément
      const typeIds = [...new Set(sanctionsData.map(s => s.type_sanction_id))];
      const { data: typesData, error: typesError } = await supabase
        .from('types_sanctions')
        .select('id, nom, contexte')
        .in('id', typeIds)
        .in('contexte', ['reunion', 'tous']);

      if (typesError) throw typesError;

      // Filtrer les sanctions qui ont un type valide (reunion ou tous)
      const sanctionsValides = sanctionsData.filter(s => 
        typesData?.some(t => t.id === s.type_sanction_id)
      );

      // Joindre manuellement les données
      const sanctionsWithDetails = sanctionsValides.map(sanction => ({
        ...sanction,
        membre: membresData?.find(m => m.id === sanction.membre_id) || { nom: 'Inconnu', prenom: '' },
        type_sanction: typesData?.find(t => t.id === sanction.type_sanction_id) || { nom: 'Inconnu', contexte: '' }
      }));

      setSanctions(sanctionsWithDetails);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions: " + error.message,
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
    setShowForm(true);
  };

  const handleDelete = async (sanctionId: string) => {
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
        description: "Impossible de supprimer la sanction: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getStatutBadge = (sanction: SanctionWithDetails) => {
    const statut = sanction.statut;
    const montant = sanction.montant;
    const montantPaye = sanction.montant_paye || 0;

    if (montantPaye >= montant) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payé
        </Badge>
      );
    } else if (montantPaye > 0) {
      return (
        <Badge className="bg-warning text-warning-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Partiel ({montantPaye.toLocaleString()}/{montant.toLocaleString()})
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-destructive text-destructive-foreground">
          <XCircle className="w-3 h-3 mr-1" />
          Impayé
        </Badge>
      );
    }
  };

  const filteredSanctions = sanctions.filter(sanction =>
    `${sanction.membre?.nom} ${sanction.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.type_sanction?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.motif?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const totalSanctions = sanctions.reduce((sum, s) => sum + s.montant, 0);
  const montantPaye = sanctions.reduce((sum, s) => sum + (s.montant_paye || 0), 0);
  const montantImpaye = totalSanctions - montantPaye;
  const sanctionsPayees = sanctions.filter(s => (s.montant_paye || 0) >= s.montant).length;
  const sanctionsImpayees = sanctions.filter(s => (s.montant_paye || 0) < s.montant).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Sanctions - Réunions"
          subtitle="Sanctions liées aux réunions et assemblées"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <LogoHeader 
            title="Sanctions - Réunions"
            subtitle="Sanctions liées aux réunions et assemblées"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => {
            setEditingSanction(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle sanction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sanctions</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSanctions.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{sanctionsPayees}</div>
            <p className="text-xs text-muted-foreground">{montantPaye.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayées</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{sanctionsImpayees}</div>
            <p className="text-xs text-muted-foreground">{montantImpaye.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sanctions.filter(s => {
                const date = new Date(s.date_sanction);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des sanctions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Sanctions de Réunions
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
                  <TableHead>Membre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSanctions.map((sanction) => (
                  <TableRow key={sanction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {sanction.membre?.nom} {sanction.membre?.prenom}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{sanction.type_sanction?.nom}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          Réunion
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-bold text-destructive">
                      {sanction.montant.toLocaleString()} FCFA
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(sanction.date_sanction).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell>
                      {getStatutBadge(sanction)}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {sanction.motif || "-"}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {((sanction.montant_paye || 0) < sanction.montant) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePayment(sanction)}
                            className="text-success border-success hover:bg-success/10"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Payer
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sanction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer cette sanction ? Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(sanction.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredSanctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune sanction trouvée" : "Aucune sanction de réunion enregistrée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SanctionForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadSanctions}
      />

      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedSanction && (
            <PaymentSanctionForm
              sanctionId={selectedSanction.id}
              montantTotal={selectedSanction.montant}
              montantPaye={selectedSanction.montant_paye || 0}
              onSuccess={() => {
                setShowPaymentForm(false);
                setSelectedSanction(null);
                loadSanctions();
              }}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}