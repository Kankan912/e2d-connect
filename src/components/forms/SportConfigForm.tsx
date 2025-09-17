import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

interface E2DConfig {
  nom_equipe: string;
  couleur_maillot: string;
  entraineur: string;
  lieu_entrainement: string;
  horaire_entrainement: string;
}

interface PhoenixConfig {
  nom_club: string;
  montant_adhesion: number;
  duree_adhesion_mois: number;
}

export default function SportConfigForm() {
  const [loading, setLoading] = useState(false);
  const [e2dConfig, setE2dConfig] = useState<E2DConfig>({
    nom_equipe: "E2D",
    couleur_maillot: "",
    entraineur: "",
    lieu_entrainement: "",
    horaire_entrainement: ""
  });
  const [phoenixConfig, setPhoenixConfig] = useState<PhoenixConfig>({
    nom_club: "Phoenix",
    montant_adhesion: 5000,
    duree_adhesion_mois: 12
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const [e2dRes, phoenixRes] = await Promise.all([
        supabase.from('sport_e2d_config').select('*').single(),
        supabase.from('sport_phoenix_config').select('*').single()
      ]);

      if (e2dRes.data) {
        setE2dConfig({
          nom_equipe: e2dRes.data.nom_equipe || "E2D",
          couleur_maillot: e2dRes.data.couleur_maillot || "",
          entraineur: e2dRes.data.entraineur || "",
          lieu_entrainement: e2dRes.data.lieu_entrainement || "",
          horaire_entrainement: e2dRes.data.horaire_entrainement || ""
        });
      }

      if (phoenixRes.data) {
        setPhoenixConfig({
          nom_club: phoenixRes.data.nom_club || "Phoenix",
          montant_adhesion: phoenixRes.data.montant_adhesion || 5000,
          duree_adhesion_mois: phoenixRes.data.duree_adhesion_mois || 12
        });
      }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: "Configurations non trouvées, utilisation des valeurs par défaut",
          variant: "destructive",
        });
      }
  };

  const saveE2DConfig = async () => {
    setLoading(true);
    try {
      // Vérifier si une config existe
      const { data: existing } = await supabase
        .from('sport_e2d_config')
        .select('id')
        .single();

      const { error } = existing
        ? await supabase
            .from('sport_e2d_config')
            .update(e2dConfig)
            .eq('id', existing.id)
        : await supabase
            .from('sport_e2d_config')
            .insert([e2dConfig]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration E2D sauvegardée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration E2D",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePhoenixConfig = async () => {
    setLoading(true);
    try {
      // Vérifier si une config existe
      const { data: existing } = await supabase
        .from('sport_phoenix_config')
        .select('id')
        .single();

      const { error } = existing
        ? await supabase
            .from('sport_phoenix_config')
            .update(phoenixConfig)
            .eq('id', existing.id)
        : await supabase
            .from('sport_phoenix_config')
            .insert([phoenixConfig]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration Phoenix sauvegardée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration Phoenix",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration Sportive
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="e2d" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="e2d">Sport E2D</TabsTrigger>
            <TabsTrigger value="phoenix">Phoenix</TabsTrigger>
          </TabsList>

          <TabsContent value="e2d" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_equipe">Nom de l'équipe</Label>
                <Input
                  id="nom_equipe"
                  value={e2dConfig.nom_equipe}
                  onChange={(e) => setE2dConfig(prev => ({ ...prev, nom_equipe: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="couleur_maillot">Couleur du maillot</Label>
                <Input
                  id="couleur_maillot"
                  placeholder="Ex: Rouge et Blanc"
                  value={e2dConfig.couleur_maillot}
                  onChange={(e) => setE2dConfig(prev => ({ ...prev, couleur_maillot: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="entraineur">Entraîneur</Label>
                <Input
                  id="entraineur"
                  placeholder="Nom de l'entraîneur"
                  value={e2dConfig.entraineur}
                  onChange={(e) => setE2dConfig(prev => ({ ...prev, entraineur: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horaire_entrainement">Horaires d'entraînement</Label>
                <Input
                  id="horaire_entrainement"
                  placeholder="Ex: Dimanche 15h-17h"
                  value={e2dConfig.horaire_entrainement}
                  onChange={(e) => setE2dConfig(prev => ({ ...prev, horaire_entrainement: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lieu_entrainement">Lieu d'entraînement</Label>
              <Textarea
                id="lieu_entrainement"
                placeholder="Adresse complète du terrain"
                value={e2dConfig.lieu_entrainement}
                onChange={(e) => setE2dConfig(prev => ({ ...prev, lieu_entrainement: e.target.value }))}
              />
            </div>
            
            <Button onClick={saveE2DConfig} disabled={loading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Sauvegarde..." : "Sauvegarder Configuration E2D"}
            </Button>
          </TabsContent>

          <TabsContent value="phoenix" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_club">Nom du club</Label>
                <Input
                  id="nom_club"
                  value={phoenixConfig.nom_club}
                  onChange={(e) => setPhoenixConfig(prev => ({ ...prev, nom_club: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="montant_adhesion">Montant d'adhésion (FCFA)</Label>
                <Input
                  id="montant_adhesion"
                  type="number"
                  value={phoenixConfig.montant_adhesion}
                  onChange={(e) => setPhoenixConfig(prev => ({ ...prev, montant_adhesion: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duree_adhesion">Durée d'adhésion (mois)</Label>
                <Input
                  id="duree_adhesion"
                  type="number"
                  value={phoenixConfig.duree_adhesion_mois}
                  onChange={(e) => setPhoenixConfig(prev => ({ ...prev, duree_adhesion_mois: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <Button onClick={savePhoenixConfig} disabled={loading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Sauvegarde..." : "Sauvegarder Configuration Phoenix"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}