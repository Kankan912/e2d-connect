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
  DollarSign, 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface Recette {
  id: string;
  libelle: string;
  montant: number;
  date_recette: string;
  notes?: string;
}

interface Depense {
  id: string;
  libelle: string;
  montant: number;
  date_depense: string;
  justificatif_url?: string;
}

export default function SportE2DFinances() {
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'recettes' | 'depenses'>('recettes');
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    try {
      const [recettesData, depensesData] = await Promise.all([
        supabase
          .from('sport_e2d_recettes')
          .select('*')
          .order('date_recette', { ascending: false }),
        supabase
          .from('sport_e2d_depenses')
          .select('*')
          .order('date_depense', { ascending: false })
      ]);

      if (recettesData.error) throw recettesData.error;
      if (depensesData.error) throw depensesData.error;

      setRecettes(recettesData.data || []);
      setDepenses(depensesData.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des finances:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données financières: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalRecettes = recettes.reduce((sum, r) => sum + Number(r.montant || 0), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant || 0), 0);
  const solde = totalRecettes - totalDepenses;

  const filteredRecettes = recettes.filter(recette =>
    recette.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recette.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepenses = depenses.filter(depense =>
    depense.libelle?.toLowerCase().includes(searchTerm.toLowerCase())
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

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Finances Sport E2D"
          subtitle="Gestion financière de l'équipe E2D"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
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
          <Button variant="outline" size="sm" onClick={goBack}>
            <BackIcon className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <LogoHeader 
            title="Finances Sport E2D"
            subtitle="Gestion financière de l'équipe E2D"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Recettes"
          value={`${totalRecettes.toLocaleString()} FCFA`}
          icon={TrendingUp}
          color="success"
        />
        <StatCard
          title="Total Dépenses"
          value={`${totalDepenses.toLocaleString()} FCFA`}
          icon={TrendingDown}
          color="destructive"
        />
        <StatCard
          title="Solde"
          value={`${solde.toLocaleString()} FCFA`}
          icon={DollarSign}
          color={solde >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'recettes' ? 'default' : 'outline'}
          onClick={() => setActiveTab('recettes')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Recettes ({recettes.length})
        </Button>
        <Button
          variant={activeTab === 'depenses' ? 'default' : 'outline'}
          onClick={() => setActiveTab('depenses')}
        >
          <TrendingDown className="w-4 h-4 mr-2" />
          Dépenses ({depenses.length})
        </Button>
      </div>

      {/* Tableau des transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'recettes' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-success" />
                  Recettes Sport E2D
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Dépenses Sport E2D
                </>
              )}
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
                  <TableHead>Libellé</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  {activeTab === 'recettes' ? (
                    <TableHead>Notes</TableHead>
                  ) : (
                    <TableHead>Justificatif</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === 'recettes' ? filteredRecettes : filteredDepenses).map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {item.libelle}
                    </TableCell>
                    
                    <TableCell className={`font-bold ${activeTab === 'recettes' ? 'text-success' : 'text-destructive'}`}>
                      {activeTab === 'recettes' ? '+' : '-'}{Number(item.montant || 0).toLocaleString()} FCFA
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(activeTab === 'recettes' ? (item as Recette).date_recette : (item as Depense).date_depense).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell>
                      {activeTab === 'recettes' ? (
                        <span className="text-sm text-muted-foreground">
                          {(item as Recette).notes || '-'}
                        </span>
                      ) : (
                        (item as Depense).justificatif_url ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={(item as Depense).justificatif_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-1" />
                              Voir
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucun</span>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {(activeTab === 'recettes' ? filteredRecettes : filteredDepenses).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? `Aucune ${activeTab} trouvée` : `Aucune ${activeTab} enregistrée`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}