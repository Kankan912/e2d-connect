import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Trophy, 
  Plus, 
  Search, 
  Users,
  Calendar,
  Target,
  Award,
  UserCheck,
  UserX,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PhoenixAdherentForm from "@/components/forms/PhoenixAdherentForm";
import PhoenixMatchForm from "@/components/forms/PhoenixMatchForm";
import LogoHeader from "@/components/LogoHeader";
import SportConfigForm from "@/components/forms/SportConfigForm";

interface Adherent {
  id: string;
  adhesion_payee: boolean;
  montant_adhesion: number;
  date_adhesion: string;
  date_limite_paiement: string;
  membre: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export default function SportPhoenix() {
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdherentDialog, setShowAdherentDialog] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAdherents();
  }, []);

  const loadAdherents = async () => {
    try {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          *,
          membre:membres(nom, prenom, email, telephone)
        `)
        .order('date_adhesion', { ascending: false });

      if (error) throw error;
      setAdherents(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les adhérents Phoenix",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAdherents = adherents.filter(adherent =>
    `${adherent.membre?.nom} ${adherent.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adherent.membre?.email.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sport E2D-Phoenix</h1>
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

  const totalAdherents = adherents.length;
  const adhesionsPayees = adherents.filter(a => a.adhesion_payee).length;
  const adhesionsEnRetard = adherents.filter(a => {
    if (a.adhesion_payee) return false;
    const limite = new Date(a.date_limite_paiement);
    return limite < new Date();
  }).length;
  const totalRecettes = adherents
    .filter(a => a.adhesion_payee)
    .reduce((sum, a) => sum + (a.montant_adhesion || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <LogoHeader 
        title="Sport E2D-Phoenix"
        subtitle="Gestion de l'équipe de football"
      />
      <div className="flex justify-end">
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowMatchDialog(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Nouveau match
          </Button>
          <Button 
            className="bg-gradient-to-r from-accent to-accent-light"
            onClick={() => setShowAdherentDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel adhérent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Adhérents"
          value={totalAdherents}
          icon={Users}
          color="accent"
        />
        <StatCard
          title="Adhésions Payées"
          value={adhesionsPayees}
          icon={UserCheck}
          color="success"
        />
        <StatCard
          title="En Retard"
          value={adhesionsEnRetard}
          icon={UserX}
          color="destructive"
        />
        <StatCard
          title="Recettes Totales"
          value={`${totalRecettes.toLocaleString()} FCFA`}
          icon={Trophy}
          color="secondary"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <Target className="h-5 w-5" />
              Statistiques Sportives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Matchs joués</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Victoires</span>
              <span className="font-semibold text-success">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Défaites</span>
              <span className="font-semibold text-destructive">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Nuls</span>
              <span className="font-semibold text-warning">1</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 bg-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Award className="h-5 w-5" />
              Meilleurs Joueurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Meilleur buteur</span>
              <span className="font-semibold">Alex (12 buts)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Plus d'assists</span>
              <span className="font-semibold">Michel (8)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Plus présent</span>
              <span className="font-semibold">Paul (100%)</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Calendar className="h-5 w-5" />
              Prochains Événements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <div>
                  <p className="text-sm font-medium">Entraînement</p>
                  <p className="text-xs text-muted-foreground">Samedi 25/01</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <div>
                  <p className="text-sm font-medium">Match vs Étoiles</p>
                  <p className="text-xs text-muted-foreground">Dimanche 26/01</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sportive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurations Sport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SportConfigForm />
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Actions rapides</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" onClick={() => navigate("/match-results")}>
                <Trophy className="w-4 h-4 mr-2" />
                Voir les résultats
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Calendrier matchs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des adhérents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Adhérents Phoenix
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
                  <TableHead>Nom Complet</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adhésion</TableHead>
                  <TableHead>Date Limite</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdherents.map((adherent) => {
                  const isEnRetard = !adherent.adhesion_payee && 
                    new Date(adherent.date_limite_paiement) < new Date();
                  
                  return (
                    <TableRow key={adherent.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {adherent.membre?.nom} {adherent.membre?.prenom}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{adherent.membre?.email}</p>
                          {adherent.membre?.telephone && (
                            <p className="text-xs text-muted-foreground">
                              {adherent.membre?.telephone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {adherent.montant_adhesion?.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Adhésion depuis {new Date(adherent.date_adhesion).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-muted-foreground">
                        {new Date(adherent.date_limite_paiement).toLocaleDateString('fr-FR')}
                      </TableCell>
                      
                      <TableCell>
                        <Badge 
                          variant={adherent.adhesion_payee ? 'default' : isEnRetard ? 'destructive' : 'secondary'}
                          className={
                            adherent.adhesion_payee 
                              ? 'bg-success text-success-foreground' 
                              : isEnRetard 
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-warning text-warning-foreground'
                          }
                        >
                          {adherent.adhesion_payee 
                            ? 'Payé' 
                            : isEnRetard 
                              ? 'En retard' 
                              : 'En attente'
                          }
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {filteredAdherents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucun adhérent trouvé" : "Aucun adhérent enregistré"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulaires */}
      <PhoenixAdherentForm
        open={showAdherentDialog}
        onOpenChange={setShowAdherentDialog}
        onSuccess={loadAdherents}
      />
      
      <PhoenixMatchForm
        open={showMatchDialog}
        onOpenChange={setShowMatchDialog}
        onSuccess={() => {
          // Refresh data or update UI as needed
          toast({
            title: "Match programmé",
            description: "Le match a été ajouté avec succès",
          });
        }}
      />
    </div>
  );
}