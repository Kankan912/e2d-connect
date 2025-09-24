import { useState, useEffect } from "react";
import { Plus, Trophy, Users, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import SanctionForm from "@/components/forms/SanctionForm";
import PaymentSanctionForm from "@/components/forms/PaymentSanctionForm";
import BackButton from "@/components/BackButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SanctionWithDetails {
  id: string;
  membre_id: string;
  type_sanction_id: string;
  montant: number;
  montant_paye: number;
  date_sanction: string;
  statut: string;
  motif?: string;
  contexte_sanction?: string;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
  sanctions_types?: {
    nom: string;
    categorie: string;
  } | null;
}

export default function SanctionsSportPage() {
  const [sanctions, setSanctions] = useState<SanctionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSanctionForm, setShowSanctionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSanctions();
  }, []);

  const fetchSanctions = async () => {
    try {
      const { data, error } = await supabase
        .from('sanctions')
        .select(`
          *,
          membres!membre_id (
            nom,
            prenom
          ),
          sanctions_types!type_sanction_id (
            nom,
            categorie
          )
        `)
        .eq('contexte_sanction', 'sport')
        .order('date_sanction', { ascending: false });

      if (error) throw error;
      setSanctions(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sanctions",
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

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedSanction(null);
    fetchSanctions();
  };

  const getStatutBadge = (sanction: SanctionWithDetails) => {
    const montantRestant = sanction.montant - (sanction.montant_paye || 0);
    
    if (sanction.montant_paye === 0) {
      return <Badge variant="destructive">Impayé</Badge>;
    } else if (montantRestant <= 0) {
      return <Badge variant="default">Payé</Badge>;
    } else {
      return <Badge variant="secondary">Partiel</Badge>;
    }
  };

  const filteredSanctions = sanctions.filter((sanction) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sanction.membres?.nom?.toLowerCase().includes(searchLower) ||
      sanction.membres?.prenom?.toLowerCase().includes(searchLower) ||
      sanction.sanctions_types?.nom?.toLowerCase().includes(searchLower) ||
      sanction.motif?.toLowerCase().includes(searchLower)
    );
  });

  // Statistiques
  const totalSanctions = filteredSanctions.reduce((sum, s) => sum + s.montant, 0);
  const totalPaye = filteredSanctions.reduce((sum, s) => sum + (s.montant_paye || 0), 0);
  const sanctionsImpayees = filteredSanctions.filter(s => (s.montant_paye || 0) === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <LogoHeader 
        title="Sanctions - Sport"
        subtitle="Gestion des sanctions disciplinaires dans le contexte sportif"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sanctions</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSanctions.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSanctions.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Payé</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaye.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impayées</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{sanctionsImpayees.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Rechercher par nom, type ou motif..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setShowSanctionForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Sanction
        </Button>
      </div>

      {/* Liste des sanctions */}
      <div className="grid gap-4">
        {filteredSanctions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm ? "Aucune sanction trouvée" : "Aucune sanction enregistrée"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Essayez avec d'autres termes de recherche" : "Enregistrez la première sanction pour commencer"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSanctions.map((sanction) => (
            <Card key={sanction.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {sanction.membres?.prenom} {sanction.membres?.nom}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {sanction.sanctions_types?.nom} - {format(new Date(sanction.date_sanction), "dd MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-2xl font-bold text-red-600">
                      {sanction.montant.toLocaleString()} FCFA
                    </p>
                    {getStatutBadge(sanction)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sanction.montant_paye > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Montant payé: </span>
                    <span className="font-medium text-green-600">
                      {sanction.montant_paye.toLocaleString()} FCFA
                    </span>
                  </div>
                )}
                
                {sanction.motif && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Motif:</p>
                    <p>{sanction.motif}</p>
                  </div>
                )}
                
                {(sanction.montant_paye || 0) < sanction.montant && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePayment(sanction)}
                    >
                      {sanction.montant_paye > 0 ? "Payer le reste" : "Payer"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Form Modals */}
      <SanctionForm 
        open={showSanctionForm} 
        onOpenChange={setShowSanctionForm}
        onSuccess={fetchSanctions}
        contexte="sport"
      />
      
      {selectedSanction && showPaymentForm && (
        <PaymentSanctionForm
          sanctionId={selectedSanction.id}
          montantTotal={selectedSanction.montant}
          montantPaye={selectedSanction.montant_paye || 0}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
}