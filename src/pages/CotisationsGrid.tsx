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
  Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface TypeCotisation {
  id: string;
  nom: string;
  description: string;
  montant_defaut: number;
  obligatoire: boolean;
}

interface CotisationData {
  id?: string;
  membre_id: string;
  type_cotisation_id: string;
  montant: number;
  statut: string;
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
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

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
        cotisationsMap[key] = cot;
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
      loadData(); // Recharger les données
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la cotisation",
        variant: "destructive",
      });
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

    const getStatutBadge = (statut: string) => {
      switch (statut) {
        case 'paye':
          return <Badge className="bg-success text-success-foreground text-xs"><CheckCircle className="w-3 h-3 mr-1" />Payé</Badge>;
        case 'en_attente':
          return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
        case 'en_retard':
          return <Badge className="bg-destructive text-destructive-foreground text-xs"><AlertTriangle className="w-3 h-3 mr-1" />En retard</Badge>;
        default:
          return <Badge variant="outline" className="text-xs">{statut}</Badge>;
      }
    };

    return (
      <div className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors">
        <div className="flex justify-between items-start mb-1">
          {getStatutBadge(cotisation.statut)}
          <Edit className="w-3 h-3 text-muted-foreground" />
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
      <LogoHeader 
        title="Grille des Cotisations"
        subtitle="Gestion par membre et type de cotisation"
      />
      <div className="flex justify-end">
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

      {/* Grille des cotisations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Grille Membres × Types de Cotisations
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    {typesCotisations.map((type) => (
                      <div 
                        key={`${membre.id}-${type.id}`} 
                        onClick={() => handleCellClick(membre, type)}
                        className="cursor-pointer"
                      >
                        {getCellContent(membre, type)}
                      </div>
                    ))}
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