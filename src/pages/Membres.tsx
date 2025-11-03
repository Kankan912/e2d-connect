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
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MembreForm from "@/components/forms/MembreForm";
import { useNavigate } from "react-router-dom";
import { PermissionGuard } from '@/components/PermissionGuard';

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statut: string;
  date_inscription: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
}

interface CotisationStatus {
  total: number;
  payees: number;
  pourcentage: number;
  dernierePaie?: string;
}

export default function Membres() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [cotisationsStatus, setCotisationsStatus] = useState<Map<string, CotisationStatus>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadMembres();
  }, []);

  const loadMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      const membresData = data || [];
      setMembres(membresData);

      // Charger le statut des cotisations pour chaque membre
      await loadCotisationsStatus(membresData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les membres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Phase 1 Fix: Link cotisations to past meetings with red indicator for missing cotisations
  const loadCotisationsStatus = async (membresData: Membre[]) => {
    try {
      const statusMap = new Map<string, CotisationStatus>();
      
      // Get completed meetings to validate cotisations against
      const { data: reunionsTerminees } = await supabase
        .from('reunions')
        .select('date_reunion')
        .eq('statut', 'terminee')
        .lt('date_reunion', new Date().toISOString())
        .order('date_reunion', { ascending: false });

      const reunionsCount = reunionsTerminees?.length || 0;
      
      for (const membre of membresData) {
        const { data: cotisations } = await supabase
          .from('cotisations')
          .select('*')
          .eq('membre_id', membre.id)
          .order('date_paiement', { ascending: false });

        const payees = cotisations?.filter(c => c.statut === 'paye').length || 0;
        const pourcentage = reunionsCount > 0 ? (payees / reunionsCount) * 100 : 100;
        const dernierePaie = cotisations?.find(c => c.statut === 'paye')?.date_paiement;

        statusMap.set(membre.id, {
          total: reunionsCount,
          payees,
          pourcentage,
          dernierePaie
        });
      }
      
      setCotisationsStatus(statusMap);
    } catch (error) {
      console.error('Erreur lors du chargement des cotisations:', error);
    }
  };

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membre.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "primary" 
  }: {
    title: string;
    value: number;
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des Membres</h1>
        </div>
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

  const membresActifs = membres.filter(m => m.statut === 'actif').length;
  const membresE2D = membres.filter(m => m.est_membre_e2d).length;
  const adherentsPhoenix = membres.filter(m => m.est_adherent_phoenix).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestion des Membres
          </h1>
          <p className="text-muted-foreground">
            Gérez les membres de l'association E2D
          </p>
        </div>
        <PermissionGuard resource="membres" action="create">
          <Button 
            className="bg-gradient-to-r from-primary to-primary-light"
            onClick={() => {
              setSelectedMembre(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau membre
          </Button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Membres"
          value={membres.length}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Membres Actifs"
          value={membresActifs}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="Membres E2D"
          value={membresE2D}
          icon={Users}
          color="secondary"
        />
        <StatCard
          title="Adhérents Phoenix"
          value={adherentsPhoenix}
          icon={Users}
          color="accent"
        />
      </div>

      {/* Search and filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Liste des Membres
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Cotisations</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembres.map((membre) => {
                  const cotisationStatus = cotisationsStatus.get(membre.id);
                  
                  const getCotisationsBadge = () => {
                    if (!cotisationStatus) return <Badge variant="outline">-</Badge>;
                    
                    // Red for overdue cotisations (based on completed meetings)
                    if (cotisationStatus.payees < cotisationStatus.total) {
                      return (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {cotisationStatus.pourcentage.toFixed(0)}% - En retard
                        </Badge>
                      );
                    } else if (cotisationStatus.pourcentage >= 80) {
                      return (
                        <Badge className="bg-success text-success-foreground">
                          {cotisationStatus.pourcentage.toFixed(0)}%
                        </Badge>
                      );
                    } else if (cotisationStatus.pourcentage >= 50) {
                      return (
                        <Badge className="bg-warning text-warning-foreground">
                          {cotisationStatus.pourcentage.toFixed(0)}%
                        </Badge>
                      );
                    } else {
                      return (
                        <Badge className="bg-destructive text-destructive-foreground">
                          {cotisationStatus.pourcentage.toFixed(0)}%
                        </Badge>
                      );
                    }
                  };

                  return (
                    <TableRow key={membre.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => navigate(`/membre/${membre.id}`)}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold">{membre.nom} {membre.prenom}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {membre.email}
                          </div>
                          {membre.telephone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {membre.telephone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={membre.statut === 'actif' ? 'default' : 'secondary'}
                          className={membre.statut === 'actif' 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }
                        >
                          {membre.statut === 'actif' ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Inactif
                            </>
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getCotisationsBadge()}
                          {cotisationStatus && (
                            <div className="text-xs text-muted-foreground">
                              {cotisationStatus.payees}/{cotisationStatus.total} réunions payées
                              {cotisationStatus.dernierePaie && (
                                <div>Dernière: {new Date(cotisationStatus.dernierePaie).toLocaleDateString('fr-FR')}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-1">
                          {membre.est_membre_e2d && (
                            <Badge variant="outline" className="text-xs">
                              E2D
                            </Badge>
                          )}
                          {membre.est_adherent_phoenix && (
                            <Badge variant="outline" className="text-xs">
                              Phoenix
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-muted-foreground">
                        {new Date(membre.date_inscription).toLocaleDateString('fr-FR')}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedMembre(membre);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {filteredMembres.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucun membre trouvé" : "Aucun membre enregistré"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MembreForm
        open={showForm}
        onOpenChange={setShowForm}
        membre={selectedMembre}
        onSuccess={loadMembres}
      />
    </div>
  );
}