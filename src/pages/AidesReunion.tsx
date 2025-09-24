import { useState, useEffect } from "react";
import { Plus, Heart, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import AideForm from "@/components/forms/AideForm";
import BackButton from "@/components/BackButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Aide {
  id: string;
  type_aide_id: string;
  beneficiaire_id: string;
  montant: number;
  date_allocation: string;
  justificatif_url?: string;
  statut: string;
  notes?: string;
  contexte_aide?: string;
  aides_types?: {
    nom: string;
    mode_repartition: string;
  } | null;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
}

export default function AidesReunion() {
  const [aides, setAides] = useState<Aide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAideForm, setShowAideForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAides();
  }, []);

  const fetchAides = async () => {
    try {
      const { data, error } = await supabase
        .from('aides')
        .select(`
          *,
          aides_types!type_aide_id (
            nom,
            mode_repartition
          ),
          membres!beneficiaire_id (
            nom,
            prenom
          )
        `)
        .eq('contexte_aide', 'reunion')
        .order('date_allocation', { ascending: false });

      if (error) throw error;
      setAides(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les aides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAides = aides.filter((aide) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      aide.membres?.nom?.toLowerCase().includes(searchLower) ||
      aide.membres?.prenom?.toLowerCase().includes(searchLower) ||
      aide.aides_types?.nom?.toLowerCase().includes(searchLower) ||
      aide.notes?.toLowerCase().includes(searchLower)
    );
  });

  const totalAides = filteredAides.reduce((sum, aide) => sum + aide.montant, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <LogoHeader 
        title="Aides - Réunions"
        subtitle="Gestion des aides allouées lors des réunions"
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Aides</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAides.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre d'Aides</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAides.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéficiaires</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredAides.map(a => a.beneficiaire_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex justify-between items-center gap-4">
        <Input
          placeholder="Rechercher par nom, type d'aide ou notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={() => setShowAideForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Aide
        </Button>
      </div>

      {/* Liste des aides */}
      <div className="grid gap-4">
        {filteredAides.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm ? "Aucune aide trouvée" : "Aucune aide enregistrée"}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "Essayez avec d'autres termes de recherche" : "Allouez la première aide pour commencer"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAides.map((aide) => (
            <Card key={aide.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {aide.membres?.prenom} {aide.membres?.nom}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {aide.aides_types?.nom} - {format(new Date(aide.date_allocation), "dd MMMM yyyy", { locale: fr })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {aide.montant.toLocaleString()} FCFA
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {aide.statut === 'alloue' ? 'Alloué' : aide.statut === 'verse' ? 'Versé' : 'Annulé'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              {aide.notes && (
                <CardContent>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Notes:</p>
                    <p>{aide.notes}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Form Modal */}
      <AideForm 
        open={showAideForm} 
        onOpenChange={setShowAideForm}
        onSuccess={fetchAides}
        contexte="reunion"
      />
    </div>
  );
}