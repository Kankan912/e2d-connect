import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Plus, 
  Search, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { logger } from "@/lib/logger";
import AlertesCotisations from "@/components/AlertesCotisations";
import { exportCotisationsExcel } from '@/lib/excelUtils';
import { exportCotisationsToPDF } from '@/lib/pdfExport';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

import type { TypeCotisation, StatutCotisation } from '@/lib/types/cotisations';

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface CotisationData {
  id?: string;
  membre_id: string;
  type_cotisation_id: string;
  montant: number;
  statut: StatutCotisation;
  notes?: string;
  date_paiement: string;
}

export default function CotisationsGrid() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [typesCotisations, setTypesCotisations] = useState<TypeCotisation[]>([]);
  const [cotisations, setCotisations] = useState<Record<string, CotisationData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{membre: Membre, type: TypeCotisation} | null>(null);
  const [cotisationForm, setCotisationForm] = useState({
    montant: "",
    statut: "paye",
    notes: "",
    date_paiement: new Date().toISOString().split('T')[0]
  });
  const [exerciceId, setExerciceId] = useState<string>("");
  const [exercices, setExercices] = useState<Array<{ id: string; nom: string; date_debut: string; date_fin: string }>>([]);
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      const [membresRes, typesRes, cotisationsRes] = await Promise.all([
        supabase.from('membres').select('id, nom, prenom, email').order('nom'),
        supabase.from('cotisations_types').select('*').order('nom'),
        supabase.from('cotisations').select('*')
      ]);

      if (membresRes.error) throw membresRes.error;
      if (typesRes.error) throw typesRes.error;
      if (cotisationsRes.error) throw cotisationsRes.error;

      setMembres(membresRes.data || []);
      setTypesCotisations(typesRes.data || []);
      
      // Convertir les cotisations en dictionnaire pour accès rapide
      const cotisationsMap: Record<string, CotisationData> = {};
      (cotisationsRes.data || []).forEach(cot => {
        const key = `${cot.membre_id}-${cot.type_cotisation_id}`;
        cotisationsMap[key] = {
          ...cot,
          statut: cot.statut as StatutCotisation
        };
      });
      setCotisations(cotisationsMap);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (membre: Membre, type: TypeCotisation) => {
    const key = `${membre.id}-${type.id}`;
    const existingCotisation = cotisations[key];
    
    setSelectedCell({ membre, type });
    setCotisationForm({
      montant: existingCotisation?.montant?.toString() || type.montant_defaut?.toString() || "",
      statut: existingCotisation?.statut || "paye",
      notes: existingCotisation?.notes || "",
      date_paiement: existingCotisation?.date_paiement || new Date().toISOString().split('T')[0]
    });
    setShowDialog(true);
  };

  const handleMontantChange = async (membreId: string, typeCotisationId: string, montant: string) => {
    const key = `${membreId}-${typeCotisationId}`;
    const amount = parseFloat(montant) || 0;
    
    if (amount <= 0) return;

    try {
      const existingCotisation = cotisations[key];
      const cotisationData = {
        membre_id: membreId,
        type_cotisation_id: typeCotisationId,
        montant: amount,
        statut: 'paye',
        date_paiement: new Date().toISOString().split('T')[0]
      };

      if (existingCotisation) {
        await supabase
          .from('cotisations')
          .update(cotisationData)
          .eq('id', existingCotisation.id);
      } else {
        await supabase
          .from('cotisations')
          .insert([cotisationData]);
      }
      
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour cotisation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;

    try {
      const key = `${selectedCell.membre.id}-${selectedCell.type.id}`;
      const existingCotisation = cotisations[key];
      
      const cotisationData = {
        membre_id: selectedCell.membre.id,
        type_cotisation_id: selectedCell.type.id,
        montant: parseFloat(cotisationForm.montant),
        statut: cotisationForm.statut,
        notes: cotisationForm.notes,
        date_paiement: cotisationForm.date_paiement
      };

      let error;
      if (existingCotisation) {
        const { error: updateError } = await supabase
          .from('cotisations')
          .update(cotisationData)
          .eq('id', existingCotisation.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cotisations')
          .insert([cotisationData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Cotisation ${existingCotisation ? 'modifiée' : 'ajoutée'} avec succès`,
      });

      setShowDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la cotisation",
        variant: "destructive",
      });
    }
  };

  const updateCotisationStatut = async (membreId: string, typeCotisationId: string, statut: string) => {
    const key = `${membreId}-${typeCotisationId}`;
    const existingCotisation = cotisations[key];
    
    if (existingCotisation) {
      try {
        await supabase
          .from('cotisations')
          .update({ statut })
          .eq('id', existingCotisation.id);
        loadData();
      } catch (error) {
        console.error('Erreur mise à jour statut:', error);
      }
    }
  };

  const getCellContent = (membre: Membre, type: TypeCotisation) => {
    const key = `${membre.id}-${type.id}`;
    const cotisation = cotisations[key];

    if (!cotisation) {
      return (
        <div className="h-16 flex items-center justify-center border-2 border-dashed border-muted hover:border-primary/50 cursor-pointer transition-colors rounded">
          <Plus className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    }

    const getStatutBadge = (statut: string, datePaiement: string) => {
      const isPast = new Date(datePaiement) < new Date();
      const opacityClass = isPast ? "opacity-60" : "";
      const pastPrefix = isPast ? "📅 " : "";
      
      switch (statut) {
        case 'paye':
          return <Badge className={`bg-success text-success-foreground text-xs ${opacityClass}`}>
            <CheckCircle className="w-3 h-3 mr-1" />{pastPrefix}Payé
          </Badge>;
        case 'en_attente':
          return <Badge variant="secondary" className={`text-xs ${opacityClass}`}>
            <Clock className="w-3 h-3 mr-1" />{pastPrefix}En attente
          </Badge>;
        case 'en_retard':
          return <Badge className={`bg-destructive text-destructive-foreground text-xs ${opacityClass}`}>
            <AlertTriangle className="w-3 h-3 mr-1" />{pastPrefix}En retard
          </Badge>;
        default:
          return <Badge variant="outline" className={`text-xs ${opacityClass}`}>{pastPrefix}{statut}</Badge>;
      }
    };

    // Gestionnaire validation rapide
    const handleValidatePayment = async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Validation 1 : Vérifier que le montant > 0
      if (!cotisation.montant || cotisation.montant <= 0) {
        toast({
          title: "Validation impossible",
          description: "Le montant doit être supérieur à 0 FCFA",
          variant: "destructive",
        });
        return;
      }
      
      // Validation 2 : Demander confirmation
      const confirmer = window.confirm(
        `Confirmer le paiement de ${cotisation.montant.toLocaleString()} FCFA pour ${membre.prenom} ${membre.nom} ?`
      );
      
      if (!confirmer) return;
      
      try {
        const { error } = await supabase
          .from('cotisations')
          .update({ 
            statut: 'paye',
            date_paiement: new Date().toISOString().split('T')[0]
          })
          .eq('id', cotisation.id);
        
        if (error) throw error;
        
        toast({
          title: "✅ Paiement validé",
          description: `${cotisation.montant.toLocaleString()} FCFA - ${membre.prenom} ${membre.nom}`,
        });
        
        loadData();
      } catch (error: any) {
        console.error('[VALIDATION_PAIEMENT] Erreur:', error);
        toast({
          title: "Erreur de validation",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    return (
      <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors">
        <div className="flex justify-between items-start mb-1">
          {getStatutBadge(cotisation.statut, cotisation.date_paiement)}
          <div className="flex gap-1">
            {/* Bouton validation rapide si en_attente ou en_retard */}
            {(cotisation.statut === 'en_attente' || cotisation.statut === 'en_retard') && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={handleValidatePayment}
                title="Valider le paiement"
              >
                <CheckCircle className="w-3 h-3 text-success" />
              </Button>
            )}
            <Edit className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
        <div className="text-sm font-medium text-primary">
          {cotisation.montant.toLocaleString()} FCFA
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(cotisation.date_paiement).toLocaleDateString('fr-FR')}
        </div>
      </div>
    );
  };

  // Filtrage hiérarchique des cotisations
  const filteredCotisationsMap = Object.fromEntries(
    Object.entries(cotisations).filter(([key, cot]) => {
      // Niveau 1 : Filtre par exercice
      if (exerciceId && exerciceId !== "") {
        const exercice = exercices.find(e => e.id === exerciceId);
        if (exercice) {
          const datePaiement = cot.date_paiement;
          if (datePaiement < exercice.date_debut || datePaiement > exercice.date_fin) {
            return false;
          }
        }
      }

      // Niveau 2 : Filtre par dates personnalisées
      if (dateDebut && cot.date_paiement < dateDebut) return false;
      if (dateFin && cot.date_paiement > dateFin) return false;

      return true;
    })
  );

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <LogoHeader 
          title="Grille des Cotisations"
          subtitle="Gestion par membre et type de cotisation"
        />
        <Button 
          variant="outline"
          onClick={() => window.history.back()}
        >
          Quitter le mode grille
        </Button>
      </div>

      {/* Alertes automatiques */}
      <AlertesCotisations />

      {/* Légende des statuts */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="font-semibold text-sm mr-2">Légende des statuts :</div>
            <div className="flex items-center gap-2">
              <Badge className="bg-success text-success-foreground text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />Payé
              </Badge>
              <span className="text-xs text-muted-foreground">= Cotisation réglée</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />En attente
              </Badge>
              <span className="text-xs text-muted-foreground">= Paiement attendu</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-destructive text-destructive-foreground text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />En retard
              </Badge>
              <span className="text-xs text-muted-foreground">= Échéance dépassée</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="opacity-60 text-xs">📅 Passé</Badge>
              <span className="text-xs text-muted-foreground">= Date antérieure</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Filtres hiérarchiques */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres hiérarchiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Niveau 1 : Exercice */}
            <div className="space-y-2">
              <Label>📊 Niveau 1 : Exercice</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={exerciceId}
                onChange={(e) => {
                  setExerciceId(e.target.value);
                  setDateDebut("");
                  setDateFin("");
                }}
              >
                <option value="">Tous les exercices</option>
                {exercices.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau 2 : Dates personnalisées */}
            <div className="space-y-2">
              <Label>📅 Niveau 2 : Date début</Label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                min={exerciceId ? exercices.find(e => e.id === exerciceId)?.date_debut : undefined}
                max={exerciceId ? exercices.find(e => e.id === exerciceId)?.date_fin : undefined}
                disabled={!exerciceId}
              />
            </div>

            <div className="space-y-2">
              <Label>📅 Niveau 2 : Date fin</Label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                min={exerciceId ? exercices.find(e => e.id === exerciceId)?.date_debut : undefined}
                max={exerciceId ? exercices.find(e => e.id === exerciceId)?.date_fin : undefined}
                disabled={!exerciceId}
              />
            </div>
          </div>

          {exerciceId && (
            <p className="text-xs text-muted-foreground mt-4">
              💡 Filtrage hiérarchique : sélectionnez d'abord l'exercice, puis affinez avec les dates personnalisées.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {exerciceId && (
              <Button 
                variant="outline"
                onClick={() => {
                  setExerciceId("");
                  setDateDebut("");
                  setDateFin("");
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
          
          {/* Boutons export */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => {
                const exportData = Object.entries(filteredCotisationsMap).map(([key, cot]) => {
                  const [membreId, typeId] = key.split('-');
                  const membre = membres.find(m => m.id === membreId);
                  const type = typesCotisations.find(t => t.id === typeId);
                  return {
                    membre_nom: `${membre?.prenom} ${membre?.nom}`,
                    type_nom: type?.nom || '',
                    montant: cot.montant,
                    date_paiement: cot.date_paiement,
                    statut: cot.statut
                  };
                });
                exportCotisationsExcel(exportData);
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exporter Excel (filtrées)
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const exportData = Object.entries(filteredCotisationsMap).map(([key, cot]) => {
                  const [membreId, typeId] = key.split('-');
                  const membre = membres.find(m => m.id === membreId);
                  const type = typesCotisations.find(t => t.id === typeId);
                  return {
                    membre_nom: `${membre?.prenom} ${membre?.nom}`,
                    type_nom: type?.nom || '',
                    montant: cot.montant,
                    date_paiement: cot.date_paiement,
                    statut: cot.statut
                  };
                });
                exportCotisationsToPDF(exportData);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Exporter PDF (filtrées)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grille des cotisations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Grille Membres × Types de Cotisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* En-tête avec types de cotisations */}
                <div className="grid grid-cols-1 gap-4" style={{
                  gridTemplateColumns: `200px repeat(${typesCotisations.length}, 180px)`
                }}>
                  {/* Coin supérieur gauche */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="font-semibold text-sm">Membre / Type</div>
                  </div>
                  
                  {/* En-têtes des types de cotisations */}
                  {typesCotisations.map((type) => (
                    <div key={type.id} className="p-4 bg-muted rounded-lg">
                      <div className="font-semibold text-sm mb-1">{type.nom}</div>
                      <div className="text-xs text-muted-foreground mb-2">{type.description}</div>
                      <div className="text-xs font-medium text-primary">
                        {type.montant_defaut?.toLocaleString()} FCFA
                      </div>
                      {type.obligatoire && (
                        <Badge variant="outline" className="text-xs mt-1">Obligatoire</Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Lignes des membres */}
                <div className="mt-4 space-y-2">
                  {filteredMembres.map((membre) => (
                    <div key={membre.id} className="grid gap-4" style={{
                      gridTemplateColumns: `200px repeat(${typesCotisations.length}, 180px)`
                    }}>
                      {/* Nom du membre */}
                      <div className="p-4 bg-card rounded-lg border">
                        <div className="font-medium text-sm">{membre.nom} {membre.prenom}</div>
                        <div className="text-xs text-muted-foreground">{membre.email}</div>
                      </div>
                      
                      {/* Cellules des cotisations */}
                      {typesCotisations.map((type) => {
                        const key = `${membre.id}-${type.id}`;
                        const cotisation = filteredCotisationsMap[key];
                        
                        return (
                          <div 
                            key={`${membre.id}-${type.id}`} 
                            onClick={() => handleCellClick(membre, type)}
                            className="cursor-pointer"
                          >
                            {(type.nom.toLowerCase().includes('huile') || type.nom.toLowerCase().includes('savon')) ? (
                              <div className="p-2 border rounded hover:bg-muted/50 transition-colors h-16 flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={cotisation?.statut === 'paye'}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const montant = e.target.checked ? (type.montant_defaut || 0) : 0;
                                    const statut = e.target.checked ? 'paye' : 'impaye';
                                    if (e.target.checked) {
                                      handleMontantChange(membre.id, type.id, montant.toString());
                                    } else {
                                      updateCotisationStatut(membre.id, type.id, statut);
                                    }
                                  }}
                                  className="h-5 w-5"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              getCellContent(membre, type)
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {filteredMembres.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Aucun membre trouvé" : "Aucun membre enregistré"}
                  </div>
                )}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog pour éditer une cotisation */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell && `${selectedCell.membre.nom} ${selectedCell.membre.prenom} - ${selectedCell.type.nom}`}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="Ex: 5000"
                value={cotisationForm.montant}
                onChange={(e) => setCotisationForm(prev => ({ ...prev, montant: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_paiement">Date de paiement *</Label>
              <Input
                id="date_paiement"
                type="date"
                value={cotisationForm.date_paiement}
                onChange={(e) => setCotisationForm(prev => ({ ...prev, date_paiement: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <select
                id="statut"
                className="w-full p-2 border rounded-md"
                value={cotisationForm.statut}
                onChange={(e) => setCotisationForm(prev => ({ ...prev, statut: e.target.value }))}
              >
                <option value="paye">Payé</option>
                <option value="en_attente">En attente</option>
                <option value="en_retard">En retard</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes sur cette cotisation..."
                value={cotisationForm.notes}
                onChange={(e) => setCotisationForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}