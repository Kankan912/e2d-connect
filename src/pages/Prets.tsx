
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
  Banknote, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PretForm from "@/components/forms/PretForm";
import LogoHeader from "@/components/LogoHeader";

interface Pret {
  id: string;
  montant: number;
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
  const { toast } = useToast();

  useEffect(() => {
    loadPrets();
  }, []);

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

  const totalPrets = prets.reduce((sum, p) => sum + p.montant, 0);
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
        <LogoHeader 
          title="Gestion des Prêts"
          subtitle="Suivi des prêts accordés aux membres"
        />
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
                  <TableHead>Avaliste</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrets.map((pret) => (
                  <TableRow key={pret.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {pret.membre?.nom} {pret.membre?.prenom}
                    </TableCell>
                    
                    <TableCell className="font-bold text-primary">
                      {pret.montant.toLocaleString()} FCFA
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
                  </TableRow>
                ))}
                
                {filteredPrets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
    </div>
  );
}
