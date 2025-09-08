
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
  Calendar, 
  Plus, 
  Search, 
  MapPin,
  Clock,
  FileText,
  Users,
  Edit,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReunionForm from "@/components/forms/ReunionForm";
import CompteRenduForm from "@/components/forms/CompteRenduForm";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Reunion {
  id: string;
  date_reunion: string;
  statut: string;
  ordre_du_jour: string;
  lieu_description: string;
  compte_rendu_url: string;
  lieu_membre: {
    nom: string;
    prenom: string;
  } | null;
  beneficiaire: {
    nom: string;
    prenom: string;
  } | null;
}

export default function Reunions() {
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCompteRenduForm, setShowCompteRenduForm] = useState(false);
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadReunions();
  }, []);

  const loadReunions = async () => {
    try {
      const { data, error } = await supabase
        .from('reunions')
        .select(`
          *,
          lieu_membre:membres!reunions_lieu_membre_id_fkey(nom, prenom),
          beneficiaire:membres!reunions_beneficiaire_id_fkey(nom, prenom)
        `)
        .order('date_reunion', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      setReunions((data || []) as any);
    } catch (error: any) {
      console.error('Erreur lors du chargement des réunions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réunions: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reunion: Reunion) => {
    setEditingReunion(reunion);
    setShowForm(true);
  };

  const handleDelete = async (reunionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) return;
    try {
      const { error } = await supabase.from('reunions').delete().eq('id', reunionId);
      if (error) throw error;
      toast({ title: "Succès", description: "Réunion supprimée avec succès" });
      loadReunions();
    } catch (error: any) {
      toast({ title: "Erreur", description: "Impossible de supprimer la réunion: " + error.message, variant: "destructive" });
    }
  };

  const handleCompteRendu = (reunion: Reunion) => {
    setSelectedReunion(reunion);
    setShowCompteRenduForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReunion(null);
    loadReunions();
  };

  const handleCompteRenduSuccess = () => {
    setShowCompteRenduForm(false);
    setSelectedReunion(null);
    loadReunions();
  };

  const filteredReunions = reunions.filter(reunion =>
    reunion.ordre_du_jour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reunion.lieu_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${reunion.lieu_membre?.nom} ${reunion.lieu_membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Planifiée
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Users className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'terminee':
        return (
          <Badge className="bg-success text-success-foreground">
            <FileText className="w-3 h-3 mr-1" />
            Terminée
          </Badge>
        );
      case 'annulee':
        return (
          <Badge variant="destructive">
            Annulée
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
          title="Gestion des Réunions"
          subtitle="Planification et suivi des réunions"
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

  const reunionsPlanifiees = reunions.filter(r => r.statut === 'planifie').length;
  const reunionsTerminees = reunions.filter(r => r.statut === 'terminee').length;
  const reunionsEnCours = reunions.filter(r => r.statut === 'en_cours').length;
  const reunionsMois = reunions.filter(r => {
    const date = new Date(r.date_reunion);
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
            title="Gestion des Réunions"
            subtitle="Planification et suivi des réunions"
          />
        </div>
        <Button 
          className="bg-gradient-to-r from-primary to-secondary"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle réunion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Planifiées"
          value={reunionsPlanifiees}
          icon={Calendar}
          color="secondary"
        />
        <StatCard
          title="En Cours"
          value={reunionsEnCours}
          icon={Users}
          color="warning"
        />
        <StatCard
          title="Terminées"
          value={reunionsTerminees}
          icon={FileText}
          color="success"
        />
        <StatCard
          title="Ce Mois"
          value={reunionsMois}
          icon={Calendar}
          color="primary"
        />
      </div>

      {/* Liste des réunions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendrier des Réunions
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
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Ordre du jour</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Compte-rendu</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReunions.map((reunion) => (
                  <TableRow key={reunion.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">
                          {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(reunion.date_reunion).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatutBadge(reunion.statut)}
                    </TableCell>
                    
                    <TableCell>
                      {reunion.beneficiaire ? (
                        <p className="text-sm font-medium">
                          {reunion.beneficiaire.prenom} {reunion.beneficiaire.nom}
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non défini</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <p className="text-sm">
                        {reunion.ordre_du_jour || "Non défini"}
                      </p>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          {reunion.lieu_description && (
                            <p className="text-sm">{reunion.lieu_description}</p>
                          )}
                          {reunion.lieu_membre && (
                            <p className="text-xs text-muted-foreground">
                              Chez {reunion.lieu_membre.nom} {reunion.lieu_membre.prenom}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {reunion.compte_rendu_url ? (
                        reunion.compte_rendu_url === 'generated' ? (
                          <Badge className="bg-success text-success-foreground">
                            <FileText className="w-3 h-3 mr-1" />
                            Disponible
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm" asChild>
                            <a href={reunion.compte_rendu_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="w-4 h-4 mr-1" />
                              Voir
                            </a>
                          </Button>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCompteRendu(reunion)}
                          className="text-primary"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter
                        </Button>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(reunion)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(reunion.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredReunions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune réunion trouvée" : "Aucune réunion planifiée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <ReunionForm
            initialData={editingReunion as any}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCompteRenduForm} onOpenChange={setShowCompteRenduForm}>
        <DialogContent className="sm:max-w-[700px]">
          {selectedReunion && (
            <CompteRenduForm
              reunionId={selectedReunion.id}
              ordreJour={selectedReunion.ordre_du_jour}
              onSuccess={handleCompteRenduSuccess}
              onCancel={() => setShowCompteRenduForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
