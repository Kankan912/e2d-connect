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
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import CotisationFormModal from "@/components/forms/CotisationFormModal";
import CotisationTypeForm from "@/components/forms/CotisationTypeForm";
import MembreCotisationConfigForm from "@/components/forms/MembreCotisationConfigForm";
import BeneficiairesReunion from "@/components/BeneficiairesReunion";
import LogoHeader from "@/components/LogoHeader";
import { logger } from "@/lib/logger";

import type { CotisationWithRelations, TypeCotisation, StatutCotisation } from '@/lib/types/cotisations';

type Cotisation = CotisationWithRelations;

export default function Cotisations() {
const [cotisations, setCotisations] = useState<Cotisation[]>([]);
const [typesCotisations, setTypesCotisations] = useState<TypeCotisation[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
const [showForm, setShowForm] = useState(false);
const [showTypeForm, setShowTypeForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showBeneficiaires, setShowBeneficiaires] = useState(false);
  const [selectedReunionId, setSelectedReunionId] = useState<string>("all");
  const [reunions, setReunions] = useState<Array<{ id: string; sujet: string | null; date_reunion: string }>>([]);
  const [typeToEdit, setTypeToEdit] = useState<TypeCotisation | null>(null);
  const [exerciceId, setExerciceId] = useState<string>("all");
const [exercices, setExercices] = useState<Array<{ id: string; nom: string; date_debut: string; date_fin: string }>>([]);
const [dateDebut, setDateDebut] = useState<string>("");
const [dateFin, setDateFin] = useState<string>("");
const { toast } = useToast();
const navigate = useNavigate();

useEffect(() => {
  loadCotisations();
  loadTypesCotisations();
  loadReunions();
  loadExercices();
}, []);

const loadExercices = async () => {
  try {
    const { data, error } = await supabase
      .from('exercices')
      .select('id, nom, date_debut, date_fin')
      .order('date_debut', { ascending: false });
    if (error) throw error;
    setExercices(data || []);
  } catch (error) {
    console.error('Erreur chargement exercices:', error);
  }
};

  const loadCotisations = async () => {
    try {
      // Charger d'abord toutes les cotisations
      const { data: cotisationsData, error: cotisationsError } = await supabase
        .from('cotisations')
        .select('*')
        .order('date_paiement', { ascending: false });

      if (cotisationsError) throw cotisationsError;

      // Charger séparément les membres
      const membreIds = [...new Set(cotisationsData?.map(c => c.membre_id) || [])];
      const { data: membresData } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .in('id', membreIds);

      // Charger séparément les types de cotisations
      const typeIds = [...new Set(cotisationsData?.map(c => c.type_cotisation_id).filter(Boolean) || [])];
      const { data: typesData } = await supabase
        .from('cotisations_types')
        .select('id, nom, description')
        .in('id', typeIds);

      // Joindre manuellement
      const cotisationsWithDetails = (cotisationsData || []).map(cot => ({
        ...cot,
        statut: cot.statut as StatutCotisation,
        membre: membresData?.find(m => m.id === cot.membre_id) || { nom: '', prenom: '' },
        cotisations_types: typesData?.find(t => t.id === cot.type_cotisation_id) || { nom: '', description: null }
      }));

      setCotisations(cotisationsWithDetails);
    } catch (error: any) {
      console.error('Erreur chargement cotisations:', error);
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
      logger.error('Erreur lors du chargement des types', error);
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
    logger.error('Erreur chargement réunions', error);
  }
};

// Mises à jour temps réel
useRealtimeUpdates({
  table: 'cotisations',
  onUpdate: loadCotisations,
  enabled: true
});

useRealtimeUpdates({
  table: 'cotisations_types',
  onUpdate: loadTypesCotisations,
  enabled: true
});

  // Filtrage hiérarchique : Exercice -> Réunion -> Dates personnalisées
  const filteredCotisations = cotisations.filter(cotisation => {
    // Filtre de recherche
    const searchMatch = !searchTerm || 
      `${cotisation.membre?.nom} ${cotisation.membre?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cotisation.cotisations_types?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    // Niveau 1 : Filtre par exercice (via date_paiement)
    if (exerciceId && exerciceId !== "all") {
      const exercice = exercices.find(e => e.id === exerciceId);
      if (exercice) {
        const datePaiement = cotisation.date_paiement;
        if (datePaiement < exercice.date_debut || datePaiement > exercice.date_fin) {
          return false;
        }
      }
    }

    // Niveau 2 : Filtre par réunion
    if (selectedReunionId && selectedReunionId !== "all") {
      if (cotisation.reunion_id !== selectedReunionId) {
        return false;
      }
    }

    // Niveau 3 : Filtre par dates personnalisées (dans le cadre de l'exercice si sélectionné)
    if (dateDebut && cotisation.date_paiement < dateDebut) return false;
    if (dateFin && cotisation.date_paiement > dateFin) return false;

    return true;
  });

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

  const totalCotisations = filteredCotisations.reduce((sum, c) => sum + c.montant, 0);
  const cotisationsPayees = filteredCotisations.filter(c => c.statut === 'paye').length;
  const cotisationsEnRetard = filteredCotisations.filter(c => c.statut === 'en_retard').length;
  const cotisationsMois = filteredCotisations.filter(c => {
    const date = new Date(c.date_paiement);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, c) => sum + c.montant, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <LogoHeader 
          title="Gestion des Cotisations"
          subtitle="Suivi des cotisations et contributions"
        />
        <div className="flex gap-2">
          {exerciceId && exerciceId !== "all" && <Badge variant="secondary">📊 Niveau 1: Exercice</Badge>}
          {selectedReunionId && selectedReunionId !== "all" && <Badge variant="secondary">🗓️ Niveau 2: Réunion</Badge>}
          {(dateDebut || dateFin) && <Badge variant="secondary">📅 Niveau 3: Dates</Badge>}
        </div>
      </div>
      {/* Filtres hiérarchiques */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres hiérarchiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Niveau 1 : Exercice */}
            <div className="space-y-2">
              <label className="text-sm font-medium">📊 Niveau 1 : Exercice</label>
              <Select value={exerciceId} onValueChange={(v) => {
                setExerciceId(v);
                setSelectedReunionId("all");
                setDateDebut("");
                setDateFin("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les exercices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les exercices</SelectItem>
                  {exercices.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Niveau 2 : Réunion */}
            <div className="space-y-2">
              <label className="text-sm font-medium">🗓️ Niveau 2 : Réunion</label>
              <Select 
                value={selectedReunionId} 
                onValueChange={(v) => {
                  setSelectedReunionId(v);
                  setDateDebut("");
                  setDateFin("");
                }}
                disabled={!exerciceId || exerciceId === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={exerciceId && exerciceId !== "all" ? "Toutes les réunions" : "Sélectionner un exercice d'abord"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les réunions</SelectItem>
                  {reunions
                    .filter(r => {
                      if (!exerciceId) return true;
                      const ex = exercices.find(e => e.id === exerciceId);
                      return ex && r.date_reunion >= ex.date_debut && r.date_reunion <= ex.date_fin;
                    })
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {new Date(r.date_reunion).toLocaleDateString('fr-FR')} - {r.sujet || 'Réunion'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Niveau 3 : Dates personnalisées */}
            <div className="space-y-2">
              <label className="text-sm font-medium">📅 Niveau 3 : Dates personnalisées</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Date début"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  min={exerciceId && exerciceId !== "all" ? exercices.find(e => e.id === exerciceId)?.date_debut : undefined}
                  max={exerciceId && exerciceId !== "all" ? exercices.find(e => e.id === exerciceId)?.date_fin : undefined}
                  disabled={!exerciceId || exerciceId === "all"}
                />
                <Input
                  type="date"
                  placeholder="Date fin"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  min={exerciceId && exerciceId !== "all" ? exercices.find(e => e.id === exerciceId)?.date_debut : undefined}
                  max={exerciceId && exerciceId !== "all" ? exercices.find(e => e.id === exerciceId)?.date_fin : undefined}
                  disabled={!exerciceId || exerciceId === "all"}
                />
              </div>
            </div>
          </div>
          
          {exerciceId && exerciceId !== "all" && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>🔍 <strong>Filtres actifs :</strong></span>
                <Badge variant="secondary">
                  Exercice: {exercices?.find(e => e.id === exerciceId)?.nom}
                </Badge>
                {selectedReunionId && selectedReunionId !== "all" && (
                  <Badge variant="secondary">
                    Réunion: {reunions?.find(r => r.id === selectedReunionId)?.sujet || 'Sélectionnée'}
                  </Badge>
                )}
                {(dateDebut || dateFin) && (
                  <Badge variant="secondary">
                    Dates: {dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : '...'} - {dateFin ? new Date(dateFin).toLocaleDateString('fr-FR') : '...'}
                  </Badge>
                )}
              </p>
            </div>
          )}

          {exerciceId && (
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline"
                disabled={!selectedReunionId}
                onClick={() => setShowBeneficiaires(true)}
              >
                Bénéficiaires Réunion
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setExerciceId("all");
                  setSelectedReunionId("all");
                  setDateDebut("");
                  setDateFin("");
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
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