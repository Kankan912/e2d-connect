import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Euro, 
  Users,
  Save,
  Edit,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
}

interface CotisationMinimale {
  id?: string;
  membre_id: string;
  montant_mensuel: number;
  actif: boolean;
}

interface CotisationData extends CotisationMinimale {
  membre?: Membre;
}

export default function CotisationsMinimales() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [cotisations, setCotisations] = useState<CotisationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load members
      const { data: membresData, error: membresError } = await supabase
        .from('membres')
        .select('*')
        .eq('statut', 'actif')
        .order('nom');

      if (membresError) throw membresError;

      // Load existing cotisations minimales
      const { data: cotisationsData, error: cotisationsError } = await supabase
        .from('cotisations_minimales')
        .select(`
          *,
          membres (id, nom, prenom, statut)
        `);

      if (cotisationsError) throw cotisationsError;

      setMembres(membresData || []);
      
      // Create combined data structure
      const cotisationsMap = new Map(
        (cotisationsData || []).map(c => [c.membre_id, c])
      );

      const allCotisations = (membresData || []).map(membre => {
        const existingCotisation = cotisationsMap.get(membre.id);
        return {
          id: existingCotisation?.id,
          membre_id: membre.id,
          montant_mensuel: existingCotisation?.montant_mensuel || 0,
          actif: existingCotisation?.actif ?? true,
          membre
        };
      });

      setCotisations(allCotisations);
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

  const handleSave = async (cotisation: CotisationData) => {
    setSaving(true);
    try {
      if (cotisation.id) {
        // Update existing
        const { error } = await supabase
          .from('cotisations_minimales')
          .update({
            montant_mensuel: cotisation.montant_mensuel,
            actif: cotisation.actif
          })
          .eq('id', cotisation.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('cotisations_minimales')
          .insert({
            membre_id: cotisation.membre_id,
            montant_mensuel: cotisation.montant_mensuel,
            actif: cotisation.actif
          });
        
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Configuration sauvegardée avec succès",
      });

      setEditingId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMontantChange = (membreId: string, montant: number) => {
    setCotisations(prev => 
      prev.map(c => 
        c.membre_id === membreId 
          ? { ...c, montant_mensuel: montant }
          : c
      )
    );
  };

  const handleActifChange = (membreId: string, actif: boolean) => {
    setCotisations(prev => 
      prev.map(c => 
        c.membre_id === membreId 
          ? { ...c, actif }
          : c
      )
    );
  };

  const filteredCotisations = cotisations.filter(cotisation =>
    cotisation.membre && (
      `${cotisation.membre.nom} ${cotisation.membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Cotisations Minimales"
          subtitle="Configuration des montants de base par membre"
        />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMembres = membres.length;
  const membresConfigurees = cotisations.filter(c => c.montant_mensuel > 0).length;
  const totalMontantMinimal = cotisations
    .filter(c => c.actif && c.montant_mensuel > 0)
    .reduce((sum, c) => sum + c.montant_mensuel, 0);

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
            title="Cotisations Minimales"
            subtitle="Configuration des montants de base par membre"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembres}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurés</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membresConfigurees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total/Mois</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMontantMinimal.toLocaleString('fr-FR')} F
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Configuration des Cotisations
            </CardTitle>
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
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Montant Mensuel</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCotisations.map((cotisation) => {
                const isEditing = editingId === cotisation.membre_id;
                
                return (
                  <TableRow key={cotisation.membre_id}>
                    <TableCell className="font-medium">
                      {cotisation.membre && (
                        `${cotisation.membre.prenom} ${cotisation.membre.nom}`
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            value={cotisation.montant_mensuel}
                            onChange={(e) => handleMontantChange(
                              cotisation.membre_id, 
                              Number(e.target.value)
                            )}
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">F CFA</span>
                        </div>
                      ) : (
                        <div>
                          {cotisation.montant_mensuel.toLocaleString('fr-FR')} F CFA
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Switch
                          checked={cotisation.actif}
                          onCheckedChange={(checked) => handleActifChange(
                            cotisation.membre_id, 
                            checked
                          )}
                        />
                      ) : (
                        <Badge variant={cotisation.actif ? "default" : "secondary"}>
                          {cotisation.actif ? "Actif" : "Inactif"}
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSave(cotisation)}
                            disabled={saving}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            Sauver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(cotisation.membre_id)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}