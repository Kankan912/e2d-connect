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
  Users, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PhoenixAdherentForm from "@/components/forms/PhoenixAdherentForm";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface PhoenixAdherent {
  id: string;
  membre_id: string;
  montant_adhesion: number;
  date_adhesion: string;
  adhesion_payee: boolean;
  date_limite_paiement: string | null;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixAdherents() {
  const [adherents, setAdherents] = useState<PhoenixAdherent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadAdherents();
  }, []);

  const loadAdherents = async () => {
    try {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          *,
          membres(nom, prenom)
        `)
        .order('date_adhesion', { ascending: false });

      if (error) throw error;
      setAdherents(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des adhérents Phoenix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les adhérents Phoenix: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAdherents = adherents.filter(adherent =>
    `${adherent.membres?.nom} ${adherent.membres?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatutBadge = (payee: boolean, dateLimite: string | null) => {
    if (payee) {
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payée
        </Badge>
      );
    }

    if (dateLimite) {
      const limite = new Date(dateLimite);
      const now = new Date();
      if (limite < now) {
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            En retard
          </Badge>
        );
      }
    }

    return (
      <Badge className="bg-warning text-warning-foreground">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Adhérents Phoenix"
          subtitle="Gestion des adhésions au club Phoenix"
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

  const totalAdherents = adherents.length;
  const adhesionsPayees = adherents.filter(a => a.adhesion_payee).length;
  const adhesionsEnAttente = adherents.filter(a => !a.adhesion_payee).length;
  const totalMontant = adherents.reduce((sum, a) => sum + (a.montant_adhesion || 0), 0);

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
            title="Adhérents Phoenix"
            subtitle="Gestion des adhésions au club Phoenix"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel adhérent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Adhérents"
          value={totalAdherents}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Adhésions Payées"
          value={adhesionsPayees}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="En Attente"
          value={adhesionsEnAttente}
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Montant Total"
          value={`${totalMontant.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="secondary"
        />
      </div>

      {/* Liste des adhérents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des Adhérents Phoenix
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un adhérent..."
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
                  <TableHead>Date d'adhésion</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date limite</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdherents.map((adherent) => (
                  <TableRow key={adherent.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {adherent.membres?.nom} {adherent.membres?.prenom}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(adherent.date_adhesion).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell className="font-bold">
                      {adherent.montant_adhesion?.toLocaleString() || 0} FCFA
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {adherent.date_limite_paiement 
                        ? new Date(adherent.date_limite_paiement).toLocaleDateString('fr-FR')
                        : "-"
                      }
                    </TableCell>
                    
                    <TableCell>
                      {getStatutBadge(adherent.adhesion_payee, adherent.date_limite_paiement)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredAdherents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucun adhérent trouvé" : "Aucun adhérent enregistré"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PhoenixAdherentForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={loadAdherents}
      />
    </div>
  );
}