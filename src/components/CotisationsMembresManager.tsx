import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Save, User, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
}

interface CotisationMinimale {
  id: string;
  membre_id: string;
  montant_mensuel: number;
  actif: boolean;
}

export default function CotisationsMembresManager() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [cotisations, setCotisations] = useState<CotisationMinimale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [montants, setMontants] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membresRes, cotisationsRes] = await Promise.all([
        supabase
          .from('membres')
          .select('id, nom, prenom, statut')
          .eq('statut', 'actif')
          .order('nom', { ascending: true }),
        supabase
          .from('cotisations_minimales')
          .select('*')
          .eq('actif', true)
      ]);

      if (membresRes.error) throw membresRes.error;
      if (cotisationsRes.error) throw cotisationsRes.error;

      setMembres(membresRes.data || []);
      setCotisations(cotisationsRes.data || []);

      // Initialiser les montants
      const initialMontants: Record<string, string> = {};
      (cotisationsRes.data || []).forEach(cot => {
        initialMontants[cot.membre_id] = cot.montant_mensuel.toString();
      });
      setMontants(initialMontants);
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

  const handleMontantChange = (membreId: string, value: string) => {
    setMontants(prev => ({ ...prev, [membreId]: value }));
  };

  const saveCotisation = async (membreId: string) => {
    setSaving(true);
    try {
      const montant = parseFloat(montants[membreId] || '0');
      
      const existingCot = cotisations.find(c => c.membre_id === membreId);
      
      if (existingCot) {
        // Mise à jour
        const { error } = await supabase
          .from('cotisations_minimales')
          .update({ montant_mensuel: montant })
          .eq('id', existingCot.id);
        
        if (error) throw error;
      } else {
        // Création
        const { error } = await supabase
          .from('cotisations_minimales')
          .insert({
            membre_id: membreId,
            montant_mensuel: montant,
            actif: true
          });
        
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Cotisation mensuelle mise à jour",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getMontantActuel = (membreId: string): number => {
    const cot = cotisations.find(c => c.membre_id === membreId);
    return cot ? cot.montant_mensuel : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cotisations Mensuelles Individuelles
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Définissez un montant de cotisation mensuelle spécifique pour chaque membre
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membre</TableHead>
              <TableHead>Montant Actuel</TableHead>
              <TableHead>Nouveau Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membres.map((membre) => {
              const montantActuel = getMontantActuel(membre.id);
              const nouveauMontant = montants[membre.id];
              const hasChanges = nouveauMontant && parseFloat(nouveauMontant) !== montantActuel;
              
              return (
                <TableRow key={membre.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{membre.prenom} {membre.nom}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {montantActuel.toLocaleString()} FCFA
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={montants[membre.id] || montantActuel}
                      onChange={(e) => handleMontantChange(membre.id, e.target.value)}
                      className="w-32"
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => saveCotisation(membre.id)}
                      disabled={saving || !hasChanges}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Sauvegarder
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {membres.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Aucun membre actif
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
