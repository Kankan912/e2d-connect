
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
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SanctionForm from "@/components/forms/SanctionForm";
import PaymentSanctionForm from "@/components/forms/PaymentSanctionForm";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Sanction {
  id: string;
  montant: number;
  montant_paye?: number;
  date_sanction: string;
  statut: string;
  motif: string;
  membre: {
    nom: string;
    prenom: string;
  };
  sanctions_types: {
    nom: string;
    categorie: string;
  };
}

export default function Sanctions() {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
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
          membre:membres(nom, prenom),
          sanctions_types(nom, categorie)
        `)
        .order('date_sanction', { ascending: false });

      if (error) throw error;
      setSanctions(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des sanctions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSanctions = sanctions.filter(sanction =>
    `${sanction.membre?.nom} ${sanction.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.sanctions_types?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sanction.motif?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatutBadge = (statut: string, montant: number, montantPaye: number = 0) => {
    switch (statut) {
      case 'paye':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payé
          </Badge>
        );
      case 'partiel':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Partiel ({montantPaye.toLocaleString()}/{montant.toLocaleString()})
          </Badge>
        );
      case 'impaye':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Impayé
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const handlePayment = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedSanction(null);
    loadSanctions();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Gestion des Sanctions"
          subtitle="Suivi des sanctions et pénalités"
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

  const totalSanctions = sanctions.reduce((sum, s) => sum + s.montant, 0);
  const sanctionsPayees = sanctions.filter(s => s.statut === 'paye').length;
  const sanctionsImpayees = sanctions.filter(s => s.statut === 'impaye').length;
  const sanctionsMois = sanctions.filter(s => {
    const date = new Date(s.date_sanction);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

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
            title="Gestion des Sanctions"
            subtitle="Suivi des sanctions et pénalités"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle sanction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sanctions"
          value={`${totalSanctions.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Sanctions Payées"
          value={sanctionsPayees}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Impayées"
          value={sanctionsImpayees}
          icon={XCircle}
          color="destructive"
        />
        <StatCard
          title="Ce Mois"
          value={sanctionsMois}
          icon={Calendar}
          color="secondary"
        />
      </div>

      {/* Liste des sanctions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Historique des Sanctions
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
                        <p className="font-medium">{sanction.sanctions_types?.nom}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {sanction.sanctions_types?.categorie}
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
                      {getStatutBadge(sanction.statut, sanction.montant, sanction.montant_paye || 0)}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {sanction.motif || "-"}
                    </TableCell>
                    
                    <TableCell>
                      {(sanction.statut === 'impaye' || sanction.statut === 'partiel') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePayment(sanction)}
                          className="text-success border-success hover:bg-success/10"
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          {sanction.statut === 'partiel' ? 'Payer reliquat' : 'Payer'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredSanctions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune sanction trouvée" : "Aucune sanction enregistrée"}
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
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
