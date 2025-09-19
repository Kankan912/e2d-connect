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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CotisationFormModal from "@/components/forms/CotisationFormModal";
import CotisationTypeForm from "@/components/forms/CotisationTypeForm";
import MembreCotisationConfigForm from "@/components/forms/MembreCotisationConfigForm";
import BeneficiairesReunion from "@/components/BeneficiairesReunion";
import LogoHeader from "@/components/LogoHeader";

interface Cotisation {
  id: string;
  montant: number;
  date_paiement: string;
  statut: string;
  notes: string;
  membre: {
    nom: string;
    prenom: string;
  };
  cotisations_types: {
    nom: string;
    description: string;
  };
}

interface TypeCotisation {
  id: string;
  nom: string;
  description: string;
  montant_defaut: number;
  obligatoire: boolean;
}

export default function Cotisations() {
const [cotisations, setCotisations] = useState<Cotisation[]>([]);
const [typesCotisations, setTypesCotisations] = useState<TypeCotisation[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [showForm, setShowForm] = useState(false);
const [showTypeForm, setShowTypeForm] = useState(false);
const [showConfigForm, setShowConfigForm] = useState(false);
const [showBeneficiaires, setShowBeneficiaires] = useState(false);
const [selectedReunionId, setSelectedReunionId] = useState<string>("");
const [reunions, setReunions] = useState<Array<{ id: string; sujet: string | null; date_reunion: string }>>([]);
const [typeToEdit, setTypeToEdit] = useState<TypeCotisation | null>(null);
const { toast } = useToast();
const navigate = useNavigate();

useEffect(() => {
  loadCotisations();
  loadTypesCotisations();
  loadReunions();
}, []);

  const loadCotisations = async () => {
    try {
      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          *,
          membre:membres(nom, prenom),
          cotisations_types(nom, description)
        `)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      setCotisations(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les cotisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTypesCotisations = async () => {
    try {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      setTypesCotisations(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des types:', error);
    }
};

const loadReunions = async () => {
  try {
    const { data, error } = await supabase
      .from('reunions')
      .select('id, sujet, date_reunion')
      .order('date_reunion', { ascending: false })
      .limit(50);
    if (error) throw error;
    setReunions(data || []);
  } catch (error) {
    console.error('Erreur chargement réunions:', error);
  }
};

  const filteredCotisations = cotisations.filter(cotisation =>
    `${cotisation.membre?.nom} ${cotisation.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cotisation.cotisations_types?.nom.toLowerCase().includes(searchTerm.toLowerCase())
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
      case 'paye':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Payé
          </Badge>
        );
      case 'en_attente':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'en_retard':
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <AlertTriangle className="w-3 h-3 mr-1" />
            En retard
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des Cotisations</h1>
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

  const totalCotisations = cotisations.reduce((sum, c) => sum + c.montant, 0);
  const cotisationsPayees = cotisations.filter(c => c.statut === 'paye').length;
  const cotisationsEnRetard = cotisations.filter(c => c.statut === 'en_retard').length;
  const cotisationsMois = cotisations.filter(c => {
    const date = new Date(c.date_paiement);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, c) => sum + c.montant, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <LogoHeader 
        title="Gestion des Cotisations"
        subtitle="Suivi des cotisations et contributions"
      />
<div className="flex justify-end">
  <div className="flex gap-2 items-center">
    <div className="w-64">
      <Select value={selectedReunionId} onValueChange={(v) => setSelectedReunionId(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner une réunion" />
        </SelectTrigger>
        <SelectContent>
          {reunions.map(r => (
            <SelectItem key={r.id} value={r.id}>
              {new Date(r.date_reunion).toLocaleDateString('fr-FR')} - {r.sujet || 'Réunion'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <Button 
      variant="outline"
      disabled={!selectedReunionId}
      onClick={() => setShowBeneficiaires(true)}
    >
      Bénéficiaires Réunion
    </Button>
    <Button 
      className="bg-gradient-to-r from-primary to-secondary"
      onClick={() => setShowForm(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nouvelle cotisation
    </Button>
    <Button 
      variant="outline"
      onClick={() => navigate("/cotisations-grid")}
    >
      Vue Grille
    </Button>
  </div>
</div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collecté"
          value={`${totalCotisations.toLocaleString()} FCFA`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Cotisations Payées"
          value={cotisationsPayees}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="En Retard"
          value={cotisationsEnRetard}
          icon={AlertTriangle}
          color="destructive"
        />
        <StatCard
          title="Ce Mois"
          value={`${cotisationsMois.toLocaleString()} FCFA`}
          icon={Calendar}
          color="secondary"
        />
      </div>

      {/* Types de cotisations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Types de Cotisations
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTypeForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau type
              </Button>
              <Button variant="outline" onClick={() => setShowConfigForm(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Montants personnalisés
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {typesCotisations.map((type) => (
              <Card key={type.id} className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{type.nom}</h4>
                    <div className="flex items-center gap-2">
                      {type.obligatoire && (
                        <Badge variant="outline" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTypeToEdit(type);
                          setShowTypeForm(true);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                  <p className="text-lg font-bold text-primary">
                    {type.montant_defaut?.toLocaleString()} FCFA
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des cotisations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Historique des Cotisations
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
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCotisations.map((cotisation) => (
                  <TableRow key={cotisation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {cotisation.membre?.nom} {cotisation.membre?.prenom}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium">{cotisation.cotisations_types?.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {cotisation.cotisations_types?.description}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-bold text-primary">
                      {cotisation.montant.toLocaleString()} FCFA
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {new Date(cotisation.date_paiement).toLocaleDateString('fr-FR')}
                    </TableCell>
                    
                    <TableCell>
                      {getStatutBadge(cotisation.statut)}
                    </TableCell>
                    
                    <TableCell className="text-muted-foreground">
                      {cotisation.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredCotisations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Aucune cotisation trouvée" : "Aucune cotisation enregistrée"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CotisationFormModal
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => {
          loadCotisations();
          loadTypesCotisations();
        }}
      />

      <CotisationTypeForm
        open={showTypeForm}
        onOpenChange={(open) => {
          setShowTypeForm(open);
          if (!open) setTypeToEdit(null);
        }}
        onSuccess={loadTypesCotisations}
        typeToEdit={typeToEdit}
      />

      <MembreCotisationConfigForm
        open={showConfigForm}
        onOpenChange={setShowConfigForm}
        onSuccess={() => {
          toast({
            title: "Succès",
            description: "Configuration mise à jour",
          });
        }}
      />

{selectedReunionId && (
  <BeneficiairesReunion
    reunionId={selectedReunionId}
    open={showBeneficiaires}
    onOpenChange={setShowBeneficiaires}
  />
)}
    </div>
  );
}